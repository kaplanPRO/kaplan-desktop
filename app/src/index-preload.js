const { ipcRenderer, remote, shell } = require('electron');
const { app, BrowserWindow, dialog, getCurrentWindow, Menu, MenuItem, getGlobal } = remote;
const fs = require('fs');
const os = require('os');
const path = require('path');

const indexWindow = getCurrentWindow();
const pathToSettings = path.join(app.getPath('userData'), 'settings.json');

ipcRenderer.on('kaplan-index', (event, arg) => {
    location.reload();
})
ipcRenderer.on('kaplan-fetch-user', (event, arg) => {
    fetchUser();
})

window.username = os.hostname();
fetchUser();

function fetchUser() {
    fs.readFile(pathToSettings, (err, data) => {
        if (err) {
            console.error(err);
        } else {
            const settingsJSON = JSON.parse(data);
            if (settingsJSON.curUser) {
              window.username = settingsJSON.curUser.username;
            }
        }
    })
}

window.createNewKDB = (role) => {
    const newKDBWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'new-kdb-preload.js')
        }
    })

    newKDBWindow.loadFile(path.join(__dirname, 'new-' + role + '.html'));
}

window.newProject = () => {
    const importProjectWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'new-project-preload.js')
        }
    })

    importProjectWindow.loadFile(path.join(__dirname, 'new-project.html'));
}

window.importProject = () => {
    const importProjectWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'import-project-preload.js')
        }
    })

    importProjectWindow.loadFile(path.join(__dirname, 'import-project.html'));
}

window.selectFile = (filterList) => {
    return dialog.showOpenDialogSync({
        browserWindow: indexWindow,
        filters: filterList
    })
}

window.setFile = (filterList) => {
    return dialog.showSaveDialogSync({
        browserWindow: indexWindow,
        filters: filterList
    })
}

window.setSpellCheckerLanguages = (arrayOfLanguages) => {
    let finalArrayOfLanguages = [];
    indexWindow.webContents.session.availableSpellCheckerLanguages.forEach((lang_code, i) => {
        arrayOfLanguages.forEach((project_lang_code, i) => {
            if (lang_code.startsWith(project_lang_code)) {
              finalArrayOfLanguages.push(lang_code);
            }
        });
    });

    indexWindow.webContents.session.setSpellCheckerLanguages(finalArrayOfLanguages);
}

window.openFileContextMenu = (e, fileId, filePath, canGenerateTargetFile) => {
    e.preventDefault();

    const fileMenu = new Menu();
    if (canGenerateTargetFile === 'true') {
        fileMenu.append(new MenuItem({ label: 'Generate target translation', click() { getTargetTranslation(fileId) } }));
    }
    fileMenu.append(new MenuItem({ label: 'Show in file explorer', click() { shell.showItemInFolder(filePath) } }));

    fileMenu.popup({ window: indexWindow });
}

window.openKDBContextMenu = (e, kDBPath, kDBId) => {
    e.preventDefault();

    const kDBMenu = new Menu();

    kDBMenu.append(new MenuItem({ label: 'Export to .xliff', click() {
        let pathToXLIFF = setFile([{name: 'XML Localisation File Format', extensions: ['xliff']}]);
        let queryURL = 'http://127.0.0.1:8000/kdb/' + kDBId
                       + '?task=export&file_type=xliff'
                       + '&path=' + encodeURI(pathToXLIFF);

        let xhttp = new XMLHttpRequest();

        xhttp.open('GET', queryURL);
        xhttp.send();
    } }));

    kDBMenu.append(new MenuItem({ type: 'separator' }));

    kDBMenu.append(new MenuItem({ label: 'Import from .csv', click() {
        let pathToCSV = selectFile([{name: 'Comma-separated values files', extensions: ['csv']}])[0];
        let queryURL = 'http://127.0.0.1:8000/kdb/' + kDBId;

        let formData = new FormData();
        formData.append('task', 'import');
        formData.append('file_type', 'csv')
        formData.append('path', pathToCSV);

        let xhttp = new XMLHttpRequest();

        xhttp.open('POST', queryURL);
        xhttp.send(formData);
    } }));

    kDBMenu.append(new MenuItem({ label: 'Import from .xliff', click() {
        let pathToXLIFF = selectFile([{name: 'XML Localisation File Format', extensions: ['kxliff', 'sdlxliff', 'xliff']}])[0];
        let queryURL = 'http://127.0.0.1:8000/kdb/' + kDBId;

        let formData = new FormData();
        formData.append('task', 'import');
        formData.append('file_type', 'xliff')
        formData.append('path', pathToXLIFF);

        let xhttp = new XMLHttpRequest();

        xhttp.open('POST', queryURL);
        xhttp.send(formData);
    } }));

    kDBMenu.append(new MenuItem({ type: 'separator' }));

    kDBMenu.append(new MenuItem({ label: 'Show in file explorer', click() { shell.showItemInFolder(kDBPath) } }));

    kDBMenu.popup({ window: indexWindow });
}
