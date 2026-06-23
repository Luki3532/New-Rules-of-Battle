const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            spellcheck: false
        },
        title: 'New Rules of Battle',
        backgroundColor: '#0f0e0d',
        icon: path.join(__dirname, 'build/icon.ico')
    });

    win.loadFile('index.html');

    // Remove default menu to prevent keyboard shortcuts from interfering
    win.setMenu(null);

    // Open DevTools in development (uncomment to debug)
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
