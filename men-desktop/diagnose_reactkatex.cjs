const fs = require('fs');

// Read react-katex source to understand how it processes the math prop
const rkContent = fs.readFileSync('node_modules/react-katex/dist/react-katex.js', 'utf8');
console.log('react-katex dist size:', rkContent.length, 'bytes');
console.log('\n=== First 500 chars ===');
console.log(rkContent.substring(0, 500));

// Check if it calls renderToString with the math prop directly
const renderIdx = rkContent.indexOf('renderToString');
console.log('\n=== renderToString context ===');
console.log(rkContent.substring(renderIdx - 50, renderIdx + 200));

// Check strict mode / trust handling
const strictIdx = rkContent.indexOf('strict');
console.log('\n=== strict mode ===');
console.log(rkContent.substring(strictIdx, strictIdx + 100));
