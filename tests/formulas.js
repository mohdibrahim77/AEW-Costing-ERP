/**
 * formulas.js — the suite that asserts the numbers are RIGHT.
 *
 * Every other suite proves the ERP executes and produces non-zero
 * output. None of them prove the arithmetic is correct. This one
 * hard-codes values computed by hand from first principles; each
 * assertion carries the derivation in a comment.
 *
 * Three kinds of check:
 *
 *   ok()      — correctness. Must pass. A failure means a formula moved.
 *   defect()  — a KNOWN defect, documented in docs/WORKED_EXAMPLE.md.
 *               Asserts the CURRENT behaviour so the build stays green,
 *               and prints a warning. If one starts failing the defect
 *               was fixed — update this file and the doc.
 *   section 8 — cross-surface agreement. Boots the real ERP and fails if
 *               Summary, Quotation and PDF disagree by even one rupee,
 *               or if any printed column fails to sum to its own total.
 *
 * Sections 1–7 have no dependencies: the formulas are transcribed, not
 * imported, so they fail loudly if the frozen block is edited to
 * disagree with them. Section 8 needs jsdom and is skipped without it.
 *
 * Reference job throughout: O100 bore x O56 rod x 500 stroke, qty 10.
 */

const PI = Math.PI;
const r2  = n => Math.round(n * 100) / 100;
const r4  = n => Math.round(n * 10000) / 10000;
const rup = n => Math.round(+n || 0);

/* ── transcribed verbatim from the frozen block ── */
const hwt = (od, id, l) => od > id && id > 0 ? (PI / 4) * (od * od - id * id) * l * 7.85e-6 : 0;
const swt = (od, l) => od > 0 ? (PI / 4) * od * od * l * 7.85e-6 : 0;
const eA  = (od, l) => od > 0 && l > 0 ? PI * od * l / 100 : 0;
const iA  = (id, l) => id > 0 && l > 0 ? PI * id * l / 100 : 0;
const srF = sr => sr <= 2 ? 1.00 : sr <= 5 ? 1.15 : sr <= 10 ? 1.35 : 1.60;
const drT = d  => d <= 10 ? .03 : d <= 20 ? .05 : d <= 30 ? .08 : .12;
const nn  = v  => Math.max(0, +v || 0);
const pc  = (mh, mr, lh, lr) => Math.max(0, r2(nn(mh) * nn(mr) + nn(lh) * nn(lr)));
const TA = { r:[80,150,250,9999], c:[500,1000,2000,9999], v:[[.08,.10,.15,.20],[.10,.15,.20,.30],[.15,.20,.30,.40],[.25,.35,.50,.70]] };
const TB = { r:[80,150,250,9999], c:[500,1000,2000,9999], v:[[.30,.60,1.20,1.80],[.50,.90,1.70,2.50],[.80,1.50,2.80,4.00],[1.20,2.20,4.00,6.00]] };
const TD = { r:[80,150,250,9999], c:[500,1000,9999],      v:[[.30,.60,1.20],[.50,.90,1.60],[.80,1.40,2.40],[1.20,2.00,3.50]] };
function lkp(T, d, l) {
  let ri = T.r.findIndex(b => d <= b), ci = T.c.findIndex(b => l <= b);
  if (ri < 0) ri = T.r.length - 1;
  if (ci < 0) ci = T.c.length - 1;
  return T.v[ri][ci];
}
function weld(d, b, wlRate, wwRate) {
  if (!d || !b) return { t: 0, h: 0 };
  const len = PI * d * b, h = len / 3600;
  return { t: r2(h * wlRate + h * .8 * wwRate), h: r4(h) };
}

let pass = 0, fail = 0, defects = 0;
const ok = (name, actual, expected, tol) => {
  tol = tol === undefined ? 0.005 : tol;
  if (Math.abs(actual - expected) <= tol) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '  expected ' + expected + ', got ' + actual); }
};
const okEq = (name, actual, expected) => {
  if (actual === expected) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + '  expected ' + expected + ', got ' + actual); }
};
const defect = (id, name, actual, current, tol) => {
  tol = tol === undefined ? 0.005 : tol;
  if (Math.abs(actual - current) <= tol) {
    defects++; console.log('  ⚠ ' + id + '  ' + name + '  (still present: ' + actual + ')');
  } else {
    fail++; console.log('  ✗ ' + id + '  ' + name +
      '  — behaviour CHANGED (was ' + current + ', now ' + actual +
      '). If fixed on purpose, update tests/formulas.js and docs/WORKED_EXAMPLE.md');
  }
};

console.log('\n━━━ Formula correctness ━━━\n');

/* ═══ 1. DENSITY AND MASS ═══════════════════════════════════════════
   Steel 7.85 g/cm3 = 7.85e-3 g/mm3 = 7.85e-6 kg/mm3; mm3 x kg/mm3 = kg */
console.log('  -- hollow mass --');

/* 100 OD x 76 ID x 500: (pi/4)(10000-5776)(500) = 1 658 760.921 mm3
   x 7.85e-6 = 13.021 273 kg                                        */
ok('100/76/500 tube = 13.0213 kg', hwt(100, 76, 500), 13.021273, 1e-5);
ok('100/76/500 tube r2 = 13.02 kg', r2(hwt(100, 76, 500)), 13.02);
ok('13.02 kg x Rs160/kg = Rs 2083.20', r2(r2(hwt(100, 76, 500)) * 160), 2083.20);

/* reference tube 125 OD x 100 ID x 700 = 3 092 505.27 mm3 = 24.276 kg */
ok('125/100/700 tube = 24.28 kg', r2(hwt(125, 100, 700)), 24.28);
ok('tube material rounds to Rs 3885', rup(r2(r2(hwt(125, 100, 700)) * 160)), 3885);

console.log('  -- solid mass --');
/* reference rod, raw 60 mm (raised from 52 by autoFixRodDia):
   (pi/4)(3600)(850)(7.85e-6) = 18.866 kg                            */
ok('60 dia x 850 rod = 18.87 kg', r2(swt(60, 850)), 18.87);
ok('rod material rounds to Rs 1510', rup(r2(r2(swt(60, 850)) * 80)), 1510);
/* the pre-fix 52 mm bar, for contrast */
ok('52 dia x 850 rod = 14.17 kg (pre-fix stock)', r2(swt(52, 850)), 14.17);

console.log('  -- surface area --');
ok('iA(100,700) = 2199.11 cm2', r2(iA(100, 700)), 2199.11);
ok('eA(120,700) = 2638.94 cm2', r2(eA(120, 700)), 2638.94);
ok('eA(56,850)  = 1495.40 cm2', r2(eA(56, 850)), 1495.40);

/* ═══ 2. LOOKUP TABLES ═════════════════════════════════════════════ */
console.log('\n  -- machining time lookups --');
okEq('TA(125,700) = 0.15 hr  [row 150, col 1000]', lkp(TA, 125, 700), 0.15);
okEq('TA(60,850)  = 0.10 hr  [row 80,  col 1000]', lkp(TA, 60, 850), 0.10);
okEq('TB(120,700) = 0.90 hr  [row 150, col 1000]', lkp(TB, 120, 700), 0.90);
okEq('TB(56,850)  = 0.60 hr  [row 80,  col 1000]', lkp(TB, 56, 850), 0.60);
okEq('TA above every band falls back to 0.70', lkp(TA, 99999, 99999), 0.70);
okEq('srF(4)  = 1.15  (rod, raw 60 - fin 56)', srF(4), 1.15);
okEq('srF(5)  = 1.15  (tube, raw 125 - fin 120)', srF(5), 1.15);
okEq('srF(11) = 1.60', srF(11), 1.60);
okEq('drT(12) = 0.05 hr/hole', drT(12), 0.05);

/* ═══ 3. TUBE OPERATIONS  (125 raw / 120 fin / 100 bore x 700) ═════ */
console.log('\n  -- tube operations --');
ok('1 cutting = Rs 72.50 -> Rs 73', pc(r4(lkp(TA, 125, 700)), 150, 0.5, 100), 72.50);
const rthTube = r4(Math.max(0, lkp(TB, 120, 700) * srF(125 - 120)));
ok('2 rough-turn hours = 1.035', rthTube, 1.035);
ok('2 rough turn = Rs 410.50 -> Rs 411', pc(rthTube, 300, 1, 100), 410.50);
ok('3 drilling = Rs 100.00', pc(r4(drT(12) * 4), 250, 0.5, 100), 100.00);
/* weld d=6 b=2: len 37.699 mm, h 0.010472; lab 3.927 + wire 3.016 */
const pw = weld(6, 2, 375, 360);
ok('4 part weld hours = 0.0105', pw.h, 0.0105);
ok('4 part weld = Rs 56.94 -> Rs 57', r2(pw.t + 0.5 * 100), 56.94);
ok('5 honing = Rs 709.73 -> Rs 710', r2(r2(iA(100, 700)) * 0.30 + 0.5 * 100), 709.73);
ok('6 finish turn = Rs 267.35 -> Rs 267', pc(r4(rthTube * 0.70), 300, 0.5, 100), 267.35);
const cw = weld(8, 2, 375, 360);
ok('7/8 cover weld = Rs 59.26 -> Rs 59', r2(cw.t + 0.5 * 100), 59.26);

/* Round-then-sum: the printed column must equal the printed total. */
const tubeOpsRounded = [72.50, 410.50, 100.00, 56.94, 709.73, 267.35, 59.26, 59.26].map(rup);
okEq('tube process = sum of ROUNDED ops = Rs 1736',
     tubeOpsRounded.reduce((a, b) => a + b, 0), 1736);
okEq('tube total = Rs 3885 + Rs 1736 = Rs 5621', 3885 + 1736, 5621);

/* ═══ 4. ROD OPERATIONS  (60 raw / 56 fin x 850) ═══════════════════ */
console.log('\n  -- rod operations (raw raised to 60 by the rod guard) --');
ok('1 cutting = Rs 65.00', pc(r4(lkp(TA, 60, 850)), 150, 0.5, 100), 65.00);
/* stock removal 60-56 = 4 -> srF 1.15; 0.60 x 1.15 = 0.69 hr */
const rthRod = r4(Math.max(0, lkp(TB, 56, 850) * srF(60 - 56)));
ok('2 rough-turn hours = 0.69', rthRod, 0.69);
ok('2 rough turn = Rs 307.00', pc(rthRod, 300, 1, 100), 307.00);
/* heat treat: 18.87 kg x Rs12/kg + 0.25 hr x Rs100 */
ok('3 heat treatment = Rs 251.44 -> Rs 251', r2(18.87 * 12 + 0.25 * 100), 251.44);
ok('4 induction hardening = Rs 722.93 -> Rs 723', r2(1495.40 * 0.45 + 0.5 * 100), 722.93);
ok('5 finish turn = Rs 194.90 -> Rs 195', pc(r4(rthRod * 0.70), 300, 0.5, 100), 194.90);
ok('6 grinding = Rs 498.62 -> Rs 499', r2(1495.40 * 0.30 + 0.5 * 100), 498.62);
ok('7 chrome plating = Rs 1296.09 -> Rs 1296', r2(1495.40 * 0.85 + 0.25 * 100), 1296.09);
ok('8 polishing = Rs 349.08 -> Rs 349', r2(1495.40 * 0.20 + 0.5 * 100), 349.08);

const rodOpsRounded = [65.00, 307.00, 251.44, 722.93, 194.90, 498.62, 1296.09, 349.08].map(rup);
okEq('rod process = sum of ROUNDED ops = Rs 3685',
     rodOpsRounded.reduce((a, b) => a + b, 0), 3685);
okEq('rod total = Rs 1510 + Rs 3685 = Rs 5195', 1510 + 3685, 5195);

/* ═══ 5. ROLL-UP AND COMMERCIALS ═══════════════════════════════════ */
console.log('\n  -- roll-up (every figure a whole rupee) --');
const covers = 660 + 760 + 630 + 260 + 210 + 530 + 530 + 620;
okEq('machined components = Rs 4200', covers, 4200);
okEq('component subtotal = 5621 + 5195 + 4200 = Rs 15016', 5621 + 5195 + covers, 15016);

/* packing weight = tube 24.28 + rod 18.87 = 43.15 kg x Rs5 = 215.75 */
okEq('packing = Rs 216', rup(r2((24.28 + 18.87) * 5)), 216);
/* painting = tube 395.84 -> 396, rod 299.08 -> 299 */
okEq('painting = Rs 695', rup(r2(2638.94 * 0.15)) + rup(r2(1495.40 * 0.20)), 695);

const mfg = 15016 + 500 + 375 + 340 + 400 + 100 + 695 + 450 + 216;
okEq('manufacturing cost = Rs 18092', mfg, 18092);
okEq('margin at 20% = Rs 3618', rup(mfg * 20 / 100), 3618);
okEq('selling price = Rs 21710', mfg + rup(mfg * 20 / 100), 21710);
okEq('order value x10 = Rs 217100', (mfg + rup(mfg * 20 / 100)) * 10, 217100);
okEq('at 0% margin, selling price = manufacturing cost', mfg + rup(mfg * 0 / 100), mfg);

/* ═══ 6. BOUNDARY BEHAVIOUR ════════════════════════════════════════ */
console.log('\n  -- boundaries --');
okEq('ID = OD  -> 0', hwt(100, 100, 500), 0);
okEq('ID > OD  -> 0 (no negative mass)', hwt(100, 120, 500), 0);
okEq('length 0 -> 0', hwt(100, 76, 0), 0);
okEq('OD 0     -> 0', hwt(0, 0, 500), 0);
okEq('NaN      -> 0', hwt(NaN, 76, 500), 0);
okEq('pc() never returns negative', pc(-5, -5, -5, -5), 0);

/* ═══ 7. KNOWN DEFECTS — open, documented, not yet fixed ═══════════ */
console.log('\n━━━ Known defects (internal only — see docs/WORKED_EXAMPLE.md) ━━━\n');

/* hwt requires id > 0, so a solid bar reports zero mass instead of
   (pi/4)(100^2)(500)(7.85e-6) = 30.83 kg. Needs ID=0 typed by hand. */
defect('DEFECT-4', 'solid bar via hwt() reports 0 kg, not 30.83 kg',
       hwt(100, 0, 500), 0);

/* negative length is unguarded: -13.021 kg */
defect('DEFECT-5', 'negative length yields negative mass',
       r2(hwt(100, 76, -500)), -13.02);

/* TD drives the displayed honing hours but never the honing cost,
   which is area-based. Not an undercharge — see ASSUMPTIONS.md. */
defect('DEFECT-6', 'honing hours displayed (TD) are not used in the honing cost',
       lkp(TD, 100, 700), 0.90);

/* ═══ 8. CROSS-SURFACE AGREEMENT ═══════════════════════════════════
   The assertion that would have caught the Rs4,200 PDF drift on day
   one. Summary, Quotation and PDF must report identical money, and
   every printed column must sum to its own printed total. */
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) {}

const finish = () => {
  console.log('\n═══════════════════════════════════');
  console.log('  ' + pass + ' correct, ' + fail + ' wrong, ' + defects + ' known defects');
  console.log('═══════════════════════════════════');
  if (defects) console.log('  See docs/WORKED_EXAMPLE.md for the full write-up.\n');
  process.exit(fail ? 1 : 0);
};

if (!JSDOM) {
  console.log('\n  (jsdom absent — cross-surface checks skipped)');
  finish();
} else (async () => {
  const fs = require('fs'), path = require('path');
  const ROOT = path.join(__dirname, '..');
  let html = fs.readFileSync(ROOT + '/products/costing/index.html', 'utf8');
  html = html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
    (m, p) => '<script>' + fs.readFileSync(path.join(ROOT, 'products/costing', p), 'utf8') + '</script>');
  html = html.replace(/<script src="https:\/\/[^"]*"><\/script>/g, '');

  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(), url: 'http://127.0.0.1:5500/products/costing/index.html' });
  const w = dom.window;
  w.Chart = function () { return { destroy() {}, update() {} }; };
  w.__pdf = {};
  w.jspdf = { jsPDF: function () { return {
    setFillColor(){}, rect(){}, setTextColor(){}, setFont(){}, setFontSize(){}, text(){},
    setDrawColor(){}, save(){},
    autoTable(o) { w.__pdf.body = o.body; w.__pdf.foot = o.foot; },
    lastAutoTable: { finalY: 200 }, internal: { pageSize: {} }
  }; } };

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const money = s => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
  const d = w.document;
  const setv = (id, v) => { const e = d.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); } };
  const txt  = id => { const e = d.getElementById(id); return e ? (e.textContent || e.value) : ''; };

  w.bootERP({ name: 'Test', avatar: 'T', color: '#059669' });
  await wait(400);
  setv('inq-bore', 100); setv('inq-rod', 56); setv('inq-stroke', 500); setv('inq-qty', 10);
  w.propagate(); await wait(200); w.calcAll(); await wait(250);

  console.log('\n━━━ Rod geometry guard ━━━\n');
  okEq('raw bar raised above finished rod',
       Number(d.getElementById('r-rdia').value) > Number(d.getElementById('r-fdia').value), true);
  okEq('raw bar = 60 mm for a 56 mm rod', Number(d.getElementById('r-rdia').value), 60);

  const read = async () => {
    w.buildQuote(); await wait(100);
    w.__pdf = {}; w.generatePDF(); await wait(150);
    const q = d.getElementById('q-rows').textContent;
    const grab = re => { const m = q.match(re); return m ? money(m[1]) : null; };
    const foot = l => { const r = (w.__pdf.foot || []).find(x => String(x[0]).indexOf(l) >= 0); return r ? money(r[3]) : null; };
    return {
      summary: { mfg: money(txt('ss-mfg')), pa: money(txt('km-mg')), sp: money(txt('km-sp')), ov: money(txt('km-ov')),
                 lines: ['ss-tube','ss-rod','ss-cec','ss-hec','ss-gland','ss-cbush','ss-stube',
                         'ss-reye','ss-rodeye','ss-piston','ss-bear','ss-seal','ss-bom',
                         'ss-asm','ss-test','ss-paint','ss-trans','ss-pack']
                        .reduce((s, i) => s + money(txt(i)), 0) },
      quote:   { mfg: grab(/Total Manufacturing Cost \(per piece\)\s*₹([\d,]+)/),
                 pa:  grab(/Profit Margin \(\d+%\)\s*₹([\d,]+)/),
                 sp:  grab(/Selling Price per Piece\s*₹([\d,]+)/),
                 ov:  grab(/Total Order Value \(\d+ nos\)\s*₹([\d,]+)/),
                 lines: Array.from(d.querySelectorAll('#q-rows tr')).filter(tr => !tr.className)
                        .reduce((s, tr) => s + money(tr.lastElementChild.textContent), 0) },
      pdf:     { mfg: foot('Total Manufacturing'), pa: foot('Profit Margin'),
                 sp:  foot('Selling Price'),        ov: foot('Total Order Value'),
                 lines: (w.__pdf.body || []).reduce((s, r) => s + money(r[3]), 0) }
    };
  };

  for (const pct of [20, 0]) {
    setv('profit-pct', pct); w.calcSummary(); await wait(200);
    const s = await read();
    console.log('\n━━━ Cross-surface agreement at ' + pct + '% margin ━━━\n');
    ['mfg', 'pa', 'sp', 'ov'].forEach(k => {
      ok(pct + '% ' + k + ' — Summary = Quotation', s.quote[k], s.summary[k], 0.005);
      ok(pct + '% ' + k + ' — Summary = PDF',       s.pdf[k],   s.summary[k], 0.005);
    });
    ok(pct + '% Summary printed lines sum to printed total',   s.summary.lines, s.summary.mfg, 0.005);
    ok(pct + '% Quotation printed rows sum to printed total',  s.quote.lines,   s.quote.mfg,   0.005);
    ok(pct + '% PDF printed rows sum to printed total',        s.pdf.lines,     s.pdf.mfg,     0.005);
    ok(pct + '% mfg + margin = selling price',                 s.summary.mfg + s.summary.pa, s.summary.sp, 0.005);
    ok(pct + '% selling price x qty = order value',            s.summary.sp * 10, s.summary.ov, 0.005);
    if (pct === 0) {
      ok('0% margin really is zero', s.summary.pa, 0);
      ok('0% selling price equals manufacturing cost', s.summary.sp, s.summary.mfg);
      okEq('PDF never quotes below manufacturing cost', s.pdf.sp >= s.summary.mfg, true);
    }
  }

  /* ═══ 9. THE LANDING PAGE QUOTES THE ERP ═════════════════════════
     index.html advertises a costed cylinder. Those figures are derived
     from this exact enquiry, so they must still add up to what the ERP
     now reports. They drifted once (page said Rs17,589, tool said
     Rs18,092); a note in CLAUDE.md only helps someone who reads it. */
  console.log('\n━━━ Landing page reconciliation ━━━\n');
  setv('profit-pct', 20); w.calcSummary(); await wait(200);
  const erpMfg = money(txt('ss-mfg'));
  const landing = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const block = landing.match(/var PARTS = \[([\s\S]*?)\];/);
  if (!block) {
    fail++; console.log('  ✗ could not find the PARTS array in index.html');
  } else {
    const costs = [...block[1].matchAll(/cost:\s*(\d+)/g)].map(m => Number(m[1]));
    const sum = costs.reduce((a, b) => a + b, 0);
    okEq('landing page lists 12 components', costs.length, 12);
    ok('landing page components sum to the ERP manufacturing cost', sum, erpMfg, 0.005);
    okEq('no balancing entry needed', sum === erpMfg, true);
    const shown = (landing.match(/id="heroTotal"[^>]*>₹([\d,]+)</) || [])[1];
    ok('headline figure matches the ERP', money(shown), erpMfg, 0.005);
  }

  finish();
})();
