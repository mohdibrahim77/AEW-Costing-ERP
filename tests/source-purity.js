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

/* ═══════════════════════════════════════════════════════════
   THE v1 MODULES

   assets/js/costing/v1/ is built from VERSION_1.xlsx, which supersedes
   Trunion_Included.xlsx as the value source. The rule does not change
   with the workbook: values and calculations come from the workbook,
   structure from the document, nothing at all from the cost sheet.

   These modules sat outside the readdir above, which is not recursive,
   so until now the newest and largest part of the costing code was the
   only part the source rule did not police.
   ═══════════════════════════════════════════════════════════ */
section('v1 modules — VERSION_1.xlsx');

const V1_DIR = path.join(COSTING_DIR, 'v1');
const V1 = fs.readdirSync(V1_DIR)
  .filter(function (f) { return /\.js$/.test(f); })
  .map(function (f) {
    const raw = fs.readFileSync(path.join(V1_DIR, f), 'utf8');
    return {
      file: f, raw: raw,
      /* Comments stripped: several of these deliberately quote a wrong
         number in order to warn about it. */
      code: raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    };
  });

ok('v1 modules found', V1.length === 5,
   'got ' + V1.map(function (f) { return f.file; }).join(', '));

const v1Masters = V1.filter(function (f) { return f.file === 'masters.js'; })[0];
const v1Others  = V1.filter(function (f) { return f.file !== 'masters.js'; });
const v1Engine = V1.filter(function (f) { return f.file === 'engine.js'; })[0];

/* The document's shifted honing table prints 300/400/550/700 under the
   honing heading. Those are turning rates. Honing is 0.30 and 0.40
   Rs/cm2 and appears nowhere in that document. Building honing from the
   document would over-price it roughly a thousandfold. */
ok('v1 honing rates are the workbook\'s, not the document\'s shifted table',
   /rateLow:\s*0\.30/.test(v1Masters.code) && /rateHigh:\s*0\.40/.test(v1Masters.code));
/* Assert the honing rate card's actual contents rather than hunting for
   loose integers near the word "honing". A first pass did the latter
   and flagged the Honing Machine's Rs.550/hr line from the Machine Rate
   Master — a legitimate figure that happens to collide with a turning
   rate. Bare integers recur across unrelated tables, so matching on
   them tests nothing except coincidence. */
const honingBlock = (v1Masters.code.match(/var HONING = \{[^}]*\}/) || [''])[0];
ok('the honing rate card holds only 0.30 and 0.40 Rs/cm2',
   /rateLow:\s*0\.30/.test(honingBlock) && /rateHigh:\s*0\.40/.test(honingBlock) &&
   !/\b(300|400|550|700)\b/.test(honingBlock.replace(/lengthThreshold:\s*4000/, '')));

/* The four Rs/kg band targets are cost-sheet derived. They are
   validation reporting only and must not appear in a costing path at
   all — this build has no reporting use for them either. */
[1003, 522, 352, 318].forEach(function (n) {
  const hits = V1.filter(function (f) {
    return new RegExp('\\b' + n + '\\b').test(f.code);
  }).map(function (f) { return f.file; });
  ok('cost-sheet band target ' + n + ' is absent from v1',
     hits.length === 0, hits.join(', '));
});

/* Every rate lives in masters.js. A rate inlined into the engine is how
   the frozen ERP ended up with eighteen operations hardcoded to 100
   while the master labour rate did nothing at all. */
/* Structural, not numeric. Every process routing row must take its rate
   from a masters accessor, never a literal. That is the property worth
   guarding — searching for the integer 650 instead flagged the Valve's
   Rs.650 bought-out price, which is a real workbook value that merely
   collides with the grinding machine's hourly rate. */
/* Extract each row() call's last top-level argument. A regex cannot do
   this: the rate argument is itself usually a call, so a non-greedy
   ) stops inside M.cuttingHours(rawOD, len) and splits the arguments
   in the wrong place. Balanced-paren scanning is the only way to read
   the argument that is actually there. */
function rateArgs(code) {
  const out = [];
  let k = 0;
  while ((k = code.indexOf('row(', k)) >= 0) {
    /* Skip the definition and any identifier ending in 'row'. */
    const before = code.slice(Math.max(0, k - 9), k);
    if (/function\s$/.test(before) || /[A-Za-z0-9_$]$/.test(before)) { k += 4; continue; }
    let depth = 0, start = k + 4, p = start, args = [], argStart = start;
    for (; p < code.length; p++) {
      const ch = code[p];
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' && depth === 0) { args.push(code.slice(argStart, p)); break; }
      else if (ch === ')' || ch === ']' || ch === '}') depth--;
      else if (ch === ',' && depth === 0) { args.push(code.slice(argStart, p)); argStart = p + 1; }
    }
    if (args.length) out.push({ at: k, rate: args[args.length - 1].trim() });
    k = p + 1;
  }
  return out;
}

const rowCalls = rateArgs(v1Engine.code);
ok('the engine has process rows to check', rowCalls.length >= 25,
   'found ' + rowCalls.length);
const literalRate = rowCalls.filter(function (c) { return !/M./.test(c.rate); });
ok('every process row takes its rate from masters', literalRate.length === 0,
   literalRate.slice(0, 3).map(function (c) {
     return c.rate.replace(/s+/g, ' ').slice(0, 60);
   }).join(' // '));

const V1_RATES = [
  ['weld rate 14',     /ratePerInchBead\s*:\s*14/],
  ['seal markup 0.25', /SEAL_MARKUP\s*=\s*0\.25/],
  ['material density', /density:\s*7\.85/]
];
V1_RATES.forEach(function (r) {
  ok(r[0] + ' is declared in v1/masters.js', r[1].test(v1Masters.code));
  const leaks = v1Others.filter(function (f) { return r[1].test(f.code); })
                        .map(function (f) { return f.file; });
  ok('  ...and nowhere else', leaks.length === 0, 'found in ' + leaks.join(', '));
});

/* The engineering defaults are the one place literals are legitimate:
   they are the working values HISPL's own sheets carry, seeded so a
   costing runs from 22 inputs. They must be quarantined in that one
   function and labelled as such, not scattered through the components. */
ok('engineering seed values live in one declared function',
   /function engineeringDefaults\(\)/.test(v1Engine.code));
ok('  ...and the code says they are seeds, not derivations',
   /Seeding is not the same as deriving/.test(v1Engine.raw));

/* The engine must reach rates through the accessors rather than
   reaching into the tables. */

ok('v1 engine reads rates through masters accessors',
   /M\.machineRate\(/.test(v1Engine.code) && /M\.processRate\(/.test(v1Engine.code));
ok('v1 engine does not index master tables directly',
   !/M\.tables\.(materials|machineRates|processRates|turning)\b/.test(v1Engine.code));

/* Geometry carries dimensions, not money. A rupee figure in the
   geometry module would mean a rate had been smuggled in as a
   dimension, which is exactly the kind of thing that reads as fine. */
const v1Geom = V1.filter(function (f) { return f.file === 'geometry.js'; })[0];
ok('v1 geometry names no rate or cost',
   !/\b(rate|cost|Rs\.|rupee)\b/i.test(v1Geom.code));

/* Provenance must survive into the code. Every geometry table declares
   where it came from and how much it can be trusted, because "ISO
   6020-2, approved by HISPL" and "general proportion, no formal
   published source found" must not look alike to whoever signs the
   quotation. */
ok('every v1 geometry table declares a confidence level',
   (v1Geom.code.match(/confidence:\s*CONF\./g) || []).length >= 12);
ok('every v1 geometry table declares its basis',
   (v1Geom.code.match(/basis:\s*'/g) || []).length >= 12);
ok('v1 geometry keeps the low-confidence wording verbatim',
   /no formal published source found/i.test(v1Geom.raw));

/* views.js carries the three sheets that do not feed the estimate. It must
   derive everything from a finished run: a view that looked up its own
   rate or dimension would be a second costing engine nobody tests. */
const v1Views = V1.filter(function (f) { return f.file === 'views.js'; })[0];
ok('v1 views recompute no rate or dimension',
   !/M\.(materialRate|turningRate|honingRate|weldBeads|processRate|sealKit|cuttingHours|roughTurnHours)\(/.test(v1Views.code) &&
   !/G\.derive\(/.test(v1Views.code));
ok('v1 views invent no machine hour',
   /TIME STANDARD NOT AVAILABLE/.test(v1Views.raw));

/* Defects are reproduced and reported, never silently corrected. */
ok('v1 engine reports workbook defects rather than fixing them',
   /level:\s*'defect'/.test(v1Engine.code));
['W-1', 'P-1', 'T-1', 'A-1', 'A-2', 'FO-1', 'FO-2', 'TR-1'].forEach(function (ref) {
  ok('defect ' + ref + ' is registered in the v1 engine',
     new RegExp("ref:\\s*'" + ref + "'").test(v1Engine.code));
});

/* ═══════════════════════════════════════════════════════════ */
console.log('\n' + '═'.repeat(56));
if (fail) {
  console.log('FAILURES:');
  failures.forEach(function (f) { console.log('  ✗ ' + f); });
}
console.log((fail ? '✗ SOURCE-PURITY' : '✓ SOURCE-PURITY') +
            ' — ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
