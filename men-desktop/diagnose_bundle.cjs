const fs = require('fs');

// Read the current compiled bundle
const files = fs.readdirSync('dist/assets').filter(f => f.endsWith('.js') && f.startsWith('index-'));
const bundleFile = files[0];
const content = fs.readFileSync(`dist/assets/${bundleFile}`, 'utf8');

console.log('Bundle:', bundleFile);

// 1. Check how math strings appear in bundle
const idx = content.indexOf('rho = ');
const context = content.substring(idx-10, idx+100);
console.log('\n=== Math string context in bundle ===');
for (let i = 0; i < context.length; i++) {
  const code = context.charCodeAt(i);
  if (code < 32) process.stdout.write(`[CR${code}]`);
  else if (code === 92) process.stdout.write('[BS]');
  else process.stdout.write(context[i]);
}
console.log();

// 2. Count backslash sequences
const doubleBS = (content.match(/\\\\/g) || []).length;
const singleBS_rho = (content.match(/[^\\]\\rho/g) || []).length;
const singleBS_frac = (content.match(/[^\\]\\frac/g) || []).length;
console.log('\n=== Backslash counts ===');
console.log('Double backslash (\\\\) occurrences:', doubleBS);
console.log('Unescaped \\rho:', singleBS_rho);
console.log('Unescaped \\frac:', singleBS_frac);

// 3. Simulate runtime: what does "\\rho" evaluate to?
const runtimeSim = "\\rho = \\frac{\\lambda}{\\mu}";
console.log('\n=== Runtime simulation ===');
console.log('JS literal "\\\\rho" at runtime is:', runtimeSim);
console.log('First char code:', runtimeSim.charCodeAt(0), '(92 = backslash = correct for KaTeX)');

// 4. Check KaTeX css presence
const hasKatexCss = fs.existsSync('dist/assets/index-vooRCSe6.css');
const cssContent = hasKatexCss ? fs.readFileSync('dist/assets/index-vooRCSe6.css', 'utf8') : '';
const katexInCss = cssContent.includes('katex');
console.log('\n=== KaTeX CSS ===');
console.log('CSS file exists:', hasKatexCss);
console.log('KaTeX in CSS:', katexInCss);

// 5. Check KaTeX fonts
const katexFonts = fs.readdirSync('dist/assets').filter(f => f.startsWith('KaTeX'));
console.log('KaTeX fonts bundled:', katexFonts.length);
