$(document).ready(function() {
    const editor_view = $("#editor_view");
    const files_table = $("#files_table");
    const files_view = $("#files_view");
    const overlay = $("main#overlay");
    const projects_table = $("#projects_table");
    const segments_table = $("#segments_table");
    const segment_hits_table = $("#hits_table");
    const tms_table = $("#tms_table");

    let active_view = $("main#projects_view");
    let active_button = $("button#btn_projects_view");

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
        $.getJSON(
            "http://127.0.0.1:8000/",
            function(data) {
            projects_table.empty();
            $.each(data, function(p_id, project) {
                tr = $("<tr>");
                tr.attr("project_id", p_id);
                tr.attr("is_imported", project.is_imported);
                tr.attr("is_exported", project.is_exported);
                title_td = $("<td class='project_title'>");
                title_td.text(project.title);
                tr.append(title_td);
                src_lng_td = $("<td class='source language'>");
                src_lng_td.attr("lang_code", project.source_language_code);
                src_lng_td.text(project.source_language);
                tr.append(src_lng_td);
                trg_lng_td = $("<td class='target language'>");
                trg_lng_td.attr("lang_code", project.target_language_code);
                trg_lng_td.text(project.target_language);
                tr.append(trg_lng_td);
                tr.dblclick(function() {
                    lang_pair = [$(this).find("td.source").attr("lang_code"),
                                 $(this).find("td.target").attr("lang_code")];
                    window.setSpellCheckerLanguages(lang_pair);
                    fetchProject($(this).attr("project_id"));
                    if ($(this).attr("is_imported") == "true") {
                        $("#btn_create_new_project_package").hide();
                        $("#btn_create_return_project_package").show();
                        $("#btn_update_from_krpp").hide();
                    }
                    else if ($(this).attr("is_exported") == "true") {
                        $("#btn_create_return_project_package").hide();
                        $("#btn_update_from_krpp").show();
                        $("#btn_create_new_project_package").show();
                    }
                    else {
                        $("#btn_create_return_project_package").hide();
                        $("#btn_update_from_krpp").hide();
                        $("#btn_create_new_project_package").show();
                    }
                });

                projects_table.prepend(tr);
            });
            projects_table.prepend($("<tr><th class=\"name\"><h4>Project Name</h4></th><th><h4>Source Language</h4></th><th><h4>Target Language</h4></th></tr>"));
            }
        )
        .done(() => {
            console.log("Projects fetched.")
        })
        .fail(() => {
            console.log("Projects not fetched. Trying again in 2 seconds.")
            setTimeout(() => {
            fetchProjects();
            }, 2000)
        })
    }

    // Fetches a list of the files in a project
    function fetchProject(project_id) {
        $.getJSON(
            "http://127.0.0.1:8000/project/" + project_id
        )
        .done(function(data) {
            files_table.empty();
            files_table.append($("<tr><th class=\"name\"><h4>File Name</h4></th></tr>"));
            $.each(data, function(f_id, file) {
                tr = $("<tr>");
                tr.attr("file_id", f_id);
                tr.dblclick(function() {fetchSegments(project_id, f_id)});
                tr.contextmenu(function(e) {window.openFileContextMenu(e, this)});
                title_td = $("<td>");
                title_td.text(file.title);
                tr.append(title_td);
                empty_td = $("<td>");
                tr.append(empty_td);
                files_table.append(tr);
            })
            $("main#files_view").attr("cur_p_id", project_id);
            toggleView("main#files_view", $("button#btn_files_view"));
            $("button#btn_files_view").prop("disabled", false);
        })
    }

    // Fetches the segments in a file
    function fetchSegments(project_id, file_id) {
        var parser = new DOMParser();
        var segments_div = document.getElementById("segments_div");
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
                segments_div.innerHTML = "";
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
                        segments_div.appendChild(translation_unit_table);

                        if (i < translation_units.length - 1) {
                            segments_div.appendChild(document.createElement("hr"));
                        }
                    }
                }
                $("main#editor_view").attr("cur_f_id", file_id);
                toggleView("main#editor_view", $("button#btn_editor_view"));
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
    $("button#btn_projects_view").click(function() {
        toggleView("main#projects_view", $(this));
    })
    $("button#btn_files_view").click(function() {
        toggleView("main#files_view", $(this));
    })
    $("button#btn_editor_view").click(function() {
        toggleView("main#editor_view", $(this));
    })
    $("button#btn_tm_view").click(function() {
        toggleView("main#tm_view", $(this));
    })

    function toggleView(to_view_id, button) {
        active_view.fadeOut(0);
        active_button.removeClass("active");
        active_view = $(to_view_id);
        active_view.fadeIn(400);
        active_button = button;
        button.addClass("active");
    }

    $("button#toggle_sidebar").click(function() {
        $("div#sidebar span").toggle()
    })

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
