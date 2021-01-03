function fireOnReady() {
    const selectSource = document.getElementById("select-source");
    const selectTarget = document.getElementById("select-target");
    const selectTMs = document.getElementById("select-tms");
    const selectTBs = document.getElementById("select-tbs");

    document.getElementById("btn-choose-dir").onclick = function() {
        window.selectDirectory();
    };

    document.getElementById("btn-choose-files").onclick = function() {
        window.selectFiles();
    };

    selectSource.onchange = function() {
        fetchRelevantTBs();
        fetchRelevantTMs();
    };

    selectTarget.onchange = function() {
        fetchRelevantTBs();
        fetchRelevantTMs();
    };

    document.forms[0].onsubmit = function(e) {
        e.preventDefault();

        let files = [];
        let parameters;
        let languageResources = [];

        [...document.getElementsByTagName("ul")[0].getElementsByTagName("li")].forEach(function(li) {
            files.push(li.getAttribute("path"));
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
            languageResources.push(tm.value);
        });

        [...document.getElementById("select-tbs").selectedOptions].forEach(function(tb) {
            languageResources.push(tb.value);
        });

        let formData = new FormData();
        formData.append("title", this["title"].value);
        formData.append("directory", this["dir"].value);
        formData.append("source_language", selectSource.value);
        formData.append("target_language", selectTarget.value);
        if (languageResources.length > 0) {
           formData.append("language_resources", languageResources.join(";"));
        }
        formData.append("files", files.join(';'));

        let xhttp = new XMLHttpRequest();

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

        xhttp.open("POST", "http://127.0.0.1:8000/project/new", true);
        xhttp.send(formData);
    };

    function fetchRelevantTMs() {
        fetchRelevantKDBs("tm", selectTMs);
    }
    function fetchRelevantTBs() {
        fetchRelevantKDBs("tb", selectTBs);
    }

    function fetchRelevantKDBs(role, selectElement) {
        let translationMemories;
        let translationMemory;

        let queryParameters = "source_language="+selectSource.value+"&target_language="+selectTarget.value;
        let xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                selectElement.innerHTML = "";
                kDBs = JSON.parse(this.responseText);
                Object.keys(kDBs).forEach(function(kDBId) {
                    kDB = kDBs[kDBId];
                    selectElement.appendChild(new Option(kDB.title, kDB.id))
                })
            }
        }

        xhttp.open("GET", "http://127.0.0.1:8000/kdb?role=" + role + "&" + queryParameters, true);
        xhttp.send();
    }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
