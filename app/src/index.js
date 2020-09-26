$(document).ready(function() {
    const editor_view = $("#editor_view");
    const filesTable = document.getElementById("files_table");
    const files_view = $("#files_view");
    const footer = document.getElementsByTagName("footer")[0];
    const overlay = $("main#overlay");
    const projectsTable = document.getElementById("projects_table");
    const segmentsDiv = document.getElementById("segments_div");
    const segment_hits_table = $("#hits_table");
    const tms_table = $("#tms_table");

    let activeView = document.getElementById("projects_view");
    let activeButton = document.getElementById("btn_projects_view");

    var tr;
    var title_td;
    var src_lng_td;
    var trg_lng_td;

    $("body.loading").removeAttr("class");

    setTimeout(() => {
        fetchProjects();
        fetchTMs();
    }, 1000);

    // Fetches a list of the projects
    function fetchProjects() {
        var projects;
        var projectsKeys;
        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                projects = JSON.parse(this.responseText);
                projectsKeys = Object.keys(projects);

                projectsTable.innerHTML = "";

                for (i = 0; i < projectsKeys.length; i++) {
                    project_id = projectsKeys[i];
                    project = projects[project_id];
                    tr = document.createElement("tr");
                    tr.setAttribute("project_id", projectsKeys[i]);
                    tr.setAttribute("is_imported", project.is_imported);
                    tr.setAttribute("is_exported", project.is_exported);

                    td = document.createElement("td");
                    td.className = "project_title";
                    td.innerHTML = project.title;
                    tr.append(td);

                    td = document.createElement("td");
                    td.className = "source language";
                    td.setAttribute("lang_code", project.source_language_code);
                    td.innerHTML = project.source_language;
                    tr.append(td);

                    td = document.createElement("td");
                    td.className = "target language";
                    td.setAttribute("lang_code", project.target_language_code)
                    td.innerHTML = project.target_language;
                    tr.append(td);

                    tr.ondblclick = function() {
                        window.projectTitle = project.title;
                        setFooter();

                        lang_pair = [project.source_language_code, project.target_language_code];
                        window.setSpellCheckerLanguages(lang_pair);

                        fetchProject(project_id);

                        if ($(this).attr("is_imported") == "true") {
                            document.getElementById("btn_create_new_project_package").style.display = "none";
                            document.getElementById("btn_create_return_project_package").style.display = "inline-block";
                            document.getElementById("btn_update_from_krpp").style.display = "none";
                        }
                        else if ($(this).attr("is_exported") == "true") {
                            document.getElementById("btn_create_return_project_package").style.display = "none";
                            document.getElementById("btn_update_from_krpp").style.display = "inline-block";
                            document.getElementById("btn_create_new_project_package").style.display = "inline-block";
                        }
                        else {
                            document.getElementById("btn_create_return_project_package").style.display = "none";
                            document.getElementById("btn_update_from_krpp").style.display = "none";
                            document.getElementById("btn_create_new_project_package").style.display = "inline-block";
                        }
                    }

                    projectsTable.prepend(tr);
                }
                tr = document.createElement("tr");
                th = document.createElement("th");
                th.className = "name";
                th.innerHTML = "Project Name";
                tr.append(th);
                th = document.createElement("th");
                th.innerHTML = "Source Language";
                tr.append(th);
                th = document.createElement("th");
                th.innerHTML = "Target Language";
                tr.append(th)
                projectsTable.prepend(tr);

                console.log("Projects fetched.")
            }
            else if (this.readyState == 4 && this.status != 200) {
                console.log("Projects not fetched. Trying again in 2 seconds.")
                setTimeout(() => {
                fetchProjects();
                }, 2000)
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/");
        xhttp.send();
    }

    // Fetches a list of the files in a project
    function fetchProject(project_id) {
        var files;
        var filesKeys;
        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                files = JSON.parse(this.responseText);
                filesKeys = Object.keys(files);

                filesTable.innerHTML = "";

                tr = document.createElement("tr");
                th = document.createElement("th");
                th.className = "name";
                th.innerHTML = "File Name";
                tr.append(th);

                filesTable.append(tr);

                for (i = 0; i < filesKeys.length; i++) {
                    f_id = filesKeys[i];
                    tr = document.createElement("tr");
                    tr.setAttribute("file_id", f_id);
                    tr.ondblclick = function() {
                        window.fileTitle = files[f_id].title;
                        setFooter();

                        fetchSegments(project_id, f_id);
                    }
                    tr.oncontextmenu = function(e) {
                        window.openFileContextMenu(e, f_id)
                    }

                    td = document.createElement("td");
                    td.innerHTML = files[f_id].title;
                    tr.append(td);

                    filesTable.append(tr);
                }
                $("main#files_view").attr("cur_p_id", project_id);
                toggleView("files_view", "block", "btn_files_view");
                $("button#btn_files_view").prop("disabled", false);
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/project/" + project_id);
        xhttp.send();
    }

    // Fetches the segments in a file
    function fetchSegments(project_id, file_id) {
        var parser = new DOMParser();
        var xhttp = new XMLHttpRequest();

        var p_i;
        var segment_row;
        var source_td;
        var tags;
        var target_td;
        var translation_unit_table;
        var translation_units;

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                segmentsDiv.innerHTML = "";
                translation_units = parser.parseFromString(this.responseText, "text/xml").documentElement.childNodes;
                for (i = 0; i < translation_units.length; i++) {
                    p_id = translation_units[i].getAttribute("id");
                    segments = translation_units[i].getElementsByTagName("segment")
                    if (segments.length > 0) {
                        translation_unit_table = document.createElement("table");
                        translation_unit_table.classList.add("segments_table");
                        for (s_i = 0; s_i < segments.length; s_i++) {
                            segment_row = document.createElement("tr");
                            segment_row.id = segments[s_i].id
                            segment_row.setAttribute("p_id", p_id)
                            if (segments[s_i].getAttribute("state") != null) {
                              segment_row.classList.add(segments[s_i].getAttribute("state"));
                            }
                            s_i_th = document.createElement("th");
                            s_i_th.innerHTML = segments[s_i].id;
                            segment_row.appendChild(s_i_th);

                            source_td = document.createElement("td");
                            source_td.classList.add("source");
                            source_td.innerHTML = segments[s_i].getElementsByTagName("source")[0].innerHTML;
                            tags = source_td.getElementsByTagName("sc");
                            for (t_i = 0; t_i < tags.length; t_i++) {
                                tags[t_i].addEventListener("click", function() { tagClickHandler(this) });
                                tags[t_i].contentEditable = "false";
                            }
                            tags = source_td.getElementsByTagName("ec");
                            for (t_i = 0; t_i < tags.length; t_i++) {
                                tags[t_i].addEventListener("click", function() { tagClickHandler(this) });
                                tags[t_i].contentEditable = "false";
                            }
                            tags = source_td.getElementsByTagName("ph");
                            for (t_i = 0; t_i < tags.length; t_i++) {
                                tags[t_i].addEventListener("click", function() { tagClickHandler(this) });
                                tags[t_i].contentEditable = "false";
                            }
                            tags = source_td.getElementsByTagName("g");
                            for (t_i = 0; t_i < tags.length; t_i++) {
                                tags[t_i].addEventListener("click", function() { tagClickHandler(this) });
                                tags[t_i].contentEditable = "false";
                            }
                            segment_row.appendChild(source_td);

                            target_td = document.createElement("td");
                            target_td.classList.add("target");
                            target_td.contentEditable = "true";
                            target_td.innerHTML = segments[s_i].getElementsByTagName("target")[0].innerHTML;
                            target_td.addEventListener("keydown", function(e) { targetKeydownHandler(e, $(this)) });
                            target_td.addEventListener("keyup", function() { $(this).find("br").remove() });
                            target_td.addEventListener("focus", function () { segmentLookup($(this).closest("tr").find("td.source"), segment_hits_table) });
                            target_td.addEventListener("focusout", function () { submitSegment($(this), "draft") });
                            segment_row.appendChild(target_td);

                            translation_unit_table.appendChild(segment_row);
                        }
                        segmentsDiv.appendChild(translation_unit_table);

                        if (i < translation_units.length - 1) {
                            segmentsDiv.appendChild(document.createElement("hr"));
                        }
                    }
                }
                $("main#editor_view").attr("cur_f_id", file_id);
                toggleView("editor_view", "grid", "btn_editor_view");
                $("button#btn_editor_view").prop("disabled", false);
            }
        }
        xhttp.open("GET", "http://127.0.0.1:8000/project/" + project_id + "/file/" + file_id);
        xhttp.send();
    }

    // Fetches a list of the translation memories
    function fetchTMs() {
        $.getJSON(
            "http://127.0.0.1:8000/tms",
            function(data) {
            tms_table.empty();
            tms_table.append($("<tr><th class=\"name\"><h4>Translation Memory</h4></th><th><h4>Source Language</h4></th><th><h4>Target Language</h4></th></tr>"));
            $.each(data, function(tm_title, tm) {
                tr = $("<tr>");
                tr.attr("id", tm.id);
                title_td = $("<td>");
                title_td.text(tm.title);
                tr.append(title_td);
                src_lng_td = $("<td>");
                src_lng_td.text(tm.source_language);
                src_lng_td.addClass("language");
                tr.append(src_lng_td);
                trg_lng_td = $("<td>");
                trg_lng_td.addClass("language");
                trg_lng_td.text(tm.target_language);
                tr.append(trg_lng_td);
                tms_table.append(tr);
            })
            }
        )
        .done(() => {
            console.log("TMs fetched.")
        })
        .fail(() => {
            console.log("TMs not fetched. Trying again in 2 seconds.")
            setTimeout(() => {
            fetchTMs();
            }, 2000)
        })
    }

    // Navigation
    document.getElementById("btn_projects_view").onclick = function() {
        toggleView("projects_view", "block", "btn_projects_view");
    }
    document.getElementById("btn_files_view").onclick = function() {
        toggleView("files_view", "block", "btn_files_view");
    }
    document.getElementById("btn_editor_view").onclick = function() {
        toggleView("editor_view", "grid", "btn_editor_view");
    }
    document.getElementById("btn_tm_view").onclick = function() {
        toggleView("tm_view", "block", "btn_tm_view");
    }

    function setFooter() {
        var footer_string;

        if (window.projectTitle == undefined) {
          return false;
        }

        footer_string = window.projectTitle;

        if (window.fileTitle != undefined) {
            footer_string +=  " | " + window.fileTitle;
        }

        footer.innerHTML = footer_string
    }

    function toggleView(viewId, viewDisplay, buttonId) {
        activeView.style.display = "none";
        activeButton.classList.remove("active");
        activeView = document.getElementById(viewId);
        activeView.style.display = viewDisplay;
        activeButton = document.getElementById(buttonId);
        activeButton.classList.add("active");
    }

    document.getElementById("toggle_sidebar").onclick = function() {
        var sidebar = document.getElementById("sidebar");

        if (sidebar.classList.contains("minimized")) {
            sidebar.classList.remove("minimized");
            this.innerHTML = "<";
        }
        else {
            sidebar.classList.add("minimized");
            this.innerHTML = ">";
        }
    }

    function populate_package_creation_menu(task) {
      overlay.show();

      $.getJSON(
          "http://127.0.0.1:8000/project/" + files_view.attr("cur_p_id")
      ).done(function(data) {
          overlay.find("form").attr("task", task);
          overlay.find("table").empty()
          $.each(data, function(f_id, file) {
              tr = $("<tr>");
              th = $("<th>");
              checkbox = $("<input>");
              checkbox.attr("type", "checkbox");
              checkbox.attr("filename", file.title);
              th.append(checkbox);
              tr.append(th);
              td = $("<td>");
              td.text(file.title);
              tr.append(td);
              overlay.find("table").append(tr);
          })
          tr = $("<tr>");
          td = $("<td colspan=\"2\">");
          submit = $("<input type=\"submit\" value=\"Create Package\"/>");
          td.append(submit);
          tr.append(td);
          overlay.find("table").append(tr);
      })
    }
    $("#btn_create_new_project_package").click(function() {
      populate_package_creation_menu("create_new_project_package");
    })
    $("#btn_create_return_project_package").click(function() {
      populate_package_creation_menu("create_return_project_package");
    })
    $("#btn_update_from_krpp").click(function() {
      pathToKRPP = window.selectKRPP()[0];

      $.post(
        "http://127.0.0.1:8000/package",
        {
          path_to_package: pathToKRPP
        }
      )
      .done(function(data) {
          overlay.show();
          overlay.find("form").attr("task", "update_from_krpp");
          overlay.find("table").empty()
          $.each(data.files_to_unpack, function(i ,filename) {
              tr = $("<tr>");
              th = $("<th>");
              checkbox = $("<input>");
              checkbox.attr("type", "checkbox");
              checkbox.attr("filename", filename);
              th.append(checkbox);
              tr.append(th);
              td = $("<td>");
              td.text(filename);
              tr.append(td);
              overlay.find("table").append(tr);
          })
          tr = $("<tr>");
          td = $("<td colspan=\"2\">");
          submit = $("<input type=\"submit\" value=\"Create Package\"/>");
          td.append(submit);
          tr.append(td);
          overlay.find("table").append(tr);
      })
    })
    $("#btn_create_tm").click(function() {
        window.createNewTM();
    })
    $("#btn_create_project").click(function() {
        window.newProject();
    })
    $("#btn_import_project").click(function() {
        window.importProject();
    })

    $("form#form_create_project_package").submit(function() {
        filesToPackage = [];
        $(this).find("th input:checked").each(function(i, checkbox) {
            filesToPackage.push($(checkbox).attr("filename"));
        });

        if (filesToPackage.length == 0) {
            $(this).closest("main").hide();
            return false;
        }

        parameters = {
            files_to_package: filesToPackage.join(";"),
            task: $(this).attr("task")
        }

        if (parameters.task == "update_from_krpp") {
          parameters.path_to_krpp = pathToKRPP;
        }

        $.post(
            "http://127.0.0.1:8000/project/" + files_view.attr("cur_p_id"),
            parameters
        )

        $(this).closest("main").hide();
        return false;
    })

    window.fetchSegments = fetchSegments;
});
