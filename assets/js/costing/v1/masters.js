/* HISPL costing — master rate tables, VERSION 1 workbook.
   Source: hispl-v2/source/VERSION_1.xlsx, sheets 'Material Master',
   'Machine Rate Master', 'Process Rate Master', 'Machine Time Master',
   'Raw Material Rate Master'.

   Every number below is transcribed from that workbook and from nothing
   else. The reference document supplies structure; the cost sheet
   supplies nothing at all. See CLAUDE.md rule 5.

   Excel lookup semantics matter more here than the numbers do. The
   workbook uses VLOOKUP(...,TRUE) and MATCH(...,1) throughout, which
   match on BIN STARTS, not on upper bounds: a row whose first column is
   81 covers 81 up to the next row's start. Reproducing that as
   "up to 150" would be right by accident for most values and wrong at
   every boundary. So the tables carry their starts, and lookup() below
   is the only thing that reads them. */
(function (root) {
  'use strict';

  /* ══ EXCEL LOOKUP PRIMITIVES ══════════════════════════════════════
     Excel returns #N/A when a value falls below the first bin. The
     workbook wraps most of those in IFERROR; where it does not, the
     cell genuinely breaks and the operator sees it. We return null and
     let the caller decide, rather than silently clamping to row 1 — a
     clamp would invent a rate HISPL never published. */

  /* MATCH(value, starts, 1) — index of the last start <= value. */
  function binIndex(starts, value) {
    var found = -1, i;
    if (typeof value !== 'number' || isNaN(value)) return -1;
    for (i = 0; i < starts.length; i++) {
      if (starts[i] <= value) found = i; else break;
    }
    return found;
  }

  /* VLOOKUP(value, rows, col, TRUE) where rows[i][0] is the bin start. */
  function vlookup(rows, value, col) {
    var i = binIndex(rowStarts(rows), value);
    return i < 0 ? null : rows[i][col];
  }

  function rowStarts(rows) {
    var out = [], i;
    for (i = 0; i < rows.length; i++) out.push(rows[i][0]);
    return out;
  }

  /* INDEX(grid, MATCH(a,rowStarts,1), MATCH(b,colStarts,1))

     Excel's MATCH(...,1) is asymmetric, and the asymmetry matters. Below
     the first bin it returns #N/A; above the last it returns the last
     bin and says nothing. So a 5-metre cut is priced at the 2001-3000
     rate with no indication that the table ran out.

     Reproduced exactly — this is the figure on HISPL's sheet — but
     beyondCeiling() below lets the caller say so out loud. Silently
     charging a 5m tube at a 3m rate is the kind of thing that only
     surfaces after the quotation has gone out. */
  function grid2d(spec, rowValue, colValue) {
    var r = binIndex(spec.rowStarts, rowValue);
    var c = binIndex(spec.colStarts, colValue);
    if (r < 0 || c < 0) return null;
    return spec.cells[r][c];
  }

  /* Returns a description when a length has run past the table's last
     declared band, or null when it is inside. */
  function beyondCeiling(spec, colValue) {
    if (typeof colValue !== 'number' || isNaN(colValue)) return null;
    if (!spec.colMax || colValue <= spec.colMax) return null;
    return colValue + 'mm is past the table\'s last band (up to ' + spec.colMax +
           'mm). Excel carries the top band across, so this is priced at the ' +
           spec.colStarts[spec.colStarts.length - 1] + '-' + spec.colMax + 'mm rate.';
  }

  /* ══ MATERIAL MASTER ══════════════════════════════════════════════
     'Material Master'!A4:D12. Density drives every weight; the flat
     rate here is the fallback — EN8, C45 and the tube steel are
     re-priced by size from the Raw Material Rate Master below, exactly
     as the component sheets do. */
  var MATERIALS = {
    'MS-EN8':         { name: 'EN8 Carbon Steel',        density: 7.85, rate: 100 },
    'MS-EN19':        { name: 'EN19 Alloy Steel',        density: 7.85, rate: 100 },
    'MS-EN24':        { name: 'EN24 Alloy Steel',        density: 7.85, rate: 140 },
    'MS-C45':         { name: 'C45 Carbon Steel',        density: 7.85, rate: 100 },
    'MS-ST52':        { name: 'ST52 Seamless Tube',      density: 7.85, rate: 160 },
    'SS-410':         { name: 'SS 410 Stainless',        density: 7.7,  rate: 410 },
    'BR-SAE660':      { name: 'Bronze SAE 660',          density: 8.9,  rate: 1800 },
    'MS-EN353':       { name: 'EN353 Case Hardening',    density: 7.85, rate: 140 },
    'MS-PLATE-IS2062':{ name: 'IS2062 Plate',            density: 7.85, rate: 85 }
  };

  /* ══ RAW MATERIAL RATE MASTER ═════════════════════════════════════
     'Raw Material Rate Master'. HISPL's handwritten size-banded rates.
     EN8 is priced by diameter, C45 by thickness. Note the gaps: EN8
     jumps 140 -> 150 and 200 -> 210. Under bin-start matching a 145mm
     bar takes the 20-140 rate, which is what the workbook does. */
  var EN8_BY_DIA = [
    [20,  140, 75],
    [150, 200, 80],
    [210, 290, 90],
    [300, 350, 100]
  ];
  var C45_BY_THICKNESS = [
    [50,  100, 100],
    [110, 150, 120],
    [150, 200, 140]
  ];

  /* ══ MACHINE RATE MASTER ══════════════════════════════════════════ */
  var MACHINE_RATES = {
    'CNC Lathe':          550,
    'Conventional Lathe': 500,
    'Milling Machine':    350,
    'Drilling Machine':   350,
    'Honing Machine':     550,
    'Grinding Machine':   650,
    'Cutting Machine':    350
  };

  /* ══ PROCESS RATE MASTER ══════════════════════════════════════════ */
  var PROCESS_RATES = {
    heatTreatment:     { rate: 12,   unit: 'Rs./kg' },
    inductionHardening:{ rate: 0.45, unit: 'Rs./cm2' },
    grinding:          { rate: 0.4,  unit: 'Rs./cm2' },
    polishing:         { rate: 0.2,  unit: 'Rs./cm2' },
    painting:          { rate: 0.2,  unit: 'Rs./cm2' },
    chromePlating:     { rate: 0.6,  unit: 'Rs./cm2' },
    dechromePlating:   { rate: 0.35, unit: 'Rs./cm2' },
    profileCutting:    { rate: 1.25, unit: 'Rs./kg' },
    packingLoose:      { rate: 5,    unit: 'Rs./kg' },
    packingWooden:     { rate: 15,   unit: 'Rs./kg' }
  };

  /* Turning rate card. Overrides the flat machine rate for turning:
     rough and finish are priced separately by finished diameter. */
  var TURNING_RATES = [
    /* start, label, rough, finish */
    [0,   'Up to 100 mm',  300, 400],
    [101, '101-250 mm',    550, 550],
    [251, 'Above 250 mm',  700, 700]
  ];

  /* Honing is charged on internal surface area, not machine hours. */
  var HONING = { rateLow: 0.30, rateHigh: 0.40, lengthThreshold: 4000, idThreshold: 100 };

  /* ══ WELDING ══════════════════════════════════════════════════════
     The workbook settles the question the earlier file left open. Every
     weld in the model — tube, CEC, rear eye, rod eye, flange, trunnion,
     clevis, foot lug — is priced the same way:

         circumference(inch) x Rs.14 x beads x locations

     The labour rate, wire cost, deposition rate and weld speed are all
     still present on the sheet and are all unused by any cost cell. The
     wire-cost line is computed on the Tube sheet and then not added to
     the tube's welding total. Reproduced as-is: this is the arithmetic
     HISPL quotes on, and correcting it here would put the tool out of
     step with their sheet. Flagged in RECONCILIATION_V1.md. */
  var WELD = {
    ratePerInchBead: 14,
    /* Unused by any cost path — kept so the divergence stays visible. */
    unused: { labourRate: 375, wireRate: 360, depositionRate: 0.8, speed: 3600,
              diaThreshold: 250, beadsLow: 5, beadsHigh: 8 }
  };

  /* Bead count by weld diameter. Bin starts, so a 150mm weld takes the
     126 row (5 beads) and a 151mm weld takes the 151 row (6). */
  var WELD_BEADS = [
    [50,  '50-75 mm',   3],
    [76,  '76-100 mm',  4],
    [101, '101-125 mm', 4],
    [126, '126-150 mm', 5],
    [151, '151-175 mm', 6],
    [176, '176-200 mm', 6]
  ];

  /* ══ MACHINE TIME MASTER ══════════════════════════════════════════
     Two-dimensional hour tables. Rows are keyed on a diameter, columns
     on a length. Both use bin starts.

     These have declared ceilings. Cutting stops at 3000mm of length and
     250+mm of OD; beyond either, the workbook has no bucket and MATCH
     returns #N/A. We surface that rather than extrapolating — HISPL has
     not told us what a 4-metre cut costs, and a guess would look
     exactly like a quote. */
  var CUTTING = {
    rowStarts: [0, 81, 151, 251],
    colStarts: [0, 501, 1001, 2001],
    colMax: 3000,
    cells: [
      [0.08, 0.10, 0.15, 0.20],
      [0.10, 0.15, 0.20, 0.30],
      [0.15, 0.20, 0.30, 0.40],
      [0.25, 0.35, 0.50, 0.70]
    ]
  };

  var ROUGH_TURNING = {
    rowStarts: [0, 81, 151, 251],
    colStarts: [0, 501, 1001, 2001],
    colMax: 3000,
    cells: [
      [0.3, 0.6, 1.2, 1.8],
      [0.5, 0.9, 1.7, 2.5],
      [0.8, 1.5, 2.8, 4.0],
      [1.2, 2.2, 4.0, 6.0]
    ]
  };

  /* Finish turning has no table of its own. The Piston Rod sheet takes
     70% of the rough-turning hours; the covers, gland and flange reuse
     the rough figure unscaled. Both are reproduced at the call site. */

  var BORING = {
    rowStarts: [0, 81, 151, 251],
    colStarts: [0, 251, 501, 1001],
    colMax: 2000,
    cells: [
      [0.25, 0.4, 0.7, 1.2],
      [0.40, 0.7, 1.2, 2.0],
      [0.70, 1.2, 2.2, 3.5],
      [1.20, 2.0, 3.5, 5.5]
    ]
  };

  var HONING_TIME = {
    rowStarts: [0, 81, 151, 251],
    colStarts: [0, 501, 1001],
    colMax: 2000,
    cells: [
      [0.3, 0.6, 1.2],
      [0.5, 0.9, 1.6],
      [0.8, 1.4, 2.4],
      [1.2, 2.0, 3.5]
    ]
  };

  var GRINDING_TIME = {
    rowStarts: [0, 81, 151, 251],
    colStarts: [0, 501, 1001],
    colMax: 2000,
    cells: [
      [0.3, 0.5, 0.9],
      [0.5, 0.8, 1.4],
      [0.8, 1.3, 2.2],
      [1.2, 2.0, 3.2]
    ]
  };

  /* Stock removal correction, applied to rough turning where the sheet
     asks for it. Starts are 0 / 2.0001 / 5.0001 / 10.0001 — the odd
     decimals are the workbook's way of making 2mm land in the first
     band rather than the second. Transcribed, not tidied. */
  var STOCK_REMOVAL = [
    [0,       '<= 2 mm',      1.00],
    [2.0001,  '> 2 - 5 mm',   1.15],
    [5.0001,  '> 5 - 10 mm',  1.35],
    [10.0001, '> 10 mm',      1.60]
  ];

  var MILLING = [
    [0,     'Up to 10,000 mm2',    0.3],
    [10001, '10,001-25,000 mm2',   0.6],
    [25001, '25,001-50,000 mm2',   1.0],
    [50001, 'Above 50,000 mm2',    1.8]
  ];

  var DRILLING = [
    [0,  'Up to 10 mm', 0.03],
    [11, '11-20 mm',    0.05],
    [21, '21-30 mm',    0.08],
    [31, 'Above 30 mm', 0.12]
  ];

  var PROFILE_CUTTING_TIME = [
    [0,  'Up to 10 kg', 0.10],
    [11, '11-25 kg',    0.20],
    [26, '26-50 kg',    0.35],
    [51, 'Above 50 kg', 0.60]
  ];

  /* ══ SEAL MASTER ══════════════════════════════════════════════════
     Seal kit price by bore. Three priced columns; the gaps are real and
     the workbook refuses rather than guesses:
       - Chevron has no price in the source catalogue, any bore
       - Freudenberg + PU has no price either
     Those return a refusal string, not a number. */
  var SEAL_TABLE = [
    /* bore, catalogueRodDia, othersPU, othersViton, freudenbergViton */
    [40,  30,  866.8,   1733.6,  2383.7],
    [50,  30,  981.0,   1962.0,  2697.75],
    [60,  30,  1101.2,  2202.4,  3028.3],
    [70,  40,  1379.4,  2758.8,  3793.35],
    [80,  40,  1490.6,  2981.2,  4099.15],
    [90,  50,  1857.8,  3715.6,  5108.95],
    [100, 60,  2086.0,  4172.0,  5736.5],
    [110, 70,  2616.2,  5232.4,  7194.55],
    [120, 80,  3545.6,  7091.2,  9750.4],
    [130, 80,  4246.9,  8493.8,  11678.975],
    [140, 90,  4808.2,  9616.4,  13222.55],
    [150, 100, 5249.5,  10499.0, 14436.125],
    [160, 120, 5635.8,  11271.6, 15498.45],
    [170, 120, 5867.1,  11734.2, 16134.525],
    [180, 130, 6278.4,  12556.8, 17265.6],
    [190, 140, 7089.7,  14179.4, 19496.675],
    [200, 150, 8036.0,  16072.0, 22099.0],
    [210, 160, 9530.5,  19061.0, 26208.875],
    [220, 170, 9796.0,  19592.0, 26939.0],
    [230, 180, 11261.5, 22523.0, 30969.125],
    [240, 190, 11852.0, 23704.0, 32593.0],
    [250, 200, 13442.5, 26885.0, 36966.875]
  ];
  var SEAL_MARKUP = 0.25;   /* HISPL instruction, not from the catalogue */

  /* ══ ACCESSORS ════════════════════════════════════════════════════
     Callers get values, never the arrays. An earlier version handed
     back the master row itself and a caller could have mutated the
     rate card for every later costing in the session. */

  function material(code) {
    var m = MATERIALS[code];
    if (!m) return null;
    return { code: code, name: m.name, density: m.density, rate: m.rate };
  }

  /* The size-banded override the component sheets apply. EN8 is priced
     on a diameter, C45 on a thickness; everything else keeps its flat
     Material Master rate. Out of band falls back to the first row, which
     is what IFERROR(...,INDEX(table,1,3)) does on the C45 path. */
  function materialRate(code, sizeMm) {
    var m = MATERIALS[code];
    if (!m) return null;
    if (code === 'MS-EN8') {
      var r = vlookup(EN8_BY_DIA, sizeMm, 2);
      return r === null ? EN8_BY_DIA[0][2] : r;
    }
    if (code === 'MS-C45') {
      var c = vlookup(C45_BY_THICKNESS, sizeMm, 2);
      return c === null ? C45_BY_THICKNESS[0][2] : c;
    }
    return m.rate;
  }

  function machineRate(name) {
    return Object.prototype.hasOwnProperty.call(MACHINE_RATES, name)
      ? MACHINE_RATES[name] : null;
  }

  function turningRate(finishedDia, kind) {
    var i = binIndex(rowStarts(TURNING_RATES), finishedDia);
    if (i < 0) return null;
    return kind === 'finish' ? TURNING_RATES[i][3] : TURNING_RATES[i][2];
  }

  /* Rs./cm2. The high rate applies once EITHER the length or the ID
     passes its threshold — the workbook's AND() is on the low side. */
  function honingRate(lengthMm, idMm) {
    return (lengthMm <= HONING.lengthThreshold && idMm <= HONING.idThreshold)
      ? HONING.rateLow : HONING.rateHigh;
  }

  function weldBeads(diaMm) {
    var b = vlookup(WELD_BEADS, diaMm, 2);
    /* Piston Rod wraps this in IFERROR(...,first row); a 40mm rod sits
       below the 50mm table start and would otherwise break the sheet. */
    return b === null ? WELD_BEADS[0][2] : b;
  }

  function cuttingHours(odMm, lengthMm)  { return grid2d(CUTTING, odMm, lengthMm); }
  function roughTurnHours(odMm, lenMm)   { return grid2d(ROUGH_TURNING, odMm, lenMm); }
  function boringHours(idMm, lengthMm)   { return grid2d(BORING, idMm, lengthMm); }
  function honingHours(idMm, lengthMm)   { return grid2d(HONING_TIME, idMm, lengthMm); }
  function grindingHours(odMm, lengthMm) { return grid2d(GRINDING_TIME, odMm, lengthMm); }

  function stockRemovalFactor(mm) {
    var f = vlookup(STOCK_REMOVAL, mm, 2);
    return f === null ? 1 : f;
  }
  function millingHours(areaMm2)   { return vlookup(MILLING, areaMm2, 2); }
  function drillingHoursPerHole(d) { return vlookup(DRILLING, d, 2); }
  function profileCuttingHours(kg) { return vlookup(PROFILE_CUTTING_TIME, kg, 2); }

  /* Seal kit. Returns { price } or { unavailable, reason } — never a
     number the catalogue does not contain. */
  function sealKit(bore, brand, mtl, type) {
    var lo = SEAL_TABLE[0][0], hi = SEAL_TABLE[SEAL_TABLE.length - 1][0];
    if (typeof bore !== 'number' || bore < lo || bore > hi) {
      return { unavailable: true,
               reason: 'Bore ' + bore + 'mm is outside the priced range (' +
                       lo + '-' + hi + 'mm). Enter the seal price manually.' };
    }
    if (type === 'Chevron') {
      return { unavailable: true,
               reason: 'Chevron has no price in the source catalogue.' };
    }
    if (brand === 'Freudenberg' && mtl === 'PU') {
      return { unavailable: true,
               reason: 'Freudenberg + PU has no price in the source catalogue.' };
    }
    var col = (brand === 'Freudenberg' && mtl === 'Viton') ? 4
            : (brand === 'Others' && mtl === 'Viton') ? 3
            : (brand === 'Others' && mtl === 'PU') ? 2 : -1;
    if (col < 0) {
      return { unavailable: true, reason: 'No catalogue column for ' + brand + ' + ' + mtl + '.' };
    }
    var kit = vlookup(SEAL_TABLE, bore, col);
    if (kit === null) return { unavailable: true, reason: 'No catalogue row at bore ' + bore + 'mm.' };
    return { kitCost: kit, markup: SEAL_MARKUP, price: kit * (1 + SEAL_MARKUP),
             catalogueRodDia: vlookup(SEAL_TABLE, bore, 1) };
  }

  root.HISPL_MASTERS_V1 = {
    /* primitives, exported so the geometry tables can reuse them */
    binIndex: binIndex,
    vlookup: vlookup,

    /* Which time tables a given length has outrun. Returns a list of
       { table, message } so the engine can attach it to a component. */
    ceilingWarnings: function (lengthMm) {
      var checks = [
        { name: 'Cutting',       spec: CUTTING },
        { name: 'Rough turning', spec: ROUGH_TURNING },
        { name: 'Boring',        spec: BORING },
        { name: 'Honing',        spec: HONING_TIME },
        { name: 'Grinding',      spec: GRINDING_TIME }
      ];
      var out = [], i, msg;
      for (i = 0; i < checks.length; i++) {
        msg = beyondCeiling(checks[i].spec, lengthMm);
        if (msg) out.push({ table: checks[i].name, message: msg });
      }
      return out;
    },

    material: material,
    materialRate: materialRate,
    machineRate: machineRate,
    turningRate: turningRate,
    honingRate: honingRate,
    weldBeads: weldBeads,
    weldRatePerInchBead: WELD.ratePerInchBead,

    cuttingHours: cuttingHours,
    roughTurnHours: roughTurnHours,
    boringHours: boringHours,
    honingHours: honingHours,
    grindingHours: grindingHours,
    stockRemovalFactor: stockRemovalFactor,
    millingHours: millingHours,
    drillingHoursPerHole: drillingHoursPerHole,
    profileCuttingHours: profileCuttingHours,

    processRate: function (k) { return PROCESS_RATES[k] ? PROCESS_RATES[k].rate : null; },
    sealKit: sealKit,

    /* read-only views, for the UI's traceability panel */
    tables: {
      materials: MATERIALS, machineRates: MACHINE_RATES, processRates: PROCESS_RATES,
      turning: TURNING_RATES, honing: HONING, weld: WELD, weldBeads: WELD_BEADS,
      cutting: CUTTING, roughTurning: ROUGH_TURNING, boring: BORING,
      honingTime: HONING_TIME, grindingTime: GRINDING_TIME,
      stockRemoval: STOCK_REMOVAL, milling: MILLING, drilling: DRILLING,
      profileCutting: PROFILE_CUTTING_TIME, seals: SEAL_TABLE,
      en8ByDia: EN8_BY_DIA, c45ByThickness: C45_BY_THICKNESS
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.HISPL_MASTERS_V1;
  }
})(typeof window !== 'undefined' ? window : this);
