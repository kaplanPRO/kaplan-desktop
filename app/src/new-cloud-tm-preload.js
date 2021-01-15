const electron = require('electron')
const { ipcRenderer } = electron
const { app } = electron.remote;
const fs = require('fs');
const mysql = require('mysql');
const path = require('path');

const pathToSettings = path.join(app.getPath('userData'), 'settings.json');

function fireOnReady() {
  const cloudTMForm = document.forms[0];

  cloudTMForm.onsubmit = function(e) {
    e.preventDefault();
    let settingsJSON = JSON.parse(fs.readFileSync(pathToSettings))

    let connection = mysql.createConnection(settingsJSON.mysql);

    connection.connect(function(error) {
      if (error) {
        alert(error);
        console.error(error);
      } else {
        connection.query("INSERT INTO `kaplan_tables` (`name`, `source`, `target`, `created_at`, `id`) VALUES ('" + cloudTMForm.title.value + "', '" + cloudTMForm['select-source'].value + "', '" + cloudTMForm['select-target'].value + "', CURRENT_TIMESTAMP, NULL)", function(error, result, fields) {
          if (error) {
            alert(error);
            console.error(error);
          } else {
            ipcRenderer.sendTo(1, 'kaplan-index', 'mysql-updated');
          }
        })
        connection.end();
      }
    })
  }
}

if (document.readyState === "complete") {
  fireOnReady();
} else {
  document.addEventListener("DOMContentLoaded", fireOnReady);
}
