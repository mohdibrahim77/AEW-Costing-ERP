/**
 * reconcile-extractions.js — two independent readings of one workbook.
 *
 * Route A: pure Node — zlib.inflateRawSync over the ZIP, then the
 *          sheet XML read directly for <f> and <v>.
 * Route B: openpyxl, run separately.
 *
 * Neither is privileged. Where they disagree, the .xlsx itself decides,
 * and the reason is named rather than a route preferred.
 */
const fs = require('fs');
const path = require('path');
const { readWorkbook } = require('../hispl-v2/source/tools/xlsx.js');

const ROOT = path.resolve(__dirname, '..');
const mine = readWorkbook(path.join(ROOT, 'hispl-v2/source/Trunion_Included.xlsx'));
const theirs = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'hispl-v2/source/independent/workbook-raw.json'), 'utf8'));

const padR = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
function line(ch) { console.log((ch || '─').repeat(76)); }

/* Normalise a formula for comparison: openpyxl keeps the leading '=',
   the raw XML does not. Excel also writes TRUE() where openpyxl may
   report TRUE. */
function normF(f) {
  if (f === null || f === undefined) return null;
  let s = String(f).trim();
  if (s.charAt(0) === '=') s = s.slice(1);
  return s.replace(/\s+/g, '');
}

/* Cached values: theirs renders dates as strings, mine as serials;
   floats may differ in the last bit. */
function sameValue(a, b) {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) {
    return (a === null || a === undefined) && (b === null || b === undefined);
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 1e-6 || Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b)) < 1e-9;
  }
  return String(a).trim() === String(b).trim();
}

console.log('');
line('═');
console.log('  RECONCILING TWO INDEPENDENT EXTRACTIONS');
line('═');

/* ── Sheet coverage ─────────────────────────────────────────────── */
const mySheets = mine.sheets.map(s => s.name);
const theirSheets = Object.keys(theirs);
console.log('');
console.log('  sheets — route A: ' + mySheets.length + '   route B: ' + theirSheets.length);
const onlyA = mySheets.filter(s => theirSheets.indexOf(s) === -1);
const onlyB = theirSheets.filter(s => mySheets.indexOf(s) === -1);
if (onlyA.length) console.log('    only in A: ' + onlyA.join(', '));
if (onlyB.length) console.log('    only in B: ' + onlyB.join(', '));
if (!onlyA.length && !onlyB.length) console.log('    identical sheet set');

/* ── Formula counting, by category ──────────────────────────────── */
let myTotal = 0, mySharedStub = 0, myReal = 0, myCells = 0;
mine.sheets.forEach(function (s) {
  if (!s.cells) return;
  Object.values(s.cells).forEach(function (c) {
    myCells++;
    if (!c.f) return;
    myTotal++;
    if (c.f === '(shared//inherited)') mySharedStub++; else myReal++;
  });
});

let theirTotal = 0, theirCells = 0;
theirSheets.forEach(function (n) {
  Object.values(theirs[n]).forEach(function (c) {
    theirCells++;
    if (c.formula !== null && c.formula !== undefined) theirTotal++;
  });
});

console.log('');
line();
console.log('  FORMULA COUNT');
line();
console.log('  route A total formula cells        : ' + myTotal);
console.log('     of which carry formula TEXT     : ' + myReal);
console.log('     of which are shared-formula     : ' + mySharedStub);
console.log('       children (an <f/> with no text)');
console.log('  route B total formula cells        : ' + theirTotal);
console.log('');
console.log('  difference A - B                   : ' + (myTotal - theirTotal));
console.log('  shared-formula children in A       : ' + mySharedStub);
console.log('  A minus its shared children        : ' + myReal +
            (myReal === theirTotal ? '   <- equals route B' : ''));

/* ── Cell-level comparison ──────────────────────────────────────── */
let compared = 0, fDiff = [], vDiff = [], aOnly = [], bOnly = [];

mine.sheets.forEach(function (s) {
  if (!s.cells) return;
  const t = theirs[s.name];
  if (!t) return;
  Object.keys(s.cells).forEach(function (ref) {
    const a = s.cells[ref], b = t[ref];
    if (!b) {
      if (a.v !== null || a.f) aOnly.push(s.name + '!' + ref);
      return;
    }
    compared++;
    const af = a.f === '(shared//inherited)' ? null : normF(a.f);
    const bf = normF(b.formula);
    if (af !== bf) {
      /* A shared child in A against a real formula in B is expected —
         B expands them. Record separately. */
      if (a.f === '(shared//inherited)' && bf) return;
      fDiff.push({ cell: s.name + '!' + ref, a: a.f, b: b.formula });
    }
    if (!sameValue(a.v, b.value)) {
      vDiff.push({ cell: s.name + '!' + ref, a: a.v, b: b.value });
    }
  });
  Object.keys(t).forEach(function (ref) {
    if (!s.cells[ref]) bOnly.push(s.name + '!' + ref);
  });
});

console.log('');
line();
console.log('  CELL-BY-CELL');
line();
console.log('  cells compared                     : ' + compared);
console.log('  formula-text disagreements         : ' + fDiff.length);
console.log('  cached-value disagreements         : ' + vDiff.length);
console.log('  present in A only                  : ' + aOnly.length);
console.log('  present in B only                  : ' + bOnly.length);

if (fDiff.length) {
  console.log('');
  console.log('  FORMULA DISAGREEMENTS:');
  fDiff.slice(0, 20).forEach(function (d) {
    console.log('    ' + padR(d.cell, 30));
    console.log('       A: ' + JSON.stringify(d.a));
    console.log('       B: ' + JSON.stringify(d.b));
  });
  if (fDiff.length > 20) console.log('    … and ' + (fDiff.length - 20) + ' more');
}

if (vDiff.length) {
  console.log('');
  console.log('  VALUE DISAGREEMENTS:');
  vDiff.slice(0, 25).forEach(function (d) {
    console.log('    ' + padR(d.cell, 30) +
      ' A=' + padR(JSON.stringify(d.a), 26) + ' B=' + JSON.stringify(d.b));
  });
  if (vDiff.length > 25) console.log('    … and ' + (vDiff.length - 25) + ' more');
}

if (aOnly.length) {
  console.log('');
  console.log('  IN A ONLY: ' + aOnly.slice(0, 25).join(', ') +
              (aOnly.length > 25 ? ' …' : ''));
}
if (bOnly.length) {
  console.log('');
  console.log('  IN B ONLY: ' + bOnly.slice(0, 25).join(', ') +
              (bOnly.length > 25 ? ' …' : ''));
}

console.log('');
line('═');
console.log('');
