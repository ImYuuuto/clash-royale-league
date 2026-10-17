const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const mysql = require("mysql2/promise");

if (process.env.CR_LEAGUE_USER_DATA_DIR) {
  app.setPath("userData", path.resolve(process.env.CR_LEAGUE_USER_DATA_DIR));
}

const API_PORT = 3000;
const API_URL = `http://127.0.0.1:${API_PORT}`;
let mainWindow;
let backendProcess;

const settingsFile = () => path.join(app.getPath("userData"), "database.json");

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
  } catch {
    try {
      const envPath = path.join(app.getAppPath(), "backend", ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        const parsed = {};
        for (const line of envContent.split(/\r?\n/)) {
          const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (m) {
            let val = m[2] ? m[2].trim() : "";
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            parsed[m[1]] = val;
          }
        }
        if (parsed.DB_HOST && parsed.DB_USER && parsed.DB_NAME) {
          const fallback = {
            DB_HOST: parsed.DB_HOST,
            DB_PORT: parsed.DB_PORT || "3306",
            DB_USER: parsed.DB_USER,
            DB_PASSWORD: parsed.DB_PASSWORD ?? "",
            DB_NAME: parsed.DB_NAME,
          };
          try {
            writeSettings(fallback);
          } catch {}
          return fallback;
        }
      }
    } catch {}
    return null;
  }
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
  fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2), { mode: 0o600 });
}

function safeSettings(settings) {
  if (!settings) return null;
  const { DB_HOST, DB_PORT, DB_USER, DB_NAME } = settings;
  return { DB_HOST, DB_PORT: String(DB_PORT), DB_USER, DB_NAME };
}

async function connectDatabase(settings) {
  const connection = await mysql.createConnection({
    host: settings.DB_HOST,
    port: Number(settings.DB_PORT),
    user: settings.DB_USER,
    password: settings.DB_PASSWORD ?? "",
    database: settings.DB_NAME,
    connectTimeout: 5000,
  });
  await connection.query("SELECT 1");
  await connection.end();
}

async function isApiRunning() {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function startBackend(settings) {
  if (backendProcess && backendProcess.exitCode === null) return;
  if (await isApiRunning()) return;
  const backendDir = path.join(app.getAppPath(), "backend");
  const entryPoint = path.join(backendDir, "dist", "server.js");
  const childEnv = {
    ...process.env,
    ...settings,
    PORT: String(API_PORT),
    NODE_ENV: "production",
  };

  backendProcess = spawn(process.execPath, [entryPoint], {
    cwd: backendDir,
    env: { ...childEnv, ELECTRON_RUN_AS_NODE: "1" },
    stdio: "ignore",
    windowsHide: true,
  });
  backendProcess.on("error", (error) => {
    dialog.showErrorBox("API could not start", error.message);
  });
  backendProcess.on("exit", (code) => {
    backendProcess = undefined;
    if (code && !app.isQuitting) {
      dialog.showErrorBox("API stopped", `The local API exited with code ${code}.`);
    }
  });
}

async function waitForApi(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("The local API did not become ready in time.");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: "#f0f2f7",
    icon: path.join(__dirname, "frontend", "public", "icon.webp"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "frontend", "dist", "index.html"));
  }
  mainWindow.on("closed", () => { mainWindow = undefined; });
}

ipcMain.handle("database:get-settings", () => safeSettings(readSettings()));
ipcMain.handle("database:get-status", async () => {
  const settings = readSettings();
  if (!settings) return { configured: false, apiReady: false };
  try {
    await connectDatabase(settings);
    return { configured: true, apiReady: Boolean(backendProcess && backendProcess.exitCode === null) };
  } catch {
    return { configured: false, apiReady: Boolean(backendProcess && backendProcess.exitCode === null) };
  }
});
ipcMain.handle("database:save-settings", async (_event, input) => {
  const settings = {
    DB_HOST: String(input?.DB_HOST ?? "").trim(),
    DB_PORT: String(input?.DB_PORT ?? "3306").trim(),
    DB_USER: String(input?.DB_USER ?? "").trim(),
    DB_PASSWORD: String(input?.DB_PASSWORD ?? ""),
    DB_NAME: String(input?.DB_NAME ?? "").trim(),
  };
  const port = Number(settings.DB_PORT);
  if (!settings.DB_HOST || !settings.DB_USER || !settings.DB_NAME || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { success: false, message: "Enter a host, valid port, username, and database name." };
  }
  try {
    await connectDatabase(settings);
    writeSettings(settings);
    startBackend(settings);
    await waitForApi();
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Could not connect to MySQL." };
  }
});

app.whenReady().then(async () => {
  const settings = readSettings();
  if (settings) {
    startBackend(settings);
    try {
      await waitForApi();
    } catch (error) {
      dialog.showErrorBox("API startup failed", error.message);
    }
  }
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (backendProcess && backendProcess.exitCode === null) backendProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
