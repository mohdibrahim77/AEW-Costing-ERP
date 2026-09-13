/* HISPL costing — the engine, VERSION 1 workbook.
   Source: VERSION_1.xlsx, one function per component sheet.

   Each function reproduces one sheet's arithmetic in the order that
   sheet performs it: material, then process routing, then welding, then
   the Section E roll-up. Where the workbook does something that looks
   wrong, it is reproduced and recorded in `notes` rather than corrected
   — the tool has to agree with the sheet HISPL quotes from, and a
   silent divergence is worse than a documented defect. Those notes
   surface in the UI and are listed in hispl-v2/v1/RECONCILIATION.md.

   Nothing here rounds until the very end. The frozen ERP learned that
   lesson the expensive way: lines displayed to whole rupees while
   totals summed at 2dp, so printed columns did not add up to printed
   totals. Rounding happens once, at the presentation boundary. */
(function (root) {
  'use strict';

  var M = (typeof require !== 'undefined') ? require('./masters.js')  : root.HISPL_MASTERS_V1;
  var G = (typeof require !== 'undefined') ? require('./geometry.js') : root.HISPL_GEOMETRY_V1;
  var I = (typeof require !== 'undefined') ? require('./inputs.js')   : root.HISPL_INPUTS_V1;

  var PI = Math.PI;

  /* ── weight primitives, exactly as the sheets write them ───────── */
  function wSolid(dia, len, rho)        { return (PI / 4) * dia * dia * len * rho / 1e6; }
  function wAnnulus(od, id, len, rho)   { return (PI / 4) * (od * od - id * id) * len * rho / 1e6; }
  function wBlock(w, h, t, rho)         { return w * h * t * rho / 1e6; }
  /* Surface area in cm2 — the basis for every area-priced process. */
  function areaCm2(dia, len)            { return PI * dia * len / 100; }

  /* ══ WELDING ══════════════════════════════════════════════════════
     One formula for every weld in the model:

         circumference(inch) x Rs.14/inch/bead x beads x locations

     Note 3.14, not PI. The workbook writes it as a literal on all eight
     weld blocks, and it is 0.05% low. Reproduced rather than improved:
     matching HISPL's sheet to the rupee is worth more than a rounding
     correction nobody asked for. */
  function weld(diaMm, locations, label) {
    var beads = M.weldBeads(diaMm);
    var circIn = (diaMm * 3.14) / 25.4;
    return {
      label: label, diameter: diaMm, beads: beads, locations: locations,
      circumferenceIn: circIn, ratePerInchBead: M.weldRatePerInchBead,
      cost: circIn * M.weldRatePerInchBead * beads * locations
    };
  }

  /* IF(B4="No", 0, cost). Anything other than an explicit "No" means the
     part is new, which is the sheets' own default. */
  /* The override block for one component, or undefined when none was
     entered. Kept as a lookup so a missing block behaves exactly like an
     empty one — the sheets treat blank as "use the table". */
  function geomOv(man, id) {
    return (man && man.geometry) ? man.geometry[id] : undefined;
  }

  /* "No. of Weld Locations" is a typed cell on every weld block, shipped
     at 1. The foot lug is the one exception: its cell is =B11, the lug
     count, so it is not an input there and is not read from here. */
  function weldLoc(man, key) {
    var w = (man && man.weldLocations) || {};
    var v = w[key];
    return (typeof v === 'number' && v > 0) ? v : 1;
  }

  function ifNewMaterial(man, id, cost) {
    var flags = man.newMaterial || {};
    return flags[id] === 'No' ? 0 : cost;
  }

  /* A process routing row. Kept as data so the UI can show the basis
     and the rate that produced every rupee, not just the rupee. */
  function row(name, machine, basisLabel, basis, rate) {
    if (basis === null || rate === null) {
      return { name: name, machine: machine, basisLabel: basisLabel,
               basis: null, rate: rate, cost: 0, blocked: true };
    }
    return { name: name, machine: machine, basisLabel: basisLabel,
             basis: basis, rate: rate, cost: basis * rate };
  }

  function andList(a) {
    if (a.length <= 1) return a.join('');
    return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  }

  function sum(rows) {
    var t = 0, i;
    for (i = 0; i < rows.length; i++) t += rows[i].cost || 0;
    return t;
  }

  /* The machine-time tables stop at 2-3 metres depending on the process,
     and Excel carries the top band across anything longer without
     comment. Long cylinders are exactly where that silence is
     expensive, so every component with a length says when it has run
     off the end of a table. */
  function ceilingNotes(lengthMm, notes) {
    var w = M.ceilingWarnings(lengthMm), i;
    for (i = 0; i < w.length; i++) {
      notes.push({ level: 'warn', ref: 'C-1',
                   text: w[i].table + ' time: ' + w[i].message });
    }
  }

  /* ══════════════════════════════════════════════════════════════════
     COMPONENTS
     ══════════════════════════════════════════════════════════════ */

  /* ── TUBE ──────────────────────────────────────────────────────── */
  function tube(inp, man) {
    var mat = M.material('MS-ST52'), rho = mat.density;
    var rawOD  = man.tubeRawOD, len = man.tubeLength;
    var finOD  = inp.tubeOD, finID = inp.bore;
    var rawID  = inp.bore + inp.boringAllowance;
    var qty    = 1;
    var notes  = [];

    var invalid = null;
    if (rawID >= rawOD) {
      invalid = 'Raw ID (' + rawID + 'mm) is not smaller than Raw OD (' + rawOD +
                'mm). The tube has no wall.';
      notes.push({ level: 'error', ref: 'V-1', text: invalid +
        ' Raise Raw OD above Raw ID to cost the tube.' });
    }
    if (len < inp.stroke) {
      notes.push({ level: 'error', text: 'Tube length (' + len + 'mm) is shorter than the stroke (' +
        inp.stroke + 'mm).' });
    }

    ceilingNotes(len, notes);

    var weight = wAnnulus(rawOD, rawID, len, rho);
    var rate   = M.materialRate('MS-ST52', rawOD);
    var matCost = ifNewMaterial(man, 'tube', weight * rate);

    var stock = M.stockRemovalFactor(rawOD - finOD);
    var rtHrs = M.roughTurnHours(finOD, len);
    var procs = [
      row('Cutting', 'Cutting Machine', 'hours',
          M.cuttingHours(rawOD, len), M.machineRate('Cutting Machine')),
      row('Rough Turning', 'Conventional Lathe', 'hours',
          rtHrs === null ? null : rtHrs * stock, M.turningRate(finOD, 'rough')),
      row('Boring', 'Conventional Lathe', 'hours',
          M.boringHours(finID, len), M.machineRate('Conventional Lathe')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(man.tubeHoleDia) * man.tubeHoles,
          M.machineRate('Drilling Machine')),
      row('Rough Honing', 'Honing Machine', 'cm2',
          areaCm2(finID, len), M.honingRate(len, finID)),
      row('Finish Turning', 'CNC Lathe', 'hours',
          rtHrs === null ? null : rtHrs * 0.7, M.turningRate(finOD, 'finish')),
      row('Finished Honing', 'Honing Machine', 'cm2',
          areaCm2(finID, len), M.honingRate(len, finID))
    ];

    /* Three weld blocks, all charged unconditionally. The third is
       "Rear Eye Welding" and it is billed even when the inquiry says no
       rear eye is fitted — this example has Rear Eye = No and still
       pays Rs.1,298 to weld one on. Left as the workbook has it and
       raised as defect W-1. */
    var welds = [
      weld(finOD, weldLoc(man, 'tubePart'),    'Part Welding (tube parts joint)'),
      weld(finOD, weldLoc(man, 'tubeCEC'),     'CEC Welding'),
      weld(finOD, weldLoc(man, 'tubeRearEye'), 'Rear Eye Welding')
    ];
    if (inp.hasRearEye !== 'Yes') {
      notes.push({ level: 'defect', ref: 'W-1', text:
        'Rear Eye welding (Rs.' + Math.round(welds[2].cost) + ') is charged on the tube even though ' +
        'no rear eye is fitted.' });
    }

    var procCost = sum(procs) + sum(welds);
    return {
      id: 'tube', name: 'Tube', sheet: 'Tube', present: true, qty: qty,
      material: mat.code, materialName: mat.name, density: rho, materialRate: rate,
      dims: { rawOD: rawOD, finishedOD: finOD, finishedID: finID, rawID: rawID, length: len },
      dimSource: { rawOD: 'manual', length: 'manual', finishedOD: 'Tube OD input',
                   finishedID: 'Bore input', rawID: 'Bore + boring allowance' },
      weight: weight, materialCost: matCost,
      processes: procs, welds: welds, processCost: procCost,
      additionalCost: 0,
      /* Withheld, not zeroed. Zero would quietly make the cylinder
         cheaper; null makes the total impossible to produce, which is
         what the workbook does. */
      invalid: invalid,
      unitCost: invalid ? null : matCost + procCost,
      totalCost: invalid ? null : (matCost + procCost) * qty,
      notes: notes
    };
  }

  /* ── PISTON ROD ────────────────────────────────────────────────── */
  function pistonRod(inp, man, mount) {
    var mat = M.material('MS-EN19'), rho = mat.density;
    var rawDia = man.rodRawDia, finDia = inp.rodDia, len = man.rodLength, qty = 1;
    var notes = [], invalid = null;
    if (finDia >= rawDia) {
      invalid = 'Finished rod diameter (' + finDia + 'mm) is not smaller than the raw bar (' +
                rawDia + 'mm).';
      notes.push({ level: 'error', ref: 'V-2', text: invalid +
        ' Use a larger raw bar.' });
    }

    ceilingNotes(len, notes);

    var weight = wSolid(rawDia, len, rho);
    var rate = M.materialRate('MS-EN19', rawDia);
    var matCost = ifNewMaterial(man, 'pistonRod', weight * rate);

    var proc = inp.rodProcess;
    var doHT = proc === 'Toughening and Induction Hardening';
    var doIH = proc === 'Toughening and Induction Hardening' || proc === 'Only Induction Hardening';
    var doDHD = proc === 'Only Deep Hole Drilling';
    var hardLen = man.hardenedLength || len;

    var rtHrs = M.roughTurnHours(finDia, len);
    var stock = M.stockRemovalFactor(rawDia - finDia);
    var procs = [
      row('Cutting', 'Cutting Machine', 'hours',
          M.cuttingHours(rawDia, len), M.machineRate('Cutting Machine')),
      row('Rough Turning', 'CNC Lathe', 'hours',
          rtHrs === null ? null : rtHrs * stock, M.turningRate(finDia, 'rough'))
    ];
    if (doHT) {
      procs.push(row('Heat Treatment', 'Vendor (Rs./kg)', 'kg', weight, M.processRate('heatTreatment')));
    }
    if (doIH) {
      procs.push(row('Induction Hardening', 'Vendor (Rs./cm2)', 'cm2',
        areaCm2(finDia, hardLen), M.processRate('inductionHardening')));
    }
    procs.push(row('Finish Turning', 'CNC Lathe', 'hours',
        rtHrs === null ? null : rtHrs * 0.7, M.turningRate(finDia, 'finish')));
    procs.push(row('Grinding', 'In-house (Rs./cm2)', 'cm2',
        areaCm2(finDia, len), M.processRate('grinding')));
    procs.push(row('Chrome Plating', 'Vendor (Rs./cm2)', 'cm2',
        areaCm2(finDia, len), M.processRate('chromePlating')));
    procs.push(row('Polishing', 'In-house (Rs./cm2)', 'cm2',
        areaCm2(finDia, len), M.processRate('polishing')));
    procs.push(row('Milling', 'Milling Machine', 'hours',
        M.millingHours(man.rodMillW * man.rodMillL), M.machineRate('Milling Machine')));
    if (doDHD) {
      procs.push({ name: 'Deep Hole Drilling', machine: 'Vendor (manual)',
                   basisLabel: 'manual', basis: null, rate: null, cost: man.deepHoleCost || 0 });
    }

    /* The rod eye is welded to the rod, so it is priced on the rod's
       diameter, not the tube's — a smaller circle and a lower bead
       count than every other weld in the model. */
    var welds = mount.rodEye ? [weld(finDia, weldLoc(man, 'rodEye'), 'Rod Eye Welding')] : [];

    var procCost = sum(procs) + sum(welds);
    return {
      id: 'pistonRod', name: 'Piston Rod', sheet: 'Piston Rod', present: true, qty: qty,
      material: mat.code, materialName: mat.name, density: rho, materialRate: rate,
      dims: { rawDia: rawDia, finishedDia: finDia, length: len, hardenedLength: hardLen },
      dimSource: { rawDia: 'manual', length: 'manual', finishedDia: 'Rod diameter input' },
      weight: weight, materialCost: matCost, route: proc,
      processes: procs, welds: welds, processCost: procCost,
      additionalCost: 0, invalid: invalid,
      unitCost: invalid ? null : matCost + procCost,
      totalCost: invalid ? null : (matCost + procCost) * qty,
      notes: notes
    };
  }

  /* ── END COVERS ────────────────────────────────────────────────────
     Cap End and Head End are the same sheet twice over — identical
     formulas, identical geometry table, identical every cached value.
     One function serves both. */
  function endCover(inp, man, which) {
    var g = G.derive('endCover', inp.bore, geomOv(man, which.id));
    if (g.error) return blocked(which.id, which.name, which.sheet, g.error);
    var d = g.values;
    var mat = M.material('MS-C45'), rho = mat.density;
    var rate = M.materialRate('MS-C45', d.thickness);
    var shapes = man.coverShape || {};
    var shape = shapes[which.id] === 'Profile / Cuboid Block' ? 'Profile / Cuboid Block' : 'Round';
    var weight = shape === 'Round'
      ? wSolid(d.diameter, d.thickness, rho)
      : wBlock(d.width, d.height, d.thickness, rho);
    var matCost = ifNewMaterial(man, which.id, weight * rate);

    var procs = [
      row('Turning', 'CNC Lathe', 'hours',
          M.roughTurnHours(d.finishedOD, d.thickness), M.machineRate('CNC Lathe')),
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(man.coverMillW * man.coverMillL), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(man.coverHoleDia) * man.coverHoles,
          M.machineRate('Drilling Machine'))
    ];
    var procCost = sum(procs);
    return {
      id: which.id, name: which.name, sheet: which.sheet, present: true, qty: 1,
      material: mat.code, materialName: mat.name, density: rho, materialRate: rate,
      dims: d, geometry: g, weight: weight, materialCost: matCost, shape: shape,
      processes: procs, welds: [], processCost: procCost,
      additionalCost: 0, unitCost: matCost + procCost, totalCost: matCost + procCost,
      notes: shape === 'Round' ? [] : [{ level: 'info', text:
        'Costed from profile / cuboid stock: ' + d.width + ' x ' + d.height + ' x ' +
        d.thickness + 'mm. Turning, milling and drilling still use the ' + d.finishedOD +
        'mm finished OD.' }]
    };
  }

  /* ── GLAND ─────────────────────────────────────────────────────── */
  function gland(inp, man) {
    var g = G.derive('gland', inp.rodDia, geomOv(man, 'gland'));
    if (g.error) return blocked('gland', 'Gland', 'Gland', g.error);
    var d = g.values, mat = M.material('MS-C45'), rho = mat.density;
    var rate = M.materialRate('MS-C45', d.length);
    var weight = wAnnulus(d.od, d.id, d.length, rho);
    var matCost = ifNewMaterial(man, 'gland', weight * rate);
    var procs = [
      row('Turning', 'CNC Lathe', 'hours',
          M.roughTurnHours(d.od, d.length), M.machineRate('CNC Lathe')),
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(man.glandMillW * man.glandMillL), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(man.glandHoleDia) * man.glandHoles,
          M.machineRate('Drilling Machine')),
      row('Grinding (ID bore)', 'In-house (Rs./cm2)', 'cm2',
          areaCm2(d.id, d.length), M.processRate('grinding'))
    ];
    var procCost = sum(procs);
    return pack('gland', 'Gland', 'Gland', mat, rho, rate, d, g, weight, matCost, procs, [], procCost);
  }

  /* ── CUSHION BUSH ──────────────────────────────────────────────── */
  function cushionBush(inp, man) {
    var g = G.derive('cushionBush', inp.rodDia, geomOv(man, 'cushionBush'));
    if (g.error) return blocked('cushionBush', 'Cushion Bush', 'Cushion Bush', g.error);
    var d = g.values, mat = M.material('BR-SAE660'), rho = mat.density;
    var rate = mat.rate;               /* bronze: no size banding */
    var weight = wAnnulus(d.od, d.id, d.length, rho);
    var matCost = ifNewMaterial(man, 'cushionBush', weight * rate);
    var procs = [
      row('Turning', 'CNC Lathe', 'hours',
          M.roughTurnHours(d.od, d.length), M.machineRate('CNC Lathe')),
      row('Grinding (ID bore)', 'In-house (Rs./cm2)', 'cm2',
          areaCm2(d.id, d.length), M.processRate('grinding'))
    ];
    var c = pack('cushionBush', 'Cushion Bush', 'Cushion Bush', mat, rho, rate, d, g,
                 weight, matCost, procs, [], sum(procs));
    /* Bronze at Rs.1,800/kg makes this the most expensive thing on the
       cylinder per kilo by a factor of eleven. Worth saying out loud —
       it is easy to read the total and assume the tube dominates. */
    c.notes.push({ level: 'info', text:
      'Bronze SAE 660 at Rs.1,800/kg. This bush is ' +
      (rate / 100).toFixed(0) + 'x the rate of the steel around it.' });
    return c;
  }

  /* ── PISTON ────────────────────────────────────────────────────── */
  function piston(inp, man) {
    var g = G.derive('piston', inp.bore, geomOv(man, 'piston'));
    if (g.error) return blocked('piston', 'Piston', 'Piston', g.error);
    var d = g.values, mat = M.material('MS-EN8'), rho = mat.density;
    var rate = M.materialRate('MS-EN8', d.od);
    var weight = wSolid(d.od, d.length, rho);
    var matCost = ifNewMaterial(man, 'piston', weight * rate);
    /* The sheet labels this row "Finish Turning" but prices it at the
       profile-cutting rate per kilo. Reproduced; raised as defect P-1. */
    var procs = [
      row('Finish Turning', 'Process Rate Master (Rs./kg)', 'kg',
          weight, M.processRate('profileCutting')),
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(man.pistonMillW * man.pistonMillL), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(man.pistonHoleDia) * man.pistonHoles,
          M.machineRate('Drilling Machine'))
    ];
    var c = pack('piston', 'Piston', 'Piston', mat, rho, rate, d, g,
                 weight, matCost, procs, [], sum(procs));
    c.notes.push({ level: 'defect', ref: 'P-1', text:
      'The "Finish Turning" row is priced at the profile-cutting rate (Rs.1.25/kg), not at a ' +
      'turning rate or machine hour. Rs.' + procs[0].cost.toFixed(2) + ' to finish-turn a piston ' +
      'looks low. Confirm it with HISPL.' });
    return c;
  }

  /* ── STOP TUBE ─────────────────────────────────────────────────── */
  function stopTube(inp, man) {
    var g = G.derive('stopTube', inp.rodDia, geomOv(man, 'stopTube'));
    if (g.error) return blocked('stopTube', 'Stop Tube', 'Stop Tube', g.error);
    var d = g.values, mat = M.material('MS-EN8'), rho = mat.density;
    var len = man.stopTubeLength;
    var rate = M.materialRate('MS-EN8', d.finishedDia);
    /* Solid round stock, per the sheet's own header note. */
    var weight = wSolid(d.rawDia, len, rho);
    var matCost = ifNewMaterial(man, 'stopTube', weight * rate);
    var rtHrs = M.roughTurnHours(d.finishedDia, len);
    var procs = [
      row('Turning', 'CNC Lathe', 'hours',
          rtHrs === null ? null : rtHrs * M.stockRemovalFactor(d.rawDia - d.finishedDia),
          M.machineRate('CNC Lathe'))
    ];
    var dims = { rawDia: d.rawDia, finishedDia: d.finishedDia, length: len };
    var c = pack('stopTube', 'Stop Tube', 'Stop Tube', mat, rho, rate, dims, g,
                 weight, matCost, procs, [], sum(procs));
    c.dimSource = { rawDia: 'derived', finishedDia: 'derived', length: 'manual' };
    if (d.finishedDia >= d.rawDia) {
      c.invalid = 'Finished diameter (' + d.finishedDia + 'mm) is not smaller than the raw bar (' +
                  d.rawDia + 'mm).';
      c.unitCost = null; c.totalCost = null;
      c.notes.push({ level: 'error', ref: 'V-3', text: c.invalid +
        ' Use a larger raw bar.' });
    }
    return c;
  }

  /* ── REAR EYE ──────────────────────────────────────────────────── */
  function rearEye(inp, man) {
    var g = G.derive('rearEye', inp.tubeOD, geomOv(man, 'rearEye'));
    if (g.error) return blocked('rearEye', 'Rear Eye', 'Rear Eye', g.error);
    var d = g.values, mat = M.material('MS-PLATE-IS2062'), rho = mat.density;
    var weight = wBlock(d.width, d.height, d.thickness, rho);
    var matCost = ifNewMaterial(man, 'rearEye', weight * mat.rate);
    var procs = [
      row('Profile Cutting', 'Process Rate Master (Rs./kg)', 'kg',
          weight, M.processRate('profileCutting')),
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(d.width * d.height), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(d.pinHole) * 1, M.machineRate('Drilling Machine'))
    ];
    return pack('rearEye', 'Rear Eye', 'Rear Eye', mat, rho, mat.rate, d, g,
                weight, matCost, procs, [], sum(procs));
  }

  /* ── ROD EYE ───────────────────────────────────────────────────── */
  function rodEye(inp, man) {
    var g = G.derive('rodEye', inp.rodDia, geomOv(man, 'rodEye'));
    if (g.error) return blocked('rodEye', 'Rod Eye', 'Rod Eye', g.error);
    var d = g.values, mat = M.material('MS-PLATE-IS2062'), rho = mat.density;
    /* Costed as a ring, not a block — HISPL Section 11. The milling
       area still uses the rectangular blank it is cut from. */
    var weight = wAnnulus(d.eyeOD, d.eyeID, d.thickness, rho);
    var matCost = ifNewMaterial(man, 'rodEye', weight * mat.rate);
    var procs = [
      row('Profile Cutting', 'Process Rate Master (Rs./kg)', 'kg',
          weight, M.processRate('profileCutting')),
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(man.rodEyeMillW * man.rodEyeMillH), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(d.pinHole) * 1, M.machineRate('Drilling Machine'))
    ];
    var c = pack('rodEye', 'Rod Eye', 'Rod Eye', mat, rho, mat.rate, d, g,
                 weight, matCost, procs, [], sum(procs));
    c.notes.push({ level: 'info', text:
      'Its weld is included in the Piston Rod cost.' });
    return c;
  }

  /* ── FLANGE (always present, gland retainer) ───────────────────── */
  function flange(inp, man) {
    var g = G.derive('flange', inp.tubeOD, geomOv(man, 'flange'));
    if (g.error) return blocked('flange', 'Flange', 'Flange', g.error);
    var d = g.values, mat = M.material('MS-C45'), rho = mat.density;
    var rate = M.materialRate('MS-C45', d.length);
    var weight = wSolid(d.od, d.length, rho);
    var matCost = ifNewMaterial(man, 'flange', weight * rate);
    var procs = [
      row('Turning', 'CNC Lathe', 'hours',
          M.roughTurnHours(d.od, d.length), M.machineRate('CNC Lathe')),
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(man.flangeMillW * man.flangeMillL), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(man.flangeHoleDia) * man.flangeHoles,
          M.machineRate('Drilling Machine'))
    ];
    var welds = [weld(inp.tubeOD, weldLoc(man, 'flange'), 'Flange Welding')];
    return pack('flange', 'Flange', 'Flange', mat, rho, rate, d, g,
                weight, matCost, procs, welds, sum(procs) + sum(welds));
  }

  /* ── TRUNNION ──────────────────────────────────────────────────── */
  function trunnion(inp, man) {
    var g = G.derive('trunnion', inp.tubeOD, geomOv(man, 'trunnion'));
    if (g.error) return blocked('trunnion', 'Trunnion', 'Trunnion', g.error);
    var d = g.values, mat = M.material('MS-EN8'), rho = mat.density;
    var rate = M.materialRate('MS-EN8', d.trunnionOD);
    /* Costed as the square bounding block the trunnion is turned from,
       not as the finished cylinder. */
    var dims = { length: d.length, width: d.trunnionOD, height: d.trunnionOD,
                 pinDia: d.pinDia, trunnionOD: d.trunnionOD, thickness: d.thickness };
    var weight = wBlock(dims.length, dims.width, dims.height, rho);
    var matCost = ifNewMaterial(man, 'trunnion', weight * rate);
    /* Trunnion!B10, shipped at 2 — a trunnion mount is a pair. */
    var qty = (typeof man.trunnionQty === 'number' && man.trunnionQty > 0) ? man.trunnionQty : 2;
    var procs = [
      { name: 'Rough Turning',    machine: 'Manual entry', basisLabel: 'manual',
        basis: null, rate: null, cost: man.trunnionRoughTurn || 0, manual: true },
      { name: 'Finished Turning', machine: 'Manual entry', basisLabel: 'manual',
        basis: null, rate: null, cost: man.trunnionFinishTurn || 0, manual: true },
      { name: 'Pin Grinding',     machine: 'Manual entry', basisLabel: 'manual',
        basis: null, rate: null, cost: man.trunnionPinGrind || 0, manual: true },
      row('Milling', 'Milling Machine', 'hours',
          M.millingHours(man.trunnionMillW * man.trunnionMillL), M.machineRate('Milling Machine')),
      row('Drilling', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(man.trunnionHoleDia) * man.trunnionHoles,
          M.machineRate('Drilling Machine'))
    ];
    var welds = [weld(inp.tubeOD, weldLoc(man, 'trunnion'), 'Trunnion Welding')];
    var procCost = sum(procs) + sum(welds);
    var c = pack('trunnion', 'Trunnion', 'Trunnion', mat, rho, rate, dims, g,
                 weight, matCost, procs, welds, procCost);
    c.qty = qty;
    c.totalCost = c.unitCost * qty;
    c.notes.push({ level: 'defect', ref: 'T-1', text:
      'Rough turning, finish turning and pin grinding are all manual and all default to Rs.0, ' +
      'so an unedited trunnion is machined for free. Only milling and drilling are automatic.' });
    c.notes.push({ level: 'info', text:
      qty + ' fitted. Weight and cost are shown per piece; the total covers all of them.' });
    return c;
  }

  /* ── CEC CLEVIS ────────────────────────────────────────────────── */
  function cecClevis(inp, man) {
    var g = G.derive('cecClevis', inp.bore, geomOv(man, 'cecClevis'));
    if (g.error) return blocked('cecClevis', 'CEC Clevis', 'CEC Clevis', g.error);
    var d = g.values, mat = M.material('MS-C45'), rho = mat.density;
    var rate = M.materialRate('MS-C45', d.thickness);
    /* CEC Clevis!B14. The Geometry Master (H104) is blunt about it: "The
       'Number of Lugs = 2' currently on the CEC Clevis sheet is a
       convention default, NOT a confirmed HISPL standard - do not treat it
       as one." So it is an input, and it says so. */
    var lugs = (typeof man.clevisLugs === 'number' && man.clevisLugs > 0) ? man.clevisLugs : 2;
    var gross = d.length * d.width * d.thickness;
    var hole  = (PI / 4) * d.pinHole * d.pinHole * d.thickness;
    var weight = ((gross - hole) * lugs) * rho / 1e6;
    var matCost = ifNewMaterial(man, 'cecClevis', weight * rate);
    var procs = [
      row('Profile Cutting', 'Process Rate Master (Rs./kg)', 'kg',
          weight, M.processRate('profileCutting')),
      row('Milling (fork/slot)', 'Milling Machine', 'hours',
          M.millingHours(d.width * d.length), M.machineRate('Milling Machine')),
      row('Drilling (pin hole)', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(d.pinHole) * lugs, M.machineRate('Drilling Machine'))
    ];
    var welds = [weld(inp.tubeOD, weldLoc(man, 'cecClevis'), 'CEC Clevis Welding')];
    var c = pack('cecClevis', 'CEC Clevis', 'CEC Clevis', mat, rho, rate, d, g,
                 weight, matCost, procs, welds, sum(procs) + sum(welds));
    c.volumes = { grossPerLug: gross, holePerLug: hole, lugs: lugs };
    c.notes.push({ level: 'warn', ref: 'G-1', text:
      'Number of lugs is ' + lugs + '. Two is the usual default, not a confirmed standard. Check the drawing.' });
    return c;
  }

  /* ── FRONT FLANGE ──────────────────────────────────────────────── */
  function frontFlange(inp, man) {
    var g = G.derive('frontFlange', inp.bore, geomOv(man, 'frontFlange'));
    if (g.error) return blocked('frontFlange', 'Front Flange', 'Front Flange', g.error);
    var d = g.values, mat = M.material('MS-PLATE-IS2062'), rho = mat.density;
    var holes = man.frontFlangeHoles;
    var gross = d.width * d.width * d.thickness;      /* square flange */
    var hole  = (PI / 4) * d.holeDia * d.holeDia * d.thickness * holes;
    var weight = (gross - hole) * rho / 1e6;
    var matCost = ifNewMaterial(man, 'frontFlange', weight * mat.rate);
    var procs = [
      row('Milling (flange facing)', 'Milling Machine', 'hours',
          M.millingHours(d.width * d.width), M.machineRate('Milling Machine')),
      row('Drilling (bolt holes)', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(d.holeDia) * holes, M.machineRate('Drilling Machine'))
    ];
    var welds = [weld(inp.tubeOD, weldLoc(man, 'frontFlange'), 'Front Flange Welding')];
    var c = pack('frontFlange', 'Front Flange', 'Front Flange', mat, rho, mat.rate, d, g,
                 weight, matCost, procs, welds, sum(procs) + sum(welds));
    c.notes.push({ level: 'info', text:
      'A front-flange cylinder carries its load through the flange, so no rod eye is fitted.' });
    return c;
  }

  /* ── FOOT LUG ──────────────────────────────────────────────────── */
  function footLug(inp, man) {
    var g = G.derive('footLug', inp.tubeOD, geomOv(man, 'footLug'));
    if (g.error) return blocked('footLug', 'Foot Lug', 'Foot Lug', g.error);
    var d = g.values, mat = M.material('MS-C45'), rho = mat.density;
    var rate = M.materialRate('MS-C45', d.thickness);
    /* Foot Lug!B11, "4 lugs standard" per the sheet's header note. */
    var lugs = (typeof man.footLugs === 'number' && man.footLugs > 0) ? man.footLugs : 4;
    var gross = d.width * d.length * d.thickness;
    var hole  = (PI / 4) * d.holeDia * d.holeDia * d.thickness;
    var weight = ((gross - hole) * lugs) * rho / 1e6;
    var matCost = ifNewMaterial(man, 'footLug', weight * rate);
    var procs = [
      row('Milling (lug faces)', 'Milling Machine', 'hours',
          M.millingHours(d.width * d.length), M.machineRate('Milling Machine')),
      row('Drilling (bolt holes)', 'Drilling Machine', 'hours',
          M.drillingHoursPerHole(d.holeDia) * lugs, M.machineRate('Drilling Machine'))
    ];
    /* Four lugs, four weld locations — and each is priced on the full
       tube circumference. That makes the welding 18x the material. */
    var welds = [weld(inp.tubeOD, lugs, 'Foot Lug Welding (' + lugs + ' lugs)')];
    var c = pack('footLug', 'Foot Lug', 'Foot Lug', mat, rho, rate, d, g,
                 weight, matCost, procs, welds, sum(procs) + sum(welds));
    c.notes.push({ level: 'defect', ref: 'F-1', text:
      'Welding is Rs.' + Math.round(welds[0].cost) + ' against Rs.' + Math.round(matCost) +
      ' of material — each of the four lugs is charged a full tube circumference of weld, ' +
      'though a lug welds along its own short edges.' });
    return c;
  }

  /* ── TIE ROD ───────────────────────────────────────────────────── */
  function tieRod(inp, man) {
    /* The only component whose size is calculated from physics rather
       than looked up: bore and pressure give the thrust, the thrust
       divided between the rods gives the tensile area, and the area
       gives a diameter rounded up to the next 5mm of stock. */
    var qty = (typeof inp.tieRodQty === 'number' && inp.tieRodQty > 0) ? inp.tieRodQty : 4;
    var yieldStress = (typeof man.tieRodYield === 'number' && man.tieRodYield > 0) ? man.tieRodYield : 294;
    var safety = (typeof man.tieRodSafety === 'number' && man.tieRodSafety > 0) ? man.tieRodSafety : 3;
    var allowable = yieldStress / safety;
    var thrust = (PI / 4) * inp.bore * inp.bore * (inp.workingPressure / 10);
    var perRod = thrust / qty;
    var areaReq = perRod / allowable;
    var calcDia = Math.sqrt(4 * areaReq / PI);
    var stdDia = Math.ceil(calcDia / 5) * 5;
    /* IF(B20="", B19, B20) and IF(B27="", B26, B27). */
    var diaOv = man.tieRodDiaOverride, lenOv = man.tieRodLengthOverride;
    var finalDia = (typeof diaOv === 'number' && diaOv > 0) ? diaOv : stdDia;
    var stdLen = inp.stroke + man.tieRodAllowance;
    var len = (typeof lenOv === 'number' && lenOv > 0) ? lenOv : stdLen;

    var mat = M.material('MS-ST52'), rho = mat.density;
    var weightPerRod = wSolid(finalDia, len, rho);
    var weight = weightPerRod * qty;
    var matCost = ifNewMaterial(man, 'tieRod', weight * mat.rate);

    /* The workbook's cutting lookup here is broken. It calls
       VLOOKUP(diameter, CuttingTable, ...) against a range whose first
       column holds HOURS (0.08 / 0.10 / 0.15 / 0.25), not diameters, so
       any real rod diameter overshoots every key and falls to the last
       row. The result is always the "Above 250mm OD" row. Reproduced
       exactly, because that is the number on HISPL's sheet — raised as
       defect TR-1. */
    var lenCol = M.binIndex([0, 501, 1001, 2001], len);
    var cutHours = (lenCol < 0 ? null : M.tables.cutting.cells[3][lenCol]);
    var procs = [
      row('Cutting (bar to length)', 'Cutting Machine', 'hours',
          cutHours === null ? null : cutHours * qty, M.machineRate('Cutting Machine')),
      { name: 'Threading (both ends)', machine: 'Vendor (Rs./rod)', basisLabel: 'rods',
        basis: qty, rate: man.tieRodThreading, cost: man.tieRodThreading * qty }
    ];
    var procCost = sum(procs);
    return {
      id: 'tieRod', name: 'Tie Rod', sheet: 'Tie Rod', present: true, qty: qty,
      material: mat.code, materialName: mat.name, density: rho, materialRate: mat.rate,
      dims: { diameter: finalDia, length: len },
      structural: { allowableStress: allowable, thrustN: thrust, forcePerRodN: perRod,
                    areaRequiredMm2: areaReq, calculatedDia: calcDia, standardDia: stdDia, finalDia: finalDia,
                    standardLength: stdLen, diameterOverridden: finalDia !== stdDia,
                    lengthOverridden: len !== stdLen, yieldStress: yieldStress, safetyFactor: safety,
                    closedLengthAllowance: man.tieRodAllowance },
      weight: weight, weightPerRod: weightPerRod, materialCost: matCost,
      processes: procs, welds: [], processCost: procCost,
      additionalCost: 0, unitCost: matCost + procCost, totalCost: matCost + procCost,
      notes: [
        { level: 'info', text: 'Diameter is calculated, not looked up: ' +
          Math.round(thrust) + ' N of thrust across ' + qty + ' rods at ' +
          allowable.toFixed(0) + ' N/mm2 allowable needs ' + calcDia.toFixed(1) +
          'mm, rounded up to ' + stdDia + 'mm stock.' },
        { level: 'defect', ref: 'TR-1', text:
          'Cutting time always uses the largest size band, whatever the rod size, so it may be too high.' },
        { level: 'info', text: 'Tie rods are through-bolted with nuts, so no welding is costed.' }
      ]
    };
  }

  /* ── shared shapes ─────────────────────────────────────────────── */
  function pack(id, name, sheet, mat, rho, rate, dims, geom, weight, matCost, procs, welds, procCost) {
    return {
      id: id, name: name, sheet: sheet, present: true, qty: 1,
      material: mat.code, materialName: mat.name, density: rho, materialRate: rate,
      dims: dims, geometry: geom, weight: weight, materialCost: matCost,
      processes: procs, welds: welds, processCost: procCost,
      additionalCost: 0, unitCost: matCost + procCost, totalCost: matCost + procCost,
      notes: []
    };
  }

  function blocked(id, name, sheet, reason) {
    return { id: id, name: name, sheet: sheet, present: true, blocked: true, reason: reason,
             weight: 0, materialCost: 0, processCost: 0, additionalCost: 0,
             unitCost: 0, totalCost: 0, processes: [], welds: [],
             notes: [{ level: 'error', text: reason }] };
  }

  /* ══ BOUGHT-OUT, SEALS, FINISHING ════════════════════════════════ */

  function seals(inp) {
    var s = M.sealKit(inp.bore, inp.sealBrand, inp.sealMaterial, inp.sealType);
    if (s.unavailable) {
      return { available: false, reason: s.reason, cost: 0,
               description: 'Seal Kit (' + inp.sealBrand + ' / ' + inp.sealMaterial +
                            ' / ' + inp.sealType + ')' };
    }
    return { available: true, kitCost: s.kitCost, markup: s.markup, cost: s.price,
             catalogueRodDia: s.catalogueRodDia,
             description: 'Seal Kit (' + inp.sealBrand + ' / ' + inp.sealMaterial +
                          ' / ' + inp.sealType + ')' };
  }

  /* Flat bought-out lines. The workbook ships one included item — two
     bearings at Rs.180 — and eight switched off. */
  function boughtOut(man) {
    var items = man.boughtOut, out = [], total = 0, i;
    for (i = 0; i < items.length; i++) {
      var c = items[i].include ? items[i].rate * items[i].qty : 0;
      out.push({ description: items[i].description, rate: items[i].rate,
                 qty: items[i].qty, include: items[i].include, cost: c });
      total += c;
    }
    return { items: out, total: total };
  }

  /* Dimension-driven bought-out items: pipe, pipe flange, bolt,
     bellows, standalone flange. These are genuinely optional and have
     nothing to do with the cylinder's own geometry, but the workbook
     includes them in the total unconditionally, so the default here
     matches it rather than quietly costing Rs.3,155 less. */
  function bocCalculated(man) {
    var b = man.boc, out = [], total = 0;
    if (b.pipe.include) {
      var wtPerM = (b.pipe.od - b.pipe.wall) * b.pipe.wall * 0.02466;
      var pw = wtPerM * b.pipe.lengthM * b.pipe.qty;
      var pc = pw * M.material('MS-ST52').rate;
      out.push({ name: 'Metallic Pipe (ST52, Sch 40 DN' + b.pipe.dn + ')',
                 detail: b.pipe.lengthM + 'm x ' + b.pipe.qty + ', ' + wtPerM.toFixed(2) + ' kg/m',
                 weight: pw, cost: pc });
      total += pc;
    }
    if (b.pipeFlange.include) {
      out.push({ name: 'Pipe Flange (ASME B16.5 Cl.150 DN' + b.pipe.dn + ')',
                 detail: b.pipeFlange.qty + ' off', weight: b.pipeFlange.weight,
                 cost: b.pipeFlange.cost });
      total += b.pipeFlange.cost;
    }
    if (b.bolt.include) {
      var headV = (PI / 4) * b.bolt.headDia * b.bolt.headDia * b.bolt.headHeight;
      var shankV = (PI / 4) * b.bolt.shankDia * b.bolt.shankDia * b.bolt.shankLength;
      var bw = (headV + shankV) * M.material('MS-EN19').density / 1e6;
      var bc = bw * b.bolt.rate * b.bolt.qty;
      out.push({ name: 'Bolts (' + b.bolt.size + ' socket head, x' + b.bolt.qty + ')',
                 detail: 'Rate is a placeholder — Unbrako publishes no prices',
                 weight: bw * b.bolt.qty, cost: bc, placeholder: true });
      total += bc;
    }
    if (b.bellows.include) {
      out.push({ name: 'Bellows (rod protection)',
                 detail: b.bellows.cost === 0 ? 'Awaiting a vendor quote — costed at zero'
                                              : b.bellows.qty + ' off',
                 weight: 0, cost: b.bellows.cost * b.bellows.qty,
                 placeholder: b.bellows.cost === 0 });
      total += b.bellows.cost * b.bellows.qty;
    }
    if (b.flangeComponent.include) {
      var fw = (PI / 4) * b.flangeComponent.od * b.flangeComponent.od *
               b.flangeComponent.thickness * M.material('MS-PLATE-IS2062').density / 1e6;
      var fc = fw * M.material('MS-PLATE-IS2062').rate * b.flangeComponent.qty;
      out.push({ name: 'Flange (standalone component)',
                 detail: 'OD ' + b.flangeComponent.od + ' x ' + b.flangeComponent.thickness + 'mm',
                 weight: fw * b.flangeComponent.qty, cost: fc });
      total += fc;
    }
    return { items: out, total: total };
  }

  function finishing(man, totalWeight) {
    var assembly = man.assemblyHours * man.assemblyRate;
    var painting = man.paintArea * M.processRate('painting');
    var packRate = man.packingType === 'Wooden Box'
      ? M.processRate('packingWooden') : M.processRate('packingLoose');
    var packing = man.packingWeight * packRate;
    var notes = [];
    /* Both of these are hard numbers on a sheet that has the real
       figures one tab away. The packing weight in particular is typed
       in kilograms while the cost summary is computing the cylinder's
       actual weight directly above it. */
    if (Math.abs(man.packingWeight - totalWeight) > 0.5) {
      notes.push({ level: 'defect', ref: 'A-1', text:
        'Packing is charged on ' + man.packingWeight + ' kg, typed by hand, while the cylinder ' +
        'actually weighs ' + totalWeight.toFixed(1) + ' kg. Difference: Rs.' +
        Math.abs((man.packingWeight - totalWeight) * packRate).toFixed(0) + '.' });
    }
    notes.push({ level: 'defect', ref: 'A-2', text:
      'Painting area is a typed ' + man.paintArea + ' cm2, not worked out from the cylinder size. Check it.' });
    return {
      assembly: { hours: man.assemblyHours, rate: man.assemblyRate, cost: assembly },
      painting: { areaCm2: man.paintArea, rate: M.processRate('painting'), cost: painting },
      packing: { type: man.packingType, weightKg: man.packingWeight, rate: packRate, cost: packing },
      total: assembly + painting + packing, notes: notes
    };
  }

  /* ══ ENGINEERING DEFAULTS ═════════════════════════════════════════
     The values the workbook carries on its own sheets for the handful
     of dimensions no table derives. They are seeded so the estimator
     gets a working costing from twenty-two inputs, and every one of
     them is editable and labelled in the UI as HISPL's working value
     rather than a derived figure. Seeding is not the same as deriving,
     and the difference is what keeps the tool honest. */
  function engineeringDefaults() {
    return {
      tubeRawOD: 185, tubeLength: 370, tubeHoleDia: 0, tubeHoles: 2,
      rodRawDia: 95, rodLength: 610, rodMillW: 20, rodMillL: 40,
      hardenedLength: null, deepHoleCost: 0,
      coverMillW: 40, coverMillL: 40, coverHoleDia: 14, coverHoles: 4,
      glandMillW: 30, glandMillL: 30, glandHoleDia: 10, glandHoles: 2,
      pistonMillW: 10, pistonMillL: 314, pistonHoleDia: 10, pistonHoles: 4,
      rodEyeMillW: 160, rodEyeMillH: 100,
      stopTubeLength: 150,
      flangeMillW: 40, flangeMillL: 40, flangeHoleDia: 14, flangeHoles: 4,
      trunnionMillW: 40, trunnionMillL: 40, trunnionHoleDia: 12, trunnionHoles: 2,
      trunnionRoughTurn: 0, trunnionFinishTurn: 0, trunnionPinGrind: 0,
      frontFlangeHoles: 4,
      tieRodAllowance: 150, tieRodThreading: 25,
      /* Tie Rod!B11, B12, B20, B27 — yield and safety as shipped, both
         overrides blank so the calculated sizes stand. */
      tieRodYield: 294, tieRodSafety: 3, tieRodDiaOverride: null, tieRodLengthOverride: null,
      /* CEC Clevis!B14, Foot Lug!B11, Trunnion!B10. */
      clevisLugs: 2, footLugs: 4, trunnionQty: 2,
      /* Cap End Cover!B5 and Head End Cover!B5. */
      coverShape: { cec: 'Round', hec: 'Round' },
      /* Every weld block's "No. of Weld Locations", shipped at 1. */
      weldLocations: { tubePart: 1, tubeCEC: 1, tubeRearEye: 1, rodEye: 1,
                       flange: 1, trunnion: 1, cecClevis: 1, frontFlange: 1 },
      /* Cost Summary B35 and B23. Both are the workbook's, both manual,
         both default to zero exactly as the sheet ships them. */
      additionalCost: 0, weightAdjustment: 0,
      /* Cost Summary A5: "each component sheet has its own New Material?
         Yes/No toggle - set to No to zero out material cost for a reused
         part". Absent means Yes, which is how the sheets ship. */
      newMaterial: {},
      /* Per-component geometry overrides, keyed by component id then by
         dimension name. Blank or missing falls through to the table. */
      geometry: {},
      assemblyHours: 3, assemblyRate: 250,
      paintArea: 4500, packingType: 'Wooden Box', packingWeight: 150,
      boughtOut: [
        { description: 'Bearing',      rate: 180, qty: 2, include: true },
        { description: 'Bearing Strip', rate: 0,  qty: 1, include: false },
        { description: 'Valve',        rate: 650, qty: 1, include: false },
        { description: 'Transducer',   rate: 0,   qty: 1, include: false },
        { description: 'Bellows',      rate: 850, qty: 1, include: false },
        { description: 'Fasteners',    rate: 0,   qty: 1, include: false }
      ],
      boc: {
        pipe: { include: true, dn: 100, od: 114.3, wall: 6.02, lengthM: 1, qty: 1 },
        pipeFlange: { include: true, qty: 1, weight: 2.8375, cost: 454.0 },
        bolt: { include: true, size: 'M12', shankDia: 12, headDia: 18, headHeight: 12,
                shankLength: 40, qty: 4, rate: 100 },
        bellows: { include: true, qty: 1, cost: 0 },
        flangeComponent: { include: true, od: 100, thickness: 20, qty: 1 }
      }
    };
  }

  /* ══ THE RUN ══════════════════════════════════════════════════════ */
  function cost(inputs, overrides) {
    var inp = inputs;
    var man = engineeringDefaults(), k;
    if (overrides) for (k in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, k)) man[k] = overrides[k];
    }

    var check = I.validate(inp);
    if (!check.ok) {
      return { ok: false, errors: check.errors, warnings: check.warnings };
    }
    var mount = I.mountingFor(inp.mounting);

    /* Every component is costed, fitted or not.

       The workbook's two roll-ups disagree about which ones count, and
       reproducing both means knowing what each would have cost. Cost
       Summary gates on the presence flags; Final Output does not gate on
       them at all, so it bills a stop tube and a rear eye that the
       inquiry says are absent. Costing everything and gating afterwards
       is also what lets the UI answer the question an estimator
       actually asks: what would fitting one add? */
    function gate(c, on, why) {
      c.present = on;
      if (!on) c.why = why;
      /* A withheld cost is null, and null must not silently become 0 in
         the subtotal — that is the difference between "we cannot price
         this" and "this is free". */
      c.billed = (on && c.totalCost !== null) ? c.totalCost : 0;
      return c;
    }

    var comps = [];
    comps.push(gate(tube(inp, man), true));
    comps.push(gate(pistonRod(inp, man, mount), true));
    comps.push(gate(endCover(inp, man, { id: 'cec', name: 'Cap End Cover', sheet: 'Cap End Cover' }), true));
    comps.push(gate(endCover(inp, man, { id: 'hec', name: 'Head End Cover', sheet: 'Head End Cover' }), true));
    comps.push(gate(gland(inp, man), true));
    comps.push(gate(cushionBush(inp, man), inp.hasCushionBush === 'Yes', 'Not fitted'));
    comps.push(gate(stopTube(inp, man), inp.hasStopTube === 'Yes', 'Not fitted'));
    comps.push(gate(rearEye(inp, man), inp.hasRearEye === 'Yes', 'Not fitted'));
    comps.push(gate(rodEye(inp, man), mount.rodEye, 'Mounting has no rod eye'));
    comps.push(gate(piston(inp, man), true));
    comps.push(gate(flange(inp, man), true));
    comps.push(gate(trunnion(inp, man), mount.trunnion, 'Mounting has no trunnion'));
    comps.push(gate(cecClevis(inp, man), mount.cecClevis, 'Mounting has no clevis'));
    comps.push(gate(tieRod(inp, man), mount.tieRod, 'Mounting has no tie rods'));
    comps.push(gate(footLug(inp, man), mount.footLug, 'Mounting has no foot lugs'));
    comps.push(gate(frontFlange(inp, man), mount.frontFlange, 'Mounting has no front flange'));

    /* A component whose cost is withheld makes the cylinder's total
       impossible, exactly as an INVALID string breaks the Cost Summary's
       SUM in the workbook. Reporting a number here would mean reporting
       one that is missing a tube. */
    var withheld = [], i;
    for (i = 0; i < comps.length; i++) {
      if (comps[i].present && comps[i].invalid) {
        withheld.push({ component: comps[i].name, reason: comps[i].invalid });
      }
    }

    var componentTotal = 0, totalWeight = 0;
    for (i = 0; i < comps.length; i++) {
      componentTotal += comps[i].billed || 0;
      /* Weight is per piece on every sheet; the trunnion's pair is the
         only place quantity moves it. */
      if (comps[i].present) {
        totalWeight += comps[i].weight * (comps[i].id === 'trunnion' ? comps[i].qty : 1);
      }
    }

    var sealKit = seals(inp);
    var bo = boughtOut(man);
    var bocCalc = bocCalculated(man);
    var fin = finishing(man, totalWeight);

    var otherTotal = sealKit.cost + bo.total + bocCalc.total + fin.total;
    /* B38 = B19 + B32 + B35. The additional cost is a real term in the
       workbook's total and was simply missing here. */
    var grandTotal = componentTotal + otherTotal + (man.additionalCost || 0);
    totalWeight += (man.weightAdjustment || 0);

    /* Notes are collected across the whole run so the UI can show a
       single "what to check before quoting" panel rather than making
       someone open thirteen component rows to find them. */
    var allNotes = [];
    for (i = 0; i < comps.length; i++) {
      /* Only what is actually being quoted. Every component is costed
         so the alternatives can be priced, but a defect note about a
         foot lug nobody is fitting is noise on the one panel that has
         to stay worth reading. */
      if (!comps[i].present) continue;
      var j;
      for (j = 0; j < comps[i].notes.length; j++) {
        allNotes.push({ component: comps[i].name, note: comps[i].notes[j] });
      }
    }
    for (i = 0; i < fin.notes.length; i++) {
      allNotes.push({ component: 'Assembly / Painting / Packing', note: fin.notes[i] });
    }
    if (!sealKit.available) {
      allNotes.push({ component: 'Seal Kit',
                      note: { level: 'error', text: sealKit.reason } });
    }

    /* Bought-out figures the workbook itself refuses to vouch for. BOC
       Calculated Items!B87: "Rate (Rs./kg) - PLACEHOLDER, awaiting real
       Unbrako vendor price list", and E86: "do not treat as a real bolt
       price". Bellows E97: "enter from an actual supplier quote". */
    for (i = 0; i < bocCalc.items.length; i++) {
      var bi = bocCalc.items[i];
      if (!bi.placeholder) continue;
      allNotes.push({ component: 'Bought-out (calculated)', note: {
        level: 'warn', ref: /Bolt/.test(bi.name) ? 'B-1' : 'B-2',
        text: /Bolt/.test(bi.name)
          ? 'The bolt rate is a placeholder, not a real supplier price.'
          : 'Bellows are costed at Rs.0 until a supplier quote is entered.' } });
    }

    /* Process Rate Master!A44: the bead table "currently covers 50-200mm
       only, per HISPL instruction - extend if a diameter outside this
       range is needed." Above 200 the lookup carries the top row. */
    var bigWelds = [];
    for (i = 0; i < comps.length; i++) {
      if (!comps[i].present) continue;
      for (var wi = 0; wi < (comps[i].welds || []).length; wi++) {
        var wd = comps[i].welds[wi].diameter;
        if (wd > 200 && bigWelds.indexOf(wd) < 0) bigWelds.push(wd);
      }
    }
    if (bigWelds.length) {
      allNotes.push({ component: 'Welding', note: { level: 'warn', ref: 'W-2', text:
        'Weld diameter ' + bigWelds.join(', ') + 'mm is past the bead table, which HISPL has ' +
        'set to cover 50-200mm only, so the largest size is used.' } });
    }

    /* The two roll-ups disagree, and the gap is not a rounding artefact.
       Naming which components each sheet counts is the only way anyone
       can decide which figure to quote. */
    var phantom = [];
    if (inp.hasStopTube !== 'Yes') phantom.push('Stop Tube');
    if (inp.hasRearEye !== 'Yes')  phantom.push('Rear Eye');
    if (!mount.rodEye)             phantom.push('Rod Eye');
    if (inp.hasCushionBush !== 'Yes') phantom.push('Cushion Bush');
    if (phantom.length) {
      allNotes.push({ component: 'Second total', note: { level: 'defect', ref: 'FO-1',
        text: 'Includes ' + andList(phantom) + ' although ' +
              (phantom.length === 1 ? 'it is' : 'they are') + ' not fitted, ' +
              'which is why it differs from the main total.' } });
    }
    var missing = [];
    if (mount.tieRod)      missing.push('Tie Rod');
    if (mount.footLug)     missing.push('Foot Lug');
    if (mount.frontFlange) missing.push('Front Flange');
    if (missing.length) {
      allNotes.push({ component: 'Second total', note: { level: 'defect', ref: 'FO-2',
        text: andList(missing) + ' ' + (missing.length === 1 ? 'is' : 'are') +
              ' fitted but left out, so it is too low. The main total includes ' +
              (missing.length === 1 ? 'it' : 'them') + '.' } });
    }

    var workbookNotes = [
      { ref: 'S-1', cell: "'Inquiry Input'!A31",
        says: 'Tube, Piston Rod, CEC, HEC, Gland, Rod Eye, Piston, and Flange are structurally essential to every cylinder and always costed.',
        but: 'Cost Summary B15 gates Rod Eye on the mounting, and the freeze-check sheet (section 9c) confirms it is excluded for Trunnion and Front Flange mountings. The tool follows the formula.' },
      { ref: 'S-2', cell: "'CEC Clevis'!A2",
        says: 'no approved HISPL geometry table exists yet - all dimensions below are ENGINEERING INPUT REQUIRED ... this component contributes Rs.0 until real dimensions are entered.',
        but: 'The same sheet\'s cells C9-C13 now read the HISPL-approved table (E4, E5: ISO 6022 / ISO 8140), and B41 costs the clevis at Rs.2,307 on the reference job. The header predates Change 6. The tool follows the cells.' },
      { ref: 'S-3', cell: "'Geometry Master'!A2, G100, E62",
        says: 'Phase 1 ... NOT connected to any costing sheet; Trunnion OD PENDING HISPL ENGINEERING DATA - do not invent Tube-OD-to-Trunnion-OD ratio.',
        but: 'The Trunnion sheet now carries an HISPL-approved stepped table with a Trunnion OD column (G5, G6: ISO 6020-2 / NFPA MT1-MT4), and the freeze-check sheet section 8 records all seven remaining components as implemented on 31-Aug-2026. The Geometry Master is the earlier phase. The tool follows the component sheets.' },
      { ref: 'S-4', cell: "'Geometry Master'!E40",
        says: 'no Applicable Yes/No flag yet for cylinders that don\'t need a Stop Tube',
        but: 'Inquiry Input B33 "Stop Tube Present?" now exists and the Cost Summary gates on it. The tool uses that flag.' }
    ];

    return {
      ok: true, warnings: check.warnings,
      /* Final Output!A18, verbatim. It belongs on anything that shows the
         figure to a customer. */
      disclaimer: 'This is an approximate manufacturing cost estimate for quotation purposes. ' +
                  'Final dimensions and engineering details are subject to the approved GA/design ' +
                  'drawing. Seal prices maintained manually by HISPL.',
      workbookNotes: workbookNotes,
      /* Non-empty means no total can be quoted. The components are still
         returned so the operator can see what is wrong and what the rest
         would have cost. */
      withheld: withheld,
      inputs: inp, engineering: man, mounting: mount,
      components: comps,
      componentTotal: componentTotal,
      totalWeight: totalWeight,
      sealKit: sealKit, boughtOut: bo, bocCalculated: bocCalc, finishing: fin,
      otherTotal: otherTotal,
      grandTotal: withheld.length ? null : grandTotal,
      notes: allNotes,
      /* The workbook's own two totals disagree, so both are reported
         rather than picking one. Final Output leaves out the calculated
         bought-out items and every component's additional-cost line;
         Cost Summary includes them. */
      totals: {
        costSummary: grandTotal,
        finalOutput: (function () {
          /* Final Output!C11 and C12, term for term. Thirteen
             components are named; only Trunnion and CEC Clevis are
             gated on the mounting. Cushion Bush, Stop Tube, Rear Eye
             and Rod Eye are added unconditionally, so this sheet bills
             components the inquiry says are not fitted. Tie Rod, Foot
             Lug and Front Flange appear in neither line, so a
             foot-lug cylinder is missing its lugs here entirely. */
          var named = ['tube', 'pistonRod', 'cec', 'hec', 'gland', 'cushionBush',
                       'stopTube', 'rearEye', 'rodEye', 'piston', 'flange'];
          var gated = { trunnion: mount.trunnion, cecClevis: mount.cecClevis };
          var rawMat = 0, procC = 0, n, c, q;
          for (n = 0; n < comps.length; n++) {
            c = comps[n];
            var inList = named.indexOf(c.id) >= 0;
            var inGated = Object.prototype.hasOwnProperty.call(gated, c.id) && gated[c.id];
            if (!inList && !inGated) continue;
            q = (c.id === 'trunnion') ? c.qty : 1;
            rawMat += c.materialCost * q;
            procC  += c.processCost  * q;
          }
          return { rawMaterial: rawMat, process: procC,
                   total: rawMat + procC + bo.total + sealKit.cost + fin.total };
        })()
      }
    };
  }

  root.HISPL_ENGINE_V1 = {
    cost: cost,
    engineeringDefaults: engineeringDefaults,
    weld: weld
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.HISPL_ENGINE_V1;
  }
})(typeof window !== 'undefined' ? window : this);
