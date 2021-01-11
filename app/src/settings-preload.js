const electron = require('electron')
const { ipcRenderer } = electron
const { app } = electron.remote;
const fs = require('fs');
const path = require('path');

function fireOnReady() {
  const pathToSettings = path.join(app.getPath('userData'), 'settings.json');

  fs.exists(pathToSettings, (exists) => {
    if (exists) {
      fs.readFile(pathToSettings, (err, data) => {
        let settingsJSON = JSON.parse(data);
        document.getElementById('form-user-profile').username.value = settingsJSON.curUser.username;
        document.getElementById('form-user-profile').email.value = settingsJSON.curUser.email;
      })
    }
  })

  document.getElementById('form-user-profile').onsubmit = function(e) {
    let settingsJSON;

    e.preventDefault();

    curUser = {
      username : this.username.value,
      email    : this.email.value
    }

    fs.exists(pathToSettings, (exists) => {
      if (exists) {
        settingsJSON = JSON.parse(fs.readFileSync(pathToSettings))
        settingsJSON.curUser = curUser;
      } else {
        settingsJSON = {
          curUser: curUser
        }
      }
      fs.writeFile(pathToSettings, JSON.stringify(settingsJSON), (err) => {
        if (err) {
          console.error(err);
        }

        ipcRenderer.sendTo(1, 'kaplan-fetch-user', 'user-updated');

      })
    })

  }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
