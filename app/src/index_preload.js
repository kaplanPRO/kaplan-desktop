const { ipcRenderer, remote, shell } = require('electron');
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

openFileContextMenu = (e, f_id, filePath) => {
    e.preventDefault();

    const fileMenu = new Menu();
    fileMenu.append(new MenuItem({ label: 'Generate target translation', click() { getTargetTranslation(fileId) } }));
    fileMenu.append(new MenuItem({ label: 'Show in file explorer', click() { shell.showItemInFolder(filePath) } }))

    fileMenu.popup({ window: indexWindow });
}

openTMContextMenu = (e, tMPath) => {
    e.preventDefault();

    const tMMenu = new Menu();
    tMMenu.append(new MenuItem({ label: 'Show in file explorer', click() { shell.showItemInFolder(tMPath) } }))

    tMMenu.popup({ window: indexWindow });
}
