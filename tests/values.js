/**
 * values.js — verifies the ERP produces real figures on load, that every
 * field remains user-editable, and that seeding never overwrites input.
 * Requires jsdom (testing only):  npm install jsdom
 */
const fs=require('fs'), path=require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) {
  console.log('\n  jsdom not installed — skipping. Run: npm install jsdom\n');
  process.exit(0);
}
const ROOT=path.join(__dirname,'..');
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
w.bootERP({name:'Aniktha Patirat',avatar:'A'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n+(d?'  '+d:''))):(fail++,console.log('  ✗ '+n+'  '+d));};

setTimeout(()=>{
  const D=w.document;
  const tx=id=>{const e=D.getElementById(id);return e?e.textContent.trim():'<missing>';};
  const num=id=>Number(String(tx(id)).replace(/[^0-9.]/g,''))||0;

  console.log('\n━━━ Component costs (were all ₹0) ━━━');
  [['ss-cec','CEC'],['ss-hec','HEC'],['ss-gland','Gland'],['ss-cbush','Cushion Bush']]
    .forEach(([id,label])=>ok(label.padEnd(14)+'non-zero', num(id)>0, tx(id)));

  console.log('\n━━━ Bought-out items (were all ₹0) ━━━');
  [['bear-tot','Bearings'],['seal-tot','Seals'],['other-tot','Other BOM']]
    .forEach(([id,label])=>ok(label.padEnd(14)+'non-zero', num(id)>0, tx(id)));

  console.log('\n━━━ Machining (already worked) ━━━');
  ok('Tube total     non-zero', num('t-total')>0, tx('t-total'));
  ok('Rod total      non-zero', num('r-total')>0, tx('r-total'));

  console.log('\n━━━ Full summary panel ━━━');
  const sum=D.getElementById('p-sum');
  const rows=[...sum.querySelectorAll('[id]')].filter(e=>/^(ss-|sf-|st-|sg-|gt-|tot)/.test(e.id));
  let z=0;
  rows.forEach(e=>{
    const v=e.textContent.trim();
    const isZero=/^(₹\s*)?0(\.0+)?$/.test(v);
    if(isZero) z++;
    console.log(`  ${isZero?'✗':'✓'} ${e.id.padEnd(14)} ${v.slice(0,20)}`);
  });
  ok('summary has no remaining zeros', z===0, z+' still zero');

  console.log('\n━━━ CUSTOM INPUT — user edits must be honoured ━━━');
  const cec=D.getElementById('cec-mat');
  const before=num('ss-cec');
  cec.value=5000;
  cec.dispatchEvent(new w.Event('input',{bubbles:true}));
  const after=num('ss-cec');
  ok('editing a field changes the total', after>before, `${before} → ${after}`);

  console.log('\n━━━ Seeding must NOT overwrite a user value ━━━');
  w.AEW.erp.reseed();
  ok('user value 5000 preserved after reseed', Number(cec.value)===5000, 'value='+cec.value);

  console.log('\n━━━ clearRates() for quoting from scratch ━━━');
  w.AEW.erp.clearRates();
  ok('all component fields zeroed', num('ss-cec')===0, tx('ss-cec'));
  w.AEW.erp.reseed();
  ok('reseed restores values', num('ss-cec')>0, tx('ss-cec'));

  console.log('\n━━━ Quotation renders with real figures ━━━');
  D.querySelector('.ntab[data-p="qte"]').click();
  const qrows=D.getElementById('q-rows');
  ok('quotation table populated', qrows && qrows.children.length>0,
     (qrows?qrows.children.length:0)+' rows');

  console.log('\n═══════════════════════════════════');
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('═══════════════════════════════════');
  process.exit(fail?1:0);
},500);
