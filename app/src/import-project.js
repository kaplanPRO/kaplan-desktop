$(document).ready(function() {
    $("#btn-choose-dir").click(() => {
        window.selectDirectory();
    });
    $("#btn-choose-path").click(() => {
        window.selectPath();
    });

    $("form").submit(() => {
        $.post(
            "http://127.0.0.1:8000/project/import",
            {
            path: $("input#input-path").val(),
            directory: $("input#input-dir").val(),
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
