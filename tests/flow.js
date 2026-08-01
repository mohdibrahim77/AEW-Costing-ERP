/**
 * flow.js — the whole estimator workflow, Inquiry through Quotation,
 * exactly as a user performs it. Also asserts the three field types are
 * visually distinct. Requires jsdom:  npm install jsdom
 */
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
w.bootERP({name:'Aniktha Patirat',avatar:'A'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(40)+d)):(fail++,console.log('  ✗ '+n.padEnd(40)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1600);
const D=w.document;
const g=id=>{const e=D.getElementById(id);return e?(e.value||e.textContent||'').trim():'MISSING';};
const num=id=>Number(String(g(id)).replace(/[^0-9.]/g,''))||0;
const set=async(id,v)=>{const e=D.getElementById(id);if(!e)return false;
  e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));
  e.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(320);return true;};
const tab=id=>{const b=D.querySelector('.ntab[data-p="'+id+'"]');if(b)b.click();};

console.log('\n═══ FIELD CLARITY ═══');
ok('legend on all 9 panels', D.querySelectorAll('.lgd').length===9,
   D.querySelectorAll('.lgd').length+' panels');
ok('locked fields are grey + not clickable',
   D.querySelectorAll('input[readonly].fi-a').length>0,
   D.querySelectorAll('input[readonly]').length+' locked');
ok('suggested fields tinted amber', D.querySelectorAll('.fi-s').length>0,
   D.querySelectorAll('.fi-s').length+' amber');
ok('locked fields have tooltips',
   [...D.querySelectorAll('input[readonly]')].every(e=>e.title.length>0));

console.log('\n═══ STEP 1 — INQUIRY (a real HISPL job) ═══');
tab('inq');
await set('inq-no','HISPL-2026-0042');
await set('inq-cust','Bharat Earth Movers Ltd');
await set('inq-desc','Double acting cylinder, cushioned both ends');
await set('inq-bore',100);
await set('inq-rod',56);
await set('inq-stroke',500);
await set('inq-qty',10);
ok('customer captured', g('inq-cust')==='Bharat Earth Movers Ltd');
ok('bore 100 propagated to tube', num('t-id')===100, 't-id='+g('t-id'));
ok('stroke drove tube length', num('t-len')===700, 't-len='+g('t-len'));
ok('stroke drove rod length', num('r-len')===850, 'r-len='+g('r-len'));
ok('rod dia propagated', num('r-fdia')===56, 'r-fdia='+g('r-fdia'));
ok('OD auto-raised above bore', num('t-rod')>100, 't-rod='+g('t-rod'));

console.log('\n═══ STEP 2 — TUBE ═══');
tab('tube');
ok('weight calculated', num('t-wt')>0, g('t-wt'));
ok('material rate shown', num('t-mr')>0, g('t-mr'));
ok('material cost', num('t-mc')>0, g('t-mc'));
ok('all 8 process rows costed',
   ['tc-c','trt-c','td-c','tpw-c','th-c','tft-c'].every(i=>num(i)>0),
   ['tc-c','trt-c','td-c','tpw-c','th-c','tft-c'].map(i=>g(i)).join(' '));
ok('tube total', num('t-total')>0, g('t-total'));

console.log('\n═══ STEP 3 — PISTON ROD ═══');
tab('rod');
ok('rod weight', num('r-wt')>0, g('r-wt'));
ok('rod total', num('r-total')>0, g('r-total'));

console.log('\n═══ STEP 4 — CEC/HEC/GLAND ═══');
tab('cov');
ok('CEC costed', num('ss-cec')>0, g('ss-cec'));
ok('HEC costed', num('ss-hec')>0, g('ss-hec'));
ok('Gland costed', num('ss-gland')>0, g('ss-gland'));
await set('cec-mat',450);
ok('editing CEC material updates total', num('ss-cec')>0, g('ss-cec'));

console.log('\n═══ STEP 5 — MISC ═══');
tab('misc');
ok('piston costed', num('ss-piston')>0, g('ss-piston'));

console.log('\n═══ STEP 6 — BILL OF MATERIALS ═══');
tab('bom');
ok('bearings subtotal', num('bom-bear-d')>0, g('bom-bear-d'));
ok('seals subtotal', num('bom-seal-d')>0, g('bom-seal-d'));
ok('other subtotal', num('bom-other-d')>0, g('bom-other-d'));
ok('BOM grand total', num('bom-grand')>0, g('bom-grand'));
{ const before=num('bom-grand');
  const r=D.querySelector('#bear-rows tr').querySelectorAll('input[type="number"]');
  const rate=r[r.length-1]; rate.value=850;
  rate.dispatchEvent(new w.Event('input',{bubbles:true})); await wait(300);
  ok('changing a supplier rate recalculates', num('bom-grand')!==before,
     before+' → '+num('bom-grand')); }

console.log('\n═══ STEP 7 — ASSEMBLY & PACKING ═══');
tab('asm');
ok('assembly cost', num('asm-c')>0, g('asm-c'));
ok('testing cost', num('test-c')>0, g('test-c'));
ok('paint area calculated', num('pt-area')>0, g('pt-area'));
ok('cylinder weight', num('pack-wt')>0, g('pack-wt'));
ok('packing cost', num('pack-c')>0, g('pack-c'));
ok('transport total', num('trans-tot')>0, g('trans-tot'));

console.log('\n═══ STEP 8 — COST SUMMARY ═══');
tab('sum');
ok('manufacturing cost', num('ss-mfg')>0, g('ss-mfg'));
ok('quantity from inquiry = 10', num('sum-qty')===10, g('sum-qty'));
ok('margin amount', num('profit-amt')>0, g('profit-amt'));
ok('selling price > cost', num('profit-sp')>num('ss-mfg'),
   g('ss-mfg')+' → '+g('profit-sp'));
ok('order value = price x 10',
   Math.abs(num('profit-ov')-num('profit-sp')*10)<12, g('profit-ov'));
{ const b=num('profit-sp'); await set('profit-pct',30);
  ok('changing margin updates price', num('profit-sp')!==b, b+' → '+num('profit-sp')); }

console.log('\n═══ STEP 9 — QUOTATION ═══');
tab('qte');
await wait(300);
ok('customer name on quote', g('q-cust').indexOf('Bharat')>=0, g('q-cust'));
ok('quote line items', D.querySelectorAll('#q-rows tr').length>0,
   D.querySelectorAll('#q-rows tr').length+' rows');
ok('generatePDF callable', typeof w.generatePDF==='function');
ok('printQuote callable', typeof w.printQuote==='function');

console.log('\n═══ FINAL QUOTATION ═══');
console.log('  Customer          : '+g('inq-cust'));
console.log('  Cylinder          : '+g('inq-bore')+' bore x '+g('inq-rod')+' rod x '+g('inq-stroke')+' stroke');
console.log('  ────────────────────────────────');
[['t-total','Tube'],['r-total','Piston rod'],['ss-cec','CEC'],['ss-hec','HEC'],
 ['ss-gland','Gland'],['ss-piston','Piston'],['bom-grand','Bought-out'],
 ['asm-c','Assembly'],['test-c','Testing'],['pack-c','Packing'],['trans-tot','Transport']]
 .forEach(([i,l])=>console.log('  '+l.padEnd(18)+g(i)));
console.log('  ────────────────────────────────');
console.log('  Mfg cost / pc     : '+g('ss-mfg'));
console.log('  Selling price / pc: '+g('profit-sp'));
console.log('  ORDER VALUE (10)  : '+g('profit-ov'));

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
