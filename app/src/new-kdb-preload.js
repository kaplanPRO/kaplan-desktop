const { ipcRenderer, remote } = require('electron');
const { dialog, getCurrentWindow, getGlobal, webContents } = remote;

const newKDBWindow = getCurrentWindow();

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#tm-view');
};

window.selectPath = () => {
    dialog.showSaveDialog({}).then(function (data) {
        document.getElementById('input-path').value = data.filePath;
    });
};
