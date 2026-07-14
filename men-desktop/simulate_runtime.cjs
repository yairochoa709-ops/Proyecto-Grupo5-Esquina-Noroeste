const fs = require('fs');
const katex = require('katex');

// The bundle has \\rho (two backslashes in the file = one backslash at runtime)
// Let's simulate what happens at runtime when JS evaluates "\\rho"
const bundleStr = "\\\\rho = \\\\frac{\\\\lambda}{\\\\mu}"; // This is what's in the bundle file

// At runtime when JS runs the bundle, "\\rho" evaluates to \rho (one backslash)
const runtimeStr = bundleStr.replace(/\\\\/g, '\\'); // simulate JS parsing

console.log('Bundle (raw file):', bundleStr);
console.log('Runtime value:', runtimeStr);

// Check char codes
console.log('Runtime first 5 chars:', [...runtimeStr.substring(0,5)].map(c => c.charCodeAt(0)));

try {
  katex.renderToString(runtimeStr);
  console.log('KaTeX with simulated runtime string: OK!');
} catch(e) {
  console.log('KaTeX error:', e.message);
}
