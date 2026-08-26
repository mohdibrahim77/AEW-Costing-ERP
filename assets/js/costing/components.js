/**
 * components.js  —  HISPL Costing v2  —  Component definitions
 * ─────────────────────────────────────────────────────────
 * The twelve component sheets of Trunion_Included.xlsx, expressed as
 * data. One definition per component, in the workbook's own
 * A / B / C / D / E shape and its own dependency order.
 *
 * Transcribed from the workbook, not from the specification. Every
 * weight formula, process row, machine name and rate basis here has a
 * cell address behind it — see hispl-v2/source/EXTRACTED_FORMULAS.md
 * and STRUCTURE_MAP.md.
 *
 * WHAT THIS FILE DOES NOT DO
 *
 * It does not derive a single dimension. In the workbook every
 * component dimension is typed by the estimator; no formula anywhere
 * computes one from bore, rod or stroke. Those standards may not exist
 * in writing at all — that is an open question with HISPL.
 *
 * So each dimension is declared with `derivedFrom: null`, and the
 * engine surfaces ENGINEERING_INPUT_REQUIRED for any the caller does
 * not supply. When HISPL answers, geometry.js fills those in by setting
 * `derivedFrom`; nothing else here changes.
 *
 * ES5-compatible per CLAUDE.md: var, function, no arrow functions, no
 * template literals.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};
  var M = window.AEW.masters;
  if (!M) throw new Error('components.js requires masters.js');

  var EIR = M.EIR;

  /* ══════════════════════════════════════════════════════════════
     WEIGHT FORMULAS

     All four shapes the workbook uses. Each returns kilograms.
     mm^3 x (g/cm^3) / 1e6 = kg — the workbook's own conversion,
     verified against its cached values.
     ══════════════════════════════════════════════════════════════ */
  var PI = Math.PI;

  function solidCylinder(d, dia, len, density) {
    return (PI / 4) * dia * dia * len * density / 1e6;
  }
  function annulus(d, od, id, len, density) {
    return (PI / 4) * (od * od - id * id) * len * density / 1e6;
  }
  function block(d, a, b, c, density) {
    return a * b * c * density / 1e6;
  }

  /* Field kinds, mirroring the workbook's three cell types. */
  var INPUT = 'input';        /* typed by the estimator */
  var LOOKUP = 'looked-up';   /* resolved through masters.js */
  var DERIVED = 'derived';    /* arithmetic on cells above */

  /* A dimension the workbook takes as typed. `derivedFrom` stays null
     until HISPL supplies an approved standard. */
  function dim(key, label, cell) {
    return { key: key, label: label, cell: cell, kind: INPUT, derivedFrom: null };
  }

  /* A Section B process row.
     `basis` says what feeds the Hours/Qty column:
       time2d   — two-axis Machine Time Master lookup
       time1d   — milling / drilling / profileCutting
       area     — PI x D x L / 100, charged per cm2
       weight   — the component's own weight, charged per kg
       vendor   — a flat manual figure
     `rate` says where the money comes from:
       machine     — Machine Rate Master by name
       turningCard — Turning Rate Card by finished diameter
       honingCard  — Honing Rate Card by stroke and ID
       process     — Process Rate Master by name           */
  function proc(o) {
    return {
      process: o.process,
      applyDefault: o.applyDefault !== false,
      basis: o.basis,
      table: o.table || null,
      rowFrom: o.rowFrom || null,
      colFrom: o.colFrom || null,
      areaOf: o.areaOf || null,
      rate: o.rate,
      machine: o.machine || null,
      processName: o.processName || null,
      turningKind: o.turningKind || null,
      stockFrom: o.stockFrom || null,
      finishFactor: o.finishFactor || false,
      holesFrom: o.holesFrom || null,
      note: o.note || null
    };
  }

  /* A Section C welding block. Tube has three, Piston Rod one.
     All four share one formula; only the weld diameter differs. */
  function weld(key, label, diaFrom) {
    return { key: key, label: label, diaFrom: diaFrom };
  }

  /* ══════════════════════════════════════════════════════════════
     THE TWELVE COMPONENTS

     Order matches the workbook's Cost Summary rows B7..B18.
     ══════════════════════════════════════════════════════════════ */
  var COMPONENTS = [

    /* ── 1. Tube — sheet 6, 51 formulas ─────────────────────────── */
    {
      key: 'tube', name: 'Tube', sheet: 'Tube',
      defaultGrade: 'ST52',
      gradeCell: 'B6',
      dims: [
        dim('rawOD',      'Raw OD',      'B7'),
        dim('finishedOD', 'Finished OD', 'B8'),
        dim('finishedID', 'Finished ID', 'B9'),
        dim('length',     'Length',      'B10'),
        dim('holeDia',    'Hole Diameter [drilling]', 'B21'),
        dim('holeCount',  'No. of Holes',             'B22')
      ],
      /* B16 = (PI/4)((RawOD)^2 - (FinishedID)^2) x L x density / 1e6
         NOTE: raw OD with FINISHED ID. Transcribed exactly as the
         workbook has it. Whether that is intended is an open question
         with HISPL — there is no Raw ID field on the sheet. */
      weightCell: 'B16',
      weight: function (d, density) {
        return annulus(d, d.rawOD, d.finishedID, d.length, density);
      },
      weightNeeds: ['rawOD', 'finishedID', 'length'],
      processes: [
        proc({ process: 'Cutting', basis: 'time2d', table: 'cutting',
               rowFrom: 'rawOD', colFrom: 'length',
               rate: 'machine', machine: 'Cutting Machine' }),
        proc({ process: 'Rough Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedOD', colFrom: 'length', stockFrom: 'rawOD',
               rate: 'turningCard', turningKind: 'rough' }),
        proc({ process: 'Boring', basis: 'time2d', table: 'boring',
               rowFrom: 'finishedID', colFrom: 'length',
               rate: 'machine', machine: 'Center Lathe', applyDefault: false,
               note: 'Workbook looks up "Conventional Lathe", which is not a ' +
                     'machine in the master (Center Lathe is) and returns #N/A. ' +
                     'Resolved to Center Lathe here; confirm with HISPL.' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' }),
        proc({ process: 'Rough Honing', basis: 'area', areaOf: 'id',
               rate: 'honingCard' }),
        proc({ process: 'Finish Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedOD', colFrom: 'length', finishFactor: true,
               rate: 'turningCard', turningKind: 'finish' }),
        proc({ process: 'Finished Honing', basis: 'area', areaOf: 'id',
               rate: 'honingCard',
               note: 'Charged at full area a second time, as the workbook does.' })
      ],
      welds: [
        weld('part',   'Part Welding (tube parts joint)', 'finishedOD'),
        weld('cec',    'CEC Welding',                     'finishedOD'),
        weld('rearEye','Rear Eye Welding',                'finishedOD')
      ]
    },

    /* ── 2. Piston Rod — sheet 7, 46 formulas ───────────────────── */
    {
      key: 'pistonRod', name: 'Piston Rod', sheet: 'Piston Rod',
      defaultGrade: 'EN19',
      gradeCell: 'B6',
      dims: [
        dim('rawDia',      'Raw Diameter',      'B7'),
        dim('finishedDia', 'Finished Diameter', 'B8'),
        dim('length',      'Length',            'B9'),
        dim('millWidth',   'Machined Width [milling]',  'B20'),
        dim('millLength',  'Machined Length [milling]', 'B21'),
        dim('deepHoleCost','Deep Hole Drilling Vendor Cost', 'B22')
      ],
      /* B15 = (PI/4)(RawDia^2) x L x density / 1e6 — solid bar */
      weightCell: 'B15',
      weight: function (d, density) {
        return solidCylinder(d, d.rawDia, d.length, density);
      },
      weightNeeds: ['rawDia', 'length'],
      processes: [
        proc({ process: 'Cutting', basis: 'time2d', table: 'cutting',
               rowFrom: 'rawDia', colFrom: 'length',
               rate: 'machine', machine: 'Cutting Machine' }),
        proc({ process: 'Rough Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedDia', colFrom: 'length', stockFrom: 'rawDia',
               rate: 'turningCard', turningKind: 'rough' }),
        proc({ process: 'Heat Treatment', basis: 'weight',
               rate: 'process', processName: 'Heat Treatment' }),
        proc({ process: 'Induction Hardening', basis: 'area', areaOf: 'od',
               rate: 'process', processName: 'Induction Hardening' }),
        proc({ process: 'Finish Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedDia', colFrom: 'length', finishFactor: true,
               rate: 'turningCard', turningKind: 'finish' }),
        proc({ process: 'Grinding', basis: 'area', areaOf: 'od',
               rate: 'process', processName: 'Grinding' }),
        proc({ process: 'Chrome Plating', basis: 'area', areaOf: 'od',
               rate: 'process', processName: 'Chrome Plating' }),
        proc({ process: 'Polishing', basis: 'area', areaOf: 'od',
               rate: 'process', processName: 'Polishing' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Deep Hole Drilling', basis: 'vendor',
               rate: 'vendor', note: 'Manual vendor figure, B22.' })
      ],
      welds: [ weld('rodEye', 'Rod Eye Welding', 'finishedDia') ]
    },

    /* ── 3. Cap End Cover — sheet 8, 21 formulas ────────────────── */
    {
      key: 'capEndCover', name: 'Cap End Cover', sheet: 'Cap End Cover',
      defaultGrade: 'C45',
      gradeCell: 'B7',
      shapeCell: 'B5',
      dims: [
        dim('diameter',   'Diameter',    'B8'),
        dim('width',      'Width',       'B9'),
        dim('height',     'Height',      'B10'),
        dim('thickness',  'Thickness',   'B11'),
        dim('finishedOD', 'Finished OD', 'B12'),
        dim('millWidth',  'Machined Width [milling]',  'B23'),
        dim('millLength', 'Machined Length [milling]', 'B24'),
        dim('holeDia',    'Hole Diameter [drilling]',  'B25'),
        dim('holeCount',  'No. of Holes',              'B26')
      ],
      /* B18 = IF(shape="Round", (PI/4)Dia^2 x Thk, W x H x Thk) x rho/1e6
         The only geometry conditional in the workbook. Note the raw
         blank drives weight; Finished OD (B12) takes no part in it. */
      weightCell: 'B18',
      shaped: true,
      weight: function (d, density, shape) {
        return shape === 'Round'
          ? solidCylinder(d, d.diameter, d.thickness, density)
          : block(d, d.width, d.height, d.thickness, density);
      },
      weightNeedsRound: ['diameter', 'thickness'],
      weightNeedsRect:  ['width', 'height', 'thickness'],
      processes: [
        proc({ process: 'Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedOD', colFrom: 'thickness',
               rate: 'machine', machine: 'CNC Lathe' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine', applyDefault: false })
      ],
      welds: []
    },

    /* ── 4. Head End Cover — sheet 9, identical to CEC ──────────── */
    {
      key: 'headEndCover', name: 'Head End Cover', sheet: 'Head End Cover',
      defaultGrade: 'C45',
      gradeCell: 'B7',
      shapeCell: 'B5',
      sameShapeAs: 'capEndCover',
      dims: [
        dim('diameter',   'Diameter',    'B8'),
        dim('width',      'Width',       'B9'),
        dim('height',     'Height',      'B10'),
        dim('thickness',  'Thickness',   'B11'),
        dim('finishedOD', 'Finished OD', 'B12'),
        dim('millWidth',  'Machined Width [milling]',  'B23'),
        dim('millLength', 'Machined Length [milling]', 'B24'),
        dim('holeDia',    'Hole Diameter [drilling]',  'B25'),
        dim('holeCount',  'No. of Holes',              'B26')
      ],
      weightCell: 'B18',
      shaped: true,
      weight: function (d, density, shape) {
        return shape === 'Round'
          ? solidCylinder(d, d.diameter, d.thickness, density)
          : block(d, d.width, d.height, d.thickness, density);
      },
      weightNeedsRound: ['diameter', 'thickness'],
      weightNeedsRect:  ['width', 'height', 'thickness'],
      processes: [
        proc({ process: 'Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedOD', colFrom: 'thickness',
               rate: 'machine', machine: 'CNC Lathe' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' })
      ],
      welds: []
    },

    /* ── 5. Gland — sheet 10, 24 formulas ───────────────────────── */
    {
      key: 'gland', name: 'Gland', sheet: 'Gland',
      defaultGrade: 'C45',
      gradeCell: 'B6',
      dims: [
        dim('od',     'OD',     'B7'),
        dim('id',     'ID',     'B8'),
        dim('length', 'Length', 'B9'),
        dim('millWidth',  'Machined Width [milling]',  'B20'),
        dim('millLength', 'Machined Length [milling]', 'B21'),
        dim('holeDia',    'Hole Diameter [drilling]',  'B22'),
        dim('holeCount',  'No. of Holes',              'B23')
      ],
      /* B15 = (PI/4)(OD^2 - ID^2) x L x rho / 1e6 */
      weightCell: 'B15',
      weight: function (d, density) {
        return annulus(d, d.od, d.id, d.length, density);
      },
      weightNeeds: ['od', 'id', 'length'],
      processes: [
        proc({ process: 'Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'od', colFrom: 'length',
               rate: 'machine', machine: 'CNC Lathe' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' }),
        proc({ process: 'Grinding (ID bore)', basis: 'area', areaOf: 'id',
               rate: 'process', processName: 'Grinding' })
      ],
      welds: []
    },

    /* ── 6. Cushion Bush — sheet 11, 18 formulas ────────────────── */
    {
      key: 'cushionBush', name: 'Cushion Bush', sheet: 'Cushion Bush',
      defaultGrade: 'BR-SAE660',
      gradeCell: 'B6',
      dims: [
        dim('od',     'OD',     'B7'),
        dim('id',     'ID',     'B8'),
        dim('length', 'Length', 'B9')
      ],
      /* B15 = (PI/4)(OD^2 - ID^2) x L x rho / 1e6 — bronze, density 8.9 */
      weightCell: 'B15',
      weight: function (d, density) {
        return annulus(d, d.od, d.id, d.length, density);
      },
      weightNeeds: ['od', 'id', 'length'],
      processes: [
        proc({ process: 'Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'od', colFrom: 'length',
               rate: 'machine', machine: 'CNC Lathe' }),
        proc({ process: 'Grinding (ID bore)', basis: 'area', areaOf: 'id',
               rate: 'process', processName: 'Grinding' })
      ],
      welds: []
    },

    /* ── 7. Stop Tube — sheet 12, 15 formulas, the simplest ─────── */
    {
      key: 'stopTube', name: 'Stop Tube', sheet: 'Stop Tube',
      defaultGrade: 'EN8',
      gradeCell: 'B6',
      dims: [
        dim('rawDia',      'Raw Diameter',      'B7'),
        dim('finishedDia', 'Finished Diameter', 'B8'),
        dim('length',      'Length',            'B9')
      ],
      /* B15 = (PI/4)(RawDia^2) x L x rho / 1e6 — solid, despite the name */
      weightCell: 'B15',
      weight: function (d, density) {
        return solidCylinder(d, d.rawDia, d.length, density);
      },
      weightNeeds: ['rawDia', 'length'],
      processes: [
        proc({ process: 'Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'finishedDia', colFrom: 'length', stockFrom: 'rawDia',
               rate: 'turningCard', turningKind: 'rough' })
      ],
      welds: []
    },

    /* ── 8. Rear Eye — sheet 13, 21 formulas, profile-cut ───────── */
    {
      key: 'rearEye', name: 'Rear Eye', sheet: 'Rear Eye',
      defaultGrade: 'PLATE-IS2062',
      gradeCell: 'B6',
      dims: [
        dim('thickness',  'Raw Plate Thickness', 'B7'),
        dim('width',      'Width',               'B8'),
        dim('height',     'Height',              'B9'),
        dim('pinHoleDia', 'Pin Hole Diameter',   'B10'),
        dim('holeCount',  'No. of Pin Holes',    'B21'),
        /* D26 = VLOOKUP((B8)*(B9), MillingTable,…) — the milling area is
           the blank's Width x Height, not separate machined cells. */
        dim('millWidth',  'Milling area width [= Width]',  'B8'),
        dim('millLength', 'Milling area length [= Height]', 'B9')
      ],
      /* B16 = W x H x Thk x rho / 1e6 — rectangular plate blank */
      weightCell: 'B16',
      weight: function (d, density) {
        return block(d, d.width, d.height, d.thickness, density);
      },
      weightNeeds: ['width', 'height', 'thickness'],
      processes: [
        /* D25 = B16 — the WEIGHT feeds the cost row, charged per kg.
           Not a machine-hour process. */
        proc({ process: 'Profile Cutting', basis: 'weight',
               rate: 'process', processName: 'Profile Cutting' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'pinHoleDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' })
      ],
      welds: []
    },

    /* ── 9. Rod Eye — sheet 14, 21 formulas ─────────────────────── */
    {
      key: 'rodEye', name: 'Rod Eye', sheet: 'Rod Eye',
      defaultGrade: 'PLATE-IS2062',
      gradeCell: 'B7',
      shapeCell: 'B5',
      dims: [
        dim('diameter',   'Diameter',          'B8'),
        dim('width',      'Width',             'B9'),
        dim('height',     'Height',            'B10'),
        dim('thickness',  'Thickness',         'B11'),
        dim('pinHoleDia', 'Pin Hole Diameter', 'B12'),
        dim('holeCount',  'No. of Pin Holes',  'B23'),
        /* D28 = VLOOKUP((B9)*(B10), MillingTable,…) */
        dim('millWidth',  'Milling area width [= Width]',   'B9'),
        dim('millLength', 'Milling area length [= Height]', 'B10')
      ],
      weightCell: 'B18',
      shaped: true,
      weight: function (d, density, shape) {
        return shape === 'Round'
          ? solidCylinder(d, d.diameter, d.thickness, density)
          : block(d, d.width, d.height, d.thickness, density);
      },
      weightNeedsRound: ['diameter', 'thickness'],
      weightNeedsRect:  ['width', 'height', 'thickness'],
      processes: [
        proc({ process: 'Profile Cutting', basis: 'weight',
               rate: 'process', processName: 'Profile Cutting' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'pinHoleDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' })
      ],
      welds: []
    },

    /* ── 10. Piston — sheet 15, 21 formulas ─────────────────────── */
    {
      key: 'piston', name: 'Piston', sheet: 'Piston',
      defaultGrade: 'EN8',
      gradeCell: 'B6',
      dims: [
        dim('od',     'OD',     'B7'),
        dim('length', 'Length', 'B8'),
        dim('millWidth',  'Machined Width [groove milling]',  'B19'),
        dim('millLength', 'Machined Length [groove milling]', 'B20'),
        dim('holeDia',    'Hole Diameter [drilling]',         'B21'),
        dim('holeCount',  'No. of Holes',                     'B22')
      ],
      /* B14 = (PI/4)(OD^2) x L x rho / 1e6 — solid disc */
      weightCell: 'B14',
      weight: function (d, density) {
        return solidCylinder(d, d.od, d.length, density);
      },
      weightNeeds: ['od', 'length'],
      processes: [
        /* D26 = B14 — weight-based first row, as on the eyes. */
        proc({ process: 'Finish Turning', basis: 'weight',
               rate: 'process', processName: 'Profile Cutting',
               note: 'Workbook feeds the component weight into this row.' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' })
      ],
      welds: []
    },

    /* ── 11. Flange — sheet 16, 21 formulas ─────────────────────── */
    {
      key: 'flange', name: 'Flange', sheet: 'Flange',
      defaultGrade: 'C45',
      gradeCell: 'B6',
      dims: [
        dim('od',     'OD',     'B7'),
        dim('length', 'Length', 'B8'),
        dim('millWidth',  'Machined Width [milling]',  'B19'),
        dim('millLength', 'Machined Length [milling]', 'B20'),
        dim('holeDia',    'Hole Diameter [drilling]',  'B21'),
        dim('holeCount',  'No. of Holes',              'B22')
      ],
      weightCell: 'B14',
      weight: function (d, density) {
        return solidCylinder(d, d.od, d.length, density);
      },
      weightNeeds: ['od', 'length'],
      processes: [
        proc({ process: 'Turning', basis: 'time2d', table: 'roughTurning',
               rowFrom: 'od', colFrom: 'length',
               rate: 'machine', machine: 'CNC Lathe' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' })
      ],
      welds: []
    },

    /* ── 12. Trunnion — sheet 17, 18 formulas ───────────────────── */
    {
      key: 'trunnion', name: 'Trunnion', sheet: 'Trunnion',
      defaultGrade: 'EN8',
      gradeCell: 'B6',
      defaultQty: 2,                    /* B10 — trunnions come in pairs */
      dims: [
        dim('length',     'Length',                   'B7'),
        dim('width',      'Width',                    'B8'),
        dim('height',     'Height',                   'B9'),
        dim('millWidth',  'Machined Width [milling]', 'B20'),
        dim('millLength', 'Machined Length [milling]','B21'),
        dim('holeDia',    'Hole Diameter [drilling]', 'B22'),
        dim('holeCount',  'No. of Holes',             'B23')
      ],
      /* B15 = L x W x H x rho / 1e6 — rectangular block */
      weightCell: 'B15',
      weight: function (d, density) {
        return block(d, d.length, d.width, d.height, density);
      },
      weightNeeds: ['length', 'width', 'height'],
      processes: [
        /* Rows 27-29 are "Manual Entry" on the sheet: D="Manual",
           E="Manual", F=0. The estimator prices these himself; there is
           no table behind them. Modelled as manual, defaulting to 0, as
           the workbook does. */
        proc({ process: 'Rough Turning', basis: 'manual', rate: 'manual',
               note: 'Manual Entry on the sheet — no table lookup.' }),
        proc({ process: 'Finished Turning', basis: 'manual', rate: 'manual',
               note: 'Manual Entry on the sheet — no table lookup.' }),
        proc({ process: 'Pin Grinding', basis: 'manual', rate: 'manual',
               note: 'Manual Entry on the sheet — no table lookup.' }),
        proc({ process: 'Milling', basis: 'time1d', table: 'milling',
               rate: 'machine', machine: 'Milling Machine' }),
        proc({ process: 'Drilling', basis: 'time1d', table: 'drilling',
               rowFrom: 'holeDia', holesFrom: 'holeCount',
               rate: 'machine', machine: 'Drilling Machine' })
      ],
      welds: [],
      note: 'hispl-masters.json records trunnionThickness = ' +
            '(Trunnion OD - Pin Diameter) / 2. The sheet takes those as ' +
            'typed inputs; no formula applies it.'
    }
  ];

  /* Index for direct access. */
  var BY_KEY = {};
  COMPONENTS.forEach(function (c) { BY_KEY[c.key] = c; });

  function byKey(k) { return BY_KEY[k] || null; }
  function all() { return COMPONENTS.slice(); }
  function keys() { return COMPONENTS.map(function (c) { return c.key; }); }

  /* Every dimension the engine will need, across all twelve. Useful for
     an input form, and for reporting how much is unanswered. */
  function requiredDimensions() {
    var out = [];
    COMPONENTS.forEach(function (c) {
      c.dims.forEach(function (d) {
        out.push({
          component: c.key, componentName: c.name,
          key: d.key, label: d.label, cell: d.cell,
          derivedFrom: d.derivedFrom,
          sheet: c.sheet
        });
      });
    });
    return out;
  }

  /* None of them are derivable yet. This is the honest count of what
     HISPL still owes, and it should fall as geometry.js is filled in. */
  function undeclaredDimensions() {
    return requiredDimensions().filter(function (d) {
      return d.derivedFrom === null;
    });
  }

  window.AEW.components = {
    all: all,
    keys: keys,
    byKey: byKey,
    requiredDimensions: requiredDimensions,
    undeclaredDimensions: undeclaredDimensions,
    EIR: EIR,
    /* exposed for the engine and for tests */
    shapes: { solidCylinder: solidCylinder, annulus: annulus, block: block },
    kinds: { INPUT: INPUT, LOOKUP: LOOKUP, DERIVED: DERIVED }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AEW.components;
  }
})();
