const fs = require('fs');

const files = [
  'src/utils/queueSolvers.js',
  'src/utils/inventorySolvers.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  // Replace 4 backslashes with 2 backslashes
  // '\\\\rho' -> '\\rho'
  content = content.replace(/\\\\\\\\/g, '\\\\');
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
