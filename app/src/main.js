const electron = require('electron');
const { app, BrowserWindow, getCurrentWindow, ipcMain, Menu, shell } = electron;
const fs = require('fs');
const path = require('path');
const { exec, spawn, spawnSync } = require('child_process');

let backendServer;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}
else if (fs.existsSync(path.join(app.getAppPath(), 'backend')))
{
    let pathToBackend;

    if (['deb','linux','rpm'].includes(process.platform)) {
        pathToBackend = path.join(app.getAppPath(), 'backend', 'backend');
    }
    else {
        pathToBackend = path.join(app.getAppPath(), 'backend', 'backend.exe');
    }
    process.env.KAPLAN_DB_PATH = path.join(app.getPath('userData'), 'kaplan.sqlite3');

    const pathToSettings = path.join(app.getPath('userData'), 'settings.json');
    let settingsJSON;

    if (fs.existsSync(pathToSettings)) {
        settingsJSON = JSON.parse(fs.readFileSync(pathToSettings));
    } else {
        settingsJSON = {}
    }

    if (!('version' in settingsJSON) || settingsJSON.version !== app.getVersion()) {
        spawnSync(pathToBackend,
                  ['migrate'])

        settingsJSON.version = app.getVersion();
        fs.writeFileSync(pathToSettings, JSON.stringify(settingsJSON))
    }

    process.env.KAPLAN_SETTINGS = JSON.stringify(settingsJSON);

    backendServer = spawn(pathToBackend,
                          ['runserver', '--noreload']);
}

let pathToIcon;

if (['deb','linux','rpm'].includes(process.platform)) {
    pathToIcon = path.join(__dirname, 'icon', 'icon-64.png');
} else {
    pathToIcon = path.join(__dirname, 'icon', 'icon.ico');
}


const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        icon: pathToIcon,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'index-preload.js')
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// This method will be called by app.quit().
app.on('before-quit', () => { backendServer.kill() });

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

ipcMain.on('update-settings', (event, arg) => {
    const pathToSettings = path.join(app.getPath('userData'), 'settings.json');
    const newSettings = JSON.parse(arg)
    let settings = JSON.parse(fs.readFileSync(pathToSettings));

    Object.keys(newSettings).map(function(key) {
        settings[key] = newSettings[key];
    })

    fs.writeFileSync(pathToSettings, JSON.stringify(settings))
    process.env.KAPLAN_SETTINGS = JSON.stringify(settings)

    event.returnValue = 'Settings updated.';
})

ipcMain.on('disconnect-mysql', (event, arg) => {
    const pathToSettings = path.join(app.getPath('userData'), 'settings.json');
    let settings = JSON.parse(fs.readFileSync(pathToSettings));

    delete(settings.mysql)

    fs.writeFileSync(pathToSettings, JSON.stringify(settings))
    process.env.KAPLAN_SETTINGS = JSON.stringify(settings)

    event.returnValue = 'MySQL settings deleted.';
})

const template = [
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'toggledevtools' }
        ]
    },
    {
        label: 'Settings',
        click: () => {
                const settingsWindow = new BrowserWindow({
                    minWidth: 800,
                    minHeight: 600,
                    icon: pathToIcon,
                    webPreferences: {
                        enableRemoteModule: true,
                        preload: path.join(__dirname, 'settings-preload.js')
                    },
                })

                settingsWindow.loadFile(path.join(__dirname, 'settings.html'));
            }
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'About',
                click: async () => { shell.openExternal('https://sourceforge.net/projects/kaplan-desktop/') }
            },
            {
                label: 'Wiki',
                click: async () => { shell.openExternal('https://sourceforge.net/p/kaplan-desktop/wiki/') }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu);
