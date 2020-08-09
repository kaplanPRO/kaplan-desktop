$(document).ready(function() {
    select_source = $("select#select_source");
    select_target = $("select#select_target");
    select_tms = $("select#select_tms");

    $("#btn_choose_dir").click(() => {
        window.selectDirectory();
    });

    $("#btn_choose_files").click(() => {
        window.selectFiles();
    });

    select_source.change(() => {
        language_select_change_handler();
    })

    select_target.change(() => {
        language_select_change_handler();
    })

    $("form").submit(() => {
        let files = [];

        $("ul").children("li").each(function(i, li) {
            files.push($(li).attr("path"));
        })

        if (files.length < 1) {
            console.error("No files selected.");
            alert("No files selected.");
            return false;
        }

        if ($("select#select_source option:selected").val() == "-----" || $("select#select_target option:selected").val() == "-----") {
            console.error("Source and/or target language not selected!");
            alert("Source and/or target language not selected!");
            return false;
        }

        $.post(
            "http://127.0.0.1:8000/project/new",
            {
            title: $("input#input_title").val(),
            directory: $("input#input_dir").val(),
            source_language: select_source.find("option:selected").val(),
            target_language: select_target.find("option:selected").val(),
            translation_memories: select_tms.val().join(";"),
            files: files.join(";"),
            }
        )
        .done(function() {
            window.indexRefresh();
            window.close();
        })
        .fail(function(data) {
            alert(data.responseJSON.error);
        })

        return false;
    });

    function language_select_change_handler() {
        $.getJSON(
            "http://127.0.0.1:8000/tms",
            {
            source_language: select_source.find("option:selected").val(),
            target_language: select_target.find("option:selected").val(),
            },
            function(data) {
            select_tms.empty();
            $.each(data, function(tm_title, tm) {
                select_tms.append(new Option(tm.title, tm.id));
            })
            }
        )
    }
})