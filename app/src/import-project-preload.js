const { ipcRenderer, remote } = require('electron');
const { dialog } = require('electron').remote;
const path = require('path');

const importProjectWindow = remote.getCurrentWindow();

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#projects-view');
};

window.selectDirectory = () => {
    dialog.showOpenDialog({
      browserWindow: importProjectWindow,
      properties: ['createDirectory', 'openDirectory']
    }).then((data) => {
        document.getElementById('input-dir').value = data.filePaths[0];
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
