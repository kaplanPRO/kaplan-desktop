const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;

window.indexRefresh = () => {
    ipcRenderer.sendTo(1, 'kaplan-index', 'main#tm_view');
};

window.selectPath = () => {
    dialog.showSaveDialog({}).then(function (data) {
        document.getElementById('input_path').value = data.filePath;
    });
};