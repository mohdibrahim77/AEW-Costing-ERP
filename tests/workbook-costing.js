/**
 * workbook-costing.js — cost the workbook's own cylinder.
 *
 * The workbook contains exactly one fully dimensioned cylinder: bore
 * 100, rod 56, stroke 800, with every component dimension typed in by
 * the estimator. This reads those typed values straight out of the
 * .xlsx — using the cell addresses recorded in components.js, so the
 * mapping verifies itself — runs them through the v2 engine, and
 * compares the result against the workbook's own cached totals.
 *
 * It is the strongest check available: our engine against HISPL's
 * spreadsheet, on HISPL's data, with no dimension supplied by us.
 *
 * TWO ASSUMPTIONS ARE APPLIED, AND BOTH ARE LABELLED IN THE OUTPUT.
 *
 * 1. Eight sheets name grades (MS-C45, MS-EN8, MS-PLATE-IS2062) that do
 *    not exist in the Material Master — an unfinished rename. The
 *    workbook itself returns #N/A for all eight and produces no total.
 *    We map MS-<X> to <X>. That is a reading, not a fact, and it is
 *    question 3a to HISPL.
 *
 * 2. Welding stays withheld. No weld cost is included in any total
 *    here. What each method WOULD add is reported separately.
 *
 * Run: node tests/workbook-costing.js
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { readWorkbook } = require('../hispl-v2/source/tools/xlsx.js');

const ROOT = path.resolve(__dirname, '..');
const WB_PATH = path.join(ROOT, 'hispl-v2/source/Trunion_Included.xlsx');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
const win = dom.window;
['masters', 'components', 'engine'].forEach(function (m) {
  new Function('window', fs.readFileSync(
    path.join(ROOT, 'assets/js/costing/' + m + '.js'), 'utf8'))(win);
});
const M = win.AEW.masters, C = win.AEW.components, E = win.AEW.engine;
const EIR = M.EIR;

const wb = readWorkbook(WB_PATH);
function sheet(name) {
  return wb.sheets.filter(function (s) { return s.name === name; })[0];
}
function cellVal(sheetName, ref) {
  const s = sheet(sheetName);
  if (!s || !ref) return undefined;
  const c = s.cells[ref];
  return c ? c.v : undefined;
}

const rs = function (n) { return 'Rs' + Math.round(n).toLocaleString('en-IN'); };
const padR = function (s, n) { return String(s).padEnd(n); };
const padL = function (s, n) { return String(s).padStart(n); };
const isNum = function (v) { return typeof v === 'number' && isFinite(v); };
function line(ch) { console.log((ch || '─').repeat(76)); }

/* ── The enquiry, from the Inquiry Input sheet ──────────────────── */
const inquiry = {
  no:       cellVal('Inquiry Input', 'B3'),
  customer: cellVal('Inquiry Input', 'B5'),
  name:     cellVal('Inquiry Input', 'B7'),
  bore:     cellVal('Inquiry Input', 'B8'),
  rodDia:   cellVal('Inquiry Input', 'B9'),
  stroke:   cellVal('Inquiry Input', 'B10'),
  mounting: cellVal('Inquiry Input', 'B11'),
  pressure: cellVal('Inquiry Input', 'B12'),
  jobType:  cellVal('Inquiry Input', 'B13')
};

console.log('');
line('═');
console.log('  COSTING THE WORKBOOK\'S OWN CYLINDER');
console.log('  ' + inquiry.name + '  ·  ' + inquiry.customer);
console.log('  Bore ' + inquiry.bore + '  Rod ' + inquiry.rodDia +
            '  Stroke ' + inquiry.stroke + '  ' + inquiry.mounting +
            '  ' + inquiry.pressure + ' bar');
line('═');

/* ── Read every typed dimension, by the cell components.js records ─ */
const GRADE_MAP = {};        /* what we assumed, for the report */
const supply = {};
let readCount = 0, absentCount = 0;
const absent = [];

C.all().forEach(function (def) {
  const rawGrade = cellVal(def.sheet, def.gradeCell);
  let grade = rawGrade;
  if (typeof grade === 'string' && /^MS-/.test(grade)) {
    const stripped = grade.replace(/^MS-/, '');
    if (M.material(stripped) !== EIR) {
      GRADE_MAP[def.sheet] = rawGrade + ' -> ' + stripped;
      grade = stripped;
    }
  }

  const dims = {};
  def.dims.forEach(function (d) {
    if (!d.cell) { absentCount++; absent.push(def.name + '.' + d.key); return; }
    const v = cellVal(def.sheet, d.cell);
    if (typeof v === 'number' && isFinite(v)) { dims[d.key] = v; readCount++; }
    else { absentCount++; absent.push(def.name + '.' + d.key + ' (' + d.cell + ')'); }
  });

  supply[def.key] = {
    grade: grade,
    dims: dims,
    qty: cellVal(def.sheet, 'B10') && def.key === 'trunnion' ? 2 : undefined,
    shape: def.shaped ? cellVal(def.sheet, def.shapeCell) : undefined,
    newMaterial: cellVal(def.sheet, 'B4') !== 'No'
  };
});

console.log('');
console.log('  Typed dimensions read from the workbook : ' + readCount);
console.log('  Cells not present on the sheet          : ' + absentCount);
if (GRADE_MAP.length !== 0) {
  console.log('');
  console.log('  ASSUMPTION — unfinished MS- rename, mapped to the real grade:');
  Object.keys(GRADE_MAP).forEach(function (k) {
    console.log('    ' + padR(k, 18) + GRADE_MAP[k]);
  });
  console.log('    (question 3a to HISPL — the workbook itself returns #N/A here)');
}

/* ── Run it ────────────────────────────────────────────────────── */
const result = E.cost(inquiry, supply);

/* ── Component table, against the workbook's cached totals ─────── */
const CACHED = {
  tube:        cellVal('Tube', 'B74'),
  pistonRod:   cellVal('Piston Rod', 'B60'),
  cushionBush: cellVal('Cushion Bush', 'B38'),
  trunnion:    cellVal('Trunnion', 'B45')
};

console.log('');
line();
console.log('  COMPONENTS');
line();
console.log('  ' + padR('Component', 15) + padR('Grade', 14) +
            padL('Weight', 10) + padL('Material', 11) + padL('Process', 11) +
            padL('Total', 11) + '  Status');

let costed = 0, blocked = 0;
result.components.forEach(function (c) {
  if (isNum(c.total)) costed++; else blocked++;
  console.log('  ' + padR(c.name, 15) + padR(c.grade, 14) +
    padL(isNum(c.weight) ? c.weight.toFixed(2) + 'kg' : '—', 10) +
    padL(isNum(c.materialCost) ? rs(c.materialCost) : '—', 11) +
    padL(isNum(c.processCost) ? rs(c.processCost) : '—', 11) +
    padL(isNum(c.total) ? rs(c.total) : '—', 11) + '  ' +
    (isNum(c.total) ? 'costed'
      : (c.weldingWithheld ? 'welding withheld'
         : c.missingDims.length + ' dims short')));
});

/* ── The validation that matters ───────────────────────────────── */
console.log('');
line();
console.log('  AGAINST THE WORKBOOK\'S OWN CACHED TOTALS');
line();
console.log('  Only four components resolve in the workbook itself; the other');
console.log('  eight are #N/A because of the MS- rename.');
console.log('');
console.log('  ' + padR('Component', 15) + padL('Workbook', 13) +
            padL('Engine', 12) + padL('Diff', 11) + '  Note');

Object.keys(CACHED).forEach(function (key) {
  const want = CACHED[key];
  const got = result.components.filter(function (c) { return c.key === key; })[0];
  if (!isNum(want)) return;
  const mine = got && isNum(got.total) ? got.total : null;
  const note = mine === null
    ? (got && got.weldingWithheld ? 'welding withheld — not comparable'
       : 'blocked')
    : (Math.abs(mine - want) <= 1 ? 'matches' : 'DIFFERS');
  console.log('  ' + padR(got ? got.name : key, 15) +
    padL(rs(want), 13) +
    padL(mine === null ? '—' : rs(mine), 12) +
    padL(mine === null ? '—' : rs(mine - want), 11) + '  ' + note);
});

/* Material and process halves, which ARE comparable even where welding
   blocks the component total. */
console.log('');
console.log('  Material cost alone, where the workbook resolves it:');
[['tube', 'Tube', 'B18'], ['pistonRod', 'Piston Rod', 'B17'],
 ['cushionBush', 'Cushion Bush', 'B17'], ['trunnion', 'Trunnion', 'B17']]
  .forEach(function (row) {
    const want = cellVal(row[1], row[2]);
    const got = result.components.filter(function (c) { return c.key === row[0]; })[0];
    if (!isNum(want) || !got || !isNum(got.materialCost)) return;
    console.log('    ' + padR(got.name, 15) + padL(rs(want), 12) +
      padL(rs(got.materialCost), 12) +
      '   ' + (Math.abs(got.materialCost - want) <= 1 ? 'matches' : 'DIFFERS'));
  });

/* ── Roll-up ───────────────────────────────────────────────────── */
console.log('');
line();
console.log('  COST SUMMARY');
line();

const sumCosted = result.components.reduce(function (n, c) {
  return n + (isNum(c.totalForQty) ? c.totalForQty : 0); }, 0);
const weightCosted = result.components.reduce(function (n, c) {
  return n + (isNum(c.weight) ? c.weight * c.qty : 0); }, 0);

/* Every component's weight resolves even where its cost does not. */
const weightAll = weightCosted;
const weightTubeRod = result.components.reduce(function (n, c) {
  return n + ((c.key === 'tube' || c.key === 'pistonRod') && isNum(c.weight)
    ? c.weight * c.qty : 0); }, 0);

console.log('  Components costed                : ' + costed + ' of 12');
console.log('  Components blocked               : ' + blocked);
console.log('  Sum of the costed components     : ' + rs(sumCosted));
console.log('  Weight of the costed components  : ' + weightCosted.toFixed(2) + ' kg');
console.log('  Bought-out (bearing x2)          : ' + rs(result.other.boughtOut));
console.log('');
console.log('  TOTAL MANUFACTURING COST         : ' +
  (isNum(result.totalManufacturingCost)
    ? rs(result.totalManufacturingCost)
    : 'ENGINEERING INPUT REQUIRED'));
if (!isNum(result.totalManufacturingCost)) {
  console.log('    blocked by: ' + result.blockedComponents.join(', '));
}

/* ── What welding would add, both ways ─────────────────────────── */
console.log('');
line();
console.log('  WELDING — WITHHELD, BOTH METHODS SHOWN');
line();
const F = M.weldingStatus().workbookFormula;
let wbWeld = 0, inchWeld = 0;
result.components.forEach(function (c) {
  c.welds.forEach(function (w) {
    if (!isNum(w.weldDia)) return;
    const beads = w.weldDia <= F.diaThresholdForBeads
      ? F.beadsIfDiaLessOrEqual : F.beadsIfDiaGreater;
    const wbCost = w.labour + w.wire;
    const inchCost = (Math.PI * w.weldDia / 25.4) * beads * 14;
    wbWeld += wbCost; inchWeld += inchCost;
    console.log('  ' + padR(c.name + ' — ' + w.label, 44) +
      padL(w.weldDia + 'mm', 8) + padL(beads + ' beads', 10) +
      padL(rs(wbCost), 10) + padL(rs(inchCost), 10));
  });
});
console.log('  ' + padR('', 44) + padL('', 8) + padL('TOTAL', 10) +
            padL(rs(wbWeld), 10) + padL(rs(inchWeld), 10));
console.log('');
console.log('  Difference: ' + rs(inchWeld - wbWeld) + ' per cylinder.');
console.log('  Neither is applied above. Question 2 to HISPL.');
/* Tube and Piston Rod are blocked ONLY on welding — their material and
   process costs are fully known. Adding them back gives the complete
   cylinder under each method, rather than a total that silently drops
   the two largest components. */
let weldBlockedBase = 0;
result.components.forEach(function (c) {
  if (isNum(c.total)) return;              /* already in sumCosted */
  if (!c.weldingWithheld) return;          /* genuinely blocked, skip */
  const mat = isNum(c.materialCost) ? c.materialCost : 0;
  const proc = c.processes.reduce(function (n, p) {
    return n + (isNum(p.cost) ? p.cost : 0); }, 0);
  weldBlockedBase += (mat + proc) * c.qty;
});

const base = sumCosted + weldBlockedBase + result.other.boughtOut;
/* The decisive check: apply the workbook's own welding formula to the
   two components it blocks, and see whether they land on the workbook's
   cached totals. */
console.log('');
console.log('  With the workbook formula applied, those two become:');
[['tube', 'Tube'], ['pistonRod', 'Piston Rod']].forEach(function (row) {
  const c = result.components.filter(function (x) { return x.key === row[0]; })[0];
  if (!c) return;
  const mat = isNum(c.materialCost) ? c.materialCost : 0;
  const proc = c.processes.reduce(function (n, p) {
    return n + (isNum(p.cost) ? p.cost : 0); }, 0);
  const wcost = c.welds.reduce(function (n, w) { return n + (w.labour + w.wire); }, 0);
  const mine = mat + proc + wcost;
  const want = CACHED[row[0]];
  console.log('    ' + padR(c.name, 14) + 'engine ' + padL(rs(mine), 9) +
    '   workbook ' + padL(rs(want), 9) + '   ' +
    (Math.abs(mine - want) <= 1 ? 'MATCHES' : 'differs by ' + rs(mine - want)));
});

console.log('');
console.log('  Components blocked only on welding add back : ' + rs(weldBlockedBase));
console.log('  (their material and process costs are fully known)');
console.log('');
console.log('  COMPLETE CYLINDER, workbook welding formula : ' + rs(base + wbWeld));
console.log('  COMPLETE CYLINDER, Rs 14 per inch per bead  : ' + rs(base + inchWeld));
console.log('');
console.log('  Cylinder weight, all twelve components      : ' +
            weightAll.toFixed(2) + ' kg');
console.log('  Tube + rod only, as the current tool models : ' +
            weightTubeRod.toFixed(2) + ' kg');
console.log('  Ratio                                       : ' +
            (weightAll / weightTubeRod).toFixed(2) + 'x');

/* ── Anything still missing ────────────────────────────────────── */
if (result.engineeringInputRequired.length) {
  console.log('');
  line();
  console.log('  STILL ENGINEERING INPUT REQUIRED — ' +
              result.engineeringInputRequired.length);
  line();
  const byComp = {};
  result.engineeringInputRequired.forEach(function (r) {
    (byComp[r.componentName] = byComp[r.componentName] || []).push(r.label);
  });
  Object.keys(byComp).forEach(function (k) {
    console.log('  ' + padR(k, 16) + byComp[k].join(', '));
  });
  console.log('');
  console.log('  These have no cell on their sheet — the workbook does not');
  console.log('  carry them either.');
}

console.log('');
line('═');
console.log('');
