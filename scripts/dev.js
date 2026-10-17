const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const frontend = spawn("npm", ["run", "dev", "--prefix", path.join(root, "frontend"), "--", "--host", "127.0.0.1"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
const electron = spawn("npx", ["wait-on", "http://127.0.0.1:5173", "&&", "npx", "electron", "."], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

const children = [frontend, electron];
let shuttingDown = false;

function stopAll() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill();
}

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);

electron.on("exit", stopAll);
