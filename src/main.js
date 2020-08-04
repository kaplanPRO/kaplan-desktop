const electron = require('electron');
const { app, BrowserWindow, Menu, shell } = electron;
const fs = require('fs');
const path = require('path');
const { exec, spawn, spawnSync } = require('child_process');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}
else if (fs.existsSync(path.join(app.getAppPath(), 'backend')))
{
    var backendPath;
    var pathToIcon;

    if (['deb','linux','rpm'].includes(process.platform)) {
        backendPath = path.join(app.getAppPath(), 'backend', 'backend');
        pathToIcon = path.join(__dirname, 'icon', 'icon-64.png');
    }
    else {
        backendPath = path.join(app.getAppPath(), 'backend', 'backend.exe');
        pathToIcon = path.join(__dirname, 'icon', 'icon.ico');
    }
    process.env.KAPLAN_DB_PATH = path.join(app.getPath('userData'), 'kaplan.sqlite3');

    spawnSync(backendPath,
              ['migrate'])

    spawnSync(backendPath,
              ['makemigrations api']);

    spawnSync(backendPath,
              ['migrate']);

    const child = spawn(backendPath,
                        ['runserver'],
                        {detached: true});
};

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        minWidth: 800,
        minHeight: 600,
        icon: pathToIcon,
        webPreferences: {
            enableRemoteModule: true,
            preload: path.join(__dirname, 'index_preload.js')
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
app.on('before-quit', () => {
    if (fs.existsSync(path.join(app.getAppPath(), 'backend'))) {process.kill(-child.pid)}
});

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

const template = [
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'toggledevtools' }
        ]
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
