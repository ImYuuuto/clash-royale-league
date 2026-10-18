const { spawn } = require("node:child_process");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const frontendCli = path.join(frontendDir, "node_modules", "vite-plus", "bin", "vp");
const electronBinary = require("electron");
const children = [];
let shuttingDown = false;
let currentFrontendPort = 5173;

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.pid) {
      try {
        if (process.platform !== "win32") {
          process.kill(-child.pid, "SIGKILL");
        }
      } catch {}
      try {
        child.kill("SIGKILL");
      } catch {}
    }
  }
  if (process.platform !== "win32") {
    try {
      const { execSync } = require("node:child_process");
      execSync(`fuser -k ${currentFrontendPort}/tcp 3000/tcp 2>/dev/null || true`);
      execSync(`pkill -9 -f "clash-royale-league/frontend" 2>/dev/null || true`);
      execSync(`pkill -9 -f "clash-royale-league/backend" 2>/dev/null || true`);
    } catch {}
  }
}

process.once("SIGINT", stopAll);
process.once("SIGTERM", stopAll);

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function findAvailablePort(startPort = 5173) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await canListen(port)) return port;
  }
  throw new Error("Could not find an available port for the frontend dev server.");
}

async function waitForServer(url, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Frontend dev server exited before becoming ready.");
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`Frontend dev server did not become ready at ${url}.`);
}

async function start() {
  const port = await findAvailablePort();
  currentFrontendPort = port;
  const devServerUrl = `http://127.0.0.1:${port}`;
  const electronEnv = {
    ...process.env,
    VITE_DEV_SERVER_URL: devServerUrl,
    CR_LEAGUE_USER_DATA_DIR: process.env.CR_LEAGUE_USER_DATA_DIR || path.join(os.tmpdir(), "cr-league-manager-dev"),
  };

  const backendPortAvailable = await canListen(3000);
  if (backendPortAvailable) {
    const backend = spawn("npm", ["run", "dev"], {
      cwd: path.join(root, "backend"),
      stdio: "inherit",
      shell: true,
      detached: process.platform !== "win32",
    });
    children.push(backend);
    backend.once("error", (error) => {
      console.error("Could not start backend server:", error.message);
      stopAll();
    });
    backend.once("exit", (code) => {
      if (!shuttingDown && code) {
        console.error(`Backend server exited with code ${code}.`);
        stopAll();
      }
    });
  }

  const frontend = spawn(process.execPath, [frontendCli, "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: frontendDir,
    stdio: "inherit",
    detached: process.platform !== "win32",
  });
  children.push(frontend);
  frontend.once("error", (error) => {
    console.error("Could not start the frontend dev server:", error.message);
    stopAll();
  });
  frontend.once("exit", (code) => {
    if (!shuttingDown) {
      if (code) console.error(`Frontend dev server exited with code ${code}.`);
      stopAll();
    }
  });

  await waitForServer(devServerUrl, frontend);
  if (shuttingDown) return;

  const electron = spawn(electronBinary, ["."], {
    cwd: root,
    env: electronEnv,
    stdio: "inherit",
    windowsHide: false,
  });
  children.push(electron);
  electron.once("error", (error) => {
    console.error("Could not start Electron:", error.message);
    stopAll();
  });
  electron.once("exit", (code) => {
    stopAll();
    setTimeout(() => {
      for (const child of children) {
        try {
          if (child.exitCode === null) child.kill("SIGKILL");
        } catch { }
      }
      process.exit(code || 0);
    }, 200);
  });
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  stopAll();
  process.exitCode = 1;
});
