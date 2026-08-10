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
const errs=[]; const vc=new VirtualConsole();
const HARNESS=/getContext|navigation to another Document|Supabase|canvas npm package|Not implemented/i;
vc.on('jsdomError',e=>{ if(!HARNESS.test(e.message)) errs.push('PAGE: '+e.message); });
vc.on('error',(...a)=>{ const m=a.join(' '); if(!HARNESS.test(m)) errs.push('console.error: '+m.slice(0,120)); });
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,url:'http://x/'});
const w=dom.window;
w.Chart=function(){return{destroy(){},update(){}};};
const stub=new Proxy({internal:{pageSize:{width:210,height:297,getWidth:()=>210,getHeight:()=>297}},
  lastAutoTable:{finalY:100}},{get(t,k){ if(k in t) return t[k]; return ()=>stub; }});
w.jspdf={jsPDF:function(){return stub;}};
w.bootERP({name:'Aniktha Patirat',avatar:'A'});

let pass=0,fail=0,warn=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(46)+d)):(fail++,console.log('  ✗ '+n.padEnd(46)+d));};
const wr=(n,d='')=>{warn++;console.log('  ⚠ '+n.padEnd(46)+d);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1500);
const D=w.document;
const g=id=>{const e=D.getElementById(id);return e?String(e.value??e.textContent??'').trim():'<missing>';};
const num=id=>Number(g(id).replace(/[^0-9.-]/g,''))||0;
const set=async(id,v)=>{const e=D.getElementById(id);if(!e)return;
  e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));
  e.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(400);};

console.log('\n═══ ADVERSARIAL / EDGE CASES ═══');

console.log('\n━━━ A. Zero and negative input ━━━');
await set('inq-qty',0);
ok('qty 0 does not produce NaN', !/NaN/.test(g('profit-ov')), 'OV='+g('profit-ov'));
await set('inq-qty',-5);
ok('negative qty does not produce NaN', !/NaN/.test(g('profit-ov')), 'OV='+g('profit-ov'));
await set('inq-qty',1);
await set('inq-bore',0);
ok('bore 0 does not produce NaN', !/NaN/.test(g('ss-mfg')), 'MFG='+g('ss-mfg'));
await set('inq-bore',-50);
ok('negative bore does not produce NaN', !/NaN/.test(g('ss-mfg')), 'MFG='+g('ss-mfg'));
await set('inq-bore',63);

console.log('\n━━━ B. Text in numeric fields ━━━');
const bEl=D.getElementById('inq-bore');
bEl.value='abc'; bEl.dispatchEvent(new w.Event('input',{bubbles:true})); await wait(400);
ok('text in bore does not produce NaN', !/NaN/.test(g('ss-mfg')), 'MFG='+g('ss-mfg'));
await set('inq-bore',63);

console.log('\n━━━ C. Extreme values ━━━');
await set('inq-stroke',100000);
ok('huge stroke stays finite', !/NaN|Infinity/.test(g('ss-mfg')), 'MFG='+g('ss-mfg'));
await set('inq-stroke',300);
await set('inq-qty',99999);
ok('huge qty stays finite', !/NaN|Infinity/.test(g('profit-ov')), 'OV='+g('profit-ov'));
await set('inq-qty',1);

console.log('\n━━━ D. Margin edge cases ━━━');
await set('profit-pct',0); await wait(300);
ok('0% margin: price = cost', num('profit-sp')===num('ss-mfg'), `${g('profit-sp')} vs ${g('ss-mfg')}`);
await set('profit-pct',100);
ok('100% margin does not break', !/NaN/.test(g('profit-sp')), g('profit-sp'));
await set('profit-pct',-10);
ok('negative margin handled', !/NaN/.test(g('profit-sp')), g('profit-sp'));
await set('profit-pct',20);

console.log('\n━━━ E. Every tab opens without error ━━━');
const before=errs.length;
for(const b of [...D.querySelectorAll('.ntab')]){ b.click(); await wait(150); }
ok('no errors from tab navigation', errs.length===before, (errs.length-before)+' new errors');

console.log('\n━━━ F. BOM row add / remove ━━━');
const bearBefore=D.querySelectorAll('#bear-rows tr').length;
w.addBearing(); await wait(200);
ok('add bearing row', D.querySelectorAll('#bear-rows tr').length===bearBefore+1);
const rm=D.querySelector('#bear-rows tr button');
if(rm){ rm.click(); await wait(300);
  ok('remove bearing row', D.querySelectorAll('#bear-rows tr').length===bearBefore);
  ok('BOM total recalculated after removal', !/NaN/.test(g('bom-grand')), g('bom-grand'));
} else wr('no remove button found on bearing row');

console.log('\n━━━ G. Quotation and PDF ━━━');
D.querySelector('.ntab[data-p="qte"]').click(); await wait(400);
ok('quotation table has rows', D.querySelectorAll('#q-rows tr').length>0,
   D.querySelectorAll('#q-rows tr').length+' rows');
try { w.generatePDF(); ok('generatePDF runs without throwing', true); }
catch(e){ ok('generatePDF runs without throwing', false, e.message); }

console.log('\n━━━ H. Theme toggle ━━━');
try {
  const t0=D.documentElement.getAttribute('data-theme');
  w.toggleTheme(); await wait(150);
  ok('theme toggles', D.documentElement.getAttribute('data-theme')!==t0,
     t0+' → '+D.documentElement.getAttribute('data-theme'));
  w.toggleTheme(); await wait(150);
} catch(e){ ok('theme toggles', false, e.message); }

console.log('\n━━━ I. Rapid input (debounce stress) ━━━');
for(let i=0;i<25;i++){
  const e=D.getElementById('inq-bore');
  e.value=60+i; e.dispatchEvent(new w.Event('input',{bubbles:true}));
}
await wait(800);
ok('survives 25 rapid changes', !/NaN/.test(g('ss-mfg')), 'MFG='+g('ss-mfg'));
ok('geometry still valid', num('t-rod')>num('t-id'), `OD ${g('t-rod')} > ID ${g('t-id')}`);

console.log('\n━━━ J. Console errors overall ━━━');
if(errs.length===0) ok('zero page errors throughout',true);
else { errs.slice(0,6).forEach(e=>console.log('    '+e)); ok('zero page errors throughout',false,errs.length+' errors'); }

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed, ${warn} warnings`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
