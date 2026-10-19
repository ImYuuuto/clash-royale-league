const { spawn, execFileSync } = require("node:child_process");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const fs = require("node:fs");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");
const frontendCli = path.join(
  frontendDir,
  "node_modules",
  "vite-plus",
  "bin",
  "vp",
);
const tsxCli = path.join(
  backendDir,
  "node_modules",
  "tsx",
  "dist",
  "cli.mjs",
);
const electronBinary = require("electron");

let backendPort = Number(process.env.PORT) || 4000;

try {
  const envPath = path.join(backendDir, ".env");
  const portLine = fs
    .readFileSync(envPath, "utf8")
    .match(/^\s*PORT\s*=\s*["']?(\d+)/m);

  if (portLine?.[1]) backendPort = Number(portLine[1]);
} catch {
  // Use the default port when no backend .env exists.
}

const children = [];
let shuttingDown = false;
let currentFrontendPort = 5173;

function stopChild(child) {
  if (!child || child.exitCode !== null || !child.pid) return;

  try {
    if (process.platform === "win32") {
      // Stop the process and its descendants on Windows.
      execFileSync(
        "taskkill",
        ["/PID", String(child.pid), "/T", "/F"],
        { stdio: "ignore" },
      );
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
}

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of [...children].reverse()) {
    stopChild(child);
  }
}

process.once("SIGINT", () => {
  stopAll();
  process.exitCode = 130;
});

process.once("SIGTERM", () => {
  stopAll();
  process.exitCode = 143;
});

async function isApiRunning() {
  try {
    const response = await fetch(
      `http://127.0.0.1:${backendPort}/api/health`,
      { signal: AbortSignal.timeout(1500) },
    );

    return response.ok;
  } catch {
    return false;
  }
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function findAvailablePort(startPort = 5173) {
  for (let port = startPort; port < startPort + 100; port += 1) {
    if (await canListen(port)) return port;
  }

  throw new Error("Could not find an available frontend port.");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, child, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (shuttingDown) throw new Error("Startup was cancelled.");
    if (child.exitCode !== null) {
      throw new Error("Frontend dev server exited before becoming ready.");
    }

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok) return;
    } catch {
      // The frontend may still be starting.
    }

    await delay(200);
  }

  throw new Error(`Frontend dev server did not become ready at ${url}.`);
}

async function waitForApi(child, timeoutMs = 30000) {
  const apiUrl = `http://127.0.0.1:${backendPort}/api/health`;
  const deadline = Date.now() + timeoutMs;
  let lastResult = "no response";

  while (Date.now() < deadline) {
    if (shuttingDown) throw new Error("Startup was cancelled.");

    if (child && child.exitCode !== null) {
      throw new Error("Backend server exited before the API became ready.");
    }

    try {
      const response = await fetch(apiUrl, {
        signal: AbortSignal.timeout(1000),
      });

      if (response.ok) return;

      lastResult = `HTTP ${response.status}`;
    } catch (error) {
      lastResult = error.name === "TimeoutError"
        ? "request timed out"
        : "connection refused or unavailable";
    }

    await delay(300);
  }

  throw new Error(
    `API health check failed at ${apiUrl} (${lastResult}).`,
  );
}

function startChild(command, args, options) {
  const child = spawn(command, args, options);
  children.push(child);
  return child;
}

async function start() {
  const port = await findAvailablePort();
  currentFrontendPort = port;

  const devServerUrl = `http://127.0.0.1:${port}`;
  const electronEnv = {
    ...process.env,
    PORT: String(backendPort),
    VITE_DEV_SERVER_URL: devServerUrl,
    CR_LEAGUE_USER_DATA_DIR:
      process.env.CR_LEAGUE_USER_DATA_DIR ||
      path.join(os.tmpdir(), "cr-league-manager-dev"),
  };

  let backend;

  if (!(await isApiRunning())) {
    if (!fs.existsSync(tsxCli)) {
      throw new Error(`Could not find tsx CLI at ${tsxCli}`);
    }

    // Launch tsx directly instead of spawning npm through a Windows shell.
    backend = startChild(
      process.execPath,
      [tsxCli, "watch", "src/server.ts"],
      {
        cwd: backendDir,
        stdio: "inherit",
        env: { ...process.env, PORT: String(backendPort) },
        windowsHide: true,
        detached: process.platform !== "win32",
      },
    );

    backend.once("error", (error) => {
      console.error("Could not start backend server:", error.message);
      stopAll();
    });

    backend.once("exit", (code) => {
      if (!shuttingDown) {
        console.error(`Backend server exited with code ${code}.`);
        stopAll();
      }
    });
  }

  await waitForApi(backend);

  if (shuttingDown) return;

  const frontend = startChild(
    process.execPath,
    [
      frontendCli,
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    {
      cwd: frontendDir,
      stdio: "inherit",
      env: process.env,
      windowsHide: true,
      detached: process.platform !== "win32",
    },
  );

  frontend.once("error", (error) => {
    console.error("Could not start frontend dev server:", error.message);
    stopAll();
  });

  frontend.once("exit", (code) => {
    if (!shuttingDown) {
      if (code) {
        console.error(`Frontend dev server exited with code ${code}.`);
      }
      stopAll();
    }
  });

  await waitForServer(devServerUrl, frontend);

  if (shuttingDown) return;

  const electron = startChild(electronBinary, ["."], {
    cwd: root,
    env: electronEnv,
    stdio: "inherit",
    windowsHide: false,
  });

  electron.once("error", (error) => {
    console.error("Could not start Electron:", error.message);
    stopAll();
  });

  electron.once("exit", (code) => {
    stopAll();
    process.exitCode = code || 0;
  });
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  stopAll();
  process.exitCode = 1;
});
