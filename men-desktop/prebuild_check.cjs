const fs = require('fs');

const q = fs.readFileSync('src/utils/queueSolvers.js', 'utf8');
const inv = fs.readFileSync('src/utils/inventorySolvers.js', 'utf8');
const d = fs.readFileSync('src/utils/decisionSolvers.js', 'utf8');

console.log('=== Source file verification ===');
console.log('String.raw in queueSolvers:', q.includes('String.raw'));
console.log('String.raw in inventorySolvers:', inv.includes('String.raw'));
console.log('String.raw in decisionSolvers:', d.includes('String.raw'));

const countMatches = (str, pattern) => (str.match(pattern) || []).length;

console.log('\nQueue math concat strings:', countMatches(q, /math: "/g));
console.log('Inventory math concat strings:', countMatches(inv, /math: "/g));
console.log('Decision math concat strings:', countMatches(d, /math: "/g));

// Check CPM/PERT removed from NetworkModule
const net = fs.readFileSync('src/components/NetworkModule/NetworkModule.jsx', 'utf8');
console.log('\nCPM still in NetworkModule:', net.includes('cpm') && net.includes("value=\"cpm\""));
console.log('PERT still in NetworkModule:', net.includes('pert') && net.includes("value=\"pert\""));

// Sample a math string from each
const qSample = q.match(/math: "([^"]+)"/);
console.log('\nQueue sample math:', qSample ? qSample[1].substring(0, 60) : 'none');

const invSample = inv.match(/math: "([^"]+)"/);
console.log('Inventory sample math:', invSample ? invSample[1].substring(0, 60) : 'none');

const dSample = d.match(/math: "([^"]+)"/);
console.log('Decision sample math:', dSample ? dSample[1].substring(0, 60) : 'none');
