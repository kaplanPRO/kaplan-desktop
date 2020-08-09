$(document).ready(function() {
    $("#btn_tm_path").click(function() {
        window.selectPath();
    });

    $("form").submit(() => {
        if ($("select#select_source option:selected").val() == "-----" || $("select#select_target option:selected").val() == "-----") {
            console.error("Source and/or target language not selected!");
            alert("Source and/or target language not selected!");
            return false;
        }

        $.post(
            "http://127.0.0.1:8000/tm/new",
            {
               title: $("input#input_title").val(),
               path: $("input#input_path").val(),
               source_language: $("select#select_source option:selected").val(),
               target_language: $("select#select_target option:selected").val(),
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
    })
});