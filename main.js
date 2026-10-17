const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let backendProcess;

function startBackend() {
  // Path to your backend server script
  const backendPath = path.join(__dirname, 'backend', '/dist/server.js');
  
  // Fork the backend process
  backendProcess = fork(backendPath, [], {
    env: { ...process.env, PORT: 5000 } // Pass environment variables if needed
  });

  backendProcess.on('message', (msg) => {
    console.log('Backend message:', msg);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Option A: If React is built statically (production mode)
  mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));

  // Option B: If running React locally in development (e.g., Vite dev server on port 5173)
  // mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

// Clean up backend process when all windows are closed
app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});