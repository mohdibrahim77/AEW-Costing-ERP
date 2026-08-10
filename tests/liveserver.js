/**
 * liveserver.js — guards against the Live Server injection bug.
 *
 * VS Code Live Server injects its live-reload client by doing a naive
 * string replace on the FIRST "</body>" in the served HTML. The ERP
 * contained that exact text inside a JavaScript string:
 *
 *     pw.document.write('</body></html>');    // printQuote()
 *
 * Live Server injected ~1.3 KB of script INSIDE that string literal,
 * which produced:
 *
 *     SyntaxError: Invalid or unexpected token   index.html:1039:21
 *
 * The whole ERP script block then failed to parse, so every function —
 * calcTube, updHdr, buildCompTables, all of them — was undefined. The
 * page still rendered, so it looked like a calculation bug.
 *
 * Fix: write the tag with an identity escape, '<\/body>'. JavaScript
 * treats \/ as /, so the runtime string is byte-identical, but the
 * literal text "</body>" no longer appears for Live Server to match.
 *
 * This test simulates the injection on every page and fails if any
 * inline script stops parsing. No dependencies.
 */
const fs=require('fs'), path=require('path'), cp=require('child_process'), os=require('os');
const ROOT=path.join(__dirname,'..');
const PAGES=['index.html','login.html','dashboard.html','reset-password.html',
  'products/costing/index.html','products/cbam/index.html',
  'products/vibration/index.html','products/asset/index.html'];

const INJECT='\n<!-- Code injected by live-server -->\n<script>\n'+('// '+'x'.repeat(1240))+'\n</script>\n';
const tmp=path.join(os.tmpdir(),'aew_ls_check.js');

let pass=0, fail=0;
console.log('\n━━━ Live Server injection resilience ━━━\n');

for (const page of PAGES) {
  const file=path.join(ROOT,page);
  if(!fs.existsSync(file)) continue;
  const html=fs.readFileSync(file,'utf8');

  const first=html.indexOf('</body>');
  const last =html.lastIndexOf('</body>');
  if (first!==last) {
    fail++;
    console.log(`  ✗ ${page}  "</body>" appears ${html.split('</body>').length-1} times — one is inside a script`);
    continue;
  }

  const served=html.replace('</body>', INJECT+'</body>');
  let broken=0;
  for (const m of served.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)) {
    const body=m[1].trim();
    if(!body) continue;
    fs.writeFileSync(tmp, body);
    if (cp.spawnSync('node',['--check',tmp]).status !== 0) broken++;
  }
  if (broken) { fail++; console.log(`  ✗ ${page}  ${broken} script block(s) break under injection`); }
  else        { pass++; console.log(`  ✓ ${page}`); }
}

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} safe, ${fail} vulnerable`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
