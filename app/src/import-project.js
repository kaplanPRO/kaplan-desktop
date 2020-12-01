function fireOnReady() {
    document.getElementById("btn-choose-dir").onclick = () => {
        window.selectDirectory();
    };
    document.getElementById("btn-choose-path").onclick = () => {
        window.selectPath();
    };

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();

        let xhttp = new XMLHttpRequest();
        const queryURL = "http://127.0.0.1:8000/project/import";
        let formData = new FormData();
        formData.append("path", document.getElementById("input-path").value);
        formData.append("directory", document.getElementById("input-dir").value);

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                window.indexRefresh();
                window.close();
            } else if (this.readyState == 4 && this.status == 500) {
                errorMessage = JSON.parse(this.responseText).error;
                console.error(errorMessage);
                alert(errorMessage);
            }
        }

        xhttp.open("POST", queryURL, true);
        xhttp.send(formData);
    };
}
if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
