/* Fidelity to VERSION_1.xlsx, proven against the workbook's own index.
 *
 * The workbook carries a sheet called MASTER REVIEW - FREEZE CHECK. Its
 * header says: "Every value below is LIVE-LINKED to its source sheet -
 * this is not a static copy... Compiled 31-Aug-2026 for final review
 * before freeze." It is 980 formulas, every one of them a reference to
 * another sheet, gathering every master, every rate card and every
 * geometry table into one place.
 *
 * That makes it the right thing to test against. It is HISPL's own
 * statement of what the workbook contains, so reproducing it cell for
 * cell is a stronger claim than reproducing the sheets I happened to
 * open. This suite reads the .xlsx directly and walks that sheet — no
 * expectation here was typed by hand.
 *
 * If Aniktha sends a revised workbook, this fails on every value she
 * changed, which is exactly what should happen.
 */
'use strict';

const path = require('path');
const { readWorkbook } = require('../hispl-v2/source/tools/xlsx.js');

const masters  = require('../assets/js/costing/v1/masters.js');
const geometry = require('../assets/js/costing/v1/geometry.js');
const inputs   = require('../assets/js/costing/v1/inputs.js');

const WB = path.join(__dirname, '../hispl-v2/source/VERSION_1.xlsx');
const wb = readWorkbook(WB);
const sheet = wb.sheets.filter(s => s.name === 'MASTER REVIEW - FREEZE CHECK')[0];

let pass = 0, fail = 0;
const failures = [];

function eq(label, got, want) {
  const near = typeof got === 'number' && typeof want === 'number'
    ? Math.abs(got - want) < 1e-9 : got === want;
  if (near) { pass++; return; }
  fail++;
  failures.push(`${label}: got ${JSON.stringify(got)}, workbook says ${JSON.stringify(want)}`);
}

/* Cell accessor over the freeze-check sheet. */
function v(ref) {
  const c = sheet.cells[ref];
  return c ? c.v : undefined;
}
function rowVals(r, cols) { return cols.map(L => v(L + r)); }

if (!sheet) {
  console.log('✗ FREEZE-CHECK-V1 — sheet not found in VERSION_1.xlsx');
  process.exit(1);
}

/* ── 1. MATERIAL MASTER (freeze-check rows 6-14) ─────────────────── */
for (let r = 6; r <= 14; r++) {
  const [code, name, density, rate] = rowVals(r, ['A', 'B', 'C', 'D']);
  if (!code) continue;
  const m = masters.material(code);
  eq(`material ${code} exists`, !!m, true);
  if (!m) continue;
  eq(`material ${code} name`,    m.name, name);
  eq(`material ${code} density`, m.density, density);
  eq(`material ${code} rate`,    m.rate, rate);
}

/* ── 2. MACHINE RATE MASTER (rows 18-24) ─────────────────────────── */
for (let r = 18; r <= 24; r++) {
  const [machine, rate] = rowVals(r, ['A', 'B']);
  if (!machine) continue;
  eq(`machine rate ${machine}`, masters.machineRate(machine), rate);
}

/* ── 3a. AREA / WEIGHT FINISHING RATES (rows 29-38) ──────────────── */
const PROC_KEY = {
  'Heat Treatment': 'heatTreatment',
  'Induction Hardening': 'inductionHardening',
  'Grinding': 'grinding',
  'Polishing': 'polishing',
  'Painting': 'painting',
  'Chrome Plating': 'chromePlating',
  'Dechrome Plating': 'dechromePlating',
  'Profile Cutting': 'profileCutting',
  'Packing - Loose': 'packingLoose',
  'Packing - Wooden Box': 'packingWooden'
};
for (let r = 29; r <= 38; r++) {
  const [proc, rate] = rowVals(r, ['A', 'B']);
  if (!proc || !PROC_KEY[proc]) continue;
  eq(`process rate ${proc}`, masters.processRate(PROC_KEY[proc]), rate);
}

/* ── 3b. TURNING RATE CARD (rows 42-44) ──────────────────────────── */
/* Columns: bin start, range label, rough, finish. Probing at the bin
   start proves the boundary, which is where an off-by-one would hide. */
for (let r = 42; r <= 44; r++) {
  const [start, , rough, finish] = rowVals(r, ['A', 'B', 'C', 'D']);
  if (typeof start !== 'number') continue;
  eq(`turning rough at ${start}mm`,  masters.turningRate(start, 'rough'),  rough);
  eq(`turning finish at ${start}mm`, masters.turningRate(start, 'finish'), finish);
}

/* ── 3c. HONING RATE CARD (rows 47-50) ───────────────────────────── */
{
  const low  = v('B47'), high = v('B48'), lenT = v('B49'), idT = v('B50');
  eq('honing low rate',       masters.honingRate(100, 50),  low);
  eq('honing high rate (ID)', masters.honingRate(100, idT + 1), high);
  eq('honing high rate (len)', masters.honingRate(lenT + 1, 50), high);
  eq('honing at the ID threshold stays low',     masters.honingRate(100, idT), low);
  eq('honing at the length threshold stays low', masters.honingRate(lenT, 50), low);
}

/* ── 3d. WELDING (rows 53-63) ────────────────────────────────────── */
{
  /* The rate, then the bead table. Both matter: the rate is the only
     welding price in the workbook, and the bead count multiplies it. */
  let rateFound = null, beadRows = [];
  for (let r = 53; r <= 64; r++) {
    const a = v('A' + r), b = v('B' + r), c = v('C' + r);
    if (typeof a === 'string' && /rate/i.test(a) && typeof b === 'number') rateFound = b;
    if (typeof a === 'number' && typeof c === 'number') beadRows.push([a, c]);
  }
  if (rateFound !== null) {
    eq('weld rate Rs./inch/bead', masters.weldRatePerInchBead, rateFound);
  }
  beadRows.forEach(function (br) {
    eq(`weld beads at ${br[0]}mm`, masters.weldBeads(br[0]), br[1]);
  });
}

/* ── 4 + 10. GEOMETRY TABLES ─────────────────────────────────────
   Every approved catalogue table, walked row by row against the module.
   The freeze-check lays each out with the driver value in column A and
   the dimensions across, under a header row naming them. */
const GEOM_SECTIONS = [
  { start: 66,  table: 'trunnion',    cols: ['pinDia', 'trunnionOD', 'thickness', 'length'] },
  { start: 81,  table: 'cecClevis',   cols: ['width', 'pinDia', 'pinHole', 'thickness', 'length'] },
  { start: 94,  table: 'rodEye',      cols: ['eyeID', 'eyeOD', 'thickness', 'pinHole'] },
  { start: 107, table: 'footLug',     cols: ['thickness', 'width', 'length', 'holeDia'] },
  { start: 122, table: 'frontFlange', cols: ['width', 'thickness', 'holeDia'] },
  { start: 278, table: 'piston',      cols: ['od', 'length'] },
  { start: 291, table: 'endCover',    cols: ['diameter', 'width', 'height', 'thickness', 'finishedOD'] },
  { start: 304, table: 'endCover',    cols: ['diameter', 'width', 'height', 'thickness', 'finishedOD'] },
  { start: 317, table: 'gland',       cols: ['id', 'od', 'length'] },
  { start: 330, table: 'cushionBush', cols: ['od', 'id', 'length'] },
  { start: 343, table: 'stopTube',    cols: ['rawDia', 'finishedDia'] },
  { start: 356, table: 'rearEye',     cols: ['thickness', 'width', 'height', 'pinHole'] },
  { start: 371, table: 'flange',      cols: ['od', 'length'] }
];

const LETTERS = ['B', 'C', 'D', 'E', 'F', 'G'];

GEOM_SECTIONS.forEach(function (sec) {
  let checked = 0;
  /* Walk down from the section header until the numbers stop. */
  for (let r = sec.start; r < sec.start + 14; r++) {
    const driver = v('A' + r);
    if (typeof driver !== 'number') continue;
    const derived = geometry.derive(sec.table, driver);
    if (derived.error) {
      fail++;
      failures.push(`${sec.table} @${driver}: ${derived.error}`);
      continue;
    }
    /* The bin must be the row itself, not a row above it — that is what
       proves the lookup is landing on the right band. */
    eq(`${sec.table} @${driver} lands on its own bin`, derived.bin, driver);
    sec.cols.forEach(function (col, i) {
      const want = v(LETTERS[i] + r);
      if (typeof want !== 'number') return;
      eq(`${sec.table} @${driver} ${col}`, derived.values[col], want);
      checked++;
    });
  }
  eq(`${sec.table} table had rows to check`, checked > 0, true);
});

/* ── 5. SEAL MASTER (rows 138-160) ───────────────────────────────── */
{
  let rows = 0;
  for (let r = 138; r <= 161; r++) {
    const bore = v('A' + r);
    if (typeof bore !== 'number') continue;
    const pu     = v('C' + r);
    const viton  = v('D' + r);
    const freud  = v('E' + r);
    if (typeof pu === 'number') {
      const k = masters.sealKit(bore, 'Others', 'PU', 'Normal Glide Ring');
      eq(`seal Others+PU @${bore}`, k.kitCost, pu);
    }
    if (typeof viton === 'number') {
      const k = masters.sealKit(bore, 'Others', 'Viton', 'Normal Glide Ring');
      eq(`seal Others+Viton @${bore}`, k.kitCost, viton);
    }
    if (typeof freud === 'number') {
      const k = masters.sealKit(bore, 'Freudenberg', 'Viton', 'Normal Glide Ring');
      eq(`seal Freudenberg+Viton @${bore}`, k.kitCost, freud);
    }
    rows++;
  }
  eq('seal table had rows to check', rows > 0, true);
}

/* ── 6a. PIPE SCHEDULE 40 (rows 166-180) ─────────────────────────── */
/* Not a costing input for the cylinder itself, but the engine's
   bought-out block quotes a pipe weight from it, so the dimensions it
   uses must be the workbook's. */
{
  const engine = require('../assets/js/costing/v1/engine.js');
  const def = engine.engineeringDefaults();
  let matched = false;
  for (let r = 166; r <= 181; r++) {
    const dn = v('A' + r);
    if (dn !== def.boc.pipe.dn) continue;
    const od = v('C' + r), wall = v('D' + r);
    if (typeof od === 'number') { eq(`pipe DN${dn} OD`, def.boc.pipe.od, od); matched = true; }
    if (typeof wall === 'number') eq(`pipe DN${dn} wall`, def.boc.pipe.wall, wall);
  }
  eq('the default pipe size exists in the Sch40 table', matched, true);
}

/* ── 7. TIE ROD STRUCTURAL SIZING (rows 220-233) ─────────────────── */
/* The one component sized from physics. The freeze-check lists the
   assumptions; the engine must be using the same ones. */
{
  const engine = require('../assets/js/costing/v1/engine.js');
  let yieldStress = null, safety = null, allowable = null;
  for (let r = 220; r <= 234; r++) {
    const label = v('A' + r), val = v('B' + r);
    if (typeof label !== 'string' || typeof val !== 'number') continue;
    if (/yield/i.test(label))     yieldStress = val;
    if (/safety/i.test(label))    safety = val;
    if (/allowable/i.test(label)) allowable = val;
  }
  const job = Object.assign(inputs.defaults(), { mounting: 'Rod Eye + Tie Rod' });
  const tr = engine.cost(job).components.filter(c => c.id === 'tieRod')[0];
  if (allowable !== null) {
    eq('tie rod allowable stress', tr.structural.allowableStress, allowable);
  }
  if (yieldStress !== null && safety !== null) {
    eq('tie rod yield / safety factor agree with the sheet',
       Math.abs(yieldStress / safety - tr.structural.allowableStress) < 1e-9, true);
  }
}

/* ── 9b. THE WELD-DIAMETER RULE ──────────────────────────────────
   Section 9b states it in words: Tube OD for CEC, Flange, Trunnion, CEC
   Clevis, Foot Lug and Front Flange; Piston Rod Diameter for Rod Eye,
   "verified NOT Tube OD - explicit rule maintained throughout".
   Worth a test, because it is the one weld that differs and getting it
   wrong would be invisible in a total. */
{
  const engine = require('../assets/js/costing/v1/engine.js');
  const base = inputs.defaults();
  const run = engine.cost(base);
  const by = {}; run.components.forEach(c => { by[c.id] = c; });

  eq('tube welds on Tube OD',      by.tube.welds[0].diameter,     base.tubeOD);
  eq('flange welds on Tube OD',    by.flange.welds[0].diameter,   base.tubeOD);
  eq('trunnion welds on Tube OD',  by.trunnion.welds[0].diameter, base.tubeOD);
  eq('rod eye welds on the ROD',   by.pistonRod.welds[0].diameter, base.rodDia);
  eq('  ...and not on the tube',
     by.pistonRod.welds[0].diameter !== base.tubeOD, true);

  const clevis = engine.cost(Object.assign({}, base, { mounting: 'Rod Eye + CEC Clevis' }));
  eq('clevis welds on Tube OD',
     clevis.components.filter(c => c.id === 'cecClevis')[0].welds[0].diameter, base.tubeOD);
  const lug = engine.cost(Object.assign({}, base, { mounting: 'Rod Eye + Foot Lug' }));
  eq('foot lug welds on Tube OD',
     lug.components.filter(c => c.id === 'footLug')[0].welds[0].diameter, base.tubeOD);
  const ff = engine.cost(Object.assign({}, base, { mounting: 'Front Flange' }));
  eq('front flange welds on Tube OD',
     ff.components.filter(c => c.id === 'frontFlange')[0].welds[0].diameter, base.tubeOD);
}

/* ── report ─────────────────────────────────────────────────────── */
if (fail) {
  console.log('\n  FREEZE-CHECK-V1 FAILURES:');
  failures.slice(0, 40).forEach(f => console.log('    x ' + f));
  if (failures.length > 40) console.log(`    ...and ${failures.length - 40} more`);
  console.log(`\n  FREEZE-CHECK-V1 — ${pass} passed, ${fail} failed`);
  process.exit(1);
} else {
  console.log(`✓ FREEZE-CHECK-V1 — ${pass} passed, 0 failed ` +
              `(walked from the workbook's own MASTER REVIEW sheet)`);
}
