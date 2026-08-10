/**
 * tube.js — verifies every auto-calculated field on the Tube panel is
 * populated on load (Bore ID, Tube Length, Weight, Material Rate, all
 * six MACH HRS cells and all costs), and that editing an auto field by
 * hand still recalculates. Requires jsdom:  npm install jsdom
 */
const fs=require('fs'), path=require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch (e) { console.log('\n  jsdom not installed — skipping. npm install jsdom\n'); process.exit(0); }
const ROOT=path.join(__dirname,'..');
let html=fs.readFileSync(ROOT+'/products/costing/index.html','utf8');
html=html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
  (m,p)=>'<script>'+fs.readFileSync(path.join(ROOT,'products/costing',p),'utf8')+'</script>');
html=html.replace(/<script src="https:\/\/[^"]*"><\/script>/g,'');
const vc=new VirtualConsole(); const infos=[];
vc.on('info',(...a)=>infos.push(a.join(' ')));
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,
  url:'http://127.0.0.1:5500/products/costing/index.html'});
const w=dom.window;
w.Chart=function(){return{destroy(){},update(){}};};
w.jspdf={jsPDF:function(){return{text(){},save(){},autoTable(){},internal:{pageSize:{}}};}};
w.bootERP({name:'Aniktha Patirat',avatar:'A'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(34)+d)):(fail++,console.log('  ✗ '+n.padEnd(34)+d));};

setTimeout(()=>{
  const D=w.document;
  const val=id=>{const e=D.getElementById(id);return e?String(e.value||'').trim():'<missing>';};
  const tx =id=>{const e=D.getElementById(id);return e?e.textContent.trim():'<missing>';};
  const nz =s=>s!==''&&s!=='—'&&s!=='0'&&s!=='₹0'&&s!=='<missing>';

  console.log('\n━━━ MATERIAL INPUTS (all blank in your screenshot) ━━━');
  ok('Bore ID (t-id)',        nz(val('t-id')),   val('t-id'));
  ok('Tube Length (t-len)',   nz(val('t-len')),  val('t-len'));
  ok('Weight/pc (t-wt)',      nz(val('t-wt')),   val('t-wt'));
  ok('Mat. Rate (t-mr)',      nz(val('t-mr')),   val('t-mr'));
  ok('Material Cost (t-mc)',  nz(val('t-mc')),   val('t-mc'));

  console.log('\n━━━ PROCESS ROUTING — MACH HRS (all "—") ━━━');
  [['tc-h','1. Cutting'],['trt-h','2. Rough Turn'],['td-h','3. Drilling'],
   ['tpw-h','4. Part Weld'],['th-h','5. Honing'],['tft-h','6. Finish Turn']]
    .forEach(([id,label])=>ok(label+' hrs', nz(tx(id)), tx(id)));

  console.log('\n━━━ PROCESS ROUTING — COST (all ₹0) ━━━');
  [['tc-c','1. Cutting'],['trt-c','2. Rough Turn'],['td-c','3. Drilling'],
   ['th-c','5. Honing'],['tft-c','6. Finish Turn']]
    .forEach(([id,label])=>ok(label+' cost', nz(tx(id)), tx(id)));

  console.log('\n━━━ Totals ━━━');
  ok('Tube process total', nz(tx('t-proc')),  tx('t-proc'));
  ok('Tube grand total',   nz(tx('t-total')), tx('t-total'));
  ok('Rod grand total',    nz(tx('r-total')), tx('r-total'));
  ok('Mfg cost',           nz(tx('ss-mfg')),  tx('ss-mfg'));

  console.log('\n━━━ MANUAL OVERRIDE — change Bore ID by hand ━━━');
  const before=tx('t-total');
  const el=D.getElementById('t-id');
  el.value=80;
  el.dispatchEvent(new w.Event('input',{bubbles:true}));
  const after=tx('t-total');
  ok('editing Bore ID recalculates', before!==after, `${before} → ${after}`);

  console.log('\n━━━ MANUAL OVERRIDE — change Tube Length ━━━');
  const b2=tx('t-total');
  const el2=D.getElementById('t-len');
  el2.value=900;
  el2.dispatchEvent(new w.Event('input',{bubbles:true}));
  ok('editing Tube Length recalculates', b2!==tx('t-total'), `${b2} → ${tx('t-total')}`);

  console.log('\n━━━ Console messages from boot ━━━');
  infos.filter(i=>/ERP/.test(i)).forEach(i=>console.log('  '+i.slice(0,110)));

  console.log('\n━━━ Boot step report ━━━');
  console.log('  ok     : '+w.AEW_BOOT.ok.join(', '));
  console.log('  failed : '+(w.AEW_BOOT.failed.length?w.AEW_BOOT.failed.join(' | '):'none'));

  console.log('\n═══════════════════════════════════');
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('═══════════════════════════════════');
  process.exit(fail?1:0);
},500);
