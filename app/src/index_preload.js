const { ipcRenderer, remote } = require('electron');
const { BrowserWindow, dialog, getCurrentWindow, Menu, MenuItem } = remote;
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

window.newProject = () => {
    const importProjectWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'new_project_preload.js')
        }
    })

    importProjectWindow.loadFile(path.join(__dirname, 'new_project.html'));
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

window.updateFromKRPP = () => {
    const updateFromKRPPWindow = new BrowserWindow({
        width: 800,
        height: 600,
        modal: true,
        parent: indexWindow,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'update_from_krpp_preload.js')
        }
    })

    updateFromKRPPWindow.loadFile(path.join(__dirname, 'update_from_krpp.html'));
}

window.selectKRPP = () => {
  return dialog.showOpenDialogSync({
      browserWindow: indexWindow,
      filters: [
          {name: 'Kaplan Return Project Packages', extensions: ['krpp']}
      ]
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

const fileMenu = new Menu();
fileMenu.append(new MenuItem({ label: 'Finalize', click() { getTargetTranslation(window.fileId) } }));

window.openFileContextMenu = (e, file_row) => {
    e.preventDefault();
    window.fileId = $(file_row).attr("file_id");
    fileMenu.popup({ window: getCurrentWindow() });
}
