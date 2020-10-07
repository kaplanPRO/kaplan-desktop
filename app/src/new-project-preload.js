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

window.selectFiles = () => {
    const options = {
        filters: [
            { name: 'Source Files', extensions: ['docx', 'kxliff', 'odp', 'ods', 'odt', 'po', 'sdlxliff', 'txt', 'xliff'] }
        ],
        properties: ['openFile', 'multiSelections']
    };
    dialog.showOpenDialog(options).then((data) => {
        let filenames = [];
        let filename = "";
        data.filePaths.forEach(element => {
            filename = path.basename(element);
            if (!filenames.includes(filename)) {
                filenames.push(filename);
                let li = document.createElement('li');
                li.setAttribute('path', element);
                li.textContent = filename;
                li.ondblclick = () => {li.parentNode.removeChild(li)};
                document.getElementById('list-files').append(li);
            }
            else {
                console.error("Selected multiple files with the same basename.");
            };
        });
    });
}
