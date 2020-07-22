const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const path = require('path');

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#projects_view');
};

window.selectDirectory = () => {
    dialog.showOpenDialog({ properties: ['createDirectory', 'openDirectory'] }).then((data) => {
        document.getElementById('input_dir').value = data.filePaths[0];
    });
};

window.selectPath = () => {
    dialog.showOpenDialog().then((data) => {
        document.getElementById('input_path').value = data.filePaths[0];
    })
}


