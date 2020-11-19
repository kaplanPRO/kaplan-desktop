function getTargetTranslation(fileId) {
    let xhttp = new XMLHttpRequest();
    let queryURL = "http://127.0.0.1:8000/project/"
                 + filesView.getAttribute("cur-p-id")
                 + "/file/"
                 + fileId
    let taskForm = new FormData();
    taskForm.append("task", "generate_target_translation");

    xhttp.open("POST", queryURL, true);
    xhttp.send(taskForm);
}
