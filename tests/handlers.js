/**
 * handlers.js — guards against dead inline event handlers.
 *
 * The Sign In button was calling signIn() while the page script only
 * defined doSignIn(). The button silently did nothing for weeks, and
 * because auto-redirect happened to reach the dashboard anyway, the
 * fault stayed invisible. This test makes that class of bug loud.
 *
 * It scans every onclick / onkeydown / oninput attribute in every page
 * and verifies the function it names is either exposed on window by the
 * page script, or defined inside the ERP's own script block.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PAGES = [
  'index.html', 'login.html', 'dashboard.html', 'reset-password.html',
  'products/costing/index.html', 'products/cbam/index.html',
  'products/vibration/index.html', 'products/asset/index.html',
];

/* Browser built-ins and expression fragments that are not page functions */
const BUILTIN = new Set([
  'event', 'this', 'alert', 'window', 'document', 'console',
  'if', 'return', 'preventDefault', 'closest', 'remove',
]);

let pass = 0, fail = 0;
console.log('\n━━━ Inline handler binding check ━━━\n');

for (const page of PAGES) {
  const file = path.join(ROOT, page);
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');

  /* Every function name invoked from an inline attribute */
  const called = new Set();
  const attrRe = /\bon(?:click|keydown|input|change|submit)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = attrRe.exec(html)) !== null) {
    /* (?<![.\w$]) excludes method calls like document.getElementById() —
       we only want bare function invocations, which are the page's own. */
    const fnRe = /(?<![.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
    let f;
    while ((f = fnRe.exec(m[1])) !== null) {
      if (!BUILTIN.has(f[1])) called.add(f[1]);
    }
  }
  if (!called.size) continue;

  for (const fn of [...called].sort()) {
    const exposed =
      new RegExp('window\\.' + fn + '\\s*=').test(html) ||          // window.fn =
      new RegExp('(?:^|\\n)\\s*(?:async\\s+)?function\\s+' + fn + '\\b').test(html); // function fn()

    if (exposed) { pass++; console.log(`  ✓ ${page}  →  ${fn}()`); }
    else         { fail++; console.log(`  ✗ ${page}  →  ${fn}()  NOT BOUND — this control is dead`); }
  }
}

console.log('\n═══════════════════════════════════════════');
console.log(`  ${pass} bound, ${fail} dead`);
console.log('═══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
