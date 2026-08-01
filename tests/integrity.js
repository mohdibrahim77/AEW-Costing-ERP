/**
 * integrity.js — proves the frozen ERP business logic is unmodified.
 * Locates the block by content (it contains BEAR_TYPES) rather than by
 * position, so adding or reordering other inline scripts cannot raise a
 * false alarm. No dependencies.
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const FILE = path.join(__dirname, '..', 'products', 'costing', 'index.html');
const BASELINE = '304a7d3070ebe34f72706af4d60c23a1';

const html = fs.readFileSync(FILE, 'utf8');
let erp = null;
for (const m of html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
  if (m[1].includes('BEAR_TYPES')) { erp = m[1]; break; }
}
if (!erp) { console.log('  \u2717 ERP block not found'); process.exit(1); }

/* Exclude the single sanctioned integration line (doLogout -> AEW.auth). */
const logicLines = erp.split('\n').filter(l => !l.includes('AEW.'));
const logic = logicLines.join('\n');
const hash  = crypto.createHash('md5').update(logic).digest('hex').slice(0, 32);

const FNS = ['calcTube','calcRod','calcBOM','calcAsm','calcSummary','buildQuote',
             'generatePDF','printQuote','propagate','updHdr','buildCompTables',
             'addBearing','addSeal','addBOM','addDefaultBOM','toggleTheme','go',
             'doLogout','handleFile','renderCharts','calcAll','buildBOMRow'];
const missing = FNS.filter(f => !new RegExp('^function\\s+' + f + '\\b', 'm').test(erp));
const integration = erp.split('\n').filter(l => l.includes('AEW.')).length;

console.log('\n\u2501\u2501\u2501 Frozen ERP integrity \u2501\u2501\u2501');
console.log('  block size      : ' + erp.length + ' chars');
console.log('  business logic  : ' + logic.length + ' chars');
console.log('  hash            : ' + hash);
console.log('  baseline        : ' + BASELINE);
console.log('  functions       : ' + (FNS.length - missing.length) + '/' + FNS.length +
            (missing.length ? '  MISSING: ' + missing.join(', ') : '  all present'));
console.log('  integration pts : ' + integration + ' (expected 1)');

const hashOK = (BASELINE === 'PLACEHOLDER') || (hash === BASELINE);
const ok = missing.length === 0 && integration === 1 && hashOK;
if (!hashOK) console.log('\n  \u2717 HASH MISMATCH \u2014 ERP business logic was modified.');
console.log('\n  ' + (ok ? '\u2713 ERP INTACT' : '\u2717 ERP DAMAGED') + '\n');
process.exit(ok ? 0 : 1);
