const electron = require('electron')
const { ipcRenderer } = electron
const { app } = electron.remote;
const fs = require('fs');
const mysql = require('mysql');
const path = require('path');

function fireOnReady() {
  const pathToSettings = path.join(app.getPath('userData'), 'settings.json');

  fs.exists(pathToSettings, (exists) => {
    if (exists) {
      fs.readFile(pathToSettings, (err, data) => {
        let settingsJSON = JSON.parse(data);
        if (settingsJSON.curUser) {
          document.getElementById('form-user-profile').username.value = settingsJSON.curUser.username;
          document.getElementById('form-user-profile').email.value = settingsJSON.curUser.email;
        }
        if (settingsJSON.mysql) {
          document.getElementById('form-mysql').host.value = settingsJSON.mysql.host;
          document.getElementById('form-mysql').database.value = settingsJSON.mysql.database;
          document.getElementById('form-mysql').user.value = settingsJSON.mysql.user;
          document.getElementById('form-mysql').password.value = settingsJSON.mysql.password
        }
      })
    }
  })

  document.getElementById('btn-user-profile').onclick = function() {
    document.getElementById('btn-mysql').classList.remove('active');
    this.classList.add('active');
    document.getElementById('tab-mysql').style.display = 'none';
    document.getElementById('tab-user-profile').style.display = 'block';
  }

  document.getElementById('btn-mysql').onclick = function() {
    document.getElementById('btn-user-profile').classList.remove('active');
    this.classList.add('active');
    document.getElementById('tab-user-profile').style.display = 'none';
    document.getElementById('tab-mysql').style.display = 'block';
  }

  document.getElementById('form-user-profile').onsubmit = function(e) {
    e.preventDefault();

    curUser = {
      username : this.username.value,
      email    : this.email.value
    }

    console.log(ipcRenderer.sendSync('update-settings', JSON.stringify({curUser:curUser})))
    ipcRenderer.sendTo(1, 'kaplan-fetch-settings', 'user-updated');
  }

  document.getElementById('form-mysql').onsubmit = function(e) {
    e.preventDefault();

    let settingsJSON;

    mYSQL = {
      host      : this.host.value,
      database  : this.database.value,
      user      : this.user.value,
      password  : this.password.value
    }

    let connection = mysql.createConnection(mYSQL);

    connection.connect(function(error) {
        if (error) {
            console.error(error);
            alert(error);
        }
    });

    connection.query('SELECT * FROM kaplan_tables', function (error, result, fields) {
      if (error) {
        console.error(error);
        alert(error)
        connection.end();
      } else {
        connection.query('SELECT * FROM kaplan_entries', function (error, result, fields) {
          connection.end();
          if (error) {
            console.error(error);
            alert(error)
          } else {
            console.log(ipcRenderer.sendSync('update-settings', JSON.stringify({mysql:mYSQL})))
            ipcRenderer.sendTo(1, 'kaplan-index', 'mysql-updated');
          }
        })
      }
    })
  }

  document.getElementById('btn-disconnect').onclick = () => {
    console.log(ipcRenderer.sendSync('disconnect-mysql', 'delete-mysql-settings'))
    ipcRenderer.sendTo(1, 'kaplan-index', 'mysql-updated');
    location.reload();
  }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
