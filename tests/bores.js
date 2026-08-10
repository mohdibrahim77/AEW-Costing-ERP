/** Requires jsdom (testing only):  npm install jsdom */
const fs=require('fs'), path=require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch(e){ console.log('\n  jsdom not installed — skipping. npm install jsdom\n'); process.exit(0); }
const ROOT=path.join(__dirname,'..');
let html=fs.readFileSync(ROOT+'/products/costing/index.html','utf8');
html=html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
  (m,p)=>'<script>'+fs.readFileSync(path.join(ROOT,'products/costing',p),'utf8')+'</script>');
html=html.replace(/<script src="https:\/\/[^"]*"><\/script>/g,'');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  virtualConsole:new VirtualConsole(),url:'http://x/'});
const w=dom.window;
w.Chart=function(){return{destroy(){},update(){}};};
w.jspdf={jsPDF:function(){return{text(){},save(){},autoTable(){},internal:{pageSize:{}}};}};
w.bootERP({name:'T'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(30)+d)):(fail++,console.log('  ✗ '+n.padEnd(30)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1200);
const D=w.document;
const g=id=>{const e=D.getElementById(id);return e?(e.value||e.textContent||'').trim():'?';};
const set=async(id,v)=>{const e=D.getElementById(id);e.value=v;
  e.dispatchEvent(new w.Event('input',{bubbles:true})); await wait(300);};

console.log('\n━━━ Every standard hydraulic bore size ━━━');
for (const bore of [40,50,63,80,100,125,160,200,250]) {
  await set('inq-bore',bore);
  const wt=g('t-wt'), od=g('t-rod'), tot=g('t-total'), mfg=g('ss-mfg');
  const good = parseFloat(wt)>0 && !/^₹?0$/.test(tot);
  ok(`bore ${String(bore).padStart(3)} mm`, good,
     `OD ${String(od).padStart(4)} · wt ${wt.padEnd(9)} · tube ${tot.padEnd(8)} · mfg ${mfg}`);
}

console.log('\n━━━ Estimator sets their own OD — must NOT be overwritten ━━━');
await set('inq-bore',100);
await set('t-rod',140);
await wait(300);
ok('user OD 140 preserved', g('t-rod')==='140', 'OD='+g('t-rod'));
ok('weight recalculated', parseFloat(g('t-wt'))>0, g('t-wt'));

console.log('\n━━━ Impossible geometry typed by hand → visible warning ━━━');
await set('t-rod',50);   // smaller than the 100 bore
await wait(300);
const warn=D.getElementById('aew-geom-warn');
ok('warning banner shown', !!warn);
if(warn) ok('names the problem', /must be smaller than the raw OD/.test(warn.textContent));
ok('offers a fix button', !!D.getElementById('aew-geom-fix'));

console.log('\n━━━ Clicking the fix button repairs it ━━━');
if(D.getElementById('aew-geom-fix')){
  D.getElementById('aew-geom-fix').click();
  await wait(300);
  ok('OD raised', Number(g('t-rod'))>100, 'OD='+g('t-rod'));
  ok('weight restored', parseFloat(g('t-wt'))>0, g('t-wt'));
  ok('warning cleared', !D.getElementById('aew-geom-warn'));
}

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
