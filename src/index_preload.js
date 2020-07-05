const { ipcRenderer } = require('electron');
const { BrowserWindow, getCurrentWindow, Menu, MenuItem } = require('electron').remote;
const path = require('path');

ipcRenderer.on('kaplan-index', (event, arg) => {
    location.reload();
})

window.createNewProject = () => {
    const newProjectWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'new_project_preload.js')
        }
    })

    newProjectWindow.loadFile(path.join(__dirname, 'new_project.html'));
}

window.createNewTM = () => {
    const newTMWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'new_tm_preload.js')
        }
    })

    newTMWindow.loadFile(path.join(__dirname, 'new_tm.html'));
}

const fileMenu = new Menu();
fileMenu.append(new MenuItem({ label: 'Finalize', click() { getTargetTranslation(window.fileId) } }));

window.openFileContextMenu = (e, file_row) => {
    e.preventDefault();
    window.fileId = $(file_row).attr("file_id");
    fileMenu.popup({ window: getCurrentWindow() });
}