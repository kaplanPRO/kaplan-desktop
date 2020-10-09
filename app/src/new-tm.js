function fireOnReady() {
    document.getElementById("btn-tm-path").onclick = function() {
        window.selectPath();
    };

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();

        let parameters = "title=" + encodeURIComponent(this["title"].value)
                         + "&path=" + encodeURIComponent(this["path"].value)
                         + "&source_language=" + encodeURIComponent(this["select-source"].value)
                         + "&target_language=" + encodeURIComponent(this["select-target"].value);

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

        xhttp.open("POST", "http://127.0.0.1:8000/tm/new", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
        xhttp.send(parameters);
    }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
