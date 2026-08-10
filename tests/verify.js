/**
 * verify.js — the ERP's post-boot self-check. Confirms a healthy boot
 * shows only a build stamp, and a broken boot renders an on-screen fault
 * report naming the failed step. Requires jsdom: npm install jsdom
 */
const fs=require('fs'), path=require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch(e){ console.log('\n  jsdom not installed — skipping.\n'); process.exit(0); }
const ROOT=path.join(__dirname,'..');

function boot(breakStep) {
  let html=fs.readFileSync(ROOT+'/products/costing/index.html','utf8');
  html=html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
    (m,p)=>'<script>'+fs.readFileSync(path.join(ROOT,'products/costing',p),'utf8')+'</script>');
  html=html.replace(/<script src="https:\/\/[^"]*"><\/script>/g,'');
  const vc=new VirtualConsole();
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
    url:'http://127.0.0.1:5500/products/costing/index.html'});
  const w=dom.window;
  w.Chart=function(){return{destroy(){},update(){}};};
  w.jspdf={jsPDF:function(){return{text(){},save(){},autoTable(){},internal:{pageSize:{}}};}};
  if(breakStep) w[breakStep]=function(){throw new Error('simulated '+breakStep+' failure');};
  w.bootERP({name:'Aniktha'});
  return w;
}
let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(42)+d)):(fail++,console.log('  ✗ '+n.padEnd(42)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
console.log('\n━━━ Healthy boot: stamp shown, no trouble report ━━━');
{
  const w=boot(); await wait(1400);
  const D=w.document;
  const mfg=D.getElementById('ss-mfg').textContent;
  ok('manufacturing cost non-zero', /[1-9]/.test(mfg), mfg);
  ok('build stamp shown', !!D.getElementById('aew-stamp'),
     D.getElementById('aew-stamp')?D.getElementById('aew-stamp').textContent:'');
  ok('NO trouble report', !D.getElementById('aew-trouble'));
  ok('weight calculated', D.getElementById('t-wt').value, D.getElementById('t-wt').value);
}

console.log('\n━━━ Broken boot: trouble report appears on screen ━━━');
{
  const w=boot('buildCompTables'); await wait(1600);
  const D=w.document;
  const t=D.getElementById('aew-trouble');
  ok('trouble report rendered', !!t);
  if(t){
    const txt=t.textContent;
    ok('names the failed step', /buildCompTables/.test(txt));
    ok('shows the mfg cost', /Manufacturing cost/.test(txt));
    ok('has a Copy button', !!D.getElementById('aew-copy'));
  }
}

console.log('\n━━━ Cache-control headers present ━━━');
{
  const h=fs.readFileSync(ROOT+'/products/costing/index.html','utf8');
  ok('no-cache meta on ERP', /http-equiv="Cache-Control"/.test(h));
}
console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
