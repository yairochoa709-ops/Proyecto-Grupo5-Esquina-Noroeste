const lambda = 10, mu = 15;
const rho = lambda/mu;

// Current state - String.raw with double backslash
const s1 = String.raw`\\rho = \\frac{\\lambda}{\\mu} = \\frac{${lambda}}{${mu}} = ${rho.toFixed(4)}`;
console.log("String.raw with \\\\:", s1);

// What KaTeX needs - single backslash
const s2 = `\\rho = \\frac{\\lambda}{\\mu} = \\frac{${lambda}}{${mu}} = ${rho.toFixed(4)}`;
console.log("Template literal with \\:", s2);

// Verify KaTeX processes it correctly
const katex = require('katex');
try {
    katex.renderToString(s2);
    console.log("s2 KaTeX: OK");
} catch(e) {
    console.log("s2 KaTeX error:", e.message);
}
try {
    katex.renderToString(s1);
    console.log("s1 KaTeX: OK");
} catch(e) {
    console.log("s1 KaTeX error:", e.message);
}
