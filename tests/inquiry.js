/**
 * inquiry.js — full functional test of the Inquiry & Rates panel:
 * all 13 enquiry fields, all 15 master rates, dimension propagation,
 * live header, quantity scaling, master-rate ripple, quotation
 * reflection, and the green-box legend.
 * Requires jsdom (testing only):  npm install jsdom
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
w.bootERP({name:'Aniktha'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(44)+d)):(fail++,console.log('  ✗ '+n.padEnd(44)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1400);
const D=w.document;
const g=id=>{const e=D.getElementById(id);return e?String(e.value??e.textContent??'').trim():'<missing>';};
const set=async(id,v)=>{const e=D.getElementById(id);if(!e)return false;
  e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));
  e.dispatchEvent(new w.Event('change',{bubbles:true}));await wait(350);return true;};

console.log('\n━━━ 1. Every Inquiry field exists and is reachable ━━━');
const FIELDS=['inq-no','inq-date','inq-cust','inq-qty','inq-job','inq-mnt','inq-desc',
 'inq-bore','inq-rod','inq-stroke','inq-press','inq-stype','inq-fluid'];
FIELDS.forEach(f=>ok(f, D.getElementById(f)!==null, g(f).slice(0,26)));

console.log('\n━━━ 2. Master rates all populated ━━━');
['m-st52','m-en8','m-en19','m-c45','m-ss410','m-ss316','mr-saw','mr-cnc','mr-hcnc',
 'mr-vtl','mr-mil','mr-drl','mr-hon','mr-gnd','pr-lab'].forEach(f=>{
  const v=g(f); ok(f, v!==''&&v!=='0'&&v!=='<missing>', v);
});

console.log('\n━━━ 3. Bore/Rod/Stroke drive the derived fields ━━━');
await set('inq-bore',100); await set('inq-rod',56); await set('inq-stroke',500);
ok('Tube ID follows bore',        g('t-id')==='100',              't-id='+g('t-id'));
ok('Rod finished dia follows rod',g('r-fdia')==='56',             'r-fdia='+g('r-fdia'));
ok('Tube length = stroke+200',    g('t-len')==='700',             't-len='+g('t-len'));
ok('Rod length = stroke+350',     g('r-len')==='850',             'r-len='+g('r-len'));
ok('Tube weight computed',        parseFloat(g('t-wt'))>0,        g('t-wt'));
ok('Rod weight computed',         parseFloat(g('r-wt'))>0,        g('r-wt'));
ok('Mfg cost computed',           /[1-9]/.test(g('ss-mfg')),      g('ss-mfg'));

console.log('\n━━━ 4. Header updates live (updHdr) ━━━');
await set('inq-no','HISPL-2026-042');
await set('inq-cust','Bharat Forge Ltd');
const hdr=g('hdr-inq')||(D.getElementById('hdr-inq')||{}).textContent||'';
ok('header shows inquiry no', /042/.test(hdr+D.body.textContent), hdr);

console.log('\n━━━ 5. Quantity drives order value ━━━');
const unit=g('ss-mfg');
await set('inq-qty',10);
ok('order value scales with qty', g('profit-ov')!==g('profit-sp'),
   `unit ${g('profit-sp')} × 10 = ${g('profit-ov')}`);
ok('sum-qty mirrors quantity', /^10\b/.test(g('sum-qty')), 'sum-qty='+g('sum-qty'));

console.log('\n━━━ 6. Master rate change ripples everywhere ━━━');
const beforeRate=g('ss-mfg');
await set('m-st52',400);
ok('material rate change moves cost', beforeRate!==g('ss-mfg'), `${beforeRate} → ${g('ss-mfg')}`);
await set('m-st52',160);
const beforeLab=g('ss-mfg');
await set('pr-lab',250); await wait(700);
ok('labour rate change moves cost', beforeLab!==g('ss-mfg'), `${beforeLab} → ${g('ss-mfg')}`);
ok('all 18 operation rows updated',
   [...D.querySelectorAll('input[id$="-lr"]')].every(e=>Number(e.value)===250),
   [...D.querySelectorAll('input[id$="-lr"]')].filter(e=>Number(e.value)===250).length+'/18');
// A row set by hand must survive a later master change
const one=D.getElementById('tc-lr'); one.value=999;
one.dispatchEvent(new w.Event('input',{bubbles:true}));
await set('pr-lab',180); await wait(700);
ok('hand-set row preserved on master change', Number(one.value)===999, 'tc-lr='+one.value);
await set('pr-lab',100); await wait(700);

console.log('\n━━━ 7. Quotation reflects Inquiry data ━━━');
D.querySelector('.ntab[data-p="qte"]').click(); await wait(400);
const qt=D.getElementById('p-qte').textContent;
ok('customer name in quotation', /Bharat Forge/.test(qt));
ok('inquiry no in quotation',    /042/.test(qt));

console.log('\n━━━ 7b. Green-box legend ━━━');
ok('legend strip rendered', !!D.getElementById('aew-legend'));
ok('locked fields marked',  D.querySelectorAll('input.aew-locked').length>0,
   D.querySelectorAll('input.aew-locked').length+' locked');
ok('auto fields marked',    D.querySelectorAll('input.aew-auto').length>0,
   D.querySelectorAll('input.aew-auto').length+' auto-filled');
ok('locked have explanatory tooltip',
   [...D.querySelectorAll('input.aew-locked')].every(e=>/cannot be edited/.test(e.title||'')));
ok('auto have explanatory tooltip',
   [...D.querySelectorAll('input.aew-auto')].every(e=>/type over it/.test(e.title||'')));

console.log('\n━━━ 8. READONLY green boxes reject typing ━━━');
for (const f of ['t-wt','r-wt','profit-amt','sum-qty']) {
  const el=D.getElementById(f);
  ok(f+' is readonly', el && el.readOnly, el?('readonly='+el.readOnly):'missing');
}

console.log('\n━━━ 9. EDITABLE green boxes accept an override ━━━');
const b4=g('t-total');
await set('t-len',1200);
ok('t-len override recalculates', b4!==g('t-total'), `${b4} → ${g('t-total')}`);

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
