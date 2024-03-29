function fireOnReady() {
    window.editorView = document.getElementById("editor-view");
    window.filesTable = document.getElementById("files-table");
    window.filesView = document.getElementById("files-view");
    window.footer = document.getElementsByTagName("footer")[0];
    window.mergeButton = document.getElementById("btn-segment-merge");
    window.overlay = document.getElementById("overlay");
    window.projectsTable = document.getElementById("projects-table");
    window.segmentsDiv = document.getElementById("segments-div");
    window.tBTable = document.getElementById("tbs-table");
    window.tBEntries = document.getElementById("tb-table");
    window.tMTable = document.getElementById("tms-table");
    window.tMEntries = document.getElementById("tm-table");

    window.activeSegment = null;
    window.activeReport = null;

    let activeProject = null;
    let activeFile = null;
    let activeTM = null;
    let activeTB = null;

    let activeButton = document.getElementById("btn-projects-view");
    let activeHeader = document.getElementById("projects-header");
    let activeView = document.getElementById("projects-view");

    document.body.removeAttribute("class");

    setTimeout(() => {
        fetchProjects();
        fetchTBs();
        fetchTMs();
    }, 1000);

    // Fetches the entries in a kdb file
    function fetchEntries(kdb_role, kdb_id, firstRow=0, lastRow=100) {
        let entries;
        let entry;
        let entryKeys;

        if (kdb_role === "tm") {
            kDBEntries = tMEntries;
        } else {
            kDBEntries = tBEntries;
        }

        let queryURL = "http://127.0.0.1:8000/kdb/" + kdb_id;
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                entries = JSON.parse(this.responseText);
                entryKeys = Object.keys(entries);

                kDBEntries.innerHTML = null;

                if (firstRow !== 0) {
                    firstRow = firstRow - 1;
                }

                if (lastRow === 0 || lastRow > entryKeys.length) {
                    lastRow = entryKeys.length;
                }

                for (i = firstRow; i < lastRow; i++) {
                    entry = entries[entryKeys[i]];

                    tr = document.createElement("tr");

                    th = document.createElement("th");
                    th.id = entry.id;
                    th.textContent = entry.id;
                    tr.appendChild(th);

                    td = document.createElement("td");
                    td.innerHTML = entry.source;
                    tr.appendChild(td);

                    td = document.createElement("td");
                    td.innerHTML = entry.target;
                    td.classList.add("target");
                    tr.appendChild(td);

                    kDBEntries.appendChild(tr);
                }
                let entry_count_message;
                if (entryKeys.length === 1) { entry_count_message = "1 entry"}
                else { entry_count_message = entryKeys.length + " entries"}
                if (kdb_role === "tm") {
                    document.getElementById("tm-entry-count").textContent = entry_count_message;
                } else {
                    document.getElementById("tb-entry-count").textContent = entry_count_message;
                }
            }
        }

        xhttp.open("GET", queryURL);
        xhttp.send();

    }
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
                    tr.setAttribute("task", project.task);

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

                        fetchProject(this.getAttribute("project-id"),
                                     this.getAttribute("is-imported"),
                                     this.getAttribute("task"));

                        if (activeProject != null) {
                            activeProject.classList.remove("active");
                        }
                        this.classList.add("active");
                        activeProject = this;

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

                    if (project.due_datetime) {
                        td = document.createElement("td");
                        td.className = "deadline";
                        td.textContent = getDatetimeString(new Date(project.due_datetime));
                        tr.appendChild(td);
                    }

                    if (project.notes) {
                        tr.setAttribute("title", project.notes);
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
                th = document.createElement("th");
                th.innerHTML = "Deadline";
                tr.append(th)
                projectsTable.prepend(tr);

                console.log("Projects fetched.")
            }
            else if (this.readyState == 4 && this.status != 200) {
                console.error("Projects not fetched. Trying again in 2 seconds.")
                setTimeout(() => {
                fetchProjects();
                }, 2000)
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/");
        xhttp.send();
    }

    // Fetches a list of the files in a project
    function fetchProject(projectId, isImported, task) {
        let files;
        let filesKeys;
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                responseJSON = JSON.parse(this.responseText);

                files = responseJSON.files;
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
                    tr.setAttribute("file-path", files[fId].path);
                    tr.setAttribute("can-generate-target-file", files[fId].can_generate_target_file);

                    td = document.createElement("td");
                    td.innerHTML = files[fId].title;
                    tr.append(td);

                    tr.ondblclick = function() {
                        window.fileTitle = this.getElementsByTagName("td")[0].innerHTML;
                        setFooter();

                        fetchSegments(projectId,
                                      this.getAttribute("file-id"),
                                      this.getAttribute("can-generate-target-file"),
                                      task);

                        if (activeFile != null) {
                            activeFile.classList.remove("active");
                        }
                        this.classList.add("active");
                        activeFile = this;
                    }
                    tr.oncontextmenu = function(e) {
                        openFileContextMenu(e,
                                            this.getAttribute("file-id"),
                                            this.getAttribute("file-path"),
                                            this.getAttribute("can-generate-target-file"),
                                            isImported,
                                            task);
                    }

                    filesTable.append(tr);
                }

                reports = responseJSON.reports;
                reportsKeys = Object.keys(reports);

                projectReportsTable = document.getElementById("reports-table").tBodies[0];
                projectReportsTable.innerHTML = "<tr><th><h4>Reports</h4></th></tr>"

                if (reportsKeys.length === 0) {
                    tr = document.createElement("tr");

                    td = document.createElement("td");
                    td.textContent = "-";
                    tr.appendChild(td);

                    projectReportsTable.appendChild(tr);
                }

                for (i = reportsKeys.length - 1; i >= 0; i--) {
                    report = reports[reportsKeys[i]];
                    reportDateString = getDatetimeString(new Date(report.timestamp));

                    tr = document.createElement("tr");
                    tr.id = reportsKeys[i];
                    tr.setAttribute("json", report.json)
                    tr.ondblclick = function() {
                        viewProjectReport(this);
                    }

                    td = document.createElement("td");
                    td.textContent = reportDateString;
                    tr.appendChild(td);

                    projectReportsTable.appendChild(tr);
                }

                reportTable = document.getElementById("project-report");
                reportTable.innerHTML = "<tr>"
                                      + "<th class=\"name\"></th><th>Repetitions</th><th>100%</th><th>95%-99%</th><th>85%-94%</th><th>75%-84%</th><th>50%-74%</th><th>New</th><th>Total</th>"
                                      + "</tr><tr>"
                                      + "<td class=\"name\">-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td>"
                                      + "</tr>"

                filesView.setAttribute("cur-p-id", projectId);
                toggleView("files-view", "grid", "files-header", "btn-files-view");
                document.getElementById("btn-files-view").disabled = false;
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/project/" + projectId);
        xhttp.send();
    }

    // Fetches the segments in a file
    function fetchSegments(projectId, fileId, supportsComments, mode="translation") {
        window.mergeButton.disabled = true;
        window.selectedTU = null;
        window.selectedSegments = [];

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
                translation_units = parser.parseFromString(this.responseText, "text/xml").documentElement;
                sourceDirection = translation_units.getAttribute("source_direction");
                targetDirection = translation_units.getAttribute("target_direction");
                translation_units = translation_units.children;
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
                            s_i_th.onclick = function() {
                                selectSegmentForMerge(this);
                            }
                            segment_row.appendChild(s_i_th);

                            source_td = document.createElement("td");
                            source_td.classList.add("source");
                            source_td.setAttribute("dir", sourceDirection);
                            source_td.innerHTML = segments[s_i].getElementsByTagName("source")[0].innerHTML
                                                  .replace(/\\n/g, "<kaplan:placeholder>")
                                                  .replace(/\n/g, "<ph>\\n</ph>")
                                                  .replace(/<kaplan:placeholder>/g, "\\n");

                            segment_row.appendChild(source_td);

                            target_td = document.createElement("td");
                            target_td.classList.add("target");
                            target_td.setAttribute("dir", targetDirection);
                            target_td.contentEditable = "true";
                            target_td.innerHTML = segments[s_i].getElementsByTagName("target")[0].innerHTML
                                                  .replace(/\\n/g, "<kaplan:placeholder>")
                                                  .replace(/\n/g, "<ph>\\n</ph>")
                                                  .replace(/<kaplan:placeholder>/g, "\\n");
                            target_td.addEventListener("keydown", function(e) { targetKeydownHandler(e, this) });
                            target_td.addEventListener("keyup", function() { [...document.getElementsByTagName("br")].forEach(function(br) { br.remove() }) });
                            target_td.addEventListener("focus", function () {
                                window.activeSegment = this.parentNode;
                                lookupSegment(this.parentNode.children[1]);
                            });
                            target_td.addEventListener("focusout", function () { submitSegment(this, null) });
                            segment_row.appendChild(target_td);

                            ["sc", "ec", "ph", "g", "x"].forEach(function(tagName) {
                                [...segment_row.getElementsByTagName(tagName)].forEach(function(tag) {
                                    if (tag.parentNode.classList.contains("source")) {
                                        tag.addEventListener("click", function() { tagClickHandler(this) });
                                    }
                                    tag.contentEditable = "false";
                                    tag.draggable = "true";
                                })
                            })
                            if (supportsComments === "true") {
                                notesTD = document.createElement("td");
                                notesTD.classList.add("notes");
                                segmentNotes = segments[s_i].getElementsByTagName("misc")
                                if (segmentNotes.length > 0 && segmentNotes[0].childNodes.length > 0) {
                                    segmentNotes[0].childNodes.forEach(function(segmentNote) {
                                        noteDiv = document.createElement("div");
                                        noteDiv.classList.add("note");
                                        noteDiv.id = segmentNote.id;
                                        noteDiv.setAttribute("segment", segmentNote.getAttribute("segment"));

                                        if (segmentNote.tagName === "note") {
                                            closeSpan = document.createElement("span");
                                            closeSpan.textContent = "X";
                                            closeSpan.onclick = function() {
                                                resolveComment(this);
                                            }
                                            noteDiv.appendChild(closeSpan);
                                        } else if (segmentNote.tagName === "lqi" && mode === "review") {
                                          closeSpan = document.createElement("span");
                                          closeSpan.textContent = "X";
                                          closeSpan.onclick = function() {
                                              resolveLQI(this);
                                          }
                                          noteDiv.appendChild(closeSpan);
                                        }

                                        authorP = document.createElement("p");
                                        authorP.textContent = "Author: " + segmentNote.getAttribute("added_by");
                                        noteDiv.appendChild(authorP);

                                        timeP = document.createElement("p");
                                        timeP.textContent = "Time: " + getDatetimeString(segmentNote.getAttribute("added_at") + "Z");
                                        noteDiv.appendChild(timeP);

                                        if (segmentNote.tagName === "lqi") {
                                            noteP = document.createElement("p");
                                            noteP.textContent = "Error: " + segmentNote.getAttribute("type");
                                            noteDiv.appendChild(noteP);
                                        }

                                        noteDiv.appendChild(document.createElement("hr"));

                                        noteP = document.createElement("p");
                                        noteP.textContent = segmentNote.textContent;
                                        noteDiv.appendChild(noteP);

                                        notesTD.appendChild(noteDiv);
                                    })
                                }
                                noteButton = document.createElement("button");
                                noteButton.textContent = "+";
                                noteButton.setAttribute("tabindex", "-1");
                                noteButton.onclick = function() { openCommentForm(this) };
                                notesTD.appendChild(noteButton);

                                if (mode === "review") {
                                    lQIButton = document.createElement("button");
                                    lQIButton.className = "cancel";
                                    lQIButton.textContent = '-';
                                    lQIButton.setAttribute("tabindex", "-1");
                                    lQIButton.onclick = function() { openLQIForm(this) };
                                    notesTD.appendChild(lQIButton);

                                }

                                segment_row.appendChild(notesTD);
                            }

                            translation_unit_table.appendChild(segment_row);
                        }
                        segmentsDiv.appendChild(translation_unit_table);

                        if (i < translation_units.length - 1) {
                            segmentsDiv.appendChild(document.createElement("hr"));
                        }
                    }
                }
                editorView.setAttribute("cur-f-id", fileId);
                editorView.setAttribute("mode", mode);
                document.getElementById("editor-header").className = mode;
                window.editorMode = mode;
                toggleView("editor-view", "grid", "editor-header", "btn-editor-view");
                document.getElementById("btn-editor-view").disabled = false;
            }
        }
        xhttp.open("GET", "http://127.0.0.1:8000/project/" + projectId + "/file/" + fileId);
        xhttp.send();
    }

    // Fetches a list of the termbases
    function fetchTBs() {
        fetchKDBs("tb", "Termbase", tBTable)
    }
    // Fetches a list of the translation memories
    function fetchTMs() {
        fetchKDBs("tm", "Translation Memory", tMTable);
    }
    function fetchKDBs(role, tableHeader, kDBtable) {
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                kDBs = JSON.parse(this.responseText);
                kDBKeys = Object.keys(kDBs);

                kDBtable.innerHTML = "";

                tr = document.createElement("tr");
                tr.innerHTML = "<th class=\"name\"><h4>" + tableHeader + "</h4></th><th><h4>Source Language</h4></th><th><h4>Target Language</h4></th>"
                kDBtable.appendChild(tr);

                for (i = 0; i < kDBKeys.length; i++) {
                    kDB = kDBs[kDBKeys[i]];
                    tr = document.createElement("tr");
                    tr.setAttribute("id", kDB.id);
                    tr.setAttribute("path", kDB.path);
                    tr.setAttribute("is_outdated", kDB.is_outdated);
                    tr.oncontextmenu = function(e) {
                        openKDBContextMenu(e, this);
                    }
                    tr.ondblclick = function() {
                        if (role == "tm"){
                            if (activeTM != null) {
                                activeTM.classList.remove("active");
                            }
                            this.classList.add("active");
                            activeTM = this;
                            fetchEntries(role, this.getAttribute("id"));
                        } else {
                            if (activeTB != null) {
                                activeTB.classList.remove("active");
                            }
                            this.classList.add("active");
                            activeTB = this;
                            fetchEntries(role, this.getAttribute("id"));
                        }
                    }

                    td = document.createElement("td");
                    td.innerHTML = kDB.title;
                    tr.appendChild(td);

                    td = document.createElement("td")
                    td.innerHTML= kDB.source_language;
                    tr.appendChild(td);

                    td = document.createElement("td")
                    td.innerHTML= kDB.target_language;
                    tr.appendChild(td);

                    kDBtable.appendChild(tr);

                }
                console.log(role.toUpperCase() + "s fetched.");
            }
            else if (this.readyState == 4 && this.status != 200) {
                console.error(role.toUpperCase() + "s not fetched. Trying again in 2 seconds.")
                setTimeout(() => {
                    fetchKDBs(role, tableHeader, kDBtable);
                }, 2000)
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/kdb?role=" + role);
        xhttp.send();
    }

    // Navigation
    document.getElementById("btn-projects-view").onclick = function() {
        toggleView("projects-view", "block", "projects-header", "btn-projects-view");
    }
    document.getElementById("btn-files-view").onclick = function() {
        toggleView("files-view", "grid", "files-header", "btn-files-view");
    }
    document.getElementById("btn-editor-view").onclick = function() {
        toggleView("editor-view", "grid", "editor-header", "btn-editor-view");
    }
    document.getElementById("btn-tm-view").onclick = function() {
        toggleView("tm-view", "grid", "tm-header", "btn-tm-view");
    }
    document.getElementById("btn-tb-view").onclick = function() {
        toggleView("tb-view", "grid", "tb-header", "btn-tb-view");
    }
    document.getElementById("btn-mysql-view").onclick = function() {
        toggleView("mysql-view", "block", "mysql-header", "btn-mysql-view");
    }
    document.getElementById("btn-project-settings").onclick = function() {
        toggleView("project-settings-view", "block", "project-settings-header", null);
        getRelevantKDBs();
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
        if (activeButton)
        {
          activeButton.classList.remove("active");
        }
        activeView = document.getElementById(viewId);
        activeView.style.display = viewDisplay;
        activeHeader = document.getElementById(headerId);
        activeHeader.style.display = "block";
        activeButton = document.getElementById(buttonId);
        if (buttonId)
        {
          activeButton.classList.add("active");
        }
    }

    function getRelevantKDBs() {
        let xhttp = new XMLHttpRequest();

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "?task=get_relevant_kdbs";

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                relevantKDBs = JSON.parse(this.responseText);
                let projectTMSelect = document.getElementById("select-project-settings-tm");
                projectTMSelect.innerHTML = null;
                let projectTBSelect = document.getElementById("select-project-settings-tb");
                projectTBSelect.innerHTML = null;
                [...Object.keys(relevantKDBs["tm"])].forEach((key, i) => {
                    let option = new Option(relevantKDBs["tm"][key]["name"], key);
                    projectTMSelect.appendChild(option);
                    option.selected = relevantKDBs["tm"][key]["selected"];
                });
                [...Object.keys(relevantKDBs["tb"])].forEach((key, i) => {
                    let option = new Option(relevantKDBs["tb"][key]["name"], key);
                    projectTBSelect.appendChild(option);
                    option.selected=relevantKDBs["tb"][key]["selected"];
                });
            }
        }

        xhttp.open("GET",  queryURL, true);
        xhttp.send();
    }

    document.getElementById("form-project-settings").onsubmit = function(e) {
        e.preventDefault();

        let xhttp = new XMLHttpRequest();

        let parameters = new FormData();
        parameters.append("task", "set_language_resources");

        let tMs = "";
        [...this['tm'].selectedOptions].forEach((option, i) => {
            if (tMs != "")
            {
              tMs += ";"
            }
            tMs += option.value
        })
        if (tMs != "")
        {
          parameters.append("tm", tMs);
        }

        let tBs = "";
        [...this['tb'].selectedOptions].forEach((option, i) => {
            if (tBs != "")
            {
              tBs += ";"
            }
            tBs += option.value
        })
        if (tBs != "")
        {
          parameters.append("tb", tBs);
        }

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "?task=set_language_resources";

         xhttp.open("POST", queryURL, true);
         xhttp.send(parameters);
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

    function openPackageMenu(task, projectMetadata, pathToKPP=null) {

        projectFiles = projectMetadata.files

        let packageForm = overlay.getElementsByTagName("form")[0];
        let packageTable = overlay.getElementsByTagName("table")[0];

        let buttonText = task.split("_")[0]
        buttonText = buttonText[0].toUpperCase() + buttonText.slice(1)

        overlay.style.display = "grid";

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
            if ("name" in projectFiles[fileKey]) {
                td.textContent = projectFiles[fileKey].name;
            } else {
                td.textContent = projectFiles[fileKey].targetBF;
            }
            tr.appendChild(td);
            packageTable.appendChild(tr);
        });

        if (task === "create_new_project_package") {
            tr = document.createElement("tr");
            th = document.createElement("th");
            th.textContent = "Task:"
            tr.appendChild(th);

            td = document.createElement("td");
            taskOptions = document.createElement("select");
            taskOptions.setAttribute("name", "linguist-task");
            taskOptions.append(new Option("Translation", "translation"));
            taskOptions.append(new Option("Review", "review"));
            td.appendChild(taskOptions);
            tr.appendChild(td)

            packageTable.appendChild(tr);

            tr = document.createElement("tr");
            th = document.createElement("th");
            th.textContent = "Deadline:"
            tr.appendChild(th);

            td = document.createElement("td");
            dateTimeInput = document.createElement("input");
            dateTimeInput.setAttribute("name", "deadline");
            dateTimeInput.setAttribute("type", "datetime-local");
            td.appendChild(dateTimeInput);
            if (projectMetadata.due_datetime) {
              deadline = getDatetimeString(projectMetadata.due_datetime);
              dateTimeInput.value = deadline.split(" ").join("T");
            }
            tr.appendChild(td);

            packageTable.appendChild(tr);

            tr = document.createElement("tr");
            th = document.createElement("th");
            th.textContent = "Notes:"
            tr.appendChild(th);

            td = document.createElement("td");
            textArea = document.createElement("textarea");
            textArea.setAttribute("name", "notes");
            td.appendChild(textArea);
            tr.appendChild(td);

            packageTable.appendChild(tr);
        }

        tr = document.createElement("tr");
        td = document.createElement("td");
        td.setAttribute("colspan", 2);
        button = document.createElement("button");
        button.type = "submit";
        button.textContent = buttonText;
        td.appendChild(button);
        tr.appendChild(td);
        packageTable.appendChild(tr);

        tr = document.createElement("tr");
        td = document.createElement("td");
        td.setAttribute("colspan", 2);
        button = document.createElement("button");
        button.type = "button";
        button.textContent = "Cancel";
        button.classList.add("cancel");
        button.onclick = () => {
          overlay.style.display = "none";
          document.forms[0].removeAttribute("project-package");
        }
        td.appendChild(button);
        tr.appendChild(td);
        packageTable.appendChild(tr);
    }
    document.getElementById("btn-create-new-project-package").onclick = function() {
        let xhttp = new XMLHttpRequest();

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "?task=get_manifest";

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                openPackageMenu("create_new_project_package",
                                JSON.parse(this.responseText));
            }
        }

        xhttp.open("GET",  queryURL, true);
        xhttp.send();
    }
    document.getElementById("btn-create-return-project-package").onclick = function() {
        let xhttp = new XMLHttpRequest();

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id")
                     + "?task=get_manifest";

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                openPackageMenu("create_return_project_package",
                                JSON.parse(this.responseText));
            }
        }

        xhttp.open("GET",  queryURL, true);
        xhttp.send();
    }
    document.getElementById("btn-update-from-package").onclick = function() {
        const filterList = [
            {name: 'Kaplan Project Packages', extensions: ['kpp']}
        ]
        let pathToKPP = window.selectFile(filterList)[0];

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
                                  JSON.parse(this.responseText),
                                  pathToKPP);
             }
         }

        xhttp.open("POST", queryURL, true);
        xhttp.send(parameters);
    }
    document.getElementById("btn-create-tb").onclick = function() {
        window.createNewKDB("tb");
    }
    document.getElementById("btn-create-tm").onclick = function() {
        window.createNewKDB("tm");
    }
    document.getElementById("btn-create-project").onclick = function() {
        window.newProject();
    }
    document.getElementById("btn-import-project").onclick = function() {
        window.importProject();
    }

    document.getElementById("project-package").onsubmit = function(e) {
        e.preventDefault();
        let filesToPackage = [];

        [...this.getElementsByTagName("input")].forEach(input => {
            if (input.checked) {
                filesToPackage.push(input.getAttribute("file-key"));
            }
        })
        if (filesToPackage.length == 0) {
            overlay.style.display = "none";
            this.removeAttribute("project-package");
            return false;
        }

        let queryURL = "http://127.0.0.1:8000/project/"
                     + filesView.getAttribute("cur-p-id");

        let parameters = new FormData();
        if (this.getAttribute("project-package")) {
          parameters.append("project_package", this.getAttribute("project-package"));
        } else {
          const filterList = [
              {name: 'Kaplan Project Packages', extensions: ['kpp']}
          ]
          parameters.append("project_package", window.setFile(filterList));
        }
        parameters.append("files", filesToPackage.join(";"));
        parameters.append("task", this.getAttribute("task"));
        if (this["linguist-task"] != null) {
            parameters.append("linguist_task", this["linguist-task"].value);
        }
        if (this["notes"] != null) {
            parameters.append("notes", this["notes"].value);
        }
        if (this["deadline"] != null && this["deadline"].value != "") {
            deadline = new Date(this["deadline"].value);
            parameters.append("deadline", deadline.toISOString());
        }

        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                overlay.style.display = "none";
                document.forms[0].removeAttribute("project-package");
            }
        }
        xhttp.open("POST",  queryURL, true);
        xhttp.send(parameters);
    }

    window.fetchSegments = fetchSegments;

    document.getElementById("tm-first-row").onkeyup = function() {
        if (activeTM == null) {
            return
        } else if (this.value === "") {
           firstRow = 0;
        } else {
            firstRow = parseInt(this.value);
        }
        if (document.getElementById("tm-last-row").value === "") {
            lastRow = 0
        } else {
            lastRow = parseInt(document.getElementById("tm-last-row").value);
        }
        fetchEntries("tm", activeTM.id, firstRow, lastRow);
    }
    document.getElementById("tm-last-row").onkeyup = function() {
        if (activeTM == null) {
            return
        } else if (this.value === "") {
            lastRow = 0;
        } else {
            lastRow = parseInt(this.value);
        }
        if (document.getElementById("tm-first-row").value === "") {
            firstRow = 0;
        } else {
            firstRow = parseInt(document.getElementById("tm-first-row").value);
        }
        fetchEntries("tm", activeTM.id, firstRow, lastRow);
    }

    document.getElementById("tb-first-row").onkeyup = function() {
        if (activeTB == null) {
            return
        } else if (this.value === "") {
           firstRow = 0;
        } else {
            firstRow = parseInt(this.value);
        }
        if (document.getElementById("tb-last-row").value === "") {
            lastRow = 0
        } else {
            lastRow = parseInt(document.getElementById("tb-last-row").value);
        }
        fetchEntries("tb", activeTB.id, firstRow, lastRow);
    }
    document.getElementById("tb-last-row").onkeyup = function() {
        if (activeTB == null) {
            return
        } else if (this.value === "") {
            lastRow = 0;
        } else {
            lastRow = parseInt(this.value);
        }
        if (document.getElementById("tb-first-row").value === "") {
            firstRow = 0;
        } else {
            firstRow = parseInt(document.getElementById("tb-first-row").value);
        }
        fetchEntries("tb", activeTB.id, firstRow, lastRow);
    }
};

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
