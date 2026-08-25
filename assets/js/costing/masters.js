/**
 * masters.js  —  HISPL Costing v2  —  Master Data
 * ─────────────────────────────────────────────────────────
 * THE single source of every rate, density, rate card and time table.
 *
 * Transcribed verbatim from hispl-v2/hispl-masters.json, which HISPL
 * supplied on 2026-08-15 from Trunion_Included.xlsx and the Costing
 * Master Tables Developer Reference.
 *
 * SPECIFICATION.md rule 6: "Keep master data centralised. No rate
 * hard-coded twice." Every rate in this file must be reachable through
 * exactly one accessor, and no rate literal may exist outside it.
 *
 * NOTHING IS INVENTED HERE. Where HISPL supplied no value, the accessor
 * returns ENGINEERING_INPUT_REQUIRED — never a default, never a zero,
 * never a nearest-neighbour guess.
 *
 * ES5-compatible per CLAUDE.md conventions: var, function, no arrow
 * functions, no template literals.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};

  /* The sentinel. Any consumer receiving this must surface it to the
     user as ENGINEERING INPUT REQUIRED, never coerce it to a number.
     A missing dimension that renders as 0 is more dangerous than one
     that renders as broken. */
  var EIR = 'ENGINEERING_INPUT_REQUIRED';

  /* ══════════════════════════════════════════════════════════════
     MATERIAL MASTER — 9 grades, each with its OWN density.

     The v1 tool hard-coded 7.85 for every grade. SS-410 is 7.7 and
     bronze SAE660 is 8.9; using 7.85 for either is a real costing
     defect, not a rounding nicety.
     ══════════════════════════════════════════════════════════════ */
  var MATERIAL = {
    'EN8':          { name: 'EN8 Carbon Steel',           density: 7.85, rate: 68,  use: 'Tubes, general turning parts' },
    'EN19':         { name: 'EN19 Alloy Steel',           density: 7.85, rate: 92,  use: 'Piston rod, heat treatable' },
    'EN24':         { name: 'EN24 Alloy Steel',           density: 7.85, rate: 118, use: 'High strength rods / eyes' },
    'C45':          { name: 'C45 Carbon Steel',           density: 7.85, rate: 66,  use: 'Cap/Head End Covers, Gland, Flange' },
    'ST52':         { name: 'ST52 Seamless Tube',         density: 7.85, rate: 78,  use: 'Cylinder tube raw material' },
    'SS-410':       { name: 'SS 410 Stainless',           density: 7.7,  rate: 210, use: 'Corrosion resistant rods' },
    'BR-SAE660':    { name: 'Bronze SAE 660',             density: 8.9,  rate: 520, use: 'Cushion bush / bearing bush' },
    'EN353':        { name: 'EN353 Case Hardening Steel', density: 7.85, rate: 96,  use: 'Pins / bushes' },
    'PLATE-IS2062': { name: 'IS2062 Plate',               density: 7.85, rate: 62,  use: 'Rear eye / rod eye / piston blanks' }
  };

  /* ══════════════════════════════════════════════════════════════
     MACHINE RATE MASTER — Rs/hr
     Turning is overridden by the Turning Rate Card; honing and
     grinding rates here are utilisation reference only.
     ══════════════════════════════════════════════════════════════ */
  var MACHINE = {
    'CNC Lathe':        { rate: 550, note: 'Finish turning rate overridden by Turning Rate Card' },
    'Center Lathe':     { rate: 500, note: 'Boring; rough turning rate overridden by Turning Rate Card' },
    'Milling Machine':  { rate: 350 },
    'Drilling Machine': { rate: 250 },
    'Honing Machine':   { rate: 450, note: 'Utilisation reference only; cost via Honing Rate Card' },
    'Grinding Machine': { rate: 400, note: 'Utilisation reference only; cost via Rs/cm2' },
    'Cutting Machine':  { rate: 350, note: 'Universal flat charge' }
  };

  /* ══════════════════════════════════════════════════════════════
     PROCESS RATE MASTER — per kg or per cm2
     ══════════════════════════════════════════════════════════════ */
  var PROCESS = {
    'Heat Treatment':      { rate: 12,   unit: 'Rs/kg' },
    'Induction Hardening': { rate: 0.45, unit: 'Rs/cm2' },
    'Grinding':            { rate: 0.4,  unit: 'Rs/cm2' },
    'Polishing':           { rate: 0.2,  unit: 'Rs/cm2' },
    'Painting':            { rate: 0.2,  unit: 'Rs/cm2' },
    'Chrome Plating':      { rate: 0.6,  unit: 'Rs/cm2' },
    'Dechrome Plating':    { rate: 0.35, unit: 'Rs/cm2' },
    'Profile Cutting':     { rate: 1.25, unit: 'Rs/kg' },
    'Packing - Loose':     { rate: 5,    unit: 'Rs/kg' },
    'Packing - Wooden Box':{ rate: 15,   unit: 'Rs/kg' }
  };

  /* ══════════════════════════════════════════════════════════════
     MACHINE TIME MASTER — hours

     Lookup contract, from hispl-masters.json:
       "Find first row bucket where value <= bound, then first column
        bucket. Returns hours."

     That prose is not how the workbook actually resolves a bucket. Each
     table carries a literal "Bin Start" helper column and every lookup
     is MATCH(value, binStarts, 1) — the largest start not exceeding the
     value. The two readings agree on every integer and disagree in the
     gap between a bound and the next start: at OD 80.5 an upper-bound
     reading picks row 2, the workbook picks row 1. Fractional dimensions
     are real (the workbook's own sample tube has a finished ID of
     100.4), so the workbook's semantics are the ones implemented here.

     Verified at source: 'Machine Time Master'!A7:A10 = 0/81/151/251 and
     the stock removal starts are 0/2.0001/5.0001/10.0001.

     `max` is the declared top of the last bucket, where the table
     states one. MATCH alone would clamp any larger value into that top
     bucket — the cutting and turning tables stop at "2001-3000", so a
     4950mm stroke would silently price as if it were 3000. That is the
     silent fallback this project forbids, so a value above `max`
     returns EIR instead. Buckets labelled "Above N" are genuinely
     open-ended and carry no `max`.
     ══════════════════════════════════════════════════════════════ */
  var TIME = {
    cutting: {
      inputs: ['OD', 'Length'],
      rowStarts: [0, 81, 151, 251],
      colStarts: [0, 501, 1001, 2001],
      colMax: 3000,
      hours: [
        [0.08, 0.10, 0.15, 0.20],
        [0.10, 0.15, 0.20, 0.30],
        [0.15, 0.20, 0.30, 0.40],
        [0.25, 0.35, 0.50, 0.70]
      ]
    },
    roughTurning: {
      inputs: ['Finished OD', 'Length'],
      rowStarts: [0, 81, 151, 251],
      colStarts: [0, 501, 1001, 2001],
      colMax: 3000,
      hours: [
        [0.3, 0.6, 1.2, 1.8],
        [0.5, 0.9, 1.7, 2.5],
        [0.8, 1.5, 2.8, 4.0],
        [1.2, 2.2, 4.0, 6.0]
      ]
    },
    boring: {
      inputs: ['Finished ID', 'Bore Length'],
      rowStarts: [0, 81, 151, 251],
      colStarts: [0, 251, 501, 1001],
      colMax: 2000,
      hours: [
        [0.25, 0.4, 0.7, 1.2],
        [0.40, 0.7, 1.2, 2.0],
        [0.70, 1.2, 2.2, 3.5],
        [1.20, 2.0, 3.5, 5.5]
      ]
    },
    honing: {
      inputs: ['ID', 'Length'],
      utilisationOnly: true,
      rowStarts: [0, 81, 151, 251],
      colStarts: [0, 501, 1001],
      colMax: 2000,
      hours: [
        [0.3, 0.6, 1.2],
        [0.5, 0.9, 1.6],
        [0.8, 1.4, 2.4],
        [1.2, 2.0, 3.5]
      ]
    },
    grinding: {
      inputs: ['OD', 'Length'],
      utilisationOnly: true,
      rowStarts: [0, 81, 151, 251],
      colStarts: [0, 501, 1001],
      colMax: 2000,
      hours: [
        [0.3, 0.5, 0.9],
        [0.5, 0.8, 1.4],
        [0.8, 1.3, 2.2],
        [1.2, 2.0, 3.2]
      ]
    }
  };

  /* Single-axis tables. Same bin-start rule; all end "Above N", so none
     declares a max. */
  var TIME_1D = {
    milling: {
      inputs: ['Machined Area mm2 = Width x Length'],
      starts: [0, 10001, 25001, 50001],
      hours:  [0.3, 0.6, 1.0, 1.8]
    },
    drilling: {
      inputs: ['Hole Diameter'],
      rule: 'Total = time per hole x number of holes',
      starts: [0, 11, 21, 31],
      hoursPerHole: [0.03, 0.05, 0.08, 0.12]
    },
    profileCutting: {
      inputs: ['Component Weight kg'],
      utilisationOnly: true,
      starts: [0, 11, 26, 51],
      hours:  [0.1, 0.2, 0.35, 0.6]
    }
  };

  /* Stock removal multiplies rough turning time.
     Stock removal = Raw OD - Finished OD.
     The workbook's starts are literally 2.0001 / 5.0001 / 10.0001 —
     its way of writing "greater than 2", "greater than 5". Kept exactly,
     so a removal of 2.00005 lands where HISPL puts it. */
  var STOCK_REMOVAL = {
    starts:  [0, 2.0001, 5.0001, 10.0001],
    factors: [1.0, 1.15, 1.35, 1.6]
  };

  /* Finish turning is a fixed fraction of rough turning time. */
  var FINISH_TURNING_FACTOR = 0.70;

  /* ══════════════════════════════════════════════════════════════
     RATE CARDS — these OVERRIDE the flat machine rate.

     Turning: by FINISHED diameter, not raw.
     Honing:  cost = internal area cm2 x rate. The higher rate applies
              if EITHER threshold is exceeded, not both.

     Trap recorded in SPECIFICATION.md 3.4: the Word export mangled the
     honing table and showed 300/400/550/700 under the honing heading.
     Those are the TURNING rates. Honing is 0.30 / 0.40 Rs/cm2.
     ══════════════════════════════════════════════════════════════ */
  var TURNING_RATE_CARD = {
    starts: [0, 101, 251],
    rough:  [300, 550, 700],
    finish: [400, 550, 700]
  };

  var HONING_RATE_CARD = {
    strokeThreshold: 4000,
    idThreshold:     100,
    rateWithin:      0.30,
    rateBeyond:      0.40
  };

  /* ══════════════════════════════════════════════════════════════
     WELDING — DELIBERATELY NOT RESOLVED.

     The workbook formula and HISPL's later approved instruction of
     Rs 14 per inch per bead give materially different numbers.
     CLAUDE_CODE_HANDOFF.md section H: "Do not average, do not choose."

     Both are recorded here as data. NO ACCESSOR RETURNS A WELD COST.
     weldingStatus() reports the conflict so callers surface it rather
     than silently costing zero.
     ══════════════════════════════════════════════════════════════ */
  var WELDING = {
    workbookFormula: {
      labourRate:            375,
      wireCost:              360,
      depositionRate:        0.8,
      weldingSpeed:          3600,
      diaThresholdForBeads:  250,
      beadsIfDiaLessOrEqual: 5,
      beadsIfDiaGreater:     8
    },
    approvedInstruction: {
      rupeesPerInchPerBead: 14
    },
    resolved: false,
    conflict: 'Workbook formula vs approved Rs 14/inch/bead. ' +
              'Unresolved — no welding cost may be calculated.'
  };

  /* ══════════════════════════════════════════════════════════════
     BOUGHT-OUT MASTER. Seals excluded at HISPL's request.
     ══════════════════════════════════════════════════════════════ */
  var BOUGHT_OUT = [
    { item: 'Bearing',     rate: 180,  qty: 2, defaultInclude: true },
    { item: 'Check Valve', rate: 650,  qty: 1, defaultInclude: false },
    { item: 'Transducer',  rate: 4500, qty: 1, defaultInclude: false, note: 'Position sensor / LVDT' },
    { item: 'Bellows',     rate: 850,  qty: 1, defaultInclude: false, note: 'Rod protection bellow' },
    { item: 'Other 1',     rate: 0,    qty: 1, defaultInclude: false, note: 'Manual entry, renameable' },
    { item: 'Other 2',     rate: 0,    qty: 1, defaultInclude: false },
    { item: 'Other 3',     rate: 0,    qty: 1, defaultInclude: false },
    { item: 'Other 4',     rate: 0,    qty: 1, defaultInclude: false },
    { item: 'Other 5',     rate: 0,    qty: 1, defaultInclude: false }
  ];

  /* ══════════════════════════════════════════════════════════════
     BORE BANDS — validation reporting only, never a costing input.

     Upper-EXCLUSIVE. Confirmed against the 295-row set: the documented
     counts 21/121/96/57 reproduce only under b<110 and b<180. Seven
     cylinders sit at bore exactly 180 and belong to the top band.
     HISPL confirmed the documents' ">180" label should read ">=180".
     ══════════════════════════════════════════════════════════════ */
  var BORE_BANDS = [
    { key: '<60',     min: 0,   max: 60,       targetTotalPerKg: 1003 },
    { key: '60-110',  min: 60,  max: 110,      targetTotalPerKg: 522 },
    { key: '110-180', min: 110, max: 180,      targetTotalPerKg: 352 },
    { key: '>=180',   min: 180, max: Infinity, targetTotalPerKg: 318 }
  ];

  /* ══════════════════════════════════════════════════════════════
     LOOKUP PRIMITIVES
     ══════════════════════════════════════════════════════════════ */

  /* The workbook's MATCH(value, binStarts, 1): the last bucket whose
     start does not exceed the value. Returns -1 below the first start,
     which for these tables means a negative input. */
  function binIndex(starts, value) {
    var found = -1;
    for (var i = 0; i < starts.length; i++) {
      if (starts[i] <= value) found = i; else break;
    }
    return found;
  }

  function isNum(v) {
    return typeof v === 'number' && isFinite(v);
  }

  /* ══════════════════════════════════════════════════════════════
     ACCESSORS — the only sanctioned way to read a rate.

     Every one returns EIR rather than a fallback when the input is
     unusable or the master has no entry.
     ══════════════════════════════════════════════════════════════ */

  function material(grade) {
    if (!grade || !MATERIAL.hasOwnProperty(grade)) return EIR;
    var m = MATERIAL[grade];
    return { grade: grade, name: m.name, density: m.density, rate: m.rate, use: m.use };
  }

  function materialRate(grade) {
    var m = material(grade);
    return m === EIR ? EIR : m.rate;
  }

  function density(grade) {
    var m = material(grade);
    return m === EIR ? EIR : m.density;
  }

  function machineRate(machineName) {
    if (!machineName || !MACHINE.hasOwnProperty(machineName)) return EIR;
    return MACHINE[machineName].rate;
  }

  function processRate(processName) {
    if (!processName || !PROCESS.hasOwnProperty(processName)) return EIR;
    return PROCESS[processName].rate;
  }

  /* Two-axis time lookup. name is a key of TIME. */
  function machineTime(name, rowValue, colValue) {
    if (!TIME.hasOwnProperty(name)) return EIR;
    if (!isNum(rowValue) || !isNum(colValue)) return EIR;
    if (rowValue <= 0 || colValue <= 0) return EIR;
    var t = TIME[name];

    /* Past the declared top of the table there is no bucket. Do not
       clamp into the last column the way a bare MATCH would. */
    if (t.rowMax !== undefined && rowValue > t.rowMax) return EIR;
    if (t.colMax !== undefined && colValue > t.colMax) return EIR;

    var ri = binIndex(t.rowStarts, rowValue);
    var ci = binIndex(t.colStarts, colValue);
    if (ri < 0 || ci < 0) return EIR;
    return t.hours[ri][ci];
  }

  function millingTime(areaMm2) {
    if (!isNum(areaMm2) || areaMm2 <= 0) return EIR;
    var i = binIndex(TIME_1D.milling.starts, areaMm2);
    return i < 0 ? EIR : TIME_1D.milling.hours[i];
  }

  function drillingTime(holeDia, holeCount) {
    if (!isNum(holeDia) || holeDia <= 0) return EIR;
    if (!isNum(holeCount) || holeCount < 0) return EIR;
    var i = binIndex(TIME_1D.drilling.starts, holeDia);
    return i < 0 ? EIR : TIME_1D.drilling.hoursPerHole[i] * holeCount;
  }

  function profileCuttingTime(weightKg) {
    if (!isNum(weightKg) || weightKg <= 0) return EIR;
    var i = binIndex(TIME_1D.profileCutting.starts, weightKg);
    return i < 0 ? EIR : TIME_1D.profileCutting.hours[i];
  }

  function stockRemovalFactor(rawOD, finishedOD) {
    if (!isNum(rawOD) || !isNum(finishedOD)) return EIR;
    var removal = rawOD - finishedOD;
    if (removal < 0) return EIR;          /* impossible geometry, not a zero */
    var i = binIndex(STOCK_REMOVAL.starts, removal);
    return i < 0 ? EIR : STOCK_REMOVAL.factors[i];
  }

  function roughTurningHours(finishedOD, length, rawOD) {
    var base = machineTime('roughTurning', finishedOD, length);
    if (base === EIR) return EIR;
    if (rawOD === undefined) return base;   /* no stock removal supplied */
    var f = stockRemovalFactor(rawOD, finishedOD);
    return f === EIR ? EIR : base * f;
  }

  function finishTurningHours(roughHours) {
    if (!isNum(roughHours)) return EIR;
    return roughHours * FINISH_TURNING_FACTOR;
  }

  /* Turning rate card, keyed on FINISHED diameter.
     kind is 'rough' or 'finish'. */
  function turningRate(finishedDia, kind) {
    if (!isNum(finishedDia) || finishedDia <= 0) return EIR;
    if (kind !== 'rough' && kind !== 'finish') return EIR;
    var i = binIndex(TURNING_RATE_CARD.starts, finishedDia);
    return i < 0 ? EIR : TURNING_RATE_CARD[kind][i];
  }

  /* Honing cost is area-based. The higher rate applies if EITHER
     threshold is exceeded. */
  function honingRate(strokeMm, idMm) {
    if (!isNum(strokeMm) || !isNum(idMm)) return EIR;
    if (strokeMm <= 0 || idMm <= 0) return EIR;
    var beyond = strokeMm > HONING_RATE_CARD.strokeThreshold ||
                 idMm     > HONING_RATE_CARD.idThreshold;
    return beyond ? HONING_RATE_CARD.rateBeyond : HONING_RATE_CARD.rateWithin;
  }

  function honingCost(internalAreaCm2, strokeMm, idMm) {
    if (!isNum(internalAreaCm2) || internalAreaCm2 < 0) return EIR;
    var r = honingRate(strokeMm, idMm);
    return r === EIR ? EIR : internalAreaCm2 * r;
  }

  function packingRate(kind) {
    if (kind === 'loose')  return processRate('Packing - Loose');
    if (kind === 'wooden') return processRate('Packing - Wooden Box');
    return EIR;
  }

  /* Welding deliberately has no cost accessor. This reports the
     conflict so a caller can surface it instead of costing zero. */
  function weldingStatus() {
    return {
      resolved: WELDING.resolved,
      conflict: WELDING.conflict,
      workbookFormula: WELDING.workbookFormula,
      approvedInstruction: WELDING.approvedInstruction
    };
  }

  /* Deep copy. A shallow slice() shares the row objects, so a caller
     that edited a returned rate would silently rewrite the master for
     every later quotation on the same page. */
  function copyRows(rows) {
    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var src = rows[i], dst = {};
      for (var k in src) { if (src.hasOwnProperty(k)) dst[k] = src[k]; }
      out.push(dst);
    }
    return out;
  }

  function boughtOut() {
    return copyRows(BOUGHT_OUT);
  }

  /* Validation reporting only. */
  function boreBand(bore) {
    if (!isNum(bore) || bore <= 0) return EIR;
    for (var i = 0; i < BORE_BANDS.length; i++) {
      if (bore >= BORE_BANDS[i].min && bore < BORE_BANDS[i].max) return BORE_BANDS[i].key;
    }
    return EIR;
  }

  function boreBands() {
    return copyRows(BORE_BANDS);
  }

  function materialGrades() {
    return Object.keys(MATERIAL);
  }

  function machineNames() {
    return Object.keys(MACHINE);
  }

  function processNames() {
    return Object.keys(PROCESS);
  }

  window.AEW.masters = {
    EIR: EIR,

    /* material */
    material: material,
    materialRate: materialRate,
    density: density,
    materialGrades: materialGrades,

    /* machine and process rates */
    machineRate: machineRate,
    machineNames: machineNames,
    processRate: processRate,
    processNames: processNames,

    /* machine time */
    machineTime: machineTime,
    millingTime: millingTime,
    drillingTime: drillingTime,
    profileCuttingTime: profileCuttingTime,
    stockRemovalFactor: stockRemovalFactor,
    roughTurningHours: roughTurningHours,
    finishTurningHours: finishTurningHours,
    finishTurningFactor: FINISH_TURNING_FACTOR,

    /* rate cards */
    turningRate: turningRate,
    honingRate: honingRate,
    honingCost: honingCost,
    packingRate: packingRate,

    /* unresolved */
    weldingStatus: weldingStatus,

    /* catalogues */
    boughtOut: boughtOut,
    boreBand: boreBand,
    boreBands: boreBands
  };

  /* Node/jsdom harness access without a browser global. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AEW.masters;
  }
})();
