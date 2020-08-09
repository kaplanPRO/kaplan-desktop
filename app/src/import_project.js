$(document).ready(function() {
    $("#btn_choose_dir").click(() => {
        window.selectDirectory();
    });
    $("#btn_choose_path").click(() => {
        window.selectPath();
    });

    $("form").submit(() => {
        $.post(
            "http://127.0.0.1:8000/project/import",
            {
            path: $("input#input_path").val(),
            directory: $("input#input_dir").val(),
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

})