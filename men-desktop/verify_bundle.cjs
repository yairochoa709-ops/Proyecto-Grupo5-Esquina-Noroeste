const fs = require('fs');

// Read the new bundle to check if it changed
const files = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js') && f.startsWith('index-'));
console.log('Bundle files:', files);

const content = fs.readFileSync(`dist/assets/${files[0]}`, 'utf8');

// Find the rho area and check char codes
const idx = content.indexOf('rho = ');
const slice = content.substring(idx - 5, idx + 30);
console.log('\nRaw chars around rho:');
for (let i = 0; i < slice.length; i++) {
  const code = slice.charCodeAt(i);
  if (code < 32 || code === 92) {
    process.stdout.write(`[${code}]`);
  } else {
    process.stdout.write(slice[i]);
  }
}
console.log('\n');
