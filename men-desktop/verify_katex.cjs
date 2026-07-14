const fs = require('fs');
const katex = require('katex');

const content = fs.readFileSync('dist/assets/index-BZVhM_Ac.js', 'utf8');

// Find the first math string in the bundle by looking for the rho formula
const idx = content.indexOf('rho = ');
const chunk = content.substring(idx - 5, idx + 80);

console.log('Raw bytes around rho:');
for (let i = 0; i < chunk.length; i++) {
  const code = chunk.charCodeAt(i);
  if (code < 32 || code === 92) {
    process.stdout.write(`[${code}]`);
  } else {
    process.stdout.write(chunk[i]);
  }
}
console.log('\n');

// Extract what the string actually looks like at runtime
// "\\rho" in JS source = \rho at runtime (2 chars: backslash + rho)
// Try to parse using eval in a controlled way
const mathStr = "\\rho = \\frac{\\lambda}{\\mu} = \\frac{10}{15} = 0.6667";
console.log('Test math string:', mathStr);
console.log('Char codes:', [...mathStr.substring(0,5)].map(c => c.charCodeAt(0)));

try {
  katex.renderToString(mathStr);
  console.log('KaTeX: OK!');
} catch(e) {
  console.log('KaTeX error:', e.message);
}
