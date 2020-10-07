function fireOnReady() {
    document.getElementById("btn-tm-path").onclick = function() {
        window.selectPath();
    };

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();

        let title = this["title"].value;
        let path = this["path"].value;
        let sourceLanguage = this["select-source"].value;
        let targetLanguage = this["select-target"].value;

        if (sourceLanguage == "-----" || targetLanguage == "-----") {
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
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("title="+title+"&path="+path+"&source_language="+sourceLanguage+"&target_language="+targetLanguage);
    }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
