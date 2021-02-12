const { ipcRenderer, remote, shell } = require('electron');
const { app, BrowserWindow, dialog, getCurrentWindow, Menu, MenuItem, getGlobal } = remote;
const fs = require('fs');
const mysql = require('mysql');
const os = require('os');
const path = require('path');

const indexWindow = getCurrentWindow();
const pathToSettings = path.join(app.getPath('userData'), 'settings.json');

ipcRenderer.on('kaplan-index', (event, arg) => {
    location.reload();
})
ipcRenderer.on('kaplan-fetch-settings', (event, arg) => {
    fetchSettings();
})

fetchSettings();

function fetchSettings() {
    window.settingsJSON = JSON.parse(fs.readFileSync(pathToSettings));
    if (settingsJSON.curUser && settingsJSON.curUser.username) {
        window.username = settingsJSON.curUser.username
    } else {
        window.username = os.hostname();
    }
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
    } else {
        fileMenu.append(new MenuItem({ label: 'Generate target translation', enabled: false }));
    }
    fileMenu.append(new MenuItem({ type: 'separator' }));
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

function fireOnReady() {
    const mYSQLTable = document.getElementById('mysql-table')

    let connection = mysql.createConnection(settingsJSON.mysql);

    connection.connect(function(error) {
        if (error) {
            console.error(error);
            alert(error);
        } else {
            document.getElementById('btn-mysql-view').disabled = false;
            mYSQLTable.innerHTML = null;
            tr = document.createElement('tr');
            tr.innerHTML = '<th class="name">Cloud TM</th><th>Source Language</th><th>Target Language</th>'
            mYSQLTable.appendChild(tr);

            connection.query('SELECT * FROM kaplan_tables', function (error, result, fields) {
                if (error) {
                    console.error(error)
                    alert(error)
                } else if (result.length === 0) {
                    tr = document.createElement('tr');
                    tr.innerHTML = '<td colspan="3">No tables found</td>'
                    mYSQLTable.appendChild(tr);
                } else {
                    result.map(function(row) {
                        tr = document.createElement('tr');
                        tr.setAttribute('cloud-tm-id', row.id);

                        td = document.createElement('td');
                        td.textContent = row.name;
                        tr.appendChild(td);

                        td = document.createElement('td');
                        td.textContent = row.source;
                        tr.appendChild(td);

                        td = document.createElement('td');
                        td.textContent = row.target;
                        tr.appendChild(td);

                        mYSQLTable.appendChild(tr);
                    })
                }
            })
        }
    });

    document.getElementById('btn-create-cloud-tm').onclick = () => {
        const newCloudTMWindow = new BrowserWindow({
            width: 800,
            height: 600,
            modal: true,
            parent: indexWindow,
            webPreferences: {
                enableRemoteModule: true,
                preload: path.join(__dirname, 'new-cloud-tm-preload.js')
            }
        })

        newCloudTMWindow.loadFile(path.join(__dirname, 'new-cloud-tm.html'));
    }
}

if (document.readyState === "complete") {
    fireOnReady();
} else {
    document.addEventListener("DOMContentLoaded", fireOnReady);
}
