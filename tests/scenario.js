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
const stub=new Proxy({internal:{pageSize:{getWidth:()=>210,getHeight:()=>297}},lastAutoTable:{finalY:100}},
  {get(t,k){return (k in t)?t[k]:()=>stub;}});
w.jspdf={jsPDF:function(){return stub;}};
w.bootERP({name:'Aniktha Patirat',avatar:'A'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(44)+d)):(fail++,console.log('  ✗ '+n.padEnd(44)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1500);
const D=w.document;
const g=id=>{const e=D.getElementById(id);return e?String(e.value??e.textContent??'').trim():'<missing>';};
const num=id=>Number(g(id).replace(/[^0-9.-]/g,''))||0;
const set=async(id,v)=>{const e=D.getElementById(id);if(!e)return;
  e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));
  e.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(400);};

console.log('\n═══ REAL ENQUIRY: the demo you will run ═══');
console.log('\n  "Quote 10 double-acting cylinders,');
console.log('   100 mm bore x 56 mm rod x 500 mm stroke, 210 bar"\n');

console.log('━━━ Step 1 — enter the enquiry ━━━');
await set('inq-no','HISPL-2026-118');
await set('inq-cust','Bharat Forge Ltd, Pune');
await set('inq-desc','Double Acting Cylinder with Cushioning');
await set('inq-qty',10);
await set('inq-press',210);
ok('customer recorded', g('inq-cust').includes('Bharat Forge'));
ok('quantity recorded', g('inq-qty')==='10');

console.log('\n━━━ Step 2 — the three dimensions ━━━');
await set('inq-bore',100);
await set('inq-rod',56);
await set('inq-stroke',500);
ok('tube ID follows bore',   g('t-id')==='100',  't-id='+g('t-id'));
ok('rod dia follows rod',    g('r-fdia')==='56', 'r-fdia='+g('r-fdia'));
ok('tube length stroke+200', g('t-len')==='700', 't-len='+g('t-len'));
ok('rod length stroke+350',  g('r-len')==='850', 'r-len='+g('r-len'));
ok('raw OD auto-raised',     num('t-rod')>100,   'OD='+g('t-rod'));

console.log('\n━━━ Step 3 — everything costs out ━━━');
const rows=[['t-wt','Tube weight'],['t-mc','Tube material'],['t-proc','Tube machining'],
 ['t-total','TUBE'],['r-wt','Rod weight'],['r-total','ROD'],['bom-grand','BOM'],
 ['ss-cec','CEC'],['ss-hec','HEC'],['ss-gland','Gland'],['asm-c','Assembly'],
 ['pack-c','Packing'],['trans-tot','Transport'],['ss-mfg','MFG COST/pc']];
rows.forEach(([id,l])=>{
  const v=g(id);
  ok(l, v!=='' && v!=='0' && v!=='₹0' && !/NaN/.test(v), v);
});

console.log('\n━━━ Step 4 — commercial figures ━━━');
await set('profit-pct',22);
console.log(`      Manufacturing cost : ${g('ss-mfg')} / cylinder`);
console.log(`      Margin @ 22%       : ${g('profit-amt')}`);
console.log(`      Selling price      : ${g('profit-sp')} / cylinder`);
console.log(`      ORDER VALUE (10)   : ${g('profit-ov')}`);
ok('margin is 22% of cost',
   Math.abs(num('profit-amt') - num('ss-mfg')*0.22) < 5,
   `${g('profit-amt')} vs expected ₹${Math.round(num('ss-mfg')*0.22)}`);
ok('price = cost + margin',
   Math.abs(num('profit-sp') - (num('ss-mfg')+num('profit-amt'))) < 2);
ok('order value = price × 10',
   Math.abs(num('profit-ov') - num('profit-sp')*10) < 10);

console.log('\n━━━ Step 5 — the quotation ━━━');
D.querySelector('.ntab[data-p="qte"]').click(); await wait(500);
const q=D.getElementById('p-qte').textContent;
ok('customer on quotation',  /Bharat Forge/.test(q));
ok('enquiry no on quotation',/118/.test(q));
ok('line items present',     D.querySelectorAll('#q-rows tr').length>0,
   D.querySelectorAll('#q-rows tr').length+' rows');
ok('order value on quotation', new RegExp(g('profit-ov').replace(/[₹,]/g,'')).test(q.replace(/[₹,]/g,'')));

console.log('\n━━━ Step 6 — estimator overrides a rate ━━━');
const b4=g('ss-mfg');
await set('cec-mat',450);
ok('manual override changes cost', b4!==g('ss-mfg'), `${b4} → ${g('ss-mfg')}`);

console.log('\n━━━ Step 7 — master labour rate ━━━');
const b5=g('ss-mfg');
await set('pr-lab',140); await wait(700);
ok('master rate updates all sheets', b5!==g('ss-mfg'), `${b5} → ${g('ss-mfg')}`);
ok('all 18 operations updated',
   [...D.querySelectorAll('input[id$="-lr"]')].filter(e=>Number(e.value)===140).length===18,
   [...D.querySelectorAll('input[id$="-lr"]')].filter(e=>Number(e.value)===140).length+'/18');

console.log('\n━━━ Step 8 — PDF export ━━━');
try { w.generatePDF(); ok('PDF generates',true); }
catch(e){ ok('PDF generates',false,e.message); }

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
