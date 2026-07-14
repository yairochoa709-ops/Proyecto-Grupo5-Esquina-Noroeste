const fs = require('fs');
const content = fs.readFileSync('src/utils/queueSolvers.js', 'utf8');
const idx = content.indexOf('String.raw');
const slice = content.substring(idx, idx + 80);
console.log('Raw chars:');
for (let i = 0; i < slice.length; i++) {
  const code = slice.charCodeAt(i);
  if (code < 32 || code === 92) {
    process.stdout.write(`[${code}]`);
  } else {
    process.stdout.write(slice[i]);
  }
}
console.log('\n');
console.log('Backslash count in first 80 chars:', (slice.match(/\\/g) || []).length);
