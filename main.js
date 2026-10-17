const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

const API_PORT = Number(process.env.PORT) || 3000;
const API_URL = `http://127.0.0.1:${API_PORT}`;
let mainWindow;
let backendProcess;
let backendReady = false;
const settingsPath = () => path.join(app.getPath('userData'), 'database.json');

function readDatabaseSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  } catch {
    return null;
  }
}

function writeDatabaseSettings(settings) {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2), { mode: 0o600 });
}

function checkApi() {
  return new Promise((resolve) => {
    const request = http.get(`${API_URL}/api/health`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.setTimeout(800, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function waitForBackend() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (await checkApi()) {
      backendReady = true;
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return false;
}

function startBackend() {
  const isPackaged = app.isPackaged;
  const backendPath = isPackaged
    ? path.join(__dirname, 'backend', 'dist', 'server.js')
    : path.join(__dirname, 'backend', 'dist', 'server.js');
  const settings = readDatabaseSettings();
  const bundledNode = path.join(process.resourcesPath, 'node', process.platform === 'win32' ? 'node.exe' : 'bin/node');
  const command = isPackaged && fs.existsSync(bundledNode) ? bundledNode : process.execPath;
  const backendArgs = isPackaged
    ? [backendPath]
    : [path.join(__dirname, 'backend', 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'watch', 'src/server.ts'];
  const backendEnv = { ...process.env, PORT: String(API_PORT) };
  if (settings) backendEnv.CR_LEAGUE_SETTINGS_PATH = settingsPath();

  backendProcess = spawn(command, backendArgs, {
    cwd: path.join(__dirname, 'backend'),
    env: backendEnv,
    stdio: 'inherit',
    windowsHide: true,
  });
  backendProcess.on('error', (error) => console.error('Could not start API:', error));
  backendProcess.on('exit', () => { backendReady = false; });
}

ipcMain.handle('database:status', async () => ({
  configured: Boolean(readDatabaseSettings() || (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)),
  apiReady: backendReady || await checkApi(),
}));

ipcMain.handle('database:save', async (_event, settings) => {
  const port = Number(settings?.DB_PORT ?? 3306);
  if (!settings || typeof settings.DB_HOST !== 'string' || !settings.DB_HOST.trim() ||
      typeof settings.DB_USER !== 'string' || !settings.DB_USER.trim() ||
      typeof settings.DB_NAME !== 'string' || !settings.DB_NAME.trim() ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    return { success: false, message: 'Enter a host, username, database name, and a valid port.' };
  }

  const cleaned = {
    DB_HOST: settings.DB_HOST.trim(),
    DB_PORT: String(port),
    DB_USER: settings.DB_USER.trim(),
    DB_PASSWORD: String(settings.DB_PASSWORD ?? ''),
    DB_NAME: settings.DB_NAME.trim(),
  };
  writeDatabaseSettings(cleaned);
  if (backendProcess && !backendProcess.killed) backendProcess.kill();
  startBackend();
  const ready = await waitForBackend();
  if (!ready) return { success: false, message: 'The API did not start. Check the database details and make sure MySQL is running.' };
  const dbResponse = await fetch(`${API_URL}/api/health/db`);
  return dbResponse.ok
    ? { success: true }
    : { success: false, message: 'The API started, but it could not connect to that database. Check the database details and try again.' };
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: '#10131b',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('database:settings', () => {
    const settings = readDatabaseSettings();
    if (!settings) return null;
    return { ...settings, DB_PASSWORD: '' };
  });
  const savedSettings = readDatabaseSettings();
  if (savedSettings || (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)) {
    startBackend();
    void waitForBackend();
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (backendProcess && !backendProcess.killed) backendProcess.kill();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
