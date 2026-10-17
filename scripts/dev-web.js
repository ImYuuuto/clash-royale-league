const { spawn } = require("node:child_process");
const net = require("node:net");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");
const frontendCli = path.join(frontendDir, "node_modules", "vite-plus", "bin", "vp");
const apiUrl = "http://127.0.0.1:3000/api/health";

const children = [];
let shuttingDown = false;

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function waitForApi(child, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child && child.exitCode !== null) throw new Error("The backend process exited before the API became ready.");
    try {
      const response = await fetch(apiUrl);
      if (response.ok) return;
    } catch { /* keep waiting while the API starts */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("The API did not become ready on port 3000. Check the backend database settings and MySQL service.");
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
  if (await canListen(3000)) {
    backend = spawn("npm", ["run", "dev"], {
      cwd: backendDir,
      stdio: "inherit",
      shell: true,
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
