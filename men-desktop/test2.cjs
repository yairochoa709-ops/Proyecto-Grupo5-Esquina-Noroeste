const fs = require('fs');

fs.writeFileSync('test2.js', 'console.log(`\\\\rho`, `\\\\rho`.length);');
const { execSync } = require('child_process');
console.log(execSync('node test2.js').toString());
