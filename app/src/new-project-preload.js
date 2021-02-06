const electron = require('electron')
const { ipcRenderer } = electron
const { app, dialog } = electron.remote;
const fs = require('fs');
const mysql = require('mysql');
const path = require('path');

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#projects-view');
};

function fireOnReady() {
  const selectSource = document.getElementById("select-source");
  const selectTarget = document.getElementById("select-target");
  const selectTBs = document.getElementById("select-tbs");
  const selectCTMs = document.getElementById("select-cloud-tms");
  const selectTMs = document.getElementById("select-tms");

  selectSource.onchange = () => {
    fetchCloudTMs();
    fetchRelevantTBs();
    fetchRelevantTMs();
  }
  selectTarget.onchange = () => {
    fetchCloudTMs();
    fetchRelevantTBs();
    fetchRelevantTMs();
  }

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

  function fetchCloudTMs() {
    let settingsJSON = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json')));

    if ('mysql' in settingsJSON && selectSource.value != '----' && selectTarget.value != '----') {
      let connection = mysql.createConnection(settingsJSON.mysql);

      connection.connect(function(error) {
        if (error) {
          console.error(error);
        } else {
          connection.query("SELECT `name`, `id` FROM `kaplan_tables` WHERE `source` = '" + selectSource.value + "' AND `target` = '" + selectTarget.value + "'", function(error, result, fields) {
            if (error) {
              console.error(error);
              alert(error);
            } else {
              selectCTMs.innerHTML = null;
              selectCTMs.appendChild(new Option('-----'));
              if (result.length > 0) {
                result.map(function(row) {
                  selectCTMs.appendChild(new Option(row.name, row.id));
                })
              }
            }
          })
        }
      });
    }
  }

  document.getElementById("btn-choose-dir").onclick = () => {
      dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'] }).then((data) => {
          projectDirectory = data.filePaths[0];
          fs.readdir(projectDirectory, function(err, files) {
              if (err) {
                 console.error(err);
              } else {
                 if (!files.length) {
                     document.getElementById('input-dir').value = data.filePaths[0];
                 } else {
                    errorMessage = 'Project directory must be an empty folder!';
                    console.error(errorMessage);
                    alert(errorMessage);
                 }
              }
          });
      });
  };

  document.getElementById("btn-choose-files").onclick = () => {
      const options = {
          filters: [
              { name: 'Source Files', extensions: ['docx', 'kxliff', 'odp', 'ods', 'odt', 'po', 'sdlxliff', 'txt', 'xliff'] }
          ],
          properties: ['openFile', 'multiSelections']
      };
      dialog.showOpenDialog(options).then((data) => {
          let filenames = [];
          let filename = "";
          data.filePaths.forEach(element => {
              filename = path.basename(element);
              if (!filenames.includes(filename)) {
                  filenames.push(filename);
                  let li = document.createElement('li');
                  li.setAttribute('path', element);
                  li.textContent = filename;
                  li.ondblclick = () => {li.parentNode.removeChild(li)};
                  document.getElementById('list-files').append(li);
              }
              else {
                  console.error('Selected multiple files with the same basename.');
              };
          });
      });
  }

  document.forms[0].onsubmit = function(e) {
      e.preventDefault();

      let files = [];
      let parameters;
      let languageResources = [];
      let cloudLanguageResources = {};

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

      [...selectTMs.selectedOptions].forEach(function(tm) {
          languageResources.push(tm.value);
      });

      [...selectTBs.selectedOptions].forEach(function(tb) {
          languageResources.push(tb.value);
      });
      if (selectCTMs.value !== '-----') {
          cloudLanguageResources = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'))).mysql;
          cloudLanguageResources.table = selectCTMs.value;
      }

      let formData = new FormData();
      formData.append("title", this["title"].value);
      formData.append("directory", this["dir"].value);
      formData.append("source_language", selectSource.value);
      formData.append("target_language", selectTarget.value);
      if (languageResources.length > 0) {
          formData.append("language_resources", languageResources.join(";"));
      }
      if (cloudLanguageResources !== {}) {
          formData.append("cloud_language_resources", JSON.stringify({'mysql':cloudLanguageResources}));
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
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
