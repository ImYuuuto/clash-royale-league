const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];
let shuttingDown = false;

function launch(command, args, cwd, env = process.env) {
  const child = spawn(command, args, { cwd, env, stdio: 'inherit', windowsHide: true });
  processes.push(child);
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) shutdown(code || 1);
  });
  child.on('error', (error) => {
    console.error(`Could not start ${command}:`, error.message);
    shutdown(1);
  });
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of processes) {
    if (child.exitCode === null) child.kill();
  }
  process.exitCode = code;
}

launch(npm, ['--prefix', 'frontend', 'run', 'dev', '--', '--host', '127.0.0.1'], root);
launch(npm, ['--prefix', 'backend', 'run', 'dev'], root);

const electronEnv = { ...process.env, VITE_DEV_SERVER_URL: 'http://127.0.0.1:5173' };
const electron = path.join(root, 'node_modules', 'electron', 'cli.js');
const electronProc = launch(process.execPath, [electron, '.'], root, electronEnv);

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
electronProc.on('exit', (code) => shutdown(code || 0));
