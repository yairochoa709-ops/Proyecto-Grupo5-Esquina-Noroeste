const fs = require('fs');

// Read source file
const src = fs.readFileSync('src/utils/queueSolvers.js', 'utf8');

// Find first String.raw template literal
const idx = src.indexOf('String.raw`');
console.log('First String.raw at index:', idx);
console.log('Context:', JSON.stringify(src.substring(idx, idx + 80)));

// The problem: String.raw`\\rho` outputs "\\rho" (two backslashes = literal \\ in string)
// KaTeX needs "\rho" (one backslash + rho)
// String.raw`\rho` outputs "\rho" (one backslash + rho) - CORRECT
// BUT in the JS source file, writing \rho without double backslash might cause issues with some chars
// Let's check: \r = carriage return, \n = newline, \t = tab - these would be problems!
// \f = form feed, \b = backspace, \v = vertical tab - also problems!
// But \l, \m, \s, \c, \q etc are NOT escape sequences in JS, so \lambda = \lambda (preserved)

// SAFE: \lambda, \mu, \rho (after \r issue), \frac, \sum, \cdot, etc.
// UNSAFE: \rho starts with \r which IS a carriage return!

// So String.raw is the right approach, but we need SINGLE backslash in the String.raw template
// Current: String.raw`\\rho` -> "\\rho" (WRONG - two backslashes)
// Needed: String.raw`\rho` -> "\rho" (CORRECT - one backslash)

// Let's verify this
const test1 = String.raw`\\rho = \\frac{\\lambda}{\\mu}`;
const test2 = String.raw`\rho = \frac{\lambda}{\mu}`;
console.log('test1 (double \\\\):', test1);
console.log('test2 (single \\):', test2);
