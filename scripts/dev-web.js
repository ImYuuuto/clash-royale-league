const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const frontendDir = path.join(root, "frontend");
const backendDir = path.join(root, "backend");
const frontendCli = path.join(frontendDir, "node_modules", "vite-plus", "bin", "vp");

const children = [];
let shuttingDown = false;

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
    }
  }
}

process.once("SIGINT", stopAll);
process.once("SIGTERM", stopAll);

// Start backend server
const backend = spawn("npm", ["run", "dev"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: true,
});
children.push(backend);

backend.once("error", (error) => {
  console.error("Backend server error:", error.message);
  stopAll();
});

backend.once("exit", (code) => {
  if (!shuttingDown && code) {
    console.error(`Backend process exited with code ${code}.`);
    stopAll();
  }
});

// Start frontend dev server on port 5173
const frontend = spawn(process.execPath, [frontendCli, "dev", "--host", "127.0.0.1", "--port", "5173"], {
  cwd: frontendDir,
  stdio: "inherit",
});
children.push(frontend);

frontend.once("error", (error) => {
  console.error("Frontend server error:", error.message);
  stopAll();
});

frontend.once("exit", (code) => {
  if (!shuttingDown && code) {
    console.error(`Frontend process exited with code ${code}.`);
    stopAll();
  }
});
