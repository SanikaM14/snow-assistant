const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let tray;
let backendProcess;
const isDev = !app.isPackaged;

// Allow system proxy for external images, but bypass for localhost to prevent dev server ERR_NETWORK_ACCESS_DENIED
app.commandLine.appendSwitch('proxy-bypass-list', '127.0.0.1,localhost,::1');

function createBackendProcess() {
  const pythonExecutable = process.platform === 'win32' 
    ? path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe')
    : path.join(__dirname, '..', 'backend', 'venv', 'bin', 'python');
  
  // In development, backend is in the backend directory relative to project root
  // In production, it will be packaged, adjust path as necessary
  const backendDir = path.join(__dirname, '..', 'backend');
  
  backendProcess = spawn(pythonExecutable, ['-m', 'uvicorn', 'main:app', '--port', '8000', '--reload'], {
    cwd: backendDir,
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready-to-show
  });

  if (isDev) {
    // In dev, Vite runs on 5173 by default
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide(); // Minimize to tray
    }
    return false;
  });
}

function createTray() {
  // Use a simple icon for now, ideally replace with an actual icon file
  // tray = new Tray(path.join(__dirname, 'icon.png')); // Placeholder
  // Creating a native image from empty buffer just to avoid crash without icon file
  const { nativeImage } = require('electron');
  const trayIcon = nativeImage.createEmpty() // Placeholder, add real icon later
  tray = new Tray(trayIcon)
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Snow', click: () => {
      mainWindow.show()
    }},
    { label: 'Quit', click: () => {
      app.isQuitting = true
      app.quit()
    }}
  ])
  
  tray.setToolTip('Snow Assistant');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

app.whenReady().then(() => {
  createBackendProcess();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
