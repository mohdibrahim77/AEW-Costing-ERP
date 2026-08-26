/**
 * coverage.js — how much of a cylinder's cost do the ten inputs reach?
 *
 * Runs the engine three ways on the same cylinder and compares:
 *
 *   A  the ten inputs alone, plus every approved geometry rule
 *   B  the ten inputs plus the dimensions typed in the workbook
 *   C  what the workbook itself computes
 *
 * A is what the tool can do today for a NEW enquiry. B is the ceiling —
 * what it produces once someone supplies the dimensions. The gap
 * between them is exactly what the geometry masters are worth.
 *
 * The reference cylinder is the workbook's own: bore 100, rod 56,
 * stroke 800. Using it means B and C are checkable against HISPL's
 * cached figures rather than against our own opinion.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { readWorkbook } = require('../hispl-v2/source/tools/xlsx.js');

const ROOT = path.resolve(__dirname, '..');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const win = dom.window;
['masters', 'inputs', 'components', 'geometry', 'engine'].forEach(function (m) {
  new Function('window', fs.readFileSync(
    path.join(ROOT, 'assets/js/costing/' + m + '.js'), 'utf8'))(win);
});
const M = win.AEW.masters, I = win.AEW.inputs, C = win.AEW.components,
      G = win.AEW.geometry, E = win.AEW.engine;
const EIR = M.EIR;

const wb = readWorkbook(path.join(ROOT, 'hispl-v2/source/Trunion_Included.xlsx'));
function cellVal(sheetName, ref) {
  const s = wb.sheets.filter(function (x) { return x.name === sheetName; })[0];
  if (!s || !ref) return undefined;
  const c = s.cells[ref];
  return c ? c.v : undefined;
}

const isNum = function (v) { return typeof v === 'number' && isFinite(v); };
const rs = function (n) { return 'Rs' + Math.round(n).toLocaleString('en-IN'); };
const pct = function (n) { return (n * 100).toFixed(1) + '%'; };
const padR = function (s, n) { return String(s).padEnd(n); };
const padL = function (s, n) { return String(s).padStart(n); };
function line(ch) { console.log((ch || '─').repeat(74)); }

/* ── The ten inputs, read from the workbook's Inquiry Input sheet ── */
const raw = I.fromCells(function (ref) { return cellVal('Inquiry Input', ref); });
const v = I.validate(raw);

console.log('');
line('═');
console.log('  INPUT COVERAGE — what the ten inputs reach');
line('═');
console.log('');
console.log('  Input surface : ' + I.count() + ' fields (document section 7)');
console.log('  Validation    : ' + (v.ok ? 'ok' : v.errors.length + ' error(s)'));
v.errors.forEach(function (e) { console.log('     ' + e.label + ' — ' + e.why); });

console.log('');
console.log('  ' + padR('Field', 42) + 'Value');
I.all().forEach(function (f) {
  const val = v.values[f.key];
  console.log('  ' + padR(f.label, 42) +
    (val === '' || val === undefined ? '(blank)' : String(val)));
});

I.divergences().forEach(function (d) {
  console.log('');
  console.log('  DIVERGENCE — ' + d.field);
  console.log('     workbook : ' + d.workbook);
  console.log('     document : ' + d.document);
  console.log('     handling : ' + d.handling);
});

/* ── The approved geometry rules ────────────────────────────────── */
const g = G.derive(v.values);
console.log('');
line();
console.log('  APPROVED GEOMETRY RULES');
line();
console.log('  Rules that run on the ten inputs : ' + g.applied.length);
g.applied.forEach(function (r) {
  console.log('     ' + padR(r.label, 22) + '= ' + padR(r.rule, 12) +
              '-> ' + r.value + '   (' + r.component + '.' + r.dimension + ')');
});
console.log('');
console.log('  Rules the document states but which cannot run : ' + g.blocked.length);
g.blocked.forEach(function (r) {
  console.log('     ' + padR(r.label, 22) + '= ' + padR(r.rule, 34));
  console.log('       needs ' + r.needs);
});
console.log('');
console.log('  Geometry masters section 8 says must be created : ' +
            G.requiredMasters().length);

/* ── A: ten inputs + approved rules ─────────────────────────────── */
const runA = (function () {
  const applied = G.applyTo({}, v.values);
  return E.cost(v.values, applied.supply);
})();

/* ── B: plus the workbook's typed dimensions ────────────────────── */
const supplyB = {};
C.all().forEach(function (def) {
  let grade = cellVal(def.sheet, def.gradeCell);
  if (typeof grade === 'string' && /^MS-/.test(grade)) {
    const s = grade.replace(/^MS-/, '');
    if (M.material(s) !== EIR) grade = s;
  }
  const dims = {};
  def.dims.forEach(function (d) {
    if (!d.cell) return;
    const val = cellVal(def.sheet, d.cell);
    if (isNum(val)) dims[d.key] = val;
  });
  supplyB[def.key] = {
    grade: grade, dims: dims,
    shape: def.shaped ? cellVal(def.sheet, def.shapeCell) : undefined,
    qty: def.key === 'trunnion' ? 2 : undefined
  };
});
const runB = E.cost(v.values, supplyB);

/* Full value of the cylinder under B, adding back the two components
   blocked only on welding, with the workbook's own welding formula. */
function fullValue(result) {
  let total = result.other.boughtOut, welded = 0;
  result.components.forEach(function (c) {
    if (isNum(c.totalForQty)) { total += c.totalForQty; return; }
    if (!c.weldingWithheld) return;
    const mat = isNum(c.materialCost) ? c.materialCost : 0;
    const proc = c.processes.reduce(function (n, p) {
      return n + (isNum(p.cost) ? p.cost : 0); }, 0);
    const w = c.welds.reduce(function (n, x) { return n + (x.labour + x.wire); }, 0);
    welded += w;
    total += (mat + proc + w) * c.qty;
  });
  return total;
}

const valueA = fullValue(runA);
const valueB = fullValue(runB);

/* ── The answer ─────────────────────────────────────────────────── */
console.log('');
line('═');
console.log('  COVERAGE');
line('═');
console.log('');
console.log('  ' + padR('', 44) + padL('A: ten inputs', 16) + padL('B: + dimensions', 17));
console.log('  ' + padR('Components costed', 44) +
  padL(runA.components.filter(function (c) { return isNum(c.total); }).length + ' of 12', 16) +
  padL(runB.components.filter(function (c) { return isNum(c.total); }).length + ' of 12', 17));
console.log('  ' + padR('Cylinder value reached', 44) +
  padL(rs(valueA), 16) + padL(rs(valueB), 17));
console.log('');
console.log('  ' + padR('THE TEN INPUTS REACH', 44) +
            padL(pct(valueA / valueB), 16));
console.log('');

/* What that residual actually is. */
console.log('  What the ten inputs do reach, line by line:');
let any = false;
runA.components.forEach(function (c) {
  if (isNum(c.total) && c.total > 0) {
    any = true;
    console.log('     ' + padR(c.name, 20) + padL(rs(c.total), 10));
  }
});
if (runA.other.boughtOut) {
  any = true;
  console.log('     ' + padR('Bought-out (bearing)', 20) +
              padL(rs(runA.other.boughtOut), 10) +
              '   master-driven; needs no geometry');
}
if (!any) console.log('     (nothing)');

console.log('');
console.log('  Everything else waits on the geometry masters. Component');
console.log('  dimensions cannot be derived from bore, rod and stroke,');
console.log('  because no approved rule for them exists — section 8 of the');
console.log('  reference document says so and lists the ' +
            G.requiredMasters().length + ' masters needed.');

/* ── Per component, what is missing ─────────────────────────────── */
console.log('');
line();
console.log('  WHAT EACH COMPONENT STILL NEEDS');
line();
runA.components.forEach(function (c) {
  const missing = c.missingDims.map(function (d) { return d.label; });
  console.log('  ' + padR(c.name, 16) +
    (missing.length ? missing.join(', ').slice(0, 92) :
      (c.weldingWithheld ? '(welding method unresolved)' : '(complete)')));
});

console.log('');
console.log('  Total dimensions outstanding : ' + runA.engineeringInputRequired.length);
console.log('');
line('═');
console.log('');
