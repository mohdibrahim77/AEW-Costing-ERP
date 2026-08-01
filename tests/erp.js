/**
 * erp.js — boots the real ERP page in a real DOM and verifies that every
 * tab switches, that a failed boot step does not disable the rest, and
 * that the page survives a blocked CDN.
 *
 * Requires jsdom, which is the ONLY dependency in this project and is
 * needed for testing only — never at runtime:
 *     npm install jsdom
 */
const fs=require('fs'), path=require('path');
let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require('jsdom'));
} catch (e) {
  console.log('\n  jsdom is not installed — skipping ERP DOM tests.');
  console.log('  Install it with:  npm install jsdom\n');
  console.log('  (test.js, routing.js and handlers.js need no dependencies');
  console.log('   and cover authentication, routing and handler binding.)\n');
  process.exit(0);
}
const ROOT=require('path').join(__dirname,'..');

function boot({withChart=true, breakFn=null}={}) {
  let html=fs.readFileSync(ROOT+'/products/costing/index.html','utf8');
  html=html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
    (m,p)=>'<script>'+fs.readFileSync(path.join(ROOT,'products/costing',p),'utf8')+'</script>');
  html=html.replace(/<script src="https:\/\/[^"]*"><\/script>/g,'');

  const vc=new VirtualConsole(); const logs=[];
  vc.on('error',(...a)=>logs.push('ERR '+a.join(' ')));
  vc.on('warn',(...a)=>logs.push('WARN '+a.join(' ')));
  vc.on('info',(...a)=>logs.push('INFO '+a.join(' ')));

  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
    virtualConsole:vc,url:'http://127.0.0.1:5500/products/costing/index.html'});
  const w=dom.window;
  if(withChart) w.Chart=function(){return{destroy(){},update(){}};};
  w.jspdf={jsPDF:function(){return{text(){},save(){},autoTable(){},internal:{pageSize:{}}};}};
  if(breakFn) w[breakFn]=function(){ throw new Error('simulated failure in '+breakFn); };
  return {w,logs};
}

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n)):(fail++,console.log('  ✗ '+n+(d?' — '+d:'')));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{

console.log('\n━━━ A. Normal boot ━━━');
{
  const {w}=boot();
  w.bootERP({name:'Aniktha Patirat',avatar:'A',color:'#059669'});
  await wait(300);
  ok('all boot steps succeeded', w.AEW_BOOT.failed.length===0,
     JSON.stringify(w.AEW_BOOT.failed));
  ok('overlay REMOVED from DOM (cannot block clicks)',
     !w.document.getElementById('auth-loading'));
  ok('#app visible', w.document.getElementById('app').style.display==='block');
  ok('user chip set', w.document.getElementById('uname').textContent==='Aniktha Patirat');
}

console.log('\n━━━ B. All 9 tabs switch ━━━');
{
  const {w}=boot();
  w.bootERP({name:'T'}); await wait(300);
  const tabs=[...w.document.querySelectorAll('.ntab')];
  let good=0;
  tabs.forEach(b=>{
    b.click();
    const id=b.getAttribute('data-p');
    const p=w.document.getElementById('p-'+id);
    if(p&&p.classList.contains('active')&&b.classList.contains('active')) good++;
  });
  ok('9/9 tabs activate their panel', good===9, good+'/9');
  ok('only one panel active at a time',
     [...w.document.querySelectorAll('.panel.active')].length===1);
}

console.log('\n━━━ C. FAULT ISOLATION — a broken step must not kill the rest ━━━');
{
  const {w}=boot({breakFn:'updHdr'});
  w.bootERP({name:'T'}); await wait(300);
  ok('updHdr failure recorded', w.AEW_BOOT.failed.some(f=>f.indexOf('updHdr')===0));
  ok('later steps STILL RAN despite the failure',
     w.AEW_BOOT.ok.indexOf('buildCompTables')!==-1,
     'ok steps: '+w.AEW_BOOT.ok.join(','));
  // tabs must still work
  const b=w.document.querySelector('.ntab[data-p="tube"]'); b.click();
  ok('tabs still work after a boot failure',
     w.document.getElementById('p-tube').classList.contains('active'));
}

console.log('\n━━━ D. Chart.js missing (CDN blocked) ━━━');
{
  const {w}=boot({withChart:false});
  w.bootERP({name:'T'}); await wait(300);
  ok('ERP still boots without Chart.js', w.document.getElementById('app').style.display==='block');
  const b=w.document.querySelector('.ntab[data-p="sum"]'); b.click();
  ok('Cost Summary tab still opens', w.document.getElementById('p-sum').classList.contains('active'));
}

console.log('\n━━━ E. Diagnostics ━━━');
{
  const {w}=boot();
  w.bootERP({name:'T'}); await wait(300);
  ok('AEW.erp.diagnose exists', typeof w.AEW.erp.diagnose==='function');
  const r=w.AEW.erp.diagnose();
  ok('reports zero missing functions', r.missing.length===0, r.missing.join(','));
  ok('reports zero unwired tabs', r.unwired.length===0, r.unwired.join(','));
}

console.log('\n━━━ F. Quotation + PDF path reachable ━━━');
{
  const {w}=boot();
  w.bootERP({name:'T'}); await wait(300);
  w.document.querySelector('.ntab[data-p="qte"]').click();
  ok('Quotation tab opens and buildQuote runs',
     w.document.getElementById('p-qte').classList.contains('active'));
  ok('generatePDF is callable', typeof w.generatePDF==='function');
  ok('printQuote is callable', typeof w.printQuote==='function');
}

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
