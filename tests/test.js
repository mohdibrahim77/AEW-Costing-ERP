const { makeEnv } = require('./harness');
const LOGIN = 'http://127.0.0.1:5500/login.html';
const DASH  = 'http://127.0.0.1:5500/dashboard.html';
const ERP   = 'http://127.0.0.1:5500/products/costing/index.html';

const DEAD_KEY = 'sb-qqtctmrdawjcwnqszplx-auth-token';
const liveSession = { user:{ email:'a@b.com', user_metadata:{role:'admin',products:['costing']}},
                      expires_at: Math.floor(Date.now()/1000) + 3600 };
const deadSession = { user:{ email:'a@b.com', user_metadata:{role:'admin',products:['costing']}},
                      expires_at: Math.floor(Date.now()/1000) - 7200 };  // 2h stale

let pass = 0, fail = 0;
const ok = (n, c, d='') => { if (c) { pass++; console.log('  ✓ ' + n); }
                             else { fail++; console.log('  ✗ ' + n + (d ? ' — ' + d : '')); } };

const settle = () => new Promise(r => setTimeout(r, 20));

(async () => {

console.log('\n━━━ T1  THE REPORTED BUG: dead session in storage ━━━');
{
  // login.html with a DEAD session sitting in localStorage
  const e = makeEnv(LOGIN, { [DEAD_KEY]: 'stale' });
  e.win.AEW.auth.checkExistingSession();
  e.fire('INITIAL_SESSION', deadSession);
  await settle();
  ok('login does NOT route on a dead session', e.nav.length === 0,
     'navigated to ' + e.nav);
  ok('dead session purged from storage', !(DEAD_KEY in e.store));
}

console.log('\n━━━ T2  refresh fails mid-session (SIGNED_OUT race) ━━━');
{
  const e = makeEnv(DASH, { [DEAD_KEY]: 'stale' });
  let booted = false;
  e.win.AEW.auth.requireAuth(() => { booted = true; });
  e.fire('INITIAL_SESSION', liveSession);
  await settle();
  ok('dashboard renders on a live session', booted);

  // Now the background refresh fails
  e.fire('SIGNED_OUT', null);
  await settle();
  ok('navigates to login exactly once', e.nav.length === 1 && e.nav[0] === LOGIN,
     JSON.stringify(e.nav));
  ok('storage purged BEFORE navigating (breaks the loop)', !(DEAD_KEY in e.store));
}

console.log('\n━━━ T3  full loop simulation: 10 page loads ━━━');
{
  // Simulate the browser actually following redirects, carrying storage over.
  let url = LOGIN, storage = { [DEAD_KEY]: 'stale' }, hops = 0;
  for (let i = 0; i < 10; i++) {
    const e = makeEnv(url, storage);
    if (url === LOGIN) e.win.AEW.auth.checkExistingSession();
    else               e.win.AEW.auth.requireAuth(() => {});
    e.fire('INITIAL_SESSION', deadSession);   // storage holds a dead session
    await settle();
    storage = e.store;
    if (!e.nav.length) break;                 // settled — no further navigation
    url = e.nav[0]; hops++;
  }
  ok('loop terminates (≤2 hops, not infinite)', hops <= 2, hops + ' hops');
  ok('came to rest on the login page', url === LOGIN, url);
}

console.log('\n━━━ T4  circuit breaker G3 ━━━');
{
  const e = makeEnv(LOGIN, {});
  const r = e.win.AEW.router;
  // Force 6 rapid navigations between two URLs
  const urls = [DASH, LOGIN, DASH, LOGIN, DASH, LOGIN];
  let blocked = 0;
  urls.forEach(u => {
    e.win.location.href = (u === DASH ? LOGIN : DASH);  // always "different"
    const before = e.nav.length;
    // reset G1 latch to isolate G3
    e.win.AEW.router.goto(u);
    if (e.nav.length === before) blocked++;
  });
  ok('breaker halts runaway navigation', blocked > 0, 'blocked ' + blocked);
}

console.log('\n━━━ T5  normal happy paths still work ━━━');
{
  const e = makeEnv(LOGIN, {});
  e.win.AEW.auth.checkExistingSession();
  e.fire('INITIAL_SESSION', null);
  await settle();
  ok('no session → stays on login', e.nav.length === 0);
}
{
  const e = makeEnv(LOGIN, {});
  e.win.AEW.auth.checkExistingSession();
  e.fire('INITIAL_SESSION', liveSession);
  await settle();
  ok('live session → STAYS on login form (DR-1 revised)', e.nav.length === 0,
     'navigated to ' + JSON.stringify(e.nav));
}
{
  const e = makeEnv(ERP, {});
  let booted = false;
  e.win.AEW.auth.requireAuth(() => { booted = true; });
  e.fire('INITIAL_SESSION', liveSession);
  await settle();
  ok('ERP boots on a live session', booted && e.nav.length === 0);
}
{
  const e = makeEnv(ERP, {});
  e.win.AEW.auth.requireAuth(() => {});
  e.fire('INITIAL_SESSION', null);
  await settle();
  ok('ERP without session → login, once', e.nav.length === 1 && e.nav[0] === LOGIN);
}

console.log('\n━━━ T6  DR-1 revised: credentials always required ━━━');
{
  const e = makeEnv(LOGIN, {});
  e.win.AEW.auth.checkExistingSession();
  e.fire('INITIAL_SESSION', liveSession);
  await settle();
  ok('login page never auto-navigates, even with a live session', e.nav.length === 0,
     JSON.stringify(e.nav));

  // Submitting credentials is the ONLY way forward
  const e2 = makeEnv(LOGIN, {});
  e2.win.AEW.router.routeUser(liveSession.user);   // what doSignIn() calls on success
  await settle();
  ok('submitting credentials DOES navigate', e2.nav.length === 1 && e2.nav[0] === DASH,
     JSON.stringify(e2.nav));
}

console.log('\n━━━ T7  logout ━━━');
{
  const e = makeEnv(ERP, { [DEAD_KEY]: 'live' });
  e.win.AEW.auth.requireAuth(() => {});
  e.fire('INITIAL_SESSION', liveSession);
  await settle();
  e.win.AEW.auth.logout();
  await settle();
  ok('logout navigates to login', e.nav.includes(LOGIN));
  ok('logout purges storage', !(DEAD_KEY in e.store));
  ok('SIGNED_OUT after logout does not double-navigate',
     (e.fire('SIGNED_OUT', null), e.nav.filter(u => u === LOGIN).length === 1));
}

console.log('\n━━━ T8  TOKEN_REFRESHED must never navigate ━━━');
{
  const e = makeEnv(ERP, {});
  e.win.AEW.auth.requireAuth(() => {});
  e.fire('INITIAL_SESSION', liveSession);
  await settle();
  e.fire('TOKEN_REFRESHED', liveSession);
  e.fire('TOKEN_REFRESHED', liveSession);
  await settle();
  ok('routine refresh causes zero navigation', e.nav.length === 0, JSON.stringify(e.nav));
}

console.log('\n━━━ T9  Supabase CDN unreachable → fail closed ━━━');
{
  const e = makeEnv(ERP, {});
  e.win.AEW.supabase = null;
  e.win.AEW.auth.requireAuth(() => {});
  await settle();
  ok('no client → redirects to login, does not hang', e.nav.length === 1);
}

console.log('\n═══════════════════════════════════════════');
console.log(`  ${pass} passed, ${fail} failed`);
console.log('═══════════════════════════════════════════');
process.exit(fail ? 1 : 0);
})();
