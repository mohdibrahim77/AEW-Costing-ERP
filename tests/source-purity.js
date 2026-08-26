/**
 * source-purity.js — the three-way source rule, enforced.
 *
 *   WORD DOCUMENT      structure and intent only. NO numeric value.
 *   TRUNION workbook   every value and every calculation.
 *   COST_SHEET         reference and validation only. NEVER a value.
 *
 * Why this suite exists rather than a note in a document.
 *
 * The Word reference exports its tables shifted one heading down, so
 * each heading displays the PREVIOUS section's table. Under "5.2 Honing
 * Rate Card" it prints 300 / 400 / 550 / 700 — those are the TURNING
 * rates. The real honing rates, 0.30 and 0.40 Rs/cm2, appear nowhere in
 * that document at all.
 *
 * Anyone building honing from that document would price it about a
 * thousand times too high, and the code would look entirely reasonable.
 * A rule that lives only in prose does not survive that. This suite
 * fails the build instead.
 *
 * The cost sheet is last financial year's quotations. It is legitimate
 * evidence about what a real job looks like and completely illegitimate
 * as a source of rates: quoting from last year's prices, mixed with
 * whatever margin was applied at the time, is not costing.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COSTING_DIR = path.join(ROOT, 'assets/js/costing');

let pass = 0, fail = 0;
const failures = [];
function ok(name, cond, detail) {
  if (cond) pass++; else { fail++; failures.push(name + (detail ? '  — ' + detail : '')); }
}
function eq(name, a, b) {
  ok(name, a === b, 'expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}
function section(t) { console.log('\n── ' + t); }

/* Read the costing modules with comments stripped — a comment may
   legitimately quote a wrong number in order to warn about it, and that
   is exactly what several of these files do. */
function sources() {
  return fs.readdirSync(COSTING_DIR)
    .filter(function (f) { return /\.js$/.test(f); })
    .map(function (f) {
      const raw = fs.readFileSync(path.join(COSTING_DIR, f), 'utf8');
      return {
        file: f,
        raw: raw,
        code: raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
      };
    });
}

const FILES = sources();
ok('costing modules found', FILES.length >= 3,
   'got ' + FILES.map(function (f) { return f.file; }).join(', '));

/* ═══════════════════════════════════════════════════════════
   1. THE WORD DOCUMENT SUPPLIES NO NUMBERS
   ═══════════════════════════════════════════════════════════ */
section('Word document — structure only, never a value');

/* The mangled honing table, in order. If this sequence appears as a
   run of values anywhere in the costing code, someone has transcribed
   the document's shifted table. */
const MANGLED = [300, 400, 550, 700];

FILES.forEach(function (f) {
  /* Look for the four numbers appearing close together as data — an
     array, or successive properties — which is how a transcribed table
     would land. */
  const nums = (f.code.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  let runFound = false;
  for (let i = 0; i + 3 < nums.length; i++) {
    if (nums[i] === MANGLED[0] && nums[i + 1] === MANGLED[1] &&
        nums[i + 2] === MANGLED[2] && nums[i + 3] === MANGLED[3]) {
      runFound = true; break;
    }
  }
  ok('no 300/400/550/700 run in ' + f.file, !runFound,
     'that sequence is the Word export\'s mangled honing table — it is ' +
     'the TURNING rates printed under the honing heading');
});

/* The honing rates must be the workbook's, and must not have been
   replaced by the document's turning rates. */
const mastersFile = FILES.filter(function (f) { return f.file === 'masters.js'; })[0];
ok('masters.js present', !!mastersFile);
if (mastersFile) {
  ok('honing rate 0.30 present', /rateWithin:\s*0\.30/.test(mastersFile.code));
  ok('honing rate 0.40 present', /rateBeyond:\s*0\.40/.test(mastersFile.code));
  ok('honing rates are NOT 300/400',
     !/rateWithin:\s*300/.test(mastersFile.code) &&
     !/rateBeyond:\s*400/.test(mastersFile.code));

  /* The turning card legitimately holds 300/400/550/700 — but split
     across two named arrays, not as one run, and under a turning name. */
  ok('turning rates live under a turning name',
     /TURNING_RATE_CARD[\s\S]{0,200}rough:\s*\[300/.test(mastersFile.code));
  ok('the honing card does not carry hour-scale rates',
     !/HONING_RATE_CARD[\s\S]{0,300}\b(300|400|550|700)\b/.test(mastersFile.code));
}

/* ═══════════════════════════════════════════════════════════
   2. THE COST SHEET SUPPLIES NO VALUES
   ═══════════════════════════════════════════════════════════ */
section('Cost sheet — reference only, never a value');

FILES.forEach(function (f) {
  ok('no cost-sheet reference in ' + f.file,
     !/COST_SHEET|historical-cylinders|cost-sheet/i.test(f.code));
});

/* The four Rs/kg band targets ARE derived from the cost sheet. They are
   permitted only as validation reporting, and must never reach a
   costing path. Enforced structurally: nothing outside masters.js may
   read them, and masters.js must not use them in any accessor that
   returns money. */
if (mastersFile) {
  const targets = /targetTotalPerKg/.test(mastersFile.code);
  ok('band targets are declared in masters.js', targets);

  /* They may appear only inside BORE_BANDS. */
  const outsideBands = mastersFile.code
    .replace(/var BORE_BANDS[\s\S]*?\];/, '')
    .match(/targetTotalPerKg|1003|522|352|318/g);
  ok('band targets appear only in BORE_BANDS', !outsideBands,
     'found ' + (outsideBands || []).join(', ') + ' outside the band table');
}

/* The four target values themselves, as literals. Checking only the
   identifier `targetTotalPerKg` was not enough — `var bandT = 1003`
   slipped straight through a deliberate negative test. */
const BAND_TARGETS = [1003, 522, 352, 318];

FILES.filter(function (f) { return f.file !== 'masters.js'; })
  .forEach(function (f) {
    ok('no band target read in ' + f.file,
       !/targetTotalPerKg/.test(f.code),
       'cost-sheet figures must not reach the costing path');
    ok('no bore banding in ' + f.file,
       !/boreBand/.test(f.code),
       'banding is validation reporting, not a costing input');

    const lit = BAND_TARGETS.filter(function (v) {
      return new RegExp('(?<![\\d.])' + v + '(?![\\d.])').test(f.code);
    });
    ok('no band-target literal in ' + f.file, lit.length === 0,
       'found ' + lit.join(', ') + ' — these are cost-sheet derived and ' +
       'may not appear in a costing module');
  });

/* ═══════════════════════════════════════════════════════════
   3. THE WORKBOOK SUPPLIES EVERYTHING ELSE
   ═══════════════════════════════════════════════════════════ */
section('Workbook — the only source of values');

/* Every module must name the workbook as its provenance. */
FILES.forEach(function (f) {
  ok(f.file + ' cites the workbook',
     /Trunion_Included|workbook/i.test(f.raw));
});

/* Rates must not be restated outside masters.js. Distinctive values
   only — 0, 5 and 100 also mean indices and percentages. */
const DISTINCTIVE = [7.7, 8.9, 1.25, 0.45, 0.35, 62, 66, 68, 78, 92, 96,
                     118, 180, 210, 520, 650, 850, 4500];
FILES.filter(function (f) { return f.file !== 'masters.js'; })
  .forEach(function (f) {
    const leaks = DISTINCTIVE.filter(function (v) {
      const re = new RegExp('(?<![\\d.])' + String(v).replace('.', '\\.') + '(?![\\d.])');
      return re.test(f.code);
    });
    ok('no rate literal in ' + f.file, leaks.length === 0,
       'found ' + leaks.join(', ') + ' — every rate must come from masters.js');
  });

/* The welding constants must be the workbook's, and no code may
   hard-code the Word document's Rs 14 per inch per bead as if settled. */
if (mastersFile) {
  ok('workbook welding constants present',
     /labourRate:\s*375/.test(mastersFile.code) &&
     /wireCost:\s*360/.test(mastersFile.code) &&
     /weldingSpeed:\s*3600/.test(mastersFile.code));
  ok('the Rs 14 instruction is recorded but not resolved',
     /rupeesPerInchPerBead:\s*14/.test(mastersFile.code) &&
     /resolved:\s*false/.test(mastersFile.code));
}

const engineFile = FILES.filter(function (f) { return f.file === 'engine.js'; })[0];
if (engineFile) {
  ok('engine.js produces no weld cost unconditionally',
     /st\.resolved/.test(engineFile.code),
     'welding must stay behind weldingStatus().resolved');
  ok('engine.js does not hard-code 14 as a weld rate',
     !/(?<![\d.])14(?![\d.])\s*\*/.test(engineFile.code));
}

/* ═══════════════════════════════════════════════════════════
   4. THE DOCUMENTED RULE MATCHES THE ENFORCED ONE
   ═══════════════════════════════════════════════════════════ */
section('The rule is written down where it will be read');

const claudeMd = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');
ok('CLAUDE.md states the three-way split',
   /structure from the document/i.test(claudeMd) ||
   /three sources, three/i.test(claudeMd));
ok('CLAUDE.md warns about the shifted Word tables',
   /shifted/i.test(claudeMd) && /honing/i.test(claudeMd));
ok('CLAUDE.md forbids cost-sheet values',
   /any value used by the application/i.test(claudeMd) &&
   /COST_SHEET/.test(claudeMd));
ok('CLAUDE.md forbids document numbers',
   /any numeric value/i.test(claudeMd));
ok('CLAUDE.md says to report structural disagreements',
   /do not silently pick|do not silently resolve/i.test(claudeMd));

const spec = fs.readFileSync(path.join(ROOT, 'hispl-v2/SPECIFICATION.md'), 'utf8');
ok('SPECIFICATION.md states the three-way split',
   /three sources, three/i.test(spec) || /structure from the document/i.test(spec));

/* ═══════════════════════════════════════════════════════════ */
console.log('\n' + '═'.repeat(56));
if (fail) {
  console.log('FAILURES:');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
}
console.log((fail ? '✗ SOURCE-PURITY' : '✓ SOURCE-PURITY') +
            ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
