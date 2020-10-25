function fireOnReady() {
    window.editorView = document.getElementById("editor-view");
    window.filesTable = document.getElementById("files-table");
    window.filesView = document.getElementById("files-view");
    window.footer = document.getElementsByTagName("footer")[0];
    window.overlay = document.getElementById("overlay");
    window.projectsTable = document.getElementById("projects-table");
    window.segmentsDiv = document.getElementById("segments-div");
    window.tMTable = document.getElementById("tms-table");

    const hitsTable = document.getElementById("hits-table");

    window.activeSegment = null;

    let activeButton = document.getElementById("btn-projects-view");
    let activeHeader = document.getElementById("projects-header");
    let activeView = document.getElementById("projects-view");

    document.getElementsByTagName("body")[0].removeAttribute("class");

    setTimeout(() => {
        fetchProjects();
        fetchTMs();
    }, 1000);

    // Fetches a list of the projects
    function fetchProjects() {
        let projects;
        let projectsKeys;
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                projects = JSON.parse(this.responseText);
                projectsKeys = Object.keys(projects);

                projectsTable.innerHTML = "";

                for (i = 0; i < projectsKeys.length; i++) {
                    projectId = projectsKeys[i];
                    project = projects[projectId];
                    tr = document.createElement("tr");
                    tr.setAttribute("project-id", projectsKeys[i]);
                    tr.setAttribute("is-imported", project.is_imported);
                    tr.setAttribute("is-exported", project.is_exported);

                    td = document.createElement("td");
                    td.className = "project-title";
                    td.innerHTML = project.title;
                    tr.append(td);

                    td = document.createElement("td");
                    td.className = "source language";
                    td.setAttribute("lang-code", project.source_language_code);
                    td.innerHTML = project.source_language;
                    tr.append(td);

                    td = document.createElement("td");
                    td.className = "target language";
                    td.setAttribute("lang-code", project.target_language_code)
                    td.innerHTML = project.target_language;
                    tr.append(td);

                    tr.ondblclick = function() {
                        window.projectTitle = this.getElementsByTagName("td")[0].innerHTML;
                        window.fileTitle = undefined;
                        setFooter();

                        langPair = [this.children[1].getAttribute("lang-code"), this.children[2].getAttribute("lang-code")];
                        window.setSpellCheckerLanguages(langPair);

                        fetchProject(this.getAttribute("project-id"));

                        if (this.getAttribute("is-imported") == "true") {
                            document.getElementById("btn-create-new-project-package").style.display = "none";
                            document.getElementById("btn-create-return-project-package").style.display = "inline-block";
                            document.getElementById("btn-update-from-package").style.display = "none";
                        }
                        else if (this.getAttribute("is-exported") == "true") {
                            document.getElementById("btn-create-return-project-package").style.display = "none";
                            document.getElementById("btn-update-from-package").style.display = "inline-block";
                            document.getElementById("btn-create-new-project-package").style.display = "inline-block";
                        }
                        else {
                            document.getElementById("btn-create-return-project-package").style.display = "none";
                            document.getElementById("btn-update-from-package").style.display = "none";
                            document.getElementById("btn-create-new-project-package").style.display = "inline-block";
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
    function fetchProject(projectId) {
        let files;
        let filesKeys;
        let xhttp = new XMLHttpRequest();

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
                    fId = filesKeys[i];
                    tr = document.createElement("tr");
                    tr.setAttribute("file-id", fId);
                    tr.setAttribute("filePath", files[fId].path);

                    td = document.createElement("td");
                    td.innerHTML = files[fId].title;
                    tr.append(td);

                    tr.ondblclick = function() {
                        window.fileTitle = this.getElementsByTagName("td")[0].innerHTML;
                        setFooter();

                        fetchSegments(projectId, this.getAttribute("file-id"));
                    }
                    tr.oncontextmenu = function(e) {
                        openFileContextMenu(e, this.getAttribute("file-id"), this.getAttribute("filePath"));
                    }

                    filesTable.append(tr);
                }
                $("main#files-view").attr("cur-p-id", projectId);
                toggleView("files-view", "block", "files-header", "btn-files-view");
                $("button#btn-files-view").prop("disabled", false);
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/project/" + projectId);
        xhttp.send();
    }

    // Fetches the segments in a file
    function fetchSegments(projectId, fileId) {
        let parser = new DOMParser();
        let xhttp = new XMLHttpRequest();

        let pI;
        let segment_row;
        let source_td;
        let tags;
        let target_td;
        let translation_unit_table;
        let translation_units;

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                segmentsDiv.innerHTML = "";
                translation_units = parser.parseFromString(this.responseText, "text/xml").documentElement.children;
                for (i = 0; i < translation_units.length; i++) {
                    pId = translation_units[i].getAttribute("id");
                    segments = translation_units[i].getElementsByTagName("segment")
                    if (segments.length > 0) {
                        translation_unit_table = document.createElement("table");
                        translation_unit_table.classList.add("segments-table");
                        for (s_i = 0; s_i < segments.length; s_i++) {
                            segment_row = document.createElement("tr");
                            segment_row.id = segments[s_i].id
                            segment_row.setAttribute("p-id", pId)
                            if (segments[s_i].getAttribute("state") != null) {
                              segment_row.classList.add(segments[s_i].getAttribute("state"));
                            }
                            s_i_th = document.createElement("th");
                            s_i_th.innerHTML = segments[s_i].id;
                            segment_row.appendChild(s_i_th);

                            source_td = document.createElement("td");
                            source_td.classList.add("source");
                            source_td.innerHTML = segments[s_i].getElementsByTagName("source")[0].innerHTML
                                                  .replace(/\\n/g, "<kaplan:placeholder>")
                                                  .replace(/\n/g, "<ph>\\n</ph>")
                                                  .replace(/<kaplan:placeholder>/g, "\\n");

                            segment_row.appendChild(source_td);

                            target_td = document.createElement("td");
                            target_td.classList.add("target");
                            target_td.contentEditable = "true";
                            target_td.innerHTML = segments[s_i].getElementsByTagName("target")[0].innerHTML
                                                  .replace(/\\n/g, "<kaplan:placeholder>")
                                                  .replace(/\n/g, "<ph>\\n</ph>")
                                                  .replace(/<kaplan:placeholder>/g, "\\n");
                            target_td.addEventListener("keydown", function(e) { targetKeydownHandler(e, $(this)) });
                            target_td.addEventListener("keyup", function() { [...document.getElementsByTagName("br")].forEach(function(br) { br.remove() }) });
                            target_td.addEventListener("focus", function () {
                                window.activeSegment = this.parentNode;
                                lookupSegment(this.parentNode.children[1], hitsTable);
                            });
                            target_td.addEventListener("focusout", function () { submitSegment($(this), "draft") });
                            segment_row.appendChild(target_td);

                            ["sc", "ec", "ph", "g"].forEach(function(tagName) {
                                [...segment_row.getElementsByTagName(tagName)].forEach(function(tag) {
                                    if (tag.parentNode.classList.contains("source")) {
                                        tag.addEventListener("click", function() { tagClickHandler(this) });
                                    }
                                    tag.contentEditable = "false";
                                })
                            })

                            translation_unit_table.appendChild(segment_row);
                        }
                        segmentsDiv.appendChild(translation_unit_table);

                        if (i < translation_units.length - 1) {
                            segmentsDiv.appendChild(document.createElement("hr"));
                        }
                    }
                }
                $("main#editor-view").attr("cur-f-id", fileId);
                toggleView("editor-view", "grid", "editor-header", "btn-editor-view");
                $("button#btn-editor-view").prop("disabled", false);
            }
        }
        xhttp.open("GET", "http://127.0.0.1:8000/project/" + projectId + "/file/" + fileId);
        xhttp.send();
    }

    // Fetches a list of the translation memories
    function fetchTMs() {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                tMs = JSON.parse(this.responseText);
                tMKeys = Object.keys(tMs);

                tMTable.innerHTML = "";

                tr = document.createElement("tr");
                tr.innerHTML = "<th class=\"name\"><h4>Translation Memory</h4></th><th><h4>Source Language</h4></th><th><h4>Target Language</h4></th>"
                tMTable.appendChild(tr);

                for (i = 0; i < tMKeys.length; i++) {
                    translationMemory = tMs[tMKeys[i]];
                    tr = document.createElement("tr");
                    tr.setAttribute("id", translationMemory.id);
                    tr.setAttribute("path", translationMemory.path);
                    tr.oncontextmenu = function(e) {
                        openTMContextMenu(e, this.getAttribute("path"));
                    }

                    td = document.createElement("td");
                    td.innerHTML = translationMemory.title;
                    tr.appendChild(td);

                    td = document.createElement("td")
                    td.innerHTML= translationMemory.source_language;
                    tr.appendChild(td);

                    td = document.createElement("td")
                    td.innerHTML= translationMemory.target_language;
                    tr.appendChild(td);

                    tMTable.appendChild(tr);

                }
                console.log("TMs fetched.");
            }
            else if (this.readyState == 4 && this.status != 200) {
                console.log("TMs not fetched. Trying again in 2 seconds.")
                setTimeout(() => {
                    fetchTMs();
                }, 2000)
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/tms");
        xhttp.send();
    }

    // Navigation
    document.getElementById("btn-projects-view").onclick = function() {
        toggleView("projects-view", "block", "projects-header", "btn-projects-view");
    }
    document.getElementById("btn-files-view").onclick = function() {
        toggleView("files-view", "block", "files-header", "btn-files-view");
    }
    document.getElementById("btn-editor-view").onclick = function() {
        toggleView("editor-view", "grid", "editor-header", "btn-editor-view");
    }
    document.getElementById("btn-tm-view").onclick = function() {
        toggleView("tm-view", "block", "tm-header", "btn-tm-view");
    }

    function setFooter() {
        let footerString;

        if (window.projectTitle == undefined) {
          return false;
        }

        footerString = window.projectTitle;

        if (window.fileTitle != undefined) {
            footerString +=  " | " + window.fileTitle;
        }

        footer.innerHTML = footerString
    }

    function toggleView(viewId, viewDisplay, headerId, buttonId) {
        activeView.style.display = "none";
        activeHeader.style.display = "none";
        activeButton.classList.remove("active");
        activeView = document.getElementById(viewId);
        activeView.style.display = viewDisplay;
        activeHeader = document.getElementById(headerId);
        activeHeader.style.display = "block";
        activeButton = document.getElementById(buttonId);
        activeButton.classList.add("active");
    }

    document.getElementById("toggle-sidebar").onclick = function() {
        const sidebar = document.getElementById("sidebar");

        if (sidebar.classList.contains("minimized")) {
            sidebar.classList.remove("minimized");
            this.innerHTML = "<";
        }
        else {
            sidebar.classList.add("minimized");
            this.innerHTML = ">";
        }
    }

    function openPackageMenu(task, projectFiles, pathToKPP=null) {

        let packageForm = overlay.getElementsByTagName("form")[0];
        let packageTable = overlay.getElementsByTagName("table")[0];

        overlay.style.display = "block";

        packageForm.setAttribute("task", task);
        if (pathToKPP) {
            packageForm.setAttribute("project-package", pathToKPP);
        }

        packageTable.innerHTML = "";

        [...Object.keys(projectFiles)].forEach((fileKey) => {
            tr = document.createElement("tr");
            th = document.createElement("th");
            input = document.createElement("input");
            input.type = "checkbox";
            input.setAttribute("file-key", fileKey);
            th.appendChild(input);
            tr.appendChild(th);

            td = document.createElement("td");
            td.textContent = projectFiles[fileKey]["targetBF"];
            tr.appendChild(td);
            packageTable.appendChild(tr);
        });

        tr = document.createElement("tr");
        td = document.createElement("td");
        td.setAttribute("colspan", 2);
        button = document.createElement("button");
        button.type = "submit";
        button.textContent = "Update";
        td.appendChild(button);
        tr.append(td);
        packageTable.append(tr);

    }
    document.getElementById("btn-create-new-project-package").onclick = function() {
        pathToKPP = window.setFile([]);

        let xhttp = new XMLHttpRequest();

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "?task=get_manifest";

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                openPackageMenu("create_new_project_package",
                                JSON.parse(this.responseText).files,
                                pathToKPP);
            }
        }

        xhttp.open("GET",  queryURL, true);
        xhttp.send();
    }
    document.getElementById("btn-create-return-project-package").onclick = function() {
        pathToKPP = window.setFile([]);

        let xhttp = new XMLHttpRequest();

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "?task=get_manifest";

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                openPackageMenu("create_return_project_package",
                                JSON.parse(this.responseText).files,
                                pathToKPP);
            }
        }

        xhttp.open("GET",  queryURL, true);
        xhttp.send();
    }
    document.getElementById("btn-update-from-package").onclick = function() {
        let pathToKPP = window.selectKPP()[0];

        let xhttp = new XMLHttpRequest();

        let queryURL = "http://127.0.0.1:8000/package";
        let parameters = new FormData();
        parameters.append("project_package", pathToKPP);

        let packageForm = overlay.getElementsByTagName("form")[0];
        let packageTable = overlay.getElementsByTagName("table")[0];
        let projectFiles;

        xhttp.onreadystatechange = function() {
             if (this.readyState == 4 && this.status == 200) {
                  openPackageMenu("update_from_project_package",
                                  JSON.parse(this.responseText).files,
                                  pathToKPP);
             }
         }

        xhttp.open("POST", queryURL, true);
        xhttp.send(parameters);
    }
    document.getElementById("btn-create-tm").onclick = function() {
        window.createNewTM();
    }
    document.getElementById("btn-create-project").onclick = function() {
        window.newProject();
    }
    document.getElementById("btn-import-project").onclick = function() {
        window.importProject();
    }

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();
        let filesToPackage = [];

        [...this.getElementsByTagName("input")].forEach(input => {
            if (input.checked) {
                filesToPackage.push(input.getAttribute("file-key"));
            }
        })
        if (filesToPackage.length == 0) {
            overlay.style.display = "none";
        }

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id");

        let parameters = new FormData();
        parameters.append("project_package", this.getAttribute("project-package"));
        parameters.append("files", filesToPackage.join(";"));
        parameters.append("task", this.getAttribute("task"));

        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                overlay.style.display = "none";
            }
        }
        xhttp.open("POST",  queryURL, true);
        xhttp.send(parameters);
    }

    window.fetchSegments = fetchSegments;
};

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
