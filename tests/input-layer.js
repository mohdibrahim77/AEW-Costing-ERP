/**
 * input-layer.js — the input surface is exactly ten, and geometry is exactly
 * what the document approves.
 *
 * The property worth guarding is negative: nothing may quietly become
 * an eleventh input, and no dimension may quietly acquire a default.
 * Both failures would look like progress — a tool that asks for less
 * and answers more — while producing numbers nobody can source.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

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

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++; else { fail++; failures.push(name + (detail ? '  — ' + detail : '')); }
}
function eq(name, a, b) {
  ok(name, a === b, 'expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}
function section(t) { console.log('\n── ' + t); }

/* ═══════════════════════════════════════════════════════════
   1. EXACTLY TEN
   ═══════════════════════════════════════════════════════════ */
section('The input surface');

eq('exactly ten inputs', I.count(), 10);
eq('in the document\'s order', I.keys().join(','),
   'inquiryNo,inquiryDate,customerName,customerLoc,cylinderName,' +
   'bore,rodDia,stroke,mounting,workingPress');

/* Job Type is the eleventh row of the workbook's sheet and is NOT here.
   It must be recorded as a divergence, not silently dropped. */
ok('Job Type is not an input',
   I.keys().indexOf('jobType') === -1);
const div = I.divergences();
ok('Job Type is recorded as a divergence', div.length === 1);
ok('the divergence names both sources',
   /B13/.test(div[0].workbook) && /section 7/.test(div[0].document));

/* The three that actually drive geometry must be required. */
['bore', 'rodDia', 'stroke'].forEach(function (k) {
  const f = I.all().filter(function (x) { return x.key === k; })[0];
  ok(k + ' is required', f && f.required === true);
});

/* ═══════════════════════════════════════════════════════════
   2. VALIDATION
   ═══════════════════════════════════════════════════════════ */
section('Validation');

const good = I.validate({
  inquiryNo: 'INQ-1', inquiryDate: '2026-08-26', customerName: 'X',
  bore: 100, rodDia: 56, stroke: 800
});
eq('a complete enquiry validates', good.ok, true);
eq('numbers come through as numbers', good.values.bore, 100);

const noBore = I.validate({ inquiryNo: 'I', customerName: 'X',
                            rodDia: 56, stroke: 800 });
eq('a missing bore fails', noBore.ok, false);
ok('and says which field', noBore.errors.some(function (e) {
  return e.key === 'bore' && e.why === 'required'; }));

/* The defect five rows of the cost sheet carry. */
const fatRod = I.validate({ inquiryNo: 'I', customerName: 'X',
                            bore: 70, rodDia: 320, stroke: 850 });
eq('rod >= bore is rejected', fatRod.ok, false);
ok('and explains why', fatRod.errors.some(function (e) {
  return e.key === 'rodDia' && /cannot be as wide/.test(e.why); }));

const equalRod = I.validate({ inquiryNo: 'I', customerName: 'X',
                              bore: 36, rodDia: 36, stroke: 280 });
eq('rod == bore is also rejected', equalRod.ok, false);

/* ═══════════════════════════════════════════════════════════
   3. GEOMETRY — ONE RULE, AND ONLY ONE
   ═══════════════════════════════════════════════════════════ */
section('Approved geometry');

eq('exactly one rule runs on the ten inputs', G.ruleCount(), 1);
const r = G.rules()[0];
eq('it is Finished Tube ID', r.dimension, 'finishedID');
eq('from Bore', r.rule, 'Bore');
ok('and cites section 9', /section 9/i.test(r.source));

const d = G.derive({ bore: 125, rodDia: 70, stroke: 900 });
eq('bore 125 gives finished ID 125', d.dims.tube.finishedID, 125);
eq('one rule applied', d.applied.length, 1);

/* The rules the document states but cannot run must be reported. */
ok('four stated-but-blocked rules are named', G.blockedRules().length === 4);
['Finished Tube OD', 'Raw Tube ID', 'Raw Tube OD', 'Trunnion Thickness']
  .forEach(function (label) {
    ok('blocked rule reported: ' + label,
       G.blockedRules().some(function (b) { return b.label === label; }));
  });
ok('every blocked rule names what it needs',
   G.blockedRules().every(function (b) { return !!b.needs; }));

eq('eighteen geometry masters are named', G.requiredMasters().length, 18);

/* No bore may be turned into a tube OD. This is the inference the
   single dimensioned cylinder invites and rule 5 forbids. */
const derived = G.derive({ bore: 100, rodDia: 56, stroke: 800 });
ok('no finished OD is derived', derived.dims.tube.finishedOD === undefined);
ok('no raw OD is derived', derived.dims.tube.rawOD === undefined);
ok('no length is derived', derived.dims.tube.length === undefined);
ok('nothing is derived for any other component',
   Object.keys(derived.dims).join(',') === 'tube');

/* The workbook's own cylinder must NOT reproduce itself from the
   inputs. Bore 100 gave finished ID 100.4 there; our rule gives 100.
   If these ever agree, someone has hard-coded the sample. */
eq('the rule gives bore exactly, not the sample\'s 100.4',
   derived.dims.tube.finishedID, 100);

/* ═══════════════════════════════════════════════════════════
   4. NOTHING GETS DEFAULTED
   ═══════════════════════════════════════════════════════════ */
section('No silent defaults');

const applied = G.applyTo({}, { bore: 100, rodDia: 56, stroke: 800 });
const run = E.cost({ bore: 100, rodDia: 56, stroke: 800 }, applied.supply);

eq('no total from the ten inputs alone', run.totalManufacturingCost, EIR);
eq('no component costs', run.components.filter(function (c) {
  return typeof c.total === 'number'; }).length, 0);
eq('no cylinder weight', run.cylinderWeight, EIR);
ok('every component reports what it needs',
   run.components.every(function (c) {
     return c.missingDims.length > 0 || c.weldingWithheld; }));
ok('the outstanding list is populated',
   run.engineeringInputRequired.length > 60);

/* A supplied dimension is a manual override and must win. */
const override = G.applyTo({ tube: { dims: { finishedID: 100.4 } } },
                           { bore: 100, rodDia: 56, stroke: 800 });
eq('a supplied value overrides the rule',
   override.supply.tube.dims.finishedID, 100.4);

/* The one thing that does resolve needs no geometry at all. */
ok('bought-out still resolves', run.other.boughtOut === 360);

console.log('\n' + '═'.repeat(56));
if (fail) {
  console.log('FAILURES:');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
}
console.log((fail ? '✗ INPUT-LAYER' : '✓ INPUT-LAYER') + ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
