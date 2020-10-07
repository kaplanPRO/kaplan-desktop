const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const path = require('path');

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#projects-view');
};

window.selectDirectory = () => {
    dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'] }).then((data) => {
        document.getElementById('input-dir').value = data.filePaths[0];
    });
};

window.selectPath = () => {
    dialog.showOpenDialog({
      filters: [
        {name: 'Kaplan New Project Packages', extensions: ['knpp']}
      ]
    }).then((data) => {
        document.getElementById('input-path').value = data.filePaths[0];
    })
}
