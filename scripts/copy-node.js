const fs = require('fs');
const path = require('path');

const source = process.execPath;
const destinationDir = path.join(__dirname, '..', 'build-resources', 'node');
const destination = path.join(destinationDir, process.platform === 'win32' ? 'node.exe' : 'node');

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log(`Bundled Node runtime at ${destination}`);
