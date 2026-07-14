const fs = require('fs');

// The fix: in source files, String.raw`\\rho` needs to become String.raw`\rho`
// i.e., remove one of the two backslashes INSIDE String.raw templates

const files = [
  'src/utils/queueSolvers.js',
  'src/utils/inventorySolvers.js',
  'src/utils/decisionSolvers.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // We need to find String.raw`...` blocks and within them replace \\\\ with \\
  // Strategy: parse the file, find String.raw template regions and fix backslashes inside them
  
  let result = '';
  let i = 0;
  while (i < content.length) {
    const rawStart = content.indexOf('String.raw`', i);
    if (rawStart === -1) {
      result += content.slice(i);
      break;
    }
    // Copy everything before String.raw`
    result += content.slice(i, rawStart + 'String.raw`'.length);
    i = rawStart + 'String.raw`'.length;
    
    // Now find the end of this template literal (need to handle ${} expressions)
    let depth = 0;
    let inExpr = false;
    let templateContent = '';
    while (i < content.length) {
      const ch = content[i];
      if (!inExpr && ch === '$' && content[i+1] === '{') {
        inExpr = true;
        depth = 0;
        templateContent += ch;
        i++;
        continue;
      }
      if (inExpr) {
        templateContent += ch;
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) inExpr = false;
        }
        i++;
        continue;
      }
      if (ch === '`') {
        // End of template
        break;
      }
      if (ch === '\\' && content[i+1] === '\\') {
        // Double backslash -> single backslash
        templateContent += '\\';
        i += 2;
        continue;
      }
      templateContent += ch;
      i++;
    }
    result += templateContent;
    if (i < content.length && content[i] === '`') {
      result += '`';
      i++;
    }
  }
  
  fs.writeFileSync(file, result);
  
  // Verify
  const verify = fs.readFileSync(file, 'utf8');
  const idx = verify.indexOf('String.raw`');
  if (idx !== -1) {
    console.log(`${file}: Fixed. Sample:`, JSON.stringify(verify.substring(idx, idx + 70)));
  } else {
    console.log(`${file}: No String.raw found`);
  }
}
