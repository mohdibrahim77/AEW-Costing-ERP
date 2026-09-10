/* HISPL costing — component geometry, VERSION 1 workbook.
   Source: the per-component geometry tables in VERSION_1.xlsx
   (CECGeomTable, GlandGeomTable, TrunnionGeomTable, and so on), plus
   the 'Geometry Master' sheet's status map.

   This is what changed between the last workbook and this one. Before,
   every dimension past bore/rod/stroke was ENGINEERING INPUT REQUIRED,
   because the file contained exactly one dimensioned cylinder and one
   example is not a rule. This workbook ships a stepped lookup table per
   component, keyed on Bore, Rod Diameter or Tube OD, so the geometry is
   now derivable for eleven of the thirteen components.

   Confidence is not uniform and the workbook says so on each sheet. It
   is carried through to the UI verbatim rather than averaged away: a
   figure resting on ISO 6020-2 and one resting on "general proportion,
   no formal published source found" should not look alike to whoever
   signs the quotation.

   Every table matches on BIN STARTS — VLOOKUP(...,TRUE) — so a bin
   labelled 90 covers 90 up to the next entry. Below the first bin the
   workbook's IFERROR yields 0, which would silently cost a component at
   nothing; we return an explicit refusal instead. */
(function (root) {
  'use strict';

  var M = (typeof require !== 'undefined')
    ? require('./masters.js')
    : root.HISPL_MASTERS_V1;

  var EIR = 'ENGINEERING INPUT REQUIRED';

  /* Confidence, as stated on each sheet. The wording is HISPL's and
     Aniktha's, not a summary of it. */
  var CONF = {
    approved:  { level: 'approved', label: 'HISPL-approved',
                 note: 'Stepped table approved by HISPL against a published standard.' },
    mediumHigh:{ level: 'medium-high', label: 'Medium-high confidence',
                 note: 'Confirmed by multiple independent sources.' },
    medium:    { level: 'medium', label: 'Medium confidence',
                 note: 'Ratios are practical estimates, not a published standard.' },
    low:       { level: 'low', label: 'Lower confidence',
                 note: 'General proportion; no formal published source found.' }
  };

  /* ── the tables, transcribed column-for-column ─────────────────── */

  var TABLES = {
    /* Cap End Cover and Head End Cover are the same table on two sheets.
       Bore-driven. cols: dia, width, height, thickness, finishedOD */
    endCover: {
      driver: 'bore', confidence: CONF.medium,
      basis: 'Finished OD 1.3x Bore, Thickness 0.35x Bore, raw round Diameter 1.35x Bore.',
      cols: ['diameter', 'width', 'height', 'thickness', 'finishedOD'],
      rows: [
        [50,  68,  65,  65,  18, 65],
        [63,  85,  82,  82,  23, 82],
        [80,  108, 105, 105, 28, 105],
        [100, 135, 130, 130, 35, 130],
        [125, 168, 165, 165, 44, 165],
        [150, 200, 195, 195, 53, 195],
        [160, 215, 210, 210, 56, 210],
        [180, 240, 235, 235, 63, 235],
        [200, 265, 260, 260, 70, 260]
      ]
    },

    /* Gland. Rod-driven. ID is rod + 1mm clearance. */
    gland: {
      driver: 'rodDia', confidence: CONF.medium,
      basis: 'ID = RodDia + 1mm clearance, OD 2.0x RodDia, Length 1.1x RodDia.',
      cols: ['id', 'od', 'length'],
      rows: [
        [40,  41,  80,  45],
        [45,  46,  90,  50],
        [50,  51,  100, 56],
        [56,  57,  112, 63],
        [63,  64,  125, 70],
        [70,  71,  140, 80],
        [80,  81,  160, 90],
        [90,  91,  180, 100],
        [100, 101, 200, 112]
      ]
    },

    cushionBush: {
      driver: 'rodDia', confidence: CONF.low,
      basis: 'OD 1.4x RodDia, ID = RodDia + 1mm, Length 0.8x RodDia.',
      cols: ['od', 'id', 'length'],
      rows: [
        [40,  56,  41,  32],
        [45,  63,  46,  36],
        [50,  70,  51,  40],
        [56,  78,  57,  45],
        [63,  88,  64,  50],
        [70,  98,  71,  56],
        [80,  112, 81,  64],
        [90,  126, 91,  72],
        [100, 140, 101, 80]
      ]
    },

    piston: {
      driver: 'bore', confidence: CONF.mediumHigh,
      basis: 'OD = Bore (the piston seals against the bore). Length 0.6x Bore.',
      cols: ['od', 'length'],
      rows: [
        [50,  50,  30],
        [63,  63,  40],
        [80,  80,  50],
        [100, 100, 60],
        [125, 125, 75],
        [150, 150, 90],
        [160, 160, 100],
        [180, 180, 110],
        [200, 200, 120]
      ]
    },

    stopTube: {
      driver: 'rodDia', confidence: CONF.low,
      basis: 'Raw Dia 1.2x RodDia, Finished Dia 1.1x RodDia. Length stays manual — no defensible relationship found.',
      cols: ['rawDia', 'finishedDia'],
      rows: [
        [40,  55,  50],
        [45,  62,  56],
        [50,  68,  62],
        [56,  76,  70],
        [63,  86,  79],
        [70,  95,  88],
        [80,  108, 100],
        [90,  122, 113],
        [100, 135, 125]
      ]
    },

    /* Rear Eye is Tube-OD driven — confirmed by HISPL 31-Aug-2026. */
    rearEye: {
      driver: 'tubeOD', confidence: CONF.low,
      basis: 'Thickness 0.15x, Width 0.5x, Height 0.6x, Pin Hole 0.25x Tube OD.',
      cols: ['thickness', 'width', 'height', 'pinHole'],
      rows: [
        [70,  11, 35,  42,  18],
        [80,  12, 40,  48,  20],
        [90,  14, 45,  54,  23],
        [100, 15, 50,  60,  25],
        [110, 17, 55,  66,  28],
        [120, 18, 60,  72,  30],
        [140, 21, 70,  84,  35],
        [150, 23, 75,  90,  38],
        [160, 24, 80,  96,  40],
        [180, 27, 90,  108, 45],
        [200, 30, 100, 120, 50]
      ]
    },

    rodEye: {
      driver: 'rodDia', confidence: CONF.approved,
      basis: 'Rod-end/clevis design guidance (pin dia 0.3-0.5x rod dia), rounded to standard sizes. Approved by HISPL.',
      cols: ['eyeID', 'eyeOD', 'thickness', 'pinHole'],
      rows: [
        [40,  16, 71,  20, 16.5],
        [45,  18, 80,  22, 18.5],
        [50,  20, 90,  25, 20.5],
        [56,  22, 100, 28, 22.5],
        [63,  25, 112, 32, 25.5],
        [70,  28, 125, 35, 28.5],
        [80,  32, 144, 40, 32.5],
        [90,  36, 162, 45, 36.5],
        [100, 40, 180, 50, 40.5]
      ]
    },

    flange: {
      driver: 'tubeOD', confidence: CONF.low,
      basis: 'The always-present round flange (gland retainer). OD 1.5x Tube OD, Length 0.3x Tube OD.',
      cols: ['od', 'length'],
      rows: [
        [70,  105, 21],
        [80,  120, 24],
        [90,  135, 27],
        [100, 150, 30],
        [110, 165, 33],
        [120, 180, 36],
        [140, 210, 42],
        [150, 225, 45],
        [160, 240, 48],
        [180, 270, 54],
        [200, 300, 60]
      ]
    },

    trunnion: {
      driver: 'tubeOD', confidence: CONF.approved,
      basis: 'ISO 6020-2 / NFPA MT1-MT4 trunnion proportions, rounded to standard round-bar sizes. Approved by HISPL.',
      cols: ['pinDia', 'trunnionOD', 'thickness', 'length'],
      rows: [
        [70,  40,  80,  20, 45],
        [80,  45,  90,  22, 50],
        [90,  50,  100, 25, 56],
        [100, 56,  112, 28, 63],
        [110, 63,  125, 32, 70],
        [120, 70,  140, 35, 80],
        [140, 80,  160, 40, 90],
        [150, 85,  170, 42, 95],
        [160, 90,  180, 45, 100],
        [180, 100, 200, 50, 112],
        [200, 115, 230, 58, 130]
      ]
    },

    cecClevis: {
      driver: 'bore', confidence: CONF.approved,
      basis: 'ISO 6022 clevis mount (MP1/MP3) proportions + ISO 8140 fork/clevis ratios. Approved by HISPL.',
      cols: ['width', 'pinDia', 'pinHole', 'thickness', 'length'],
      rows: [
        [50,  40,  20, 20.5, 20, 45],
        [63,  50,  25, 25.5, 25, 56],
        [80,  63,  32, 32.5, 32, 70],
        [100, 80,  40, 40.5, 40, 90],
        [125, 100, 50, 50.5, 50, 110],
        [150, 112, 56, 56.5, 56, 125],
        [160, 125, 63, 63.5, 63, 140],
        [180, 140, 70, 70.5, 70, 160],
        [200, 160, 80, 80.5, 80, 180]
      ]
    },

    frontFlange: {
      driver: 'bore', confidence: CONF.approved,
      basis: 'ISO 6020-1 MF1 head rectangular flange, rounded UP to standard sizes — upper-end bias intentional for costing.',
      cols: ['width', 'thickness', 'holeDia'],
      rows: [
        [25,  50,  10, 11],
        [32,  60,  13, 13],
        [40,  75,  16, 13],
        [50,  95,  20, 15],
        [63,  120, 25, 15],
        [80,  150, 32, 19],
        [100, 190, 40, 19],
        [125, 235, 50, 23],
        [160, 300, 62, 27],
        [200, 375, 78, 27]
      ]
    },

    footLug: {
      driver: 'tubeOD', confidence: CONF.approved,
      basis: 'NFPA MS2/MS7 side-lug proportions (Parker 2H reference), rounded to standard plate/drill sizes. Approved by HISPL.',
      cols: ['thickness', 'width', 'length', 'holeDia'],
      rows: [
        [70,  10, 40,  25, 9],
        [80,  12, 45,  28, 9],
        [90,  12, 50,  32, 11],
        [100, 16, 56,  35, 11],
        [110, 16, 60,  40, 13],
        [120, 18, 66,  42, 13],
        [140, 20, 77,  49, 17],
        [150, 22, 82,  53, 17],
        [160, 25, 88,  56, 17],
        [180, 28, 99,  63, 21],
        [200, 30, 110, 70, 21]
      ]
    }
  };

  /* ── lookup ────────────────────────────────────────────────────── */

  /* Returns { values, driver, driverValue, bin, confidence, basis } or
     { error } when the driver falls below the table's first bin.

     The workbook's IFERROR would hand back 0 here, and a zero dimension
     costs the component at nothing while still printing a total. That
     is the failure mode the bore-63 bug had, so it refuses instead. */
  /* Overrides are the third argument because every component sheet has
     them: a block of cells headed "Manual Overrides (blank = use table
     above; enter a value here to force it from an actual GA/design
     drawing)". The stepped tables are approximations for costing; once a
     real drawing exists its dimensions must win.

     Each sheet implements this as IF(override="", VLOOKUP(...), override),
     so a blank falls through to the table and any value at all replaces
     it. Reproduced: only null, undefined and '' fall through. */
  function derive(tableName, driverValue, overrides) {
    var t = TABLES[tableName];
    if (!t) return { error: 'No geometry table named ' + tableName };
    if (typeof driverValue !== 'number' || isNaN(driverValue)) {
      return { error: EIR + ' — ' + t.driver + ' not supplied' };
    }
    var starts = [], i;
    for (i = 0; i < t.rows.length; i++) starts.push(t.rows[i][0]);
    var idx = M.binIndex(starts, driverValue);
    if (idx < 0) {
      return { error: EIR + ' — ' + t.driver + ' ' + driverValue +
                      'mm is below the table\'s first bin (' + starts[0] + 'mm)' };
    }
    var row = t.rows[idx], values = {}, overridden = [];
    for (i = 0; i < t.cols.length; i++) {
      var key = t.cols[i];
      var ov = overrides ? overrides[key] : undefined;
      if (ov === undefined || ov === null || ov === '') {
        values[key] = row[i + 1];
      } else {
        var num = typeof ov === 'number' ? ov : parseFloat(ov);
        if (isNaN(num)) { values[key] = row[i + 1]; }
        else { values[key] = num; overridden.push(key); }
      }
    }
    return {
      table: tableName, values: values, driver: t.driver, driverValue: driverValue,
      /* Which dimensions came from a drawing rather than the table. The
         UI has to say so: an overridden figure carries the drawing's
         authority, not the table's confidence rating. */
      overridden: overridden,
      bin: row[0], confidence: t.confidence, basis: t.basis,
      /* True when the driver sits past the last bin: the table stops
         rather than extrapolating, so the top row is being stretched. */
      atTopOfTable: idx === t.rows.length - 1 && driverValue > row[0]
    };
  }

  /* ══ WHAT THE TABLES DO NOT COVER ═════════════════════════════════
     The Geometry Master sheet is explicit that these stay manual. They
     are engineering inputs, not defaults: a stroke-to-tube-length
     allowance has never been validated, so inventing one would put a
     number into a quotation that no one at HISPL has agreed to. */
  var MANUAL = [
    { component: 'Tube', field: 'rawOD', label: 'Tube Raw OD',
      reason: 'Kept manual per HISPL instruction — raw stock size is a purchasing decision, not a derived dimension.' },
    { component: 'Tube', field: 'length', label: 'Tube Raw Length',
      reason: 'No validated Stroke-to-Tube-Length allowance exists.' },
    { component: 'Piston Rod', field: 'rawDia', label: 'Rod Raw Diameter',
      reason: 'No validated rod turning allowance exists.' },
    { component: 'Piston Rod', field: 'length', label: 'Rod Length',
      reason: 'No validated Stroke-to-Rod-Length allowance exists.' },
    { component: 'Stop Tube', field: 'length', label: 'Stop Tube Length',
      reason: 'Application-specific; no defensible relationship to stroke found.' }
  ];

  /* Milling and drilling dimensions are per-component and not derivable
     from bore/rod/stroke. The workbook carries a working value for each
     on its sheet; those are seeded as starting points in components.js
     and are editable, which is the honest treatment — they are neither
     derived nor invented, they are what HISPL's own sheet uses. */

  root.HISPL_GEOMETRY_V1 = {
    derive: derive,
    tables: TABLES,
    manual: MANUAL,
    confidenceLevels: CONF,
    EIR: EIR
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.HISPL_GEOMETRY_V1;
  }
})(typeof window !== 'undefined' ? window : this);
