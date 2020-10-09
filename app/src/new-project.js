function fireOnReady() {
    const selectSource = document.getElementById("select-source");
    const selectTarget = document.getElementById("select-target");
    const selectTMs = document.getElementById("select-tms");

    document.getElementById("btn-choose-dir").onclick = function() {
        window.selectDirectory();
    };

    document.getElementById("btn-choose-files").onclick = function() {
        window.selectFiles();
    };

    selectSource.onchange = function() {
        fetchRelevantTMs();
    };

    selectTarget.onchange = function() {
        fetchRelevantTMs();
    };

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();

        let files = [];
        let parameters;
        let translationMemories = [];

        [...document.getElementsByTagName("ul")[0].getElementsByTagName("li")].forEach(function(li) {
            files.push(li.getAttribute("path"));
            console.log(li);
        })

        if (files.length < 1) {
            console.error("No files selected.");
            alert("No files selected.");
            return false;
        }

        if (selectSource.value == "-----" || selectTarget.value == "-----") {
            console.error("Source and/or target language not selected!");
            alert("Source and/or target language not selected!");
            return false;
        }

        [...document.getElementById("select-tms").selectedOptions].forEach(function(tm) {
            translationMemories.push(tm.value);
        })

        parameters = "title=" + encodeURIComponent(this["title"].value)
                     + "&directory=" + encodeURIComponent(this["dir"].value)
                     + "&source_language=" + encodeURIComponent(selectSource.value)
                     + "&target_language=" + encodeURIComponent(selectTarget.value);
        if (translationMemories.length > 0) {
           parameters += "&translation_memories="
                      + encodeURIComponent(translationMemories.join(";"));
        }
        parameters += "&files=" + encodeURIComponent(files.join(';'));

        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
              window.indexRefresh();
              window.close();
          }
        }

        xhttp.open("POST", "http://127.0.0.1:8000/project/new", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded; charset=utf-8");
        xhttp.send(parameters);
    };

    function fetchRelevantTMs() {
        let translationMemories;
        let translationMemory;

        let queryParameters = "source_language="+selectSource.value+"&target_language="+selectTarget.value;
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                selectTMs.innerHTML = "";
                translationMemories = JSON.parse(this.responseText);
                Object.keys(translationMemories).forEach(function(tMId) {
                    translationMemory = translationMemories[tMId];
                    selectTMs.appendChild(new Option(translationMemory.title, translationMemory.id))
                })
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/tms?" + queryParameters, true);
        xhttp.send();
    }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
