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
w.bootERP({name:'Aniktha Patirat',avatar:'A'});

setTimeout(()=>{
  const D=w.document;
  // Visit every tab so panels that calculate on open are exercised
  D.querySelectorAll('.ntab').forEach(b=>b.click());

  const blank=v=>v===''||v==='—'||v==='0'||v==='₹0'||v==='0 kg'||v==='0 hr'||/^₹?0(\.0+)?$/.test(v);

  const PANELS={'p-inq':'Inquiry & Rates','p-tube':'Tube','p-rod':'Piston Rod',
    'p-cov':'CEC/HEC/Gland','p-misc':'Misc','p-bom':'Bill of Materials',
    'p-asm':'Assembly & Packing','p-sum':'Cost Summary','p-qte':'Quotation'};

  let totalBad=0;
  Object.keys(PANELS).forEach(pid=>{
    const p=D.getElementById(pid); if(!p) return;
    const bad=[];
    // readonly "auto" inputs
    p.querySelectorAll('input[readonly]').forEach(e=>{
      if(blank(String(e.value||'').trim())) bad.push(`${e.id} [readonly] = "${e.value}"`);
    });
    // span/td outputs
    p.querySelectorAll('span[id], td[id], div[id]').forEach(e=>{
      if(e.querySelector('input,select,table')) return;
      const t=(e.textContent||'').trim();
      if(t.length>40) return;
      if(blank(t)) bad.push(`${e.id} = "${t}"`);
    });
    const st=bad.length?'✗':'✓';
    console.log(`\n  ${st} ${PANELS[pid].padEnd(20)} ${bad.length} blank/zero`);
    bad.slice(0,12).forEach(b=>console.log(`      ${b}`));
    totalBad+=bad.length;
  });

  console.log(`\n  ═══ TOTAL blank or zero outputs: ${totalBad} ═══`);

  console.log('\n  ── Key figures ──');
  [['t-wt','Tube weight'],['t-mc','Tube material'],['t-total','TUBE TOTAL'],
   ['r-wt','Rod weight'],['r-mc','Rod material'],['r-total','ROD TOTAL'],
   ['bom-grand','BOM grand'],['asm-c','Assembly'],['pack-c','Packing'],
   ['trans-tot','Transport'],['ss-mfg','MFG COST'],['profit-sp','SELLING PRICE'],
   ['profit-ov','ORDER VALUE']].forEach(([id,l])=>{
    const e=D.getElementById(id);
    const v=e?(e.value||e.textContent||'').trim():'<missing>';
    console.log(`     ${l.padEnd(16)} ${v}`);
  });
}, 1200);
