const fs = require('fs');

const files = [
  'src/utils/queueSolvers.js',
  'src/utils/inventorySolvers.js',
  'src/utils/decisionSolvers.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace: math: `...` with math: String.raw`...`
  // But wait, there are backslashes already in the file.
  // Currently the file has math: `\\rho ... ` (2 backslashes)
  // If we change it to String.raw, we only need ONE backslash.
  // So we first change `math: \`` to `math: String.raw\``
  content = content.replace(/math:\s*`/g, 'math: String.raw`');
  
  // Then we change all double backslashes to single backslashes
  // ONLY inside the String.raw templates?
  // It's safer to just change all `\\\\` to `\\` globally in the file since these files only use backslashes for math.
  content = content.replace(/\\\\/g, '\\');
  
  fs.writeFileSync(file, content);
  console.log(`Fixed ${file}`);
}
