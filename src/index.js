$(document).ready(function() {
    const editor_view = $("#editor_view");
    const files_table = $("#files_table");
    const files_view = $("#files_view");
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
                tr.dblclick(function() {fetchProject($(this).attr("project_id"))});
                title_td = $("<td class='project_title'>");
                title_td.text(project.title);
                tr.append(title_td);
                src_lng_td = $("<td>");
                src_lng_td.addClass("language");
                src_lng_td.text(project.source_language);
                tr.append(src_lng_td);
                trg_lng_td = $("<td>");
                trg_lng_td.addClass("language");
                trg_lng_td.text(project.target_language);
                tr.append(trg_lng_td);
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
        $.getJSON(
            "http://127.0.0.1:8000/project/" + project_id + "/file/" + file_id
        )
        .done(function(data) {
            segments_table.empty();
            $.each(data, function(s_id, segment) {
            tr = $("<tr>");
            tr.attr("id", s_id);
            tr.attr("p_id", segment.paragraph);
            if (segment.status) {
                tr.addClass(segment.status);
            }
            s_id_th = $("<th>");
            s_id_th.text(s_id);
            s_id_th.click(function() { segmentSelect($(this).closest("tr")) });
            tr.append(s_id_th);
            source_td = $("<td class='source'>");
            source_td.html(segment.source);
            $(source_td).find("tag").click(function() { tagClickHandler(this) });
            tr.append(source_td);
            target_td = $("<td class='target'>");
            target_td.html(segment.target);
            target_td.attr("contenteditable", true);
            target_td.keydown(function(e) { targetKeydownHandler(e, $(this)) });
            target_td.keyup(function() { $(this).find("br").remove() });
            target_td.focus(function () { segmentLookup($(this).closest("tr").find("td.source"), segment_hits_table) });
            target_td.focusout(function () { submitSegment($(this), "draft") });
            tr.append(target_td);
            segments_table.append(tr);
            })
            $("main#editor_view").attr("cur_f_id", file_id);
            toggleView("main#editor_view", $("button#btn_editor_view"));
            $("button#btn_editor_view").prop("disabled", false);
        })
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
        if ($(this).text() == "<") {
            $("div#sidebar").css("width", "4rem");
            $("body#index main").css("margin-left", "4rem");
            $(this).text(">");
        }
        else {
            $("div#sidebar").css("width", "7rem");
            $("body#index main").css("margin-left", "7rem");
            $(this).text("<");
        }
    })

    $("#btn_create_project").click(function() {
        window.createNewProject();
    })
    $("#btn_create_tm").click(function() {
        window.createNewTM();
    })

    window.fetchSegments = fetchSegments;
});
