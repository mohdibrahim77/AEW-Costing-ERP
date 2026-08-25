/**
 * stale.js — no derived value may survive a change of its driver.
 *
 * The defect this exists to catch:
 *
 *   autoFixRodDia() guarded with `if (!fin || raw > fin) return false`
 *   — "raw bar is wider than the finished rod, geometry is fine". True,
 *   and useless. It raised the bar when the rod grew and never lowered
 *   it when the rod shrank. Quote a 160 mm rod, then a 28 mm one in the
 *   same session, and the 28 mm rod was costed from 165 mm bar:
 *   100.71 kg instead of 10 kg, Rs19,806 instead of Rs10,991. An 80%
 *   over-quote on geometry that looked entirely valid.
 *
 *   The tube had the identical bug and was fixed with
 *   syncTubeODToBore(). The rod's guard had been written to mirror
 *   autoFixTubeOD() while that still only raised, so it froze the wrong
 *   half of the pattern and the follow-down fix was never applied to it.
 *
 * The lesson is not about the rod. Any field derived from an enquiry
 * dimension can drift one-way, and a one-way guard reads as correct
 * because the geometry it produces IS valid — just not this cylinder's.
 *
 * So this suite does not check the rod. It checks EVERY input, select
 * and summary readout the ERP owns: quote a large cylinder, then a
 * small one, and require the result to be indistinguishable from a page
 * that only ever saw the small one. Any future one-way guard fails here
 * without anyone having to anticipate which field it will be.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

function boot() {
  let html = fs.readFileSync(path.join(ROOT, 'products/costing/index.html'), 'utf8');
  html = html.replace(
    /<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
    function (m, p) {
      return '<script>' + fs.readFileSync(
        path.join(ROOT, 'products/costing', p), 'utf8') + '<\/script>';
    });
  html = html.replace(/<script src="https:\/\/[^"]*"><\/script>/g, '');

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
    url: 'http://127.0.0.1:5500/products/costing/index.html'
  });
  const w = dom.window;
  w.Chart = function () { return { destroy: function () {}, update: function () {} }; };
  w.jspdf = { jsPDF: function () {
    return { setFillColor(){}, rect(){}, setTextColor(){}, setFont(){},
             setFontSize(){}, text(){}, setDrawColor(){}, save(){},
             autoTable(){}, lastAutoTable:{finalY:200}, internal:{pageSize:{}} };
  } };
  return w;
}

const wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

async function quote(w, bore, rod, stroke) {
  const d = w.document;
  const setv = function (id, v) {
    const e = d.getElementById(id);
    if (e) { e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); }
  };
  setv('inq-qty', 1);
  setv('inq-bore', bore);   await wait(20);
  setv('inq-rod', rod);     await wait(20);
  setv('inq-stroke', stroke);
  await wait(500);                    /* past the 150ms geometry debounce */
}

/* Everything the ERP owns, minus the enquiry fields we set ourselves. */
function snapshot(w) {
  const d = w.document;
  const out = {};
  Array.prototype.forEach.call(d.querySelectorAll('input[id],select[id]'), function (e) {
    if (/^inq-/.test(e.id)) return;
    out[e.id] = e.value;
  });
  ['ss-tube', 'ss-rod', 'ss-csub', 'ss-mfg'].forEach(function (id) {
    const e = d.getElementById(id);
    if (e) out[id] = (e.textContent || '').trim();
  });
  return out;
}

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; failures.push(name + (detail ? '  — ' + detail : '')); }
}

/* Small cylinder, and a much larger one to contaminate the page with. */
const SMALL = [40, 28, 250];
const BIG   = [280, 160, 1750];

(async function () {
  const wA = boot();
  wA.bootERP({ name: 'A', avatar: 'A', color: '#059669' });
  await wait(700);
  await quote(wA, SMALL[0], SMALL[1], SMALL[2]);
  const fresh = snapshot(wA);

  const wB = boot();
  wB.bootERP({ name: 'B', avatar: 'B', color: '#059669' });
  await wait(700);
  await quote(wB, BIG[0], BIG[1], BIG[2]);
  const big = snapshot(wB);
  await quote(wB, SMALL[0], SMALL[1], SMALL[2]);
  const after = snapshot(wB);

  ok('fresh page produced a costing', Object.keys(fresh).length > 50);
  ok('the big quote actually differed from the small one',
     big['r-rdia'] !== fresh['r-rdia'] || big['t-rod'] !== fresh['t-rod'],
     'the two cylinders must exercise different stock, or this proves nothing');

  /* The general property. */
  const keys = Object.keys(fresh);
  const drifted = keys.filter(function (k) {
    return String(fresh[k]) !== String(after[k]);
  });
  ok('no field survives a change of its driving dimension (' +
     keys.length + ' checked)',
     drifted.length === 0,
     drifted.map(function (k) {
       return k + ': fresh=' + fresh[k] + ' after=' + after[k];
     }).join('; '));

  /* Named assertions for the specific regression, so a failure says
     what broke rather than only that something did. */
  ok('r-rdia returns to its fresh value',
     String(fresh['r-rdia']) === String(after['r-rdia']),
     'fresh=' + fresh['r-rdia'] + ' after=' + after['r-rdia']);
  ok('r-wt returns to its fresh value',
     String(fresh['r-wt']) === String(after['r-wt']),
     'fresh=' + fresh['r-wt'] + ' after=' + after['r-wt']);
  ok('t-rod returns to its fresh value',
     String(fresh['t-rod']) === String(after['t-rod']),
     'fresh=' + fresh['t-rod'] + ' after=' + after['t-rod']);
  ok('t-wt returns to its fresh value',
     String(fresh['t-wt']) === String(after['t-wt']),
     'fresh=' + fresh['t-wt'] + ' after=' + after['t-wt']);
  ok('the manufacturing total returns to its fresh value',
     String(fresh['ss-mfg']) === String(after['ss-mfg']),
     'fresh=' + fresh['ss-mfg'] + ' after=' + after['ss-mfg']);

  /* The estimator's own stock size must still win, and must be released
     when the rod changes — the override contract, not just the sync. */
  const wC = boot();
  wC.bootERP({ name: 'C', avatar: 'C', color: '#059669' });
  await wait(700);
  await quote(wC, SMALL[0], SMALL[1], SMALL[2]);
  const dC = wC.document;
  const bar = dC.getElementById('r-rdia');
  bar.value = 90;
  bar.dispatchEvent(new wC.window.Event('input', { bubbles: true }));
  await wait(500);
  ok('a typed bar size is not overwritten', String(bar.value) === '90',
     'got ' + bar.value);

  /* Changing the rod releases it. */
  const rodEl = dC.getElementById('inq-rod');
  rodEl.value = 36;
  rodEl.dispatchEvent(new wC.window.Event('input', { bubbles: true }));
  await wait(500);
  ok('changing the rod releases the typed bar size',
     String(dC.getElementById('r-rdia').value) !== '90',
     'still ' + dC.getElementById('r-rdia').value);

  console.log('');
  if (fail) {
    console.log('FAILURES:');
    failures.forEach(function (f) { console.log('  ✗ ' + f); });
  }
  console.log((fail ? '✗ STALE' : '✓ STALE') + ' — ' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
})();
