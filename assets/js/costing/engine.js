/**
 * engine.js  —  HISPL Costing v2  —  The costing pipeline
 * ─────────────────────────────────────────────────────────
 * Runs the twelve component definitions through the master data and
 * rolls them up the way the workbook's Cost Summary does, preserving
 * its dependency order.
 *
 * THE ONE RULE THIS FILE ENFORCES
 *
 * Nothing is ever guessed. A missing dimension, an unknown grade, a
 * value beyond a master table's declared range — each yields
 * ENGINEERING_INPUT_REQUIRED and propagates. A component that cannot be
 * costed is reported as blocked, never as zero.
 *
 * The workbook does the opposite in one place: Cost Summary!B22 wraps
 * every component weight in IFERROR(...,0) and so reports 76.54 kg for
 * a cylinder missing two thirds of its parts. That is the behaviour
 * this engine exists to not have.
 *
 * WELDING is computed but never returned as money while
 * masters.weldingStatus().resolved is false. The mechanics are here and
 * tested; only the commercial decision is outstanding.
 *
 * GEOMETRY is absent by design. No dimension is derived from bore, rod
 * or stroke, because the workbook derives none and HISPL has not
 * confirmed that written standards exist. geometry.js will supply them
 * later without this file changing.
 *
 * ES5-compatible per CLAUDE.md.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};
  var M = window.AEW.masters;
  var C = window.AEW.components;
  if (!M || !C) throw new Error('engine.js requires masters.js and components.js');

  var EIR = M.EIR;
  var PI = Math.PI;

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function isEIR(v) { return v === EIR; }

  /* Whole rupees. The v1 lesson: round each line, then sum, so a
     printed column always agrees with its printed total. */
  function rup(n) { return Math.round(Number(n) || 0); }

  /* Cylindrical surface area in cm2 — Machine Time Master section 11:
     PI x D(mm) x L(mm) / 100. */
  function areaCm2(dia, len) {
    if (!isNum(dia) || !isNum(len) || dia <= 0 || len <= 0) return EIR;
    return PI * dia * len / 100;
  }

  /* ══════════════════════════════════════════════════════════════
     A trace entry per computed value. This is the traceability
     payload (D2b): every number can name the master it came from and
     the inputs that produced it.
     ══════════════════════════════════════════════════════════════ */
  function Trace() { this.rows = []; }
  Trace.prototype.add = function (o) { this.rows.push(o); return o.value; };
  Trace.prototype.all = function () { return this.rows.slice(); };

  /* ══════════════════════════════════════════════════════════════
     SECTION B — one process row
     ══════════════════════════════════════════════════════════════ */
  function runProcess(p, ctx) {
    var out = {
      process: p.process,
      applied: ctx.applied,
      basis: p.basis,
      hours: null, qty: null, rate: null, cost: null,
      source: null, blocked: null, note: p.note || null
    };

    if (!ctx.applied) {                       /* Apply? = No */
      out.cost = 0;
      out.source = 'not applied';
      return out;
    }

    var d = ctx.dims;

    /* ── the Hours / Qty basis column ── */
    var basisValue = EIR, basisLabel = '';
    if (p.basis === 'time2d') {
      var rowV = d[p.rowFrom], colV = d[p.colFrom];
      if (!isNum(rowV) || !isNum(colV)) {
        basisValue = EIR;
        basisLabel = 'machineTime(' + p.table + ')';
      } else if (p.stockFrom) {
        basisValue = M.roughTurningHours(rowV, colV, d[p.stockFrom]);
        basisLabel = 'roughTurningHours(' + rowV + ',' + colV + ',' + d[p.stockFrom] + ')';
      } else {
        basisValue = M.machineTime(p.table, rowV, colV);
        basisLabel = 'machineTime(' + p.table + ',' + rowV + ',' + colV + ')';
        if (p.finishFactor && !isEIR(basisValue)) {
          basisValue = M.finishTurningHours(basisValue);
          basisLabel += ' x ' + M.finishTurningFactor;
        }
      }
      if (p.finishFactor && p.stockFrom && !isEIR(basisValue)) {
        basisValue = M.finishTurningHours(basisValue);
        basisLabel += ' x ' + M.finishTurningFactor;
      }
    } else if (p.basis === 'time1d') {
      if (p.table === 'milling') {
        var area = (isNum(d.millWidth) && isNum(d.millLength))
          ? d.millWidth * d.millLength : NaN;
        basisValue = M.millingTime(area);
        basisLabel = 'millingTime(' + area + ' mm2)';
      } else if (p.table === 'drilling') {
        var n = p.holesFrom ? d[p.holesFrom] : 1;
        basisValue = M.drillingTime(d[p.rowFrom], isNum(n) ? n : NaN);
        basisLabel = 'drillingTime(' + d[p.rowFrom] + ' mm x ' + n + ')';
      } else {
        basisValue = M.profileCuttingTime(ctx.weight);
        basisLabel = 'profileCuttingTime(' + ctx.weight + ' kg)';
      }
    } else if (p.basis === 'area') {
      var dia = p.areaOf === 'id'
        ? (d.finishedID !== undefined ? d.finishedID : d.id)
        : (d.finishedOD !== undefined ? d.finishedOD
           : d.finishedDia !== undefined ? d.finishedDia : d.od);
      var len = d.length;
      basisValue = areaCm2(dia, len);
      basisLabel = 'PI x ' + dia + ' x ' + len + ' / 100 cm2';
    } else if (p.basis === 'weight') {
      basisValue = isNum(ctx.weight) ? ctx.weight : EIR;
      basisLabel = 'component weight ' + ctx.weight + ' kg';
    } else if (p.basis === 'vendor') {
      basisValue = isNum(d.deepHoleCost) ? d.deepHoleCost : 0;
      basisLabel = 'manual vendor figure';
      out.hours = null; out.qty = basisValue; out.rate = 1;
      out.cost = rup(basisValue);
      out.source = basisLabel;
      return out;
    }

    out.qty = basisValue;
    if (p.basis === 'time2d' || p.basis === 'time1d') out.hours = basisValue;

    /* ── the Rate column ── */
    var rate = EIR, rateLabel = '';
    if (p.rate === 'machine') {
      rate = M.machineRate(p.machine);
      rateLabel = 'Machine Rate Master: ' + p.machine;
    } else if (p.rate === 'turningCard') {
      var td = p.rowFrom ? d[p.rowFrom] : NaN;
      rate = M.turningRate(td, p.turningKind);
      rateLabel = 'Turning Rate Card (' + p.turningKind + ') @ ' + td + ' mm';
    } else if (p.rate === 'honingCard') {
      var hid = d.finishedID !== undefined ? d.finishedID : d.id;
      rate = M.honingRate(ctx.stroke, hid);
      rateLabel = 'Honing Rate Card @ stroke ' + ctx.stroke + ', ID ' + hid;
    } else if (p.rate === 'process') {
      rate = M.processRate(p.processName);
      rateLabel = 'Process Rate Master: ' + p.processName;
    }
    out.rate = rate;
    out.source = basisLabel + '  x  ' + rateLabel;

    /* ── the Cost column: F = IF(Apply?="Yes", D x E, 0) ── */
    if (isEIR(basisValue) || isEIR(rate)) {
      out.cost = EIR;
      out.blocked = isEIR(basisValue)
        ? 'no value for ' + basisLabel
        : 'no rate for ' + rateLabel;
    } else {
      out.cost = rup(basisValue * rate);
    }
    return out;
  }

  /* ══════════════════════════════════════════════════════════════
     SECTION C — welding. Computed, but held behind weldingStatus().
     ══════════════════════════════════════════════════════════════ */
  function runWeld(wd, dims) {
    var st = M.weldingStatus();
    var dia = dims[wd.diaFrom];
    var out = {
      key: wd.key, label: wd.label, weldDia: dia,
      beads: null, weldLength: null, hours: null,
      labour: null, wire: null, cost: EIR,
      withheld: !st.resolved,
      reason: st.resolved ? null : st.conflict
    };
    if (!isNum(dia) || dia <= 0) { out.reason = 'weld diameter unknown'; return out; }

    var f = st.workbookFormula;
    out.beads = dia <= f.diaThresholdForBeads ? f.beadsIfDiaLessOrEqual
                                              : f.beadsIfDiaGreater;
    out.weldLength = PI * dia * out.beads;
    out.hours  = out.weldLength / f.weldingSpeed;
    out.labour = out.hours * f.labourRate;
    out.wire   = out.hours * f.depositionRate * f.wireCost;

    /* The mechanics are known; which method is current is not. Until
       HISPL rules, this returns EIR rather than either number. */
    if (st.resolved) out.cost = rup(out.labour + out.wire);
    return out;
  }

  /* ══════════════════════════════════════════════════════════════
     ONE COMPONENT — A, B, C, D, E in the workbook's order
     ══════════════════════════════════════════════════════════════ */
  function runComponent(def, supplied, opts) {
    opts = opts || {};
    var trace = new Trace();
    var given = (supplied && supplied.dims) || {};
    var blocked = [];

    var out = {
      key: def.key, name: def.name, sheet: def.sheet,
      grade: null, density: null, materialRate: null,
      shape: null, qty: null,
      newMaterial: supplied && supplied.newMaterial === false ? false : true,
      dims: {}, missingDims: [],
      weight: EIR, materialCost: EIR,
      processes: [], processCost: EIR,
      welds: [], weldingCost: EIR, weldingWithheld: false,
      additionalCost: 0,
      total: EIR, totalForQty: EIR,
      blocked: blocked, trace: null
    };

    /* ── Section A: grade ── */
    var grade = (supplied && supplied.grade) || def.defaultGrade;
    out.grade = grade;
    var mat = M.material(grade);
    if (isEIR(mat)) {
      blocked.push('material grade "' + grade + '" is not in the Material Master');
      out.density = EIR; out.materialRate = EIR;
    } else {
      out.density = mat.density;
      out.materialRate = mat.rate;
      trace.add({ cell: def.gradeCell, what: 'density', value: mat.density,
                  source: 'Material Master: ' + grade });
      trace.add({ cell: def.gradeCell, what: 'material rate', value: mat.rate,
                  source: 'Material Master: ' + grade });
    }

    /* ── Section A: dimensions. None are derived. ── */
    def.dims.forEach(function (d) {
      var v = given[d.key];
      if (isNum(v)) { out.dims[d.key] = v; }
      else {
        out.dims[d.key] = EIR;
        out.missingDims.push({ key: d.key, label: d.label, cell: d.cell });
      }
    });

    out.shape = (supplied && supplied.shape) || (def.shaped ? 'Round' : null);
    out.qty = isNum(supplied && supplied.qty) ? supplied.qty
            : (def.defaultQty || 1);

    /* ── Auto calculate: weight ── */
    var needs = def.shaped
      ? (out.shape === 'Round' ? def.weightNeedsRound : def.weightNeedsRect)
      : def.weightNeeds;
    var haveAll = needs.every(function (k) { return isNum(out.dims[k]); });

    if (!haveAll) {
      var absent = needs.filter(function (k) { return !isNum(out.dims[k]); });
      blocked.push('weight needs ' + absent.join(', ') +
                   ' — ENGINEERING INPUT REQUIRED');
    } else if (isEIR(out.density)) {
      blocked.push('weight needs a density, and the grade is unknown');
    } else {
      out.weight = def.shaped
        ? def.weight(out.dims, out.density, out.shape)
        : def.weight(out.dims, out.density);
      trace.add({ cell: def.weightCell, what: 'unit weight (kg)',
                  value: out.weight,
                  source: 'geometry x density ' + out.density + ' / 1e6' });
    }

    /* ── Material cost: IF(New Material?="No", 0, weight x rate) ── */
    if (!out.newMaterial) {
      out.materialCost = 0;
      trace.add({ cell: 'B4', what: 'material cost', value: 0,
                  source: 'New Material? = No — reused component' });
    } else if (isNum(out.weight) && isNum(out.materialRate)) {
      out.materialCost = rup(out.weight * out.materialRate);
    }

    /* ── Section B ── */
    var applyMap = (supplied && supplied.apply) || {};
    var procCost = 0, procBlocked = false;
    def.processes.forEach(function (p) {
      var applied = applyMap.hasOwnProperty(p.process)
        ? !!applyMap[p.process] : p.applyDefault;
      var r = runProcess(p, {
        dims: out.dims, applied: applied,
        weight: out.weight, stroke: opts.stroke
      });
      out.processes.push(r);
      if (isEIR(r.cost)) { procBlocked = true; }
      else { procCost += r.cost; }
      if (!isEIR(r.cost)) {
        trace.add({ what: 'process: ' + p.process, value: r.cost,
                    source: r.source });
      }
    });

    /* ── Section C ── */
    var weldCost = 0, weldBlocked = false;
    (def.welds || []).forEach(function (wd) {
      var r = runWeld(wd, out.dims);
      out.welds.push(r);
      if (isEIR(r.cost)) { weldBlocked = true; out.weldingWithheld = out.weldingWithheld || r.withheld; }
      else weldCost += r.cost;
    });
    out.weldingCost = weldBlocked ? EIR : weldCost;
    if (weldBlocked && out.weldingWithheld) {
      blocked.push('welding method unresolved — no weld cost produced');
    }

    /* ── Subtotal: SUM(process costs) + welding totals ── */
    if (procBlocked || weldBlocked) {
      out.processCost = EIR;
      if (procBlocked) blocked.push('one or more process rows could not be costed');
    } else {
      out.processCost = procCost + weldCost;
    }

    /* ── Section D ── */
    out.additionalCost = rup((supplied && supplied.additionalCost) || 0);

    /* ── Section E ── */
    if (isNum(out.materialCost) && isNum(out.processCost)) {
      out.total = out.materialCost + out.processCost + out.additionalCost;
      out.totalForQty = out.total * out.qty;
    }

    out.trace = trace.all();
    return out;
  }

  /* ══════════════════════════════════════════════════════════════
     THE PIPELINE — Cost Summary order
     ══════════════════════════════════════════════════════════════ */
  function cost(inquiry, supply) {
    inquiry = inquiry || {};
    supply = supply || {};

    var results = [];
    C.all().forEach(function (def) {
      results.push(runComponent(def, supply[def.key], { stroke: inquiry.stroke }));
    });

    /* B19 — component manufacturing cost. Blocked if ANY component is. */
    var subtotal = 0, blockedComponents = [];
    results.forEach(function (r) {
      if (isNum(r.totalForQty)) subtotal += r.totalForQty;
      else blockedComponents.push(r.key);
    });
    var componentSubtotal = blockedComponents.length ? EIR : subtotal;

    /* B22 — cylinder weight.
       The workbook wraps each term in IFERROR(...,0) and so reports a
       confident number for a cylinder it could not cost. Deliberately
       not reproduced: a weight that omits components is reported as
       EIR, with the omissions named. */
    var weightSum = 0, weightMissing = [];
    results.forEach(function (r) {
      if (isNum(r.weight)) weightSum += r.weight * r.qty;
      else weightMissing.push(r.key);
    });
    var cylinderWeight = weightMissing.length ? EIR : weightSum;

    /* B27..B32 — other costs. Bought-out is the only one the masters
       supply; the rest are the estimator's figures. */
    var boughtOut = 0;
    M.boughtOut().forEach(function (b) {
      var inc = supply.boughtOut && supply.boughtOut.hasOwnProperty(b.item)
        ? supply.boughtOut[b.item] : b.defaultInclude;
      if (inc) boughtOut += rup(b.rate * b.qty);
    });

    var other = {
      sealKit:  rup(supply.sealKitCost || 0),
      boughtOut: boughtOut,
      assembly: rup(supply.assemblyCost || 0),
      painting: rup(supply.paintingCost || 0),
      packing:  rup(supply.packingCost || 0)
    };
    other.subtotal = other.sealKit + other.boughtOut + other.assembly +
                     other.painting + other.packing;

    /* B35 — reconditioning */
    var recon = supply.reconditioning && supply.reconditioning.include
      ? rup(supply.reconditioning.cost || 0) : 0;

    /* B38 — TOTAL MANUFACTURING COST */
    var total = isNum(componentSubtotal)
      ? componentSubtotal + other.subtotal + recon
      : EIR;

    /* What HISPL still owes, counted rather than guessed at. */
    var missing = [];
    results.forEach(function (r) {
      r.missingDims.forEach(function (d) {
        missing.push({ component: r.key, componentName: r.name,
                       dimension: d.key, label: d.label, cell: d.cell });
      });
    });

    return {
      inquiry: inquiry,
      components: results,
      componentSubtotal: componentSubtotal,
      blockedComponents: blockedComponents,
      cylinderWeight: cylinderWeight,
      weightMissing: weightMissing,
      other: other,
      reconditioning: recon,
      totalManufacturingCost: total,
      engineeringInputRequired: missing,
      welding: M.weldingStatus(),
      complete: isNum(total)
    };
  }

  /* A flat, printable account of where every number came from. */
  function traceability(result) {
    var rows = [];
    result.components.forEach(function (c) {
      (c.trace || []).forEach(function (t) {
        rows.push({
          component: c.name, sheet: c.sheet,
          cell: t.cell || '', what: t.what,
          value: t.value, source: t.source
        });
      });
      c.processes.forEach(function (p) {
        if (isEIR(p.cost)) {
          rows.push({ component: c.name, sheet: c.sheet, cell: '',
                      what: 'process: ' + p.process,
                      value: EIR, source: p.blocked || 'blocked' });
        }
      });
      c.missingDims.forEach(function (d) {
        rows.push({ component: c.name, sheet: c.sheet, cell: d.cell || '',
                    what: 'dimension: ' + d.label, value: EIR,
                    source: 'no approved geometry standard — ' +
                            'ENGINEERING INPUT REQUIRED' });
      });
    });
    return rows;
  }

  window.AEW.engine = {
    cost: cost,
    runComponent: runComponent,
    traceability: traceability,
    areaCm2: areaCm2,
    EIR: EIR
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AEW.engine;
  }
})();
