const { app, BrowserWindow, globalShortcut } = require('electron');

const createWindow = () => {
    let win = new BrowserWindow({
      width: 300,
      height: 500,
      webPreferences: {
        nodeIntegration: true
      },
      frame: false
    });
  
    // win.loadFile('index.html');


    if (process.env.NODE_ENV == 'development') {
      win.loadURL('http://localhost:3000');
      win.webContents.openDevTools();
    } else {
      win.loadFile('./build/index.html');
      // win.webContents.openDevTools();
      globalShortcut.register('CmdOrCtrl+R', () => {});
    }
    win.removeMenu();
  }
  
  app.on('ready', createWindow);