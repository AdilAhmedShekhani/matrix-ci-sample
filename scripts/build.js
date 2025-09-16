
const fs = require('fs');
const path = require('path');

fs.mkdirSync('dist', { recursive: true });
const html = `<html><body><h1>Build at: ${new Date().toISOString()}</h1></body></html>`;
fs.writeFileSync(path.join('dist', 'index.html'), html);

console.log('Built to dist/index.html');
