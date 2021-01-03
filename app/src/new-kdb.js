function fireOnReady() {
    document.getElementById("btn-tm-path").onclick = function() {
        window.selectPath();
    };

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();

        let formData = new FormData();
        formData.append("title", this["title"].value);
        formData.append("path", this["path"].value);
        formData.append("source_language", this["select-source"].value);
        formData.append("target_language", this["select-target"].value);
        formData.append("role", this["kdb-role"].value)

        if (this["select-source"].value == "-----" || this["select-target"].value == "-----") {
            console.error("Source and/or target language not selected!");
            return false;
        }

        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                window.indexRefresh();
                window.close();
            }
        }

        xhttp.open("POST", "http://127.0.0.1:8000/kdb/new", true);
        xhttp.send(formData);
    }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
