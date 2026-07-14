const fs = require('fs');

// Check if the problem could be in how the components receive the math prop
// Look at how BlockMath is called in the bundle

const content = fs.readFileSync('dist/assets/index-Buyf85Nu.js', 'utf8');

// Find BlockMath usage
const bmIdx = content.indexOf('BlockMath');
console.log('BlockMath found at:', bmIdx);
console.log('Context:', content.substring(bmIdx - 50, bmIdx + 100));

// Look for the math prop passing
const mathPropIdx = content.indexOf(',math:');
console.log('\nmathProp context:', content.substring(mathPropIdx - 20, mathPropIdx + 80));

// Check if react-katex is being used correctly
const katexImport = content.indexOf('react-katex');
console.log('\nreact-katex reference:', katexImport !== -1 ? 'found' : 'not found directly');

// Look for InlineMath or BlockMath component in bundle
const bm = content.match(/BlockMath/g) || [];
console.log('BlockMath references:', bm.length);

// Check how the component renders - look for dangerouslySetInnerHTML
const dangerous = content.indexOf('dangerouslySetInnerHTML');
console.log('\ndangerouslySetInnerHTML found:', dangerous !== -1);
if (dangerous !== -1) {
  console.log('Context:', content.substring(dangerous - 30, dangerous + 100));
}

// Look for __html pattern near katex
const htmlPat = content.indexOf('__html');
console.log('\n__html found:', htmlPat !== -1);
if (htmlPat !== -1) {
  console.log('Context:', content.substring(htmlPat - 30, htmlPat + 80));
}
