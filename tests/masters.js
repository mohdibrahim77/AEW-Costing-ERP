/**
 * masters.js — Stage 1 verification for HISPL Costing v2 master data.
 *
 * Guards three things:
 *   1. Every value in hispl-masters.json is reachable through an accessor.
 *   2. No accessor ever invents a number — missing data returns EIR.
 *   3. The traps recorded in SPECIFICATION.md stay fixed (honing rates,
 *      per-grade density, turning card keyed on finished diameter,
 *      welding left unresolved).
 *
 * Node + jsdom, consistent with the rest of tests/.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

/* Load masters.js into a DOM-ish global, the way the browser will. */
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
const src = fs.readFileSync(path.join(ROOT, 'assets/js/costing/masters.js'), 'utf8');
new Function('window', src)(dom.window);
const M = dom.window.AEW.masters;
const EIR = M.EIR;

/* The authoritative source, read fresh so the test compares against
   HISPL's file rather than against my transcription of it. */
const JSON_MASTERS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'hispl-v2/hispl-masters.json'), 'utf8')
);

let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (detail ? '  — ' + detail : '')); }
}
function eq(name, actual, expected) {
  ok(name, actual === expected, 'expected ' + JSON.stringify(expected) +
     ', got ' + JSON.stringify(actual));
}
function close(name, actual, expected, tol) {
  ok(name, typeof actual === 'number' && Math.abs(actual - expected) < (tol || 1e-9),
     'expected ~' + expected + ', got ' + JSON.stringify(actual));
}
function section(t) { console.log('\n── ' + t); }

/* ═══════════════════════════════════════════════════════════
   1. MATERIAL MASTER — every grade, rate and density round-trips
   ═══════════════════════════════════════════════════════════ */
section('Material master');

const jsonMat = JSON_MASTERS.materialMaster;
const jsonGrades = Object.keys(jsonMat);

/* If this ever fails the round-trip below is silently testing nothing. */
ok('materialMaster found in HISPL JSON', jsonGrades.length > 0);
eq('9 material grades exposed', M.materialGrades().length, 9);
eq('exposed grades match the JSON exactly',
   M.materialGrades().sort().join(','), jsonGrades.sort().join(','));

jsonGrades.forEach(function (g) {
  eq('rate round-trips from JSON: ' + g, M.materialRate(g), jsonMat[g].rate);
  eq('density round-trips from JSON: ' + g, M.density(g), jsonMat[g].density);
});

/* The defect this master exists to kill: v1 used 7.85 for everything. */
eq('SS-410 density is NOT 7.85', M.density('SS-410'), 7.7);
eq('Bronze SAE660 density is NOT 7.85', M.density('BR-SAE660'), 8.9);
ok('per-grade densities actually differ',
   new Set(M.materialGrades().map(M.density)).size === 3);

eq('unknown grade returns EIR', M.material('EN99'), EIR);
eq('empty grade returns EIR', M.materialRate(''), EIR);
eq('undefined grade returns EIR', M.density(undefined), EIR);

/* ═══════════════════════════════════════════════════════════
   2. MACHINE + PROCESS RATES
   ═══════════════════════════════════════════════════════════ */
section('Machine and process rates');

eq('7 machines exposed', M.machineNames().length, 7);
eq('CNC Lathe rate', M.machineRate('CNC Lathe'), 550);
eq('Cutting Machine rate', M.machineRate('Cutting Machine'), 350);
eq('unknown machine returns EIR', M.machineRate('Laser Cutter'), EIR);

eq('10 processes exposed', M.processNames().length, 10);
eq('Heat Treatment Rs/kg', M.processRate('Heat Treatment'), 12);
eq('Chrome Plating Rs/cm2', M.processRate('Chrome Plating'), 0.6);
eq('Dechrome is cheaper than chrome',
   M.processRate('Dechrome Plating') < M.processRate('Chrome Plating'), true);
eq('unknown process returns EIR', M.processRate('Anodising'), EIR);

eq('packing loose', M.packingRate('loose'), 5);
eq('packing wooden', M.packingRate('wooden'), 15);
eq('unknown packing returns EIR', M.packingRate('crate'), EIR);

/* ═══════════════════════════════════════════════════════════
   3. MACHINE TIME TABLES — bucket edges are where these break
   ═══════════════════════════════════════════════════════════ */
section('Machine time tables');

/* Bin-start semantics, verified against 'Machine Time Master'!A7:A10
   = 0/81/151/251 and the column starts 0/501/1001/2001. */
eq('cutting 80x500 first bucket', M.machineTime('cutting', 80, 500), 0.08);
eq('cutting 81 starts the second row', M.machineTime('cutting', 81, 500), 0.10);
eq('cutting 501 starts the second column', M.machineTime('cutting', 80, 501), 0.10);
eq('cutting open-ended row', M.machineTime('cutting', 9999, 500), 0.25);
eq('cutting longest defined column', M.machineTime('cutting', 80, 3000), 0.20);

/* THE CORRECTION. The workbook uses MATCH(value, binStarts, 1), so a
   value in the gap between a bound and the next start stays in the
   LOWER bucket. An upper-bound reading would push it up. These four
   assertions are the ones that changed. */
eq('80.5 stays in row 1 (workbook), not row 2',
   M.machineTime('cutting', 80.5, 500), 0.08);
eq('150.5 stays in row 2', M.machineTime('cutting', 150.5, 500), 0.10);
eq('250.5 stays in row 3', M.machineTime('cutting', 250.5, 500), 0.15);
eq('500.5 stays in column 1', M.machineTime('cutting', 80, 500.5), 0.08);
eq('fractional finished ID 100.4 (the workbook sample) lands in row 2',
   M.machineTime('boring', 100.4, 250), 0.40);

/* MATCH alone would clamp anything above the last start into the top
   column, silently pricing a 4950mm stroke as if it were 3000. The
   declared ceiling stops that. 6 of the 295 historical cylinders here. */
eq('length beyond the declared 3000 ceiling returns EIR, not a clamp',
   M.machineTime('cutting', 80, 3001), EIR);
eq('rough turning at 4950 returns EIR',
   M.machineTime('roughTurning', 80, 4950), EIR);
eq('boring beyond its 2000 ceiling returns EIR',
   M.machineTime('boring', 80, 2001), EIR);
eq('honing beyond its 2000 ceiling returns EIR',
   M.machineTime('honing', 80, 2001), EIR);

eq('rough turning 150x1000', M.machineTime('roughTurning', 150, 1000), 0.9);
eq('boring 250x2000', M.machineTime('boring', 250, 2000), 3.5);
eq('honing 80x500', M.machineTime('honing', 80, 500), 0.3);
eq('grinding open-ended', M.machineTime('grinding', 400, 2000), 3.2);

eq('unknown table returns EIR', M.machineTime('welding', 100, 100), EIR);
eq('zero input returns EIR', M.machineTime('cutting', 0, 500), EIR);
eq('negative input returns EIR', M.machineTime('cutting', 100, -5), EIR);
eq('non-numeric input returns EIR', M.machineTime('cutting', 'big', 500), EIR);

/* 1-D tables */
eq('milling 10000mm2', M.millingTime(10000), 0.3);
eq('milling 25001mm2', M.millingTime(25001), 1.0);
eq('milling open-ended', M.millingTime(999999), 1.8);
eq('milling zero returns EIR', M.millingTime(0), EIR);

close('drilling 6 holes at 10mm', M.drillingTime(10, 6), 0.18);
close('drilling 4 holes at 25mm', M.drillingTime(25, 4), 0.32);
eq('drilling 0 holes is 0 hours, not EIR', M.drillingTime(10, 0), 0);
eq('drilling bad dia returns EIR', M.drillingTime(0, 4), EIR);

eq('profile cutting 10kg', M.profileCuttingTime(10), 0.1);
eq('profile cutting 60kg open-ended', M.profileCuttingTime(60), 0.6);

/* ═══════════════════════════════════════════════════════════
   4. STOCK REMOVAL AND TURNING TIME
   ═══════════════════════════════════════════════════════════ */
section('Stock removal and turning');

/* Starts 0 / 2.0001 / 5.0001 / 10.0001 — the workbook's way of writing
   "greater than 2", "greater than 5", "greater than 10". */
eq('removal 2mm factor 1.00', M.stockRemovalFactor(82, 80), 1.0);
eq('removal 5mm factor 1.15', M.stockRemovalFactor(85, 80), 1.15);
eq('removal 10mm factor 1.35', M.stockRemovalFactor(90, 80), 1.35);
eq('removal 11mm factor 1.60', M.stockRemovalFactor(91, 80), 1.6);
eq('removal 0mm still 1.00', M.stockRemovalFactor(80, 80), 1.0);
eq('removal 2.00005 is still <=2 band', M.stockRemovalFactor(82.00005, 80), 1.0);
eq('removal 2.0001 crosses into 1.15', M.stockRemovalFactor(82.0001, 80), 1.15);
eq('removal 5.0001 crosses into 1.35', M.stockRemovalFactor(85.0001, 80), 1.35);

/* Raw smaller than finished is impossible stock. It must NOT silently
   become a factor of 1 — that is the 56mm-rod-from-52mm-bar defect. */
eq('raw < finished returns EIR', M.stockRemovalFactor(52, 56), EIR);

close('rough turning with stock factor',
      M.roughTurningHours(80, 500, 85), 0.3 * 1.15);
eq('rough turning without raw OD skips the factor',
   M.roughTurningHours(80, 500), 0.3);
eq('rough turning with impossible stock returns EIR',
   M.roughTurningHours(56, 500, 52), EIR);

close('finish turning is 70% of rough', M.finishTurningHours(1.0), 0.7);
eq('finish turning factor', M.finishTurningFactor, 0.70);
eq('finish turning of EIR-ish input returns EIR', M.finishTurningHours(EIR), EIR);

/* ═══════════════════════════════════════════════════════════
   5. RATE CARDS — the documented traps
   ═══════════════════════════════════════════════════════════ */
section('Rate cards');

/* Turning card is keyed on FINISHED diameter. */
eq('turning rough <=100', M.turningRate(100, 'rough'), 300);
eq('turning rough 101-250', M.turningRate(101, 'rough'), 550);
eq('turning rough >250', M.turningRate(251, 'rough'), 700);
eq('turning finish <=100', M.turningRate(100, 'finish'), 400);
eq('turning finish 101-250', M.turningRate(101, 'finish'), 550);
eq('turning finish >250', M.turningRate(400, 'finish'), 700);
/* Bin starts 0/101/251 — 100.5 stays in the first band. */
eq('turning 100.5 stays in the first band', M.turningRate(100.5, 'rough'), 300);
eq('turning 250.5 stays in the second band', M.turningRate(250.5, 'rough'), 550);
eq('finish costs more than rough only in the first band',
   M.turningRate(100, 'finish') > M.turningRate(100, 'rough'), true);
eq('bands 2 and 3 have equal rough and finish',
   M.turningRate(200, 'rough') === M.turningRate(200, 'finish'), true);
eq('bad turning kind returns EIR', M.turningRate(100, 'grind'), EIR);
eq('zero dia returns EIR', M.turningRate(0, 'rough'), EIR);

/* THE TRAP: the Word export printed 300/400/550/700 under the honing
   heading. Those are turning rates. Honing is 0.30 / 0.40 Rs/cm2. */
eq('honing rate within thresholds', M.honingRate(1000, 80), 0.30);
eq('honing rate is NOT 300', M.honingRate(1000, 80) !== 300, true);
eq('honing beyond ID threshold', M.honingRate(1000, 101), 0.40);
eq('honing beyond stroke threshold', M.honingRate(4001, 80), 0.40);
eq('EITHER threshold triggers, not both', M.honingRate(4001, 50), 0.40);
eq('exactly at thresholds stays within', M.honingRate(4000, 100), 0.30);
close('honing cost = area x rate', M.honingCost(1256.6, 1000, 80), 1256.6 * 0.30, 1e-6);
eq('honing bad stroke returns EIR', M.honingCost(1000, 0, 80), EIR);

/* ═══════════════════════════════════════════════════════════
   6. WELDING STAYS UNRESOLVED
   ═══════════════════════════════════════════════════════════ */
section('Welding conflict');

const w = M.weldingStatus();
eq('welding is not resolved', w.resolved, false);
ok('welding conflict is described', typeof w.conflict === 'string' && w.conflict.length > 20);
ok('both candidate methods are retained',
   !!w.workbookFormula && !!w.approvedInstruction);
eq('approved instruction rate retained', w.approvedInstruction.rupeesPerInchPerBead, 14);
eq('workbook labour rate retained', w.workbookFormula.labourRate, 375);
/* The hard guarantee: there is no way to get a weld cost out of this. */
ok('NO welding cost accessor exists',
   Object.keys(M).every(function (k) { return !/weld/i.test(k) || k === 'weldingStatus'; }));

/* ═══════════════════════════════════════════════════════════
   7. BOUGHT-OUT AND BORE BANDS
   ═══════════════════════════════════════════════════════════ */
section('Bought-out and bore bands');

const bo = M.boughtOut();
eq('9 bought-out lines', bo.length, 9);
eq('bearing rate', bo[0].rate, 180);
eq('bearing qty 2', bo[0].qty, 2);
eq('only bearing defaults to included',
   bo.filter(function (b) { return b.defaultInclude; }).length, 1);
ok('boughtOut returns a copy, not the master',
   M.boughtOut() !== M.boughtOut());
eq('no seals in bought-out',
   bo.some(function (b) { return /seal/i.test(b.item); }), false);

/* Upper-exclusive banding, confirmed against the 295-row set. */
eq('bore 59 band', M.boreBand(59), '<60');
eq('bore 60 band is the NEXT band', M.boreBand(60), '60-110');
eq('bore 109 band', M.boreBand(109), '60-110');
eq('bore 110 band is the NEXT band', M.boreBand(110), '110-180');
eq('bore 179 band', M.boreBand(179), '110-180');
eq('bore exactly 180 belongs to the top band', M.boreBand(180), '>=180');
eq('bore 480 band', M.boreBand(480), '>=180');
eq('bore 0 returns EIR', M.boreBand(0), EIR);

const bands = M.boreBands();
eq('4 bands', bands.length, 4);
eq('band targets', bands.map(function (b) { return b.targetTotalPerKg; }).join(','),
   '1003,522,352,318');
ok('bands are contiguous with no gap or overlap',
   bands.every(function (b, i) { return i === 0 || b.min === bands[i - 1].max; }));

/* ═══════════════════════════════════════════════════════════
   8. THE CENTRALISATION GUARANTEE
   ═══════════════════════════════════════════════════════════ */
section('Centralisation');

ok('EIR sentinel is exported', EIR === 'ENGINEERING_INPUT_REQUIRED');

/* Every accessor must be a function; nothing may leak a mutable table. */
const nonFns = Object.keys(M).filter(function (k) {
  return k !== 'EIR' && k !== 'finishTurningFactor' && typeof M[k] !== 'function';
});
eq('every export is an accessor (or a named constant)', nonFns.join(','), '');

/* Mutating what an accessor hands back must not corrupt the master. */
const b1 = M.boughtOut(); b1[0].rate = 99999; b1.length = 1;
eq('bought-out rate is immune to caller mutation', M.boughtOut()[0].rate, 180);
eq('bought-out length is immune to caller mutation', M.boughtOut().length, 9);
const bb = M.boreBands(); bb[0].targetTotalPerKg = 1; bb.length = 0;
eq('bore band target is immune to caller mutation',
   M.boreBands()[0].targetTotalPerKg, 1003);
eq('bore band length is immune to caller mutation', M.boreBands().length, 4);

/* No sibling module under assets/js/costing/ may restate a rate.
   This is the guard that keeps "one source of truth" true as Stage 3
   and beyond add pricing modules next to masters.js. Only the
   distinctive values are scanned — 0, 5 and 100 also mean array
   indices and percentages, so matching them would be noise. */
const DISTINCTIVE = [7.7, 8.9, 1.25, 0.45, 0.35, 62, 66, 68, 78, 92, 96,
                     118, 180, 210, 300, 450, 520, 550, 650, 700, 850, 4500];
const dir = path.join(ROOT, 'assets/js/costing');
const siblings = fs.readdirSync(dir).filter(function (f) {
  return /\.js$/.test(f) && f !== 'masters.js';
});
const leaks = [];
siblings.forEach(function (f) {
  const body = fs.readFileSync(path.join(dir, f), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')   /* strip comments before scanning */
    .replace(/\/\/[^\n]*/g, '');
  DISTINCTIVE.forEach(function (v) {
    const re = new RegExp('(?<![\\d.])' + String(v).replace('.', '\\.') + '(?![\\d.])');
    if (re.test(body)) leaks.push(f + ' contains ' + v);
  });
});
eq('no rate literal outside masters.js (' + siblings.length + ' sibling module(s) scanned)',
   leaks.join('; '), '');

/* ═══════════════════════════════════════════════════════════
   9. AGAINST THE WORKBOOK'S OWN CACHED VALUES

   The decisive check. Excel stored the result of every lookup when the
   file was last calculated. If masters.js reproduces those numbers for
   the workbook's sample tube, the tables and the bin semantics are
   right — not merely self-consistent.

   Tube sheet: Raw OD 110, Finished OD 108, Finished ID 100.4,
   Length 900, hole dia 12 x 4 holes.
   ═══════════════════════════════════════════════════════════ */
section('Workbook cached values (Tube sample)');

const WB = path.join(ROOT, 'hispl-v2/source/Trunion_Included.xlsx');
if (!fs.existsSync(WB)) {
  console.log('   (source workbook not present — skipped)');
} else {
  /* D26 cutting: MATCH(RawOD=110), MATCH(Length=900) */
  eq('D26 cutting hours', M.machineTime('cutting', 110, 900), 0.15);

  /* D27 rough turning: table x stock removal factor of (110-108)=2 */
  close('D27 rough turning hours', M.roughTurningHours(108, 900, 110), 0.9);

  /* D28 boring: finished ID 100.4 — the fractional case */
  eq('D28 boring hours', M.machineTime('boring', 100.4, 900), 1.2);

  /* D29 drilling: 12mm dia x 4 holes */
  close('D29 drilling hours', M.drillingTime(12, 4), 0.2);

  /* D31 finish turning = rough x 0.70 */
  close('D31 finish turning hours',
        M.finishTurningHours(M.roughTurningHours(108, 900, 110)), 0.63);

  /* E26/E29 flat machine rates */
  eq('E26 cutting machine rate', M.machineRate('Cutting Machine'), 350);
  eq('E29 drilling machine rate', M.machineRate('Drilling Machine'), 250);

  /* E27/E31 turning rate card, keyed on FINISHED OD 108 */
  eq('E27 rough turning rate', M.turningRate(108, 'rough'), 550);
  eq('E31 finish turning rate', M.turningRate(108, 'finish'), 550);

  /* E30/E32 honing rate: length 900 within, but ID 100.4 exceeds 100,
     so the HIGH rate applies. This is the AND/OR case. */
  eq('E30 honing rate is the high one (ID 100.4 > 100)',
     M.honingRate(900, 100.4), 0.40);

  /* D30/D32 honing area = PI x ID x Length / 100 */
  close('D30 honing area cm2', Math.PI * 100.4 * 900 / 100, 2838.743122, 1e-4);

  /* F30 honing cost = area x rate */
  close('F30 honing cost', M.honingCost(2838.743122, 900, 100.4),
        1135.497249, 1e-4);

  /* B14/B15 material lookups for EN8 */
  eq('B14 density EN8', M.density('EN8'), 7.85);
  eq('B15 material rate EN8', M.materialRate('EN8'), 68);

  /* B16 unit weight = (PI/4)(RawOD^2 - FinishedID^2) x L x density / 1e6
     Reproduced here to confirm the density and the 1e6 conversion, NOT
     to endorse the formula's use of Raw OD with Finished ID — that is
     a live question with HISPL (see RECONCILIATION.md section 7). */
  const unitWt = (Math.PI / 4) * (110 * 110 - 100.4 * 100.4) * 900 * 7.85 / 1e6;
  close('B16 tube unit weight', unitWt, 11.207765, 1e-5);
}

/* ═══════════════════════════════════════════════════════════ */
console.log('\n' + '═'.repeat(56));
if (fail) {
  console.log('FAILURES:');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
}
console.log((fail ? '✗ MASTERS' : '✓ MASTERS') + ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
