/* HISPL costing — the three remaining sheets of VERSION_1.xlsx.
   Source: 'Machine Time Calculator', 'Actual Cost Tracker',
   'Cylinder Database'.

   None of these feeds the estimate, which is why they were not in the
   first build. They are still part of the workbook, and each one does a
   job the estimate cannot:

     Machine Time Calculator  what the shop floor is being asked to make
     Actual Cost Tracker      what it really cost, against what we said
     Cylinder Database        the record of having said it

   All three are derived from a completed costing run. Nothing here
   recomputes a rate or a dimension; if a number appears below it came
   out of engine.cost(). */
(function (root) {
  'use strict';

  var M = (typeof require !== 'undefined') ? require('./masters.js') : root.HISPL_MASTERS_V1;

  /* ══ MACHINE TIME CALCULATOR ══════════════════════════════════════
     'Machine Time Calculator'. The sheet describes itself precisely:
     "Standalone TIME-ONLY calculator. Does not calculate material cost,
     labour cost, welding cost, overheads, profit or quotation value."

     It also states the rule that matters most here: some operations are
     priced by area or by weight rather than against an hourly standard —
     honing, grinding, chrome plating, heat treatment, induction
     hardening, polishing — and for those it prints "TIME STANDARD NOT
     AVAILABLE", "exactly as instructed (no value is invented)".

     So this reports hours only where an hour was actually looked up. A
     process costed at Rs./cm2 has no machine-hour standard behind it,
     and turning its rupees back into hours would be inventing one. */
  var NO_STANDARD = 'TIME STANDARD NOT AVAILABLE';

  function machineTime(result) {
    if (!result || !result.ok) return null;

    var rows = [], byMachine = {}, totalHours = 0, i, j, c, p;

    for (i = 0; i < result.components.length; i++) {
      c = result.components[i];
      if (!c.present || c.blocked) continue;

      for (j = 0; j < c.processes.length; j++) {
        p = c.processes[j];

        /* basisLabel is 'hours' only where the engine read a machine-time
           table. 'cm2' and 'kg' are the area- and weight-priced routes;
           'manual' is a typed rupee figure. Neither carries an hour. */
        var isHours = p.basisLabel === 'hours' && typeof p.basis === 'number';
        var hours = isHours ? p.basis * (c.qty || 1) : null;

        rows.push({
          component: c.name, process: p.name, machine: p.machine,
          hours: hours,
          note: isHours ? null : NO_STANDARD,
          basis: isHours ? null : p.basisLabel
        });

        if (hours !== null) {
          totalHours += hours;
          /* Only real machines aggregate. "Vendor (Rs./cm2)" and
             "In-house" are routing labels, not machines. */
          if (M.machineRate(p.machine) !== null) {
            byMachine[p.machine] = (byMachine[p.machine] || 0) + hours;
          }
        }
      }
    }

    var machines = [];
    for (var name in byMachine) {
      if (Object.prototype.hasOwnProperty.call(byMachine, name)) {
        machines.push({ machine: name, hours: byMachine[name],
                        rate: M.machineRate(name) });
      }
    }
    machines.sort(function (a, b) { return b.hours - a.hours; });

    return {
      rows: rows,
      machines: machines,
      totalHours: totalHours,
      withoutStandard: rows.filter(function (r) { return r.note; }).length,
      note: 'Time only. Material, welding, overhead and profit are not part of this view.'
    };
  }

  /* ══ ACTUAL COST TRACKER ══════════════════════════════════════════
     'Actual Cost Tracker'. Production enters what it really cost; the
     estimate is pulled from each component sheet; variance follows.

     Two things about the sheet are reproduced rather than corrected,
     both the same family of defect already recorded for Final Output:

       - it lists twelve components and gates none of them, so a stop
         tube and a rear eye that were never fitted still appear
       - it takes per-piece costs, so the trunnion is counted once even
         though a trunnion mount is a pair

     Its TOTAL of Rs.25,011.25 on the reference job is only reachable
     with both of those in place, which is how they were found. */
  var TRACKED = ['tube', 'pistonRod', 'cec', 'hec', 'gland', 'cushionBush',
                 'stopTube', 'rearEye', 'rodEye', 'piston', 'flange', 'trunnion'];

  function actualCost(result, actuals) {
    if (!result || !result.ok) return null;
    var a = actuals || {};
    var by = {}, i;
    for (i = 0; i < result.components.length; i++) by[result.components[i].id] = result.components[i];

    var rows = [], estMat = 0, estProc = 0, actMat = 0, actProc = 0;

    for (i = 0; i < TRACKED.length; i++) {
      var c = by[TRACKED[i]];
      if (!c) continue;
      /* Per piece, ungated — the sheet's own arithmetic. */
      var em = c.materialCost || 0, ep = c.processCost || 0;
      var am = (a[TRACKED[i]] && a[TRACKED[i]].material) || 0;
      var ap = (a[TRACKED[i]] && a[TRACKED[i]].process)  || 0;
      var est = em + ep, act = am + ap;

      rows.push({
        id: TRACKED[i], component: c.name,
        estMaterial: em, actualMaterial: am,
        estProcess: ep, actualProcess: ap,
        variance: act - est,
        variancePct: est === 0 ? 0 : (act - est) / est,
        /* Said out loud rather than left for someone to notice. */
        countedButNotFitted: !c.present,
        perPieceOnly: (c.qty || 1) > 1 ? c.qty : null
      });
      estMat += em; estProc += ep; actMat += am; actProc += ap;
    }

    var estTotal = estMat + estProc, actTotal = actMat + actProc;
    var overall = {
      actualVendor:   a.vendor   || 0,
      actualWelding:  a.welding  || 0,
      actualAssembly: a.assembly || 0
    };
    var actualManufacturing = actTotal + overall.actualVendor +
                              overall.actualWelding + overall.actualAssembly;
    var estimatedManufacturing = result.grandTotal;

    return {
      rows: rows,
      totals: { estMaterial: estMat, actualMaterial: actMat,
                estProcess: estProc, actualProcess: actProc,
                estimated: estTotal, actual: actTotal,
                variance: actTotal - estTotal,
                variancePct: estTotal === 0 ? 0 : (actTotal - estTotal) / estTotal },
      overall: overall,
      actualManufacturing: actualManufacturing,
      estimatedManufacturing: estimatedManufacturing,
      overallVariance: estimatedManufacturing === null ? null
        : actualManufacturing - estimatedManufacturing,
      overallVariancePct: (!estimatedManufacturing) ? 0
        : (actualManufacturing - estimatedManufacturing) / estimatedManufacturing,
      /* The tracker's subtotal is per-piece and ungated, so it will not
         agree with the Cost Summary. That is the sheet, not a bug here. */
      reconcilesWithCostSummary: false
    };
  }

  /* ══ CYLINDER DATABASE ════════════════════════════════════════════
     'Cylinder Database'. One row per job: "Copy row 5, Paste Special >
     Values into a new row below to permanently log this job to history."

     The sheet carries the workbook's clearest statement about pricing:
     "Quoted Price (column J) is entered manually once negotiated with the
     customer - no automatic profit % is applied anywhere in this
     workbook." Margin is therefore only meaningful once someone has
     typed a quoted price; it is never derived. */
  function databaseRow(result, quotedPrice, actualTotal) {
    if (!result || !result.ok) return null;
    var inp = result.inputs;

    /* CONCATENATE("CYL-",TEXT(InquiryDate,"YYYYMMDD")). An empty date
       gives Excel's 1899-12-30 epoch and the sheet prints CYL-18991230 —
       reproduced, because a cylinder id that silently invents today's
       date would be worse than one that visibly shows no date was set. */
    var id = 'CYL-' + excelDateStamp(inp.inquiryDate);

    var quoted = typeof quotedPrice === 'number' ? quotedPrice : 0;
    var estimated = result.grandTotal;

    return {
      cylinderId: id,
      inquiryNo: inp.inquiryNo,
      customer: inp.customerName,
      cylinderName: inp.cylinderName,
      bore: inp.bore, rod: inp.rodDia, stroke: inp.stroke,
      mounting: inp.mounting,
      estimatedCost: estimated,
      quotedPrice: quoted,
      actualCost: typeof actualTotal === 'number' ? actualTotal : 0,
      /* =IF(J5=0,0,(J5-I5)/J5) — margin on the quoted price, not on cost,
         and zero until a price exists. */
      marginPct: (quoted === 0 || estimated === null) ? 0 : (quoted - estimated) / quoted,
      date: inp.inquiryDate || '',
      pricingNote: 'No automatic profit percentage is applied anywhere in ' +
                   'this workbook. Quoted price is entered manually once negotiated.'
    };
  }

  function excelDateStamp(d) {
    if (!d) return '18991230';          /* the workbook's own empty-date output */
    var dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return '18991230';
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return dt.getFullYear() + p(dt.getMonth() + 1) + p(dt.getDate());
  }

  root.HISPL_VIEWS_V1 = {
    machineTime: machineTime,
    actualCost: actualCost,
    databaseRow: databaseRow,
    NO_STANDARD: NO_STANDARD
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.HISPL_VIEWS_V1;
  }
})(typeof window !== 'undefined' ? window : this);
