const fs = require('fs');

const files = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js') && f.startsWith('index-'));
const file = files[0];
let content = fs.readFileSync(`dist/assets/${file}`, 'utf8');

console.log('File:', file);
console.log('Size before:', content.length);

// In the compiled bundle, String.raw`` preserves \\rho as \\rho (double backslash in JS string = literal \\)
// But KaTeX needs \rho (single backslash) 
// The template tag `w` is the compiled String.raw.
// We need to find these tagged template literals in the bundle and fix them.

// Pattern: w`...\\frac...` -> w`...\frac...`
// But since this is a JS file, we need to be careful
// The compiled String.raw template still has \\ which renders as \ at runtime
// BUT the issue is that String.raw preserves ALL backslashes literally

// Actually String.raw`\\rho` = "\\rho" (two chars: backslash backslash rho)
// KaTeX needs "\rho" (one backslash + rho)

// So the fix is: in the bundle, replace the String.raw tag with empty (no tag = normal template)
// A normal template literal `\rho` = \rho (one backslash) since \r is not a special escape... wait
// Actually `\r` IS a carriage return in a template literal!
// `\rho` would be carriage return + 'ho'!

// The REAL solution: use String.raw but with SINGLE backslash in source
// String.raw`\rho` = "\rho" (one backslash + rho) - CORRECT for KaTeX!

// Current state in source: String.raw`\\rho` = "\\rho" (TWO backslashes) - WRONG for KaTeX!
// We need: String.raw`\rho` = "\rho" (ONE backslash) - CORRECT for KaTeX!

// So fix: in the source files, convert String.raw`\\frac` to String.raw`\frac`

// Check sample
const idx = content.indexOf('\\\\frac');
console.log('Sample double backslash context:', content.substring(idx-20, idx+40));
