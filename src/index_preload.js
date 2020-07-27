const { ipcRenderer, remote } = require('electron');
const { BrowserWindow, getCurrentWindow, Menu, MenuItem } = remote;
const path = require('path');

const indexWindow = remote.getCurrentWindow();

ipcRenderer.on('kaplan-index', (event, arg) => {
    location.reload();
})

window.createNewTM = () => {
    const newTMWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'new_tm_preload.js')
        }
    })

    newTMWindow.loadFile(path.join(__dirname, 'new_tm.html'));
}

window.importProject = () => {
    const importProjectWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'import_project_preload.js')
        }
    })

    importProjectWindow.loadFile(path.join(__dirname, 'import_project.html'));
}

const fileMenu = new Menu();
fileMenu.append(new MenuItem({ label: 'Finalize', click() { getTargetTranslation(window.fileId) } }));

window.openFileContextMenu = (e, file_row) => {
    e.preventDefault();
    window.fileId = $(file_row).attr("file_id");
    fileMenu.popup({ window: getCurrentWindow() });
}
