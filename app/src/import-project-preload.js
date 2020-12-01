const { ipcRenderer, remote } = require('electron');
const { dialog } = require('electron').remote;
const fs = require('fs');

const importProjectWindow = remote.getCurrentWindow();

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#projects-view');
};

window.selectDirectory = () => {
    dialog.showOpenDialog({
        browserWindow: importProjectWindow,
        properties: ['createDirectory', 'openDirectory']
    }).then((data) => {
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

window.selectPath = () => {
    dialog.showOpenDialog({
        browserWindow: importProjectWindow,
        filters: [
            {name: 'Kaplan Project Packages', extensions: ['kpp']}
        ]
      }).then((data) => {
            document.getElementById('input-path').value = data.filePaths[0];
      })
}
