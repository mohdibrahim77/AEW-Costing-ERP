/**
 * engine.js — Stage 3 verification.
 *
 * Guards the properties that matter more than any single number:
 *   1. Nothing is invented. A missing dimension yields EIR and stays
 *      EIR all the way to the total — never a zero, never a default.
 *   2. The workbook's shape is preserved: per-process Apply? gates,
 *      the New Material? reuse flag, Section D feeding the total
 *      unconditionally, the Cost Summary roll-up order.
 *   3. Welding produces no money while the method is unresolved.
 *   4. Given the workbook's own Tube dimensions, the engine reproduces
 *      the workbook's own cached numbers.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const win = dom.window;
['masters', 'components', 'engine'].forEach(function (m) {
  new Function('window', fs.readFileSync(
    path.join(ROOT, 'assets/js/costing/' + m + '.js'), 'utf8'))(win);
});
const M = win.AEW.masters;
const C = win.AEW.components;
const E = win.AEW.engine;
const EIR = M.EIR;

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++; else { fail++; failures.push(name + (detail ? '  — ' + detail : '')); }
}
function eq(name, a, b) {
  ok(name, a === b, 'expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}
function close(name, a, b, tol) {
  ok(name, typeof a === 'number' && Math.abs(a - b) < (tol || 1e-6),
     'expected ~' + b + ', got ' + JSON.stringify(a));
}
function section(t) { console.log('\n── ' + t); }

/* ═══════════════════════════════════════════════════════════
   1. THE TWELVE COMPONENTS
   ═══════════════════════════════════════════════════════════ */
section('Component definitions');

eq('twelve components', C.all().length, 12);
eq('Cost Summary order preserved', C.keys().join(','),
   'tube,pistonRod,capEndCover,headEndCover,gland,cushionBush,stopTube,' +
   'rearEye,rodEye,piston,flange,trunnion');

const tube = C.byKey('tube');
eq('tube has 7 processes', tube.processes.length, 7);
eq('tube has 3 welds', tube.welds.length, 3);
eq('piston rod has 10 processes', C.byKey('pistonRod').processes.length, 10);
eq('piston rod has 1 weld', C.byKey('pistonRod').welds.length, 1);
eq('stop tube has 1 process', C.byKey('stopTube').processes.length, 1);
eq('cushion bush has 2 processes', C.byKey('cushionBush').processes.length, 2);
eq('trunnion has 5 processes', C.byKey('trunnion').processes.length, 5);
eq('trunnion defaults to a pair', C.byKey('trunnion').defaultQty, 2);
eq('cushion bush is bronze', C.byKey('cushionBush').defaultGrade, 'BR-SAE660');
eq('only tube and piston rod weld',
   C.all().filter(function (c) { return c.welds.length; })
     .map(function (c) { return c.key; }).join(','), 'tube,pistonRod');

/* The boring row the workbook cannot resolve. */
const boring = tube.processes.filter(function (p) { return p.process === 'Boring'; })[0];
eq('boring resolved to a real machine', boring.machine, 'Center Lathe');
ok('boring carries the workbook-defect note', /Conventional Lathe/.test(boring.note));
eq('boring defaults to not applied', boring.applyDefault, false);

/* ═══════════════════════════════════════════════════════════
   2. NO GEOMETRY IS INVENTED
   ═══════════════════════════════════════════════════════════ */
section('Geometry surfaces ENGINEERING INPUT REQUIRED');

const undeclared = C.undeclaredDimensions();
eq('every dimension is still undeclared',
   undeclared.length, C.requiredDimensions().length);
ok('there are dimensions to declare', undeclared.length > 40);
ok('no dimension claims a derivation',
   C.requiredDimensions().every(function (d) { return d.derivedFrom === null; }));

/* An enquiry with the 11 inputs and NO dimensions must not produce a
   number. This is the whole design in one assertion. */
const bare = E.cost({ bore: 100, rodDia: 56, stroke: 800 }, {});
eq('a bare enquiry produces no total', bare.totalManufacturingCost, EIR);
eq('and is not marked complete', bare.complete, false);
eq('and no cylinder weight', bare.cylinderWeight, EIR);
eq('all twelve components blocked', bare.blockedComponents.length, 12);
ok('it names what it needs', bare.engineeringInputRequired.length > 40);
ok('every requirement names a component and a label',
   bare.engineeringInputRequired.every(function (r) {
     return r.component && r.label; }));

/* The workbook's silent zero, explicitly not reproduced. */
ok('weight is EIR rather than a partial sum',
   bare.cylinderWeight === EIR && bare.weightMissing.length === 12);

/* ═══════════════════════════════════════════════════════════
   3. THE TUBE, WITH THE WORKBOOK'S OWN DIMENSIONS
   ═══════════════════════════════════════════════════════════ */
section('Tube against the workbook sample');

/* Trunion_Included.xlsx, Tube sheet: EN8, raw OD 110, finished OD 108,
   finished ID 100.4, length 900, hole 12mm x 4, qty 1. */
const tubeSupply = {
  grade: 'EN8',
  dims: { rawOD: 110, finishedOD: 108, finishedID: 100.4, length: 900,
          holeDia: 12, holeCount: 4 },
  qty: 1
};
const t = E.runComponent(tube, tubeSupply, { stroke: 900 });

close('B14 density', t.density, 7.85);
close('B15 material rate', t.materialRate, 68);
close('B16 unit weight', t.weight, 11.207765, 1e-5);
eq('B18 material cost', t.materialCost, 762);   /* 11.207765 x 68 = 762.13 */
eq('no missing dimensions', t.missingDims.length, 0);

const byName = {};
t.processes.forEach(function (p) { byName[p.process] = p; });

close('D26 cutting hours', byName['Cutting'].hours, 0.15);
eq('E26 cutting rate', byName['Cutting'].rate, 350);
eq('F26 cutting cost', byName['Cutting'].cost, 53);   /* 0.15 x 350 = 52.5 */

close('D27 rough turning hours', byName['Rough Turning'].hours, 0.9);
eq('E27 rough turning rate', byName['Rough Turning'].rate, 550);
eq('F27 rough turning cost', byName['Rough Turning'].cost, 495);

close('D29 drilling hours', byName['Drilling'].hours, 0.2);
eq('E29 drilling rate', byName['Drilling'].rate, 250);
eq('F29 drilling cost', byName['Drilling'].cost, 50);

close('D31 finish turning hours', byName['Finish Turning'].hours, 0.63);
eq('E31 finish turning rate', byName['Finish Turning'].rate, 550);
eq('F31 finish turning cost', byName['Finish Turning'].cost, 347);  /* 346.5 */

close('D30 honing area cm2', byName['Rough Honing'].qty, 2838.743122, 1e-4);
eq('E30 honing rate is the high one', byName['Rough Honing'].rate, 0.40);
eq('F30 honing cost', byName['Rough Honing'].cost, 1135);

eq('honing is charged twice, as the workbook does',
   byName['Finished Honing'].cost, byName['Rough Honing'].cost);

eq('boring is not applied by default', byName['Boring'].applied, false);
eq('an unapplied process costs zero', byName['Boring'].cost, 0);

/* ═══════════════════════════════════════════════════════════
   4. WELDING IS COMPUTED BUT WITHHELD
   ═══════════════════════════════════════════════════════════ */
section('Welding held behind weldingStatus()');

eq('three weld blocks on the tube', t.welds.length, 3);
const w0 = t.welds[0];
eq('weld diameter from finished OD', w0.weldDia, 108);
eq('beads: 108 <= 250 so 5', w0.beads, 5);
close('weld length = PI x dia x beads', w0.weldLength, 1696.460033, 1e-4);
close('welding hours', w0.hours, 0.471238898, 1e-6);
close('labour cost', w0.labour, 176.7145868, 1e-4);
close('wire cost', w0.wire, 135.7168026, 1e-4);

/* The mechanics are right — and still no money comes out. */
eq('weld cost is withheld', w0.cost, EIR);
eq('and says why', w0.withheld, true);
eq('component welding cost is EIR', t.weldingCost, EIR);
ok('the component is blocked on welding',
   t.blocked.some(function (b) { return /welding method unresolved/.test(b); }));
eq('so the tube has no total', t.total, EIR);

/* Above the bead threshold. */
const bigWeld = E.runComponent(tube, {
  grade: 'EN8',
  dims: { rawOD: 320, finishedOD: 300, finishedID: 280, length: 900,
          holeDia: 12, holeCount: 4 }
}, { stroke: 900 });
eq('beads: 300 > 250 so 8', bigWeld.welds[0].beads, 8);

/* ═══════════════════════════════════════════════════════════
   5. THE TWO GATES
   ═══════════════════════════════════════════════════════════ */
section('Apply? and New Material?');

/* Per-process Apply? */
const noHoning = E.runComponent(tube, {
  grade: 'EN8', dims: tubeSupply.dims,
  apply: { 'Rough Honing': false, 'Finished Honing': false }
}, { stroke: 900 });
const nh = {};
noHoning.processes.forEach(function (p) { nh[p.process] = p; });
eq('a switched-off process costs zero', nh['Rough Honing'].cost, 0);
eq('and is marked not applied', nh['Rough Honing'].applied, false);
eq('other processes are untouched', nh['Cutting'].cost, 53);

/* New Material? = No zeroes material but keeps process cost. */
const reused = E.runComponent(tube, {
  grade: 'EN8', dims: tubeSupply.dims, newMaterial: false
}, { stroke: 900 });
eq('reused component has no material cost', reused.materialCost, 0);
eq('but still has its weight', Math.round(reused.weight * 1000),
   Math.round(t.weight * 1000));
const ru = {};
reused.processes.forEach(function (p) { ru[p.process] = p; });
eq('and still pays for process', ru['Cutting'].cost, 53);

/* ═══════════════════════════════════════════════════════════
   6. SECTION D AND THE ROLL-UP
   ═══════════════════════════════════════════════════════════ */
section('Section D and Cost Summary');

/* Cushion bush resolves fully — no welds, both processes costable. */
const cb = E.runComponent(C.byKey('cushionBush'), {
  grade: 'BR-SAE660', dims: { od: 130, id: 57, length: 70 }, qty: 1
}, { stroke: 900 });
ok('cushion bush costs cleanly', typeof cb.total === 'number');
ok('bronze density used', cb.density === 8.9);

const cbPlus = E.runComponent(C.byKey('cushionBush'), {
  grade: 'BR-SAE660', dims: { od: 130, id: 57, length: 70 }, qty: 1,
  additionalCost: 500
}, { stroke: 900 });
eq('Section D adds straight to the total', cbPlus.total, cb.total + 500);
eq('Section D is not gated by Apply?', cbPlus.additionalCost, 500);

/* Quantity multiplies the component total, as B75 does. */
const cbQty = E.runComponent(C.byKey('cushionBush'), {
  grade: 'BR-SAE660', dims: { od: 130, id: 57, length: 70 }, qty: 3
}, { stroke: 900 });
eq('total for qty', cbQty.totalForQty, cb.total * 3);

/* Bought-out: only the bearing defaults in, at rate x qty. */
eq('bought-out default is the bearing only', bare.other.boughtOut, 360);
const withValve = E.cost({ stroke: 800 },
  { boughtOut: { 'Check Valve': true } });
eq('including a check valve adds its rate', withValve.other.boughtOut, 360 + 650);

/* Other costs roll up even when components are blocked — they are
   independent of geometry. */
const withOther = E.cost({ stroke: 800 },
  { assemblyCost: 750, paintingCost: 900, packingCost: 2250 });
eq('other costs subtotal', withOther.other.subtotal, 360 + 750 + 900 + 2250);
eq('but the total is still blocked', withOther.totalManufacturingCost, EIR);

/* ═══════════════════════════════════════════════════════════
   7. EIR PROPAGATES — never silently zero
   ═══════════════════════════════════════════════════════════ */
section('EIR propagation');

/* One dimension short. */
const short = E.runComponent(C.byKey('gland'), {
  grade: 'C45', dims: { od: 130, id: 57 }   /* no length */
}, { stroke: 900 });
eq('missing length blocks the weight', short.weight, EIR);
eq('and the material cost', short.materialCost, EIR);
eq('and the total', short.total, EIR);
ok('and it says which dimension', short.missingDims.some(function (d) {
  return d.key === 'length'; }));
ok('total is never 0 when blocked', short.total !== 0);

/* Unknown grade. */
const badGrade = E.runComponent(C.byKey('gland'), {
  grade: 'MS-C45', dims: { od: 130, id: 57, length: 70 }
}, { stroke: 900 });
eq('an unknown grade blocks density', badGrade.density, EIR);
eq('and the weight', badGrade.weight, EIR);
ok('and names the grade', badGrade.blocked.some(function (b) {
  return /MS-C45/.test(b); }));

/* Beyond a table ceiling. */
const tooLong = E.runComponent(tube, {
  grade: 'EN8',
  dims: { rawOD: 110, finishedOD: 108, finishedID: 100.4, length: 4950,
          holeDia: 12, holeCount: 4 }
}, { stroke: 4950 });
const tl = {};
tooLong.processes.forEach(function (p) { tl[p.process] = p; });
eq('a 4950mm part has no cutting time', tl['Cutting'].cost, EIR);
ok('and says so', /no value for/.test(tl['Cutting'].blocked || ''));
eq('which blocks the process subtotal', tooLong.processCost, EIR);

/* ═══════════════════════════════════════════════════════════
   8. TRACEABILITY
   ═══════════════════════════════════════════════════════════ */
section('Traceability payload');

const tr = E.traceability(E.cost({ bore: 100, rodDia: 56, stroke: 900 },
  { tube: tubeSupply }));
ok('traceability produces rows', tr.length > 20);
ok('every row names its component', tr.every(function (r) { return !!r.component; }));
ok('every row names a source', tr.every(function (r) { return !!r.source; }));
ok('costed rows cite the master they used',
   tr.some(function (r) { return /Machine Rate Master/.test(r.source); }));
ok('rate-card rows are identified',
   tr.some(function (r) { return /Turning Rate Card/.test(r.source); }));
ok('blocked dimensions explain themselves',
   tr.some(function (r) { return /ENGINEERING INPUT REQUIRED/.test(r.source); }));
ok('the density row cites the grade',
   tr.some(function (r) { return r.what === 'density' && /EN8/.test(r.source); }));

/* ═══════════════════════════════════════════════════════════ */
console.log('\n' + '═'.repeat(56));
if (fail) {
  console.log('FAILURES:');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
}
console.log((fail ? '✗ ENGINE' : '✓ ENGINE') + ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
