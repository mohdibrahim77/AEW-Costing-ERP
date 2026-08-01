const { makeEnv } = require('./harness');
const LOGIN='http://127.0.0.1:5500/login.html';
const DASH ='http://127.0.0.1:5500/dashboard.html';
const ERP  ='http://127.0.0.1:5500/products/costing/index.html';
const CBAM ='http://127.0.0.1:5500/products/cbam/index.html';
const exp = Math.floor(Date.now()/1000)+3600;
const S = m => ({ user:{ email:'u@x.com', user_metadata:m }, expires_at: exp });

let pass=0, fail=0;
const ok=(n,c,d='')=>{ if(c){pass++;console.log('  ✓ '+n);} else {fail++;console.log('  ✗ '+n+(d?' — '+d:''));} };
const settle=()=>new Promise(r=>setTimeout(r,20));

(async()=>{
console.log('\n━━━ Routing matrix (per SRS FR-D) ━━━');

const cases = [
  ['admin, 1 product',      {role:'admin',    products:['costing']},            DASH],
  ['admin, all products',   {role:'admin',    products:['costing','cbam']},     DASH],
  ['estimator, 1 product',  {role:'estimator',products:['costing']},            ERP ],
  ['viewer, 1 product',     {role:'viewer',   products:['costing']},            ERP ],
  ['viewer, 2 products',    {role:'viewer',   products:['costing','cbam']},     DASH],
  ['estimator, cbam only',  {role:'estimator',products:['cbam']},               CBAM],
  ['no metadata at all',    {},                                                 ERP ],
];

for (const [name, meta, expected] of cases) {
  const e = makeEnv(LOGIN, {});
  /* Post-submit path: doSignIn() calls router.routeUser() on success */
  e.win.AEW.router.routeUser(S(meta).user);
  await settle();
  ok(name + ' → ' + expected.split('/').slice(3).join('/'),
     e.nav.length===1 && e.nav[0]===expected, JSON.stringify(e.nav));
}

console.log('\n━━━ Idempotence: one navigation per page load (G1) ━━━');
{
  const e = makeEnv(LOGIN, {});
  e.win.AEW.router.routeUser(S({role:'admin',products:['costing']}).user);
  await settle();
  e.win.AEW.router.gotoLogin();
  e.win.AEW.router.gotoDashboard();
  e.win.AEW.router.goto(ERP);
  await settle();
  ok('further goto() calls are no-ops after commit', e.nav.length===1, JSON.stringify(e.nav));
}

console.log('\n━━━ Same-page guard (G2) ━━━');
{
  const e = makeEnv(LOGIN, {});
  e.win.AEW.router.gotoLogin();
  await settle();
  ok('login → login is refused', e.nav.length===0, JSON.stringify(e.nav));
}

console.log('\n━━━ Base-URL detection under a nested server root ━━━');
{
  const fs=require('fs'), vm=require('vm');
  const ctx=vm.createContext({ window:null, console,
    document:{ getElementsByTagName:()=>([{src:'http://127.0.0.1:5500/aew-platform/assets/js/config.js'}]) },
    location:{protocol:'http:'} });
  ctx.window=ctx;
  vm.runInContext(fs.readFileSync('/mnt/user-data/outputs/aew-platform/assets/js/config.js','utf8'),ctx);
  ok('nested root detected correctly',
     ctx.AEW.config.ROUTES.login==='http://127.0.0.1:5500/aew-platform/login.html',
     ctx.AEW.config.ROUTES.login);
}

console.log('\n═══════════════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════════════');
process.exit(fail?1:0);
})();
