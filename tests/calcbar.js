/**
 * calcbar.js — the Calculate bar on every panel.
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
const pdf=new Proxy({internal:{pageSize:{getWidth:()=>210,getHeight:()=>297}},lastAutoTable:{finalY:100}},
  {get(t,k){return (k in t)?t[k]:()=>pdf;}});
w.jspdf={jsPDF:function(){return pdf;}};
w.bootERP({name:'Aniktha'});

let pass=0,fail=0;
const ok=(n,c,d='')=>{c?(pass++,console.log('  ✓ '+n.padEnd(44)+d)):(fail++,console.log('  ✗ '+n.padEnd(44)+d));};
const wait=ms=>new Promise(r=>setTimeout(r,ms));

(async()=>{
await wait(1600);
const D=w.document;
const PANELS=['p-inq','p-tube','p-rod','p-cov','p-misc','p-bom','p-asm','p-sum','p-qte'];
const NAMES ={'p-inq':'Inquiry','p-tube':'Tube','p-rod':'Piston Rod','p-cov':'CEC/HEC/Gland',
              'p-misc':'Misc','p-bom':'Bill of Materials','p-asm':'Assembly','p-sum':'Cost Summary','p-qte':'Quotation'};
const txt=sel=>{const e=D.querySelector(sel);return e?e.textContent.trim():'';};
const blank=v=>!v||v==='—'||/^₹?0$/.test(v);

console.log('\n━━━ A bar on every panel ━━━');
PANELS.forEach(p=>ok(NAMES[p], !!D.querySelector('#'+p+' .aew-calc-bar')));

console.log('\n━━━ Each bar has a button and four figures ━━━');
PANELS.forEach(p=>{
  const btn=D.querySelector('#'+p+' .aew-calc-btn');
  const cells=D.querySelectorAll('#'+p+' .aew-calc-figures > div').length;
  ok(NAMES[p]+' complete', !!btn && btn.textContent==='Calculate' && cells===4,
     cells+' figures');
});

console.log('\n━━━ Figures are populated, not blank ━━━');
PANELS.forEach(p=>{
  const own=txt('#'+p+' .aew-calc-own'), mfg=txt('#'+p+' .aew-calc-mfg'),
        ord=txt('#'+p+' .aew-calc-order');
  ok(NAMES[p], !blank(own)&&!blank(mfg)&&!blank(ord), `${own} · ${mfg} · ${ord}`);
});

console.log('\n━━━ Clicking Calculate works on every panel ━━━');
for(const p of PANELS){
  const btn=D.querySelector('#'+p+' .aew-calc-btn');
  try{ btn.click(); await wait(120);
    ok(NAMES[p]+' click', btn.textContent==='Calculate' && !btn.disabled);
  }catch(e){ ok(NAMES[p]+' click', false, e.message); }
}

console.log('\n━━━ Calculate picks up a manual edit ━━━');
const before=txt('#p-tube .aew-calc-own');
const el=D.getElementById('t-len'); el.value=1400;
el.dispatchEvent(new w.Event('input',{bubbles:true})); await wait(200);
D.querySelector('#p-tube .aew-calc-btn').click(); await wait(300);
ok('tube total changed', before!==txt('#p-tube .aew-calc-own'),
   `${before} → ${txt('#p-tube .aew-calc-own')}`);

console.log('\n━━━ Manual overrides survive Calculate ━━━');
{
  const fire=(id,v)=>{const e=D.getElementById(id);e.value=v;
    e.dispatchEvent(new w.Event('input',{bubbles:true}));};

  fire('inq-stroke',500); await wait(300);
  D.querySelector('#p-tube .aew-calc-btn').click(); await wait(300);
  const derived=D.getElementById('t-len').value;
  ok('derived from stroke by default', Number(derived)===700, 't-len='+derived);

  fire('t-len',1250); await wait(200);           // estimator's own stock length
  D.querySelector('#p-tube .aew-calc-btn').click(); await wait(300);
  ok('manual tube length preserved', Number(D.getElementById('t-len').value)===1250,
     't-len='+D.getElementById('t-len').value);
  ok('and it affects the cost', !blank(txt('#p-tube .aew-calc-own')),
     txt('#p-tube .aew-calc-own'));

  // Changing the stroke again should still re-derive for non-overridden fields
  fire('inq-rod',60); await wait(200);
  D.querySelector('#p-rod .aew-calc-btn').click(); await wait(300);
  ok('non-overridden field still follows source', Number(D.getElementById('r-fdia').value)===60,
     'r-fdia='+D.getElementById('r-fdia').value);
}

console.log('\n━━━ Every bar reflects the same job ━━━');
const orders=PANELS.map(p=>txt('#'+p+' .aew-calc-order'));
ok('order value consistent across all 9', new Set(orders).size===1, orders[0]);
const mfgs=PANELS.map(p=>txt('#'+p+' .aew-calc-mfg'));
ok('mfg cost consistent across all 9', new Set(mfgs).size===1, mfgs[0]);

console.log('\n━━━ Panel-specific figures actually differ ━━━');
const own={};PANELS.forEach(p=>own[p]=txt('#'+p+' .aew-calc-own'));
ok('tube ≠ rod',   own['p-tube']!==own['p-rod'], `${own['p-tube']} vs ${own['p-rod']}`);
ok('bom ≠ tube',   own['p-bom']!==own['p-tube'], `${own['p-bom']} vs ${own['p-tube']}`);
ok('quotation shows order value', own['p-qte']===txt('#p-qte .aew-calc-order'), own['p-qte']);

console.log('\n━━━ Quantity is shown ━━━');
D.getElementById('inq-qty').value=25;
D.querySelector('#p-sum .aew-calc-btn').click(); await wait(300);
ok('quantity cell updates', /25/.test(txt('#p-sum .aew-calc-qty')), txt('#p-sum .aew-calc-qty'));
ok('order value scaled', txt('#p-sum .aew-calc-order')!==txt('#p-sum .aew-calc-mfg'),
   `${txt('#p-sum .aew-calc-mfg')} × 25 = ${txt('#p-sum .aew-calc-order')}`);

console.log('\n━━━ Bars survive a broken calculation step ━━━');
const realCalcBOM=w.calcBOM;
w.calcBOM=function(){ throw new Error('simulated BOM failure'); };
try{
  const failures=w.recalculateAll();
  ok('failure reported, others still ran', failures.includes('bill of materials'), failures.join(','));
  ok('tube still calculated', !blank(txt('#p-tube .aew-calc-own')), txt('#p-tube .aew-calc-own'));
}finally{ w.calcBOM=realCalcBOM; }

console.log('\n━━━ ERP untouched ━━━');
['calcTube','calcRod','calcBOM','calcAsm','calcSummary','propagate','buildQuote','generatePDF']
  .forEach(f=>ok(f+' intact', typeof w[f]==='function'));

console.log('\n═══════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════');
process.exit(fail?1:0);
})();
