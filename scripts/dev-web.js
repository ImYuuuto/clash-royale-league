const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");
const frontendCli = path.join(frontendDir, "node_modules", "vite-plus", "bin", "vp");
const backendEnvPath = path.join(backendDir, ".env");
let apiPort = Number(process.env.PORT) || 4000;
try {
  const portLine = require("node:fs").readFileSync(backendEnvPath, "utf8").match(/^\s*PORT\s*=\s*["']?(\d+)/m);
  if (portLine?.[1]) apiPort = Number(portLine[1]);
} catch {
  // Use the backend's default port when no local .env file exists.
}
const apiUrl = `http://127.0.0.1:${apiPort}/api/health`;

const children = [];
let shuttingDown = false;

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
}

async function isApiRunning() {
  try {
    const response = await fetch(apiUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApi(child, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastResult = "no response";
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error("The backend process exited before the API became ready.");
    try {
      const response = await fetch(apiUrl);
      if (response.ok) return;
      lastResult = `HTTP ${response.status}`;
    } catch {
      lastResult = "connection refused or unavailable";
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`The backend health check at ${apiUrl} failed (${lastResult}). Check the backend startup output and whether that port is already in use.`);
}

function watchChild(child, name) {
  child.once("error", (error) => {
    console.error(`${name} server error:`, error.message);
    stopAll();
  });
  child.once("exit", (code) => {
    if (!shuttingDown) {
      if (code) console.error(`${name} process exited with code ${code}.`);
      stopAll();
    }
  });
}

process.once("SIGINT", stopAll);
process.once("SIGTERM", stopAll);

async function start() {
  let backend;
  if (!(await isApiRunning())) {
    backend = spawn("npm", ["run", "dev"], {
      cwd: backendDir,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, PORT: String(apiPort) },
    });
    children.push(backend);
    watchChild(backend, "Backend");
  }

  await waitForApi(backend);
  if (shuttingDown) return;

  const frontend = spawn(process.execPath, [frontendCli, "dev", "--host", "127.0.0.1", "--port", "5173", "--strictPort"], {
    cwd: frontendDir,
    stdio: "inherit",
  });
  children.push(frontend);
  watchChild(frontend, "Frontend");
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  stopAll();
  process.exitCode = 1;
});
