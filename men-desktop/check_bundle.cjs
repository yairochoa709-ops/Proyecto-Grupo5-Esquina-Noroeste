const fs = require('fs');

// Read compiled JS
const files = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js') && f.startsWith('index-'));
const file = files[0];
const content = fs.readFileSync(`dist/assets/${file}`, 'utf8');

// Find all instances of String.raw template tag followed by backslash content
// In the compiled bundle, String.raw`\\frac` results in literal \\frac (double backslash)
// But plain template `` `\frac` `` results in \frac (single backslash)

// Count instances
const doubleBackslash = (content.match(/\\\\frac/g) || []).length;
const singleBackslash = (content.match(/(?<!\\)\\frac/g) || []).length;

console.log(`Double backslash \\\\frac: ${doubleBackslash}`);
console.log(`Single backslash \\frac: ${singleBackslash}`);

// Show sample context
const idx = content.indexOf('\\frac');
console.log('\nSample:', JSON.stringify(content.substring(idx-5, idx+20)));
