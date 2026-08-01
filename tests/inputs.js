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
  virtualConsole:new VirtualConsole(),url:'http://127.0.0.1:5500/products/costing/index.html'});
const w=dom.window;
w.Chart=function(){return{destroy(){},update(){}};};
w.jspdf={jsPDF:function(){return{text(){},save(){},autoTable(){},internal:{pageSize:{}}};}};
w.bootERP({name:'Aniktha'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(38)+d)):(fail++,console.log('  ✗ '+n.padEnd(38)+d));};

setTimeout(async ()=>{
  const D=w.document;
  D.querySelectorAll('.ntab').forEach(b=>b.click());
  const txt=id=>{const e=D.getElementById(id);return e?(e.value||e.textContent||'').trim():'';};

  /* Type into a field the way a user does, then read a downstream total. */
  function typeInto(id, val, watch){
    const el=D.getElementById(id);
    if(!el) return {ok:false, why:'field missing'};
    const before=txt(watch);
    el.value=val;
    el.dispatchEvent(new w.Event('input',{bubbles:true}));
    el.dispatchEvent(new w.Event('change',{bubbles:true}));
    const after=txt(watch);
    return {ok:before!==after, before, after};
  }

  console.log('\n━━━ INQUIRY — the three driving dimensions ━━━');
  [['inq-bore',100,'ss-mfg'],['inq-rod',70,'ss-mfg'],['inq-stroke',800,'ss-mfg'],
   ['inq-qty',25,'profit-ov']].forEach(([id,v,watch])=>{
    const r=typeInto(id,v,watch);
    ok(`${id} = ${v}`, r.ok, `${r.before} → ${r.after}`);
  });

  console.log('\n━━━ TUBE — material, dimensions, process ━━━');
  [['t-rod',110,'t-total'],['t-fod',105,'t-total'],['t-id',120,'t-total'],
   ['t-len',1400,'t-total'],['td-hd',25,'t-total'],['td-hn',8,'t-total'],
   ['tc-lh',1.5,'t-total'],['tpw-d',10,'t-total']].forEach(([id,v,watch])=>{
    const r=typeInto(id,v,watch);
    ok(`${id} = ${v}`, r.ok, `${r.before} → ${r.after}`);
  });

  console.log('\n━━━ PISTON ROD ━━━');
  [['r-fdia',85,'r-total'],['r-len',1500,'r-total'],['rht-lh',1,'r-total'],
   ['rch-lh',2,'r-total']].forEach(([id,v,watch])=>{
    const r=typeInto(id,v,watch);
    ok(`${id} = ${v}`, r.ok, `${r.before} → ${r.after}`);
  });

  console.log('\n━━━ COMPONENTS (CEC / HEC / Gland / Misc) ━━━');
  ['cec-mat','hec-proc','gland-lab','piston-mat','cbush-proc'].forEach(id=>{
    const r=typeInto(id,999,'ss-mfg');
    ok(`${id} = 999`, r.ok, `${r.before} → ${r.after}`);
  });

  console.log('\n━━━ BILL OF MATERIALS — bearing / seal / other rate ━━━');
  ['bear-rows','seal-rows','bom-rows'].forEach(tb=>{
    const row=D.querySelector('#'+tb+' tr');
    if(!row){ ok(tb,false,'no rows'); return; }
    const nums=row.querySelectorAll('input[type="number"]');
    const rate=nums[nums.length-1];
    const before=txt('bom-grand');
    rate.value=1500;
    rate.dispatchEvent(new w.Event('input',{bubbles:true}));
    ok(`${tb} rate = 1500`, before!==txt('bom-grand'), `${before} → ${txt('bom-grand')}`);
  });

  console.log('\n━━━ ASSEMBLY & PACKING ━━━');
  [['asm-h',12,'ss-mfg'],['asm-lr',250,'ss-mfg'],['test-h',3,'ss-mfg'],
   ['trans-in',900,'trans-tot'],['trans-out',700,'trans-tot'],
   ].forEach(([id,v,watch])=>{
    const r=typeInto(id,v,watch);
    ok(`${id} = ${v}`, r.ok, `${r.before} → ${r.after}`);
  });

  console.log('\n━━━ PACKING — custom mode ━━━');
  {
    const sel=D.getElementById('pack-type');
    if(sel){
      sel.value='custom';
      sel.dispatchEvent(new w.Event('change',{bubbles:true}));
      const r=typeInto('pack-cust',400,'pack-c');
      ok('pack-cust = 400 (Custom mode)', r.ok, `${r.before} → ${r.after}`);
    } else ok('pack-t selector', false, 'missing');
  }

  console.log('\n━━━ COST SUMMARY — margin ━━━');
  {
    const r=typeInto('profit-pct',35,'profit-sp');
    ok('profit-pct = 35', r.ok, `${r.before} → ${r.after}`);
  }

  console.log('\n━━━ DROPDOWNS ━━━');
  /* Earlier steps fired many inputs synchronously, so the debounced
     geometry auto-fix only saw the last one and the tube is left in an
     invalid state (bore > OD). Restore a valid geometry first — this
     section is testing the material dropdown, not the geometry guard,
     which bores.js covers on its own. */
  const rawEl=D.getElementById('t-rod');
  rawEl.value=w.deriveTubeOD(Number(D.getElementById('t-id').value)||63);
  D.getElementById('t-fod').value=Number(rawEl.value)-5;
  rawEl.dispatchEvent(new w.Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,400));
  [['t-mat','t-mc'],['r-mat','r-mc']].forEach(([id,watch])=>{
    const sel=D.getElementById(id);
    if(!sel||sel.options.length<2){ ok(id,false,'no options'); return; }
    const before=txt(watch);
    sel.selectedIndex=sel.options.length-1;
    sel.dispatchEvent(new w.Event('change',{bubbles:true}));
    ok(`${id} → "${sel.value}"`, before!==txt(watch), `${before} → ${txt(watch)}`);
  });

  console.log('\n━━━ Final state after all custom input ━━━');
  [['t-wt','Tube weight'],['r-wt','Rod weight'],['t-total','Tube'],['r-total','Rod'],
   ['bom-grand','BOM'],['ss-mfg','MFG COST'],['profit-sp','SELLING PRICE'],
   ['profit-ov','ORDER VALUE (25 pcs)']].forEach(([id,l])=>
    console.log(`     ${l.padEnd(22)} ${txt(id)}`));

  console.log('\n═══════════════════════════════════');
  console.log(`  ${pass} passed, ${fail} failed`);
  console.log('═══════════════════════════════════');
  process.exit(fail?1:0);
},1600);
