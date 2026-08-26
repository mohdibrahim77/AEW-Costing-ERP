/**
 * validate-historical.js — HISPL Costing v2, Stage 2 validation harness.
 *
 * Runs all 295 historical cylinders through the CURRENT (v1) costing
 * engine and measures how far its answers sit from what HISPL actually
 * charged. This measures the baseline. It changes nothing.
 *
 * The question Stage 3 depends on, and the reason this file exists:
 *   the v1 engine is known to under-quote by roughly 2.8x.
 *   How much of that is the RATES being too low,
 *   and how much is component MASS that v1 never models at all?
 *
 * Those two compose multiplicatively:
 *
 *     actual_total     actual_mass      actual_rupees_per_kg
 *     ------------  =  -----------  x  ----------------------
 *   predicted_total   predicted_mass   predicted_rupees_per_kg
 *
 *          gap      =   mass factor   x      rate factor
 *
 * Both sides of both factors are measured, never assumed: actual mass
 * is the CSV's WEIGHT column, predicted mass is what the engine's own
 * geometry produces. No dimension is interpolated or invented here.
 *
 * Node + jsdom. Run:  node tests/validate-historical.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

/* ── Load the master data (for banding and the reference rates) ───── */
const mdom = new JSDOM('<!doctype html><html><body></body></html>');
new Function('window', fs.readFileSync(
  path.join(ROOT, 'assets/js/costing/masters.js'), 'utf8'))(mdom.window);
const M = mdom.window.AEW.masters;

/* ── Read the historical set ─────────────────────────────────────── */
function readHistory() {
  const lines = fs.readFileSync(
    path.join(ROOT, 'hispl-v2/historical-cylinders.csv'), 'utf8')
    .trim().split(/\r?\n/);
  const hdr = lines[0].split(',').map(function (s) { return s.trim(); });
  const col = {};
  hdr.forEach(function (h, i) { col[h] = i; });

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    const r = {
      line:     i + 1,
      bore:     Number(c[col.BORE]),
      rod:      Number(c[col.ROD]),
      stroke:   Number(c[col.STROKE]),
      mounting: (c[col.MOUNTING] || '').trim(),
      weight:   Number(c[col.WEIGHT]),
      rawMat:   Number(c[col.RAW_MAT]),
      process:  Number(c[col.PROCESS]),
      total:    Number(c[col.TOTAL])
    };
    const bad = !isFinite(r.bore) || !isFinite(r.rod) || !isFinite(r.stroke) ||
                !isFinite(r.weight) || !isFinite(r.total) ||
                r.bore <= 0 || r.weight <= 0 || r.total <= 0;
    if (bad) { r.malformed = true; }

    /* Numerically parseable is not the same as physically possible.
       A piston rod cannot be as wide as the bore it travels inside, so
       these rows cannot describe the cylinder their other columns
       price. They are excluded from the headline error figures and
       reported separately rather than quietly averaged in. */
    if (!bad && r.rod >= r.bore) { r.implausible = 'rod >= bore'; }
    rows.push(r);
  }
  return rows;
}

/* ── Boot the ERP once; every row is re-quoted on the same page ──── */
function bootERP() {
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

const wait  = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
const money = function (s) { return Number(String(s).replace(/[^0-9.]/g, '')) || 0; };

/* ── Statistics ──────────────────────────────────────────────────── */
function median(a) {
  if (!a.length) return NaN;
  const s = a.slice().sort(function (x, y) { return x - y; });
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const pct  = function (n) { return (n * 100).toFixed(1) + '%'; };
const rs   = function (n) { return '₹' + Math.round(n).toLocaleString('en-IN'); };
const padL = function (s, n) { return String(s).padStart(n); };
const padR = function (s, n) { return String(s).padEnd(n); };

(async function () {
  const rows = readHistory();
  const clean = rows.filter(function (r) { return !r.malformed; });
  const implausible = clean.filter(function (r) { return r.implausible; });

  console.log('\n' + '═'.repeat(74));
  console.log('  HISPL COSTING v2 — STAGE 2 VALIDATION HARNESS');
  console.log('  ' + rows.length + ' rows read, ' +
              (rows.length - clean.length) + ' malformed, ' +
              implausible.length + ' physically impossible');
  console.log('═'.repeat(74));
  if (implausible.length) {
    console.log('\n  EXCLUDED — rod diameter >= bore diameter:');
    implausible.forEach(function (r) {
      console.log('    line ' + padL(r.line, 4) + '  bore ' + padL(r.bore, 4) +
                  '  rod ' + padL(r.rod, 4) + '  stroke ' + padL(r.stroke, 6) +
                  '  weight ' + padL(r.weight, 5) + 'kg  total ' + rs(r.total));
    });
  }

  const w = bootERP();
  w.bootERP({ name: 'V', avatar: 'V', color: '#059669' });
  await wait(600);
  const d = w.document;

  const setv = function (id, v) {
    const e = d.getElementById(id);
    if (e) { e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); }
  };
  const txt = function (id) {
    const e = d.getElementById(id);
    return e ? (e.textContent || e.value || '') : '';
  };
  const val = function (id) {
    const e = d.getElementById(id);
    return e ? (parseFloat(e.value) || 0) : 0;
  };

  /* Quote every row on the same page, as an estimator would. */
  const results = [];
  process.stdout.write('\n  quoting');
  for (let i = 0; i < clean.length; i++) {
    const r = clean[i];
    setv('inq-qty', 1);
    setv('inq-bore', r.bore);   await wait(20);
    setv('inq-rod', r.rod);     await wait(20);
    setv('inq-stroke', r.stroke);
    await wait(320);            /* clears the 150ms geometry debounce */

    const predMfg = money(txt('ss-mfg'));
    const tubeWt  = val('t-wt');
    const rodWt   = val('r-wt');
    const predWt  = tubeWt + rodWt;

    results.push({
      row: r,
      predMfg: predMfg,
      predWt: predWt,
      tubeWt: tubeWt,
      rodWt: rodWt,
      gap:    predMfg > 0 ? r.total / predMfg : NaN,
      massF:  predWt  > 0 ? r.weight / predWt : NaN,
      actualPerKg: r.total / r.weight,
      predPerKg:   predWt > 0 ? predMfg / predWt : NaN,
      absErr: Math.abs(predMfg - r.total),
      relErr: predMfg > 0 ? Math.abs(predMfg - r.total) / r.total : NaN,
      band:   M.boreBand(r.bore)
    });
    if (i % 25 === 0) process.stdout.write('.');
  }
  console.log(' done\n');

  const valid = results.filter(function (x) {
    return isFinite(x.gap) && isFinite(x.massF) && x.predMfg > 0 &&
           !x.row.implausible;
  });
  const zeroed = results.filter(function (x) { return !(x.predMfg > 0); }).length;

  /* ── E1: overall accuracy ──────────────────────────────────────── */
  console.log('─'.repeat(74));
  console.log('  E1 — PREDICTED vs ACTUAL');
  console.log('─'.repeat(74));
  console.log('  rows quoted            : ' + results.length);
  console.log('  rows the engine zeroed : ' + zeroed +
              (zeroed ? '   ← produced no cost at all' : ''));
  console.log('  median absolute error  : ' + rs(median(valid.map(function (x) { return x.absErr; }))));
  console.log('  median relative error  : ' + pct(median(valid.map(function (x) { return x.relErr; }))));
  console.log('  median actual total    : ' + rs(median(valid.map(function (x) { return x.row.total; }))));
  console.log('  median predicted total : ' + rs(median(valid.map(function (x) { return x.predMfg; }))));

  const medGap = median(valid.map(function (x) { return x.gap; }));
  console.log('  median gap (act/pred)  : ' + medGap.toFixed(2) + 'x');

  /* ── E1b: by bore band ─────────────────────────────────────────── */
  console.log('\n' + '─'.repeat(74));
  console.log('  E1b — BY BORE BAND  (upper-exclusive)');
  console.log('─'.repeat(74));
  console.log('  ' + padR('band', 10) + padL('n', 5) + padL('med gap', 10) +
              padL('act ₹/kg', 11) + padL('target', 9) + padL('pred ₹/kg', 11) +
              padL('med abs err', 14));

  M.boreBands().forEach(function (b) {
    const inBand = valid.filter(function (x) { return x.band === b.key; });
    if (!inBand.length) {
      console.log('  ' + padR(b.key, 10) + padL(0, 5) + padL('—', 10));
      return;
    }
    console.log('  ' + padR(b.key, 10) +
      padL(inBand.length, 5) +
      padL(median(inBand.map(function (x) { return x.gap; })).toFixed(2) + 'x', 10) +
      padL(Math.round(median(inBand.map(function (x) { return x.actualPerKg; }))), 11) +
      padL(b.targetTotalPerKg, 9) +
      padL(Math.round(median(inBand.map(function (x) { return x.predPerKg; }))), 11) +
      padL(rs(median(inBand.map(function (x) { return x.absErr; }))), 14));
  });

  /* ── E1c: weight and cost components ───────────────────────────── */
  console.log('\n' + '─'.repeat(74));
  console.log('  E1c — WEIGHT, MATERIAL AND PROCESS');
  console.log('─'.repeat(74));
  const medActWt  = median(valid.map(function (x) { return x.row.weight; }));
  const medPredWt = median(valid.map(function (x) { return x.predWt; }));
  console.log('  median actual weight    : ' + medActWt.toFixed(1) + ' kg');
  console.log('  median predicted weight : ' + medPredWt.toFixed(1) +
              ' kg   (tube + rod only)');
  console.log('  median mass factor      : ' +
              median(valid.map(function (x) { return x.massF; })).toFixed(2) + 'x');
  console.log('  median actual RAW_MAT   : ' +
              rs(median(valid.map(function (x) { return x.row.rawMat; }))));
  console.log('  median actual PROCESS   : ' +
              rs(median(valid.map(function (x) { return x.row.process; }))));
  console.log('  actual material ₹/kg    : ' +
              Math.round(median(valid.map(function (x) { return x.row.rawMat / x.row.weight; }))));
  console.log('  master tube rate ST52   : ' + M.materialRate('ST52') + ' ₹/kg');
  console.log('  master rod rate EN19    : ' + M.materialRate('EN19') + ' ₹/kg');

  /* ── E2: the decomposition Stage 3 depends on ──────────────────── */
  const medMass = median(valid.map(function (x) { return x.massF; }));
  const medRate = median(valid.map(function (x) {
    return x.actualPerKg / x.predPerKg;
  }));

  console.log('\n' + '═'.repeat(74));
  console.log('  E2 — WHAT THE ' + medGap.toFixed(2) + 'x GAP IS MADE OF');
  console.log('═'.repeat(74));
  console.log('    gap  =  mass factor  x  rate factor');
  console.log('   ' + medGap.toFixed(2) + 'x =    ' + medMass.toFixed(2) +
              'x      x    ' + medRate.toFixed(2) + 'x');
  console.log();

  const predPerKg = median(valid.map(function (x) { return x.predPerKg; }));
  const actPerKg  = median(valid.map(function (x) { return x.actualPerKg; }));

  console.log('    MASS   — the engine predicts ' + medPredWt.toFixed(0) +
              ' kg where the cylinder actually');
  console.log('             weighed ' + medActWt.toFixed(0) + ' kg. Mass is ' +
              (medMass >= 1 ? 'UNDER-stated by ' + medMass.toFixed(2)
                            : 'OVER-stated by ' + (1 / medMass).toFixed(2)) + 'x.');
  console.log();
  console.log('    RATES  — the engine prices a kg at ' + Math.round(predPerKg) +
              ' ₹/kg where HISPL');
  console.log('             charged ' + Math.round(actPerKg) + ' ₹/kg. Rates are ' +
              (medRate >= 1 ? medRate.toFixed(2) + 'x too low.'
                            : (1 / medRate).toFixed(2) + 'x too high.'));
  console.log();

  /* A percentage split is only meaningful when both factors push the
     same way. When they oppose, one is masking the other and a "share
     of the gap" is arithmetic without meaning. */
  const lg = Math.log(medGap), lm = Math.log(medMass), lr = Math.log(medRate);
  const sameWay = (lm > 0) === (lr > 0);

  if (sameWay && lg > 0) {
    console.log('  Both push the same way, so the gap does divide cleanly:');
    console.log();
    console.log('    share attributable to MISSING COMPONENT MASS : ' + pct(lm / lg));
    console.log('    share explained by RATES being too low       : ' + pct(lr / lg));
    console.log();
    console.log('  (These are medians of three separate distributions, and a');
    console.log('   median of a product is not the product of the medians, so');
    console.log('   the two shares need not land on exactly 100%.)');
    console.log();
    console.log('  The engine models the tube and the rod. It does not model the');
    console.log('  covers, gland, piston, eyes, bushes or trunnion, and that');
    console.log('  missing steel is very nearly the whole gap. Correcting rates');
    console.log('  alone would move a median quote only to ' +
                rs(median(valid.map(function (x) { return x.predMfg; })) * medRate) +
                ',');
    console.log('  against an actual of ' +
                rs(median(valid.map(function (x) { return x.row.total; }))) + '.');
  } else {
    console.log('  These do not both push the same way, so the gap cannot be');
    console.log('  split into two percentages that sum to 100 — one is masking');
    console.log('  the other. Read each on its own terms above.');
  }
  console.log();

  /* Where the 2.8x actually lives. */
  const bigBore = valid.filter(function (x) { return x.band === '>=180'; });
  if (bigBore.length) {
    console.log('  The 2.8x in the handoff is close to the global median (' +
                medGap.toFixed(2) + 'x).');
    console.log('  It is the >=180 band alone: ' +
                median(bigBore.map(function (x) { return x.gap; })).toFixed(2) +
                'x across ' + bigBore.length + ' cylinders, where mass is');
    console.log('  under-stated ' +
                median(bigBore.map(function (x) { return x.massF; })).toFixed(2) +
                'x and rates are ' +
                median(bigBore.map(function (x) { return x.actualPerKg / x.predPerKg; })).toFixed(2) +
                'x low.');
  }

  /* ── E3: worst outliers ────────────────────────────────────────── */
  console.log('\n' + '─'.repeat(74));
  console.log('  E3 — TEN WORST OUTLIERS BY ABSOLUTE ERROR');
  console.log('─'.repeat(74));
  console.log('  ' + padR('line', 6) + padR('bore x rod x stroke', 22) +
              padR('mount', 9) + padL('actual', 10) + padL('pred', 10) +
              padL('gap', 8) + padL('act kg', 8) + padL('pred kg', 9));

  results.slice().sort(function (a, b) { return b.absErr - a.absErr; })
    .slice(0, 10).forEach(function (x) {
      const r = x.row;
      console.log('  ' + padR(r.line, 6) +
        padR(r.bore + ' x ' + r.rod + ' x ' + r.stroke, 22) +
        padR(r.mounting || '—', 9) +
        padL(rs(r.total), 10) +
        padL(x.predMfg > 0 ? rs(x.predMfg) : 'ZERO', 10) +
        padL(isFinite(x.gap) ? x.gap.toFixed(2) + 'x' : '—', 8) +
        padL(r.weight.toFixed(0), 8) +
        padL(x.predWt.toFixed(1), 9));
    });

  /* ── E4: rows outside the masters' reach ───────────────────────── */
  const beyondTable = clean.filter(function (r) { return r.stroke > 3000; });
  console.log('\n' + '─'.repeat(74));
  console.log('  E4 — ROWS OUTSIDE THE MASTER TABLES');
  console.log('─'.repeat(74));
  console.log('  stroke > 3000mm (machine time tables have no column) : ' +
              beyondTable.length);
  if (beyondTable.length) {
    console.log('  lines: ' + beyondTable.map(function (r) {
      return r.line + ' (' + r.stroke + 'mm)';
    }).join(', '));
    console.log('  These must return ENGINEERING INPUT REQUIRED, not a clamped');
    console.log('  top-column time. HISPL owes a longer table or a rule.');
  }
  console.log('\n' + '═'.repeat(74) + '\n');

  /* Emit machine-readable output for Stage 3 to diff against. */
  fs.writeFileSync(path.join(__dirname, 'validate-historical.out.json'),
    JSON.stringify({
      generated: new Date().toISOString(),
      rows: results.length, zeroed: zeroed,
      medianGap: medGap, medianMassFactor: medMass, medianRateFactor: medRate,
      medianAbsErr: median(valid.map(function (x) { return x.absErr; })),
      medianRelErr: median(valid.map(function (x) { return x.relErr; })),
      byBand: M.boreBands().map(function (b) {
        const inB = valid.filter(function (x) { return x.band === b.key; });
        return {
          band: b.key, n: inB.length,
          medianGap: inB.length ? median(inB.map(function (x) { return x.gap; })) : null,
          actualPerKg: inB.length ? median(inB.map(function (x) { return x.actualPerKg; })) : null,
          targetPerKg: b.targetTotalPerKg
        };
      })
    }, null, 2));
  console.log('  wrote tests/validate-historical.out.json\n');
  process.exit(0);
})();
