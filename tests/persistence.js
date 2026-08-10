/**
 * persistence.js — Save and History in the ERP.
 *
 * Verifies the costing snapshot is collected correctly, that saving
 * degrades gracefully when no backend is configured, and that reopening
 * a saved costing restores the sheet.
 * Requires jsdom (testing only):  npm install jsdom
 */
const fs=require('fs'), path=require('path');
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); }
catch(e){ console.log('\n  jsdom not installed — skipping.\n'); process.exit(0); }
const ROOT=path.join(__dirname,'..');

let html=fs.readFileSync(ROOT+'/products/costing/index.html','utf8');
html=html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
  (m,p)=>'<script>'+fs.readFileSync(path.join(ROOT,'products/costing',p),'utf8')+'</script>');
html=html.replace(/<script src="https:\/\/[^"]*"><\/script>/g,'');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,
  virtualConsole:new VirtualConsole(),url:'http://x/'});
const w=dom.window;
w.Chart=function(){return{destroy(){},update(){}};};
const pdfStub=new Proxy({internal:{pageSize:{getWidth:()=>210,getHeight:()=>297}},
  lastAutoTable:{finalY:100}},{get(t,k){return (k in t)?t[k]:()=>pdfStub;}});
w.jspdf={jsPDF:function(){return pdfStub;}};
w.AbortController=w.AbortController||function(){return{signal:{},abort(){}};};
w.bootERP({name:'Aniktha'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(46)+d)):(fail++,console.log('  ✗ '+n.padEnd(46)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1600);
const D=w.document;
const g=id=>{const e=D.getElementById(id);return e?String(e.value??e.textContent??'').trim():'';};

console.log('\n━━━ UI installed ━━━');
ok('Save button present',   !!D.getElementById('aew-save-btn'));
ok('History button present',!!D.getElementById('aew-hist-btn'));
ok('State chip present',    !!D.getElementById('aew-save-state'),
   g('aew-save-state')||D.getElementById('aew-save-state').textContent);
ok('api client exposed',    typeof w.AEW.api.saveQuotation==='function');

console.log('\n━━━ Snapshot collection ━━━');
const body=w.collectCosting();
ok('inquiry number captured', !!body.inquiry_no, body.inquiry_no);
ok('customer captured',       !!body.customer,   body.customer);
ok('bore captured',           body.bore>0,       String(body.bore));
ok('rod captured',            body.rod>0,        String(body.rod));
ok('stroke captured',         body.stroke>0,     String(body.stroke));
ok('cost captured',           body.total_cost>0, String(body.total_cost));
ok('order value captured',    body.order_value>0,String(body.order_value));
ok('rod smaller than bore',   body.rod<body.bore,`${body.rod} < ${body.bore}`);
ok('snapshot has many fields',Object.keys(body.payload).length>50,
   Object.keys(body.payload).length+' fields');
ok('dynamic rows captured',   !!body.payload._rows,
   Object.keys(body.payload._rows||{}).join(', '));

console.log('\n━━━ Validation before sending ━━━');
ok('valid costing passes',    w.costingProblems(body).length===0);
ok('rejects rod >= bore',     w.costingProblems({...body,rod:999}).length>0);
ok('rejects zero bore',       w.costingProblems({...body,bore:0}).length>0);
ok('rejects uncalculated',    w.costingProblems({...body,total_cost:0}).length>0);

console.log('\n━━━ Degraded mode (no backend configured) ━━━');
ok('isConfigured false by default', w.AEW.api.isConfigured()===false);
const r=await w.AEW.api.saveQuotation(body);
ok('save resolves, never rejects', r && r.ok===false);
ok('flagged offline',              r.offline===true);
ok('message explains, not alarms', /not configured/i.test(r.error), r.error.slice(0,44)+'…');

console.log('\n━━━ ERP keeps working without a backend ━━━');
const before=g('ss-mfg');
const bore=D.getElementById('inq-bore');
bore.value=125; bore.dispatchEvent(new w.Event('input',{bubbles:true}));
await wait(400);
ok('costing still recalculates', before!==g('ss-mfg'), `${before} → ${g('ss-mfg')}`);

console.log('\n━━━ Save button is safe to press offline ━━━');
try { D.getElementById('aew-save-btn').click(); await wait(300); ok('click does not throw',true); }
catch(e){ ok('click does not throw',false,e.message); }
ok('toast shown to user', !!D.getElementById('aew-toast'),
   (D.getElementById('aew-toast')||{}).textContent);

console.log('\n━━━ Reopening restores the sheet ━━━');
const saved=JSON.parse(JSON.stringify(body.payload));
w.AEW.api.getQuotation=()=>Promise.resolve({ok:true,data:{id:'x',inquiry_no:'HISPL-TEST',payload:saved}});
D.getElementById('inq-cust').value='WIPED';
D.getElementById('inq-bore').value=999;
await w.reopenCosting('x'); await wait(500);
ok('customer restored', g('inq-cust')===body.customer, g('inq-cust'));
ok('bore restored',     Number(g('inq-bore'))===body.bore, g('inq-bore'));
ok('state shows Saved', /saved/i.test(D.getElementById('aew-save-state').textContent));

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
