function getTargetTranslation(fileId) {
    $.post(
        "http://127.0.0.1:8000/project/" + filesView.getAttribute("cur-p-id") + "/file/" + fileId,
        {
            task: "generate_target_translation",
        }
    )
}
