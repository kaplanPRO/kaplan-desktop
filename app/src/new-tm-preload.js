const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#tm-view');
};

window.selectPath = () => {
    dialog.showSaveDialog({}).then(function (data) {
        document.getElementById('input-path').value = data.filePath;
    });
};
