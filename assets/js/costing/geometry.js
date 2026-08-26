/**
 * geometry.js  —  HISPL Costing v2  —  Approved geometry rules
 * ─────────────────────────────────────────────────────────
 * Derives component dimensions from the ten inputs — but ONLY where an
 * approved rule exists. Today that is one dimension.
 *
 * WHERE THE RULES COME FROM
 *
 * Section 9 of the reference document, "Geometry Calculation Rules".
 * These are rules, not values, so they are legitimately sourced from
 * the document under rule 5 — the document supplies structure and
 * intent, never a number.
 *
 * Section 9 lists eight entries. Sorting them by what they actually
 * need:
 *
 *   DERIVABLE FROM THE TEN INPUTS
 *     Finished Tube ID = Bore                                  <- the only one
 *
 *   NEEDS A MASTER THAT DOES NOT EXIST
 *     Finished Tube OD = "Tube OD input"       Tube OD is not one of the
 *                                              ten; it comes from the Tube
 *                                              Geometry Master
 *     Raw Tube ID  = Bore + Tube Boring Allowance        allowance unknown
 *     Raw Tube OD  = Tube OD + OD Turning Allowance      both unknown
 *     Trunnion Thickness = (Trunnion OD - Pin Dia) / 2   both unknown
 *
 *   NOT GEOMETRY — already implemented in components.js / engine.js
 *     Tube / rod / ring volume, steel weight, cylindrical surface
 *     area, mm2 -> cm2
 *
 * Section 8 of the same document is explicit about why the rest cannot
 * be derived:
 *
 *   "The supplied workbook does not currently contain dedicated
 *    geometry masters for the following. These should be created as
 *    controlled engineering reference tables and populated from HISPL
 *    historical drawings/data or approved engineering standards."
 *
 * — followed by eighteen named masters and their required fields. So
 * the absence is HISPL's own documented position, not an omission we
 * discovered.
 *
 * WHAT THIS FILE WILL NEVER DO
 *
 * Infer a rule from the single dimensioned cylinder in the workbook.
 * That cylinder gives bore 100 -> finished ID 100.4, finished OD 108,
 * raw OD 110, stroke 800 -> length 900. Four observations. Turning them
 * into a standard would produce plausible numbers for every bore and no
 * way to ever notice they were invented. Rule 5 forbids it and so does
 * section 8's instruction that the masters be populated from drawings
 * or approved standards.
 *
 * ES5-compatible per CLAUDE.md.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};
  var M = window.AEW.masters;
  if (!M) throw new Error('geometry.js requires masters.js');

  var EIR = M.EIR;

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  /* ══════════════════════════════════════════════════════════════
     THE APPROVED RULES

     One entry per derivable dimension. `from` names the inputs it
     consumes; `rule` is the document's own wording.
     ══════════════════════════════════════════════════════════════ */
  var RULES = [
    {
      component: 'tube',
      dimension: 'finishedID',
      label: 'Finished Tube ID',
      rule: 'Bore',
      source: 'Reference document section 9, Geometry Calculation Rules',
      from: ['bore'],
      derive: function (inp) {
        return isNum(inp.bore) && inp.bore > 0 ? inp.bore : EIR;
      }
    }
  ];

  /* Rules the document states but which cannot run, each with the
     master that would unblock it. Reported, never guessed. */
  var BLOCKED_RULES = [
    { component: 'tube', dimension: 'finishedOD', label: 'Finished Tube OD',
      rule: 'Tube OD input',
      needs: 'Tube OD — not one of the ten inputs; Tube Geometry Master' },
    { component: 'tube', dimension: 'rawID', label: 'Raw Tube ID',
      rule: 'Bore + Tube Boring Allowance',
      needs: 'Tube Boring Allowance — Tube Geometry Master' },
    { component: 'tube', dimension: 'rawOD', label: 'Raw Tube OD',
      rule: 'Tube OD + Tube OD Turning Allowance',
      needs: 'Tube OD and OD Turning Allowance — Tube Geometry Master' },
    { component: 'trunnion', dimension: 'thickness', label: 'Trunnion Thickness',
      rule: '(Trunnion OD - Pin Diameter) / 2',
      needs: 'Trunnion OD and Pin Diameter — Trunnion Geometry Master' }
  ];

  /* The eighteen masters section 8 says must be created. Listed so the
     tool can name precisely what is missing rather than saying
     "geometry unavailable". */
  var REQUIRED_MASTERS = [
    'Geometry Master', 'Tube Geometry Master', 'Piston Rod Geometry Master',
    'Piston Geometry Master', 'CEC Geometry Master', 'HEC Geometry Master',
    'Gland Geometry Master', 'Cushion Bush Geometry Master',
    'Stop Tube Geometry Master', 'Rod Eye Geometry Master',
    'Rear Eye Geometry Master', 'Trunnion Geometry Master',
    'Flange Geometry Master', 'CEC Clevis Geometry Master',
    'Foot Lug Geometry Master', 'Tie Rod Geometry Master',
    'Pin Master', 'Port/Connection Master'
  ];

  /**
   * derive(inputs)
   * Returns { dims, applied, blocked } where `dims` maps component key
   * to the dimensions an approved rule produced.
   *
   * Section 9's last line — "Final Dimension: Manual Override if
   * entered; otherwise Standard Geometry Value" — means a supplied
   * value always wins. The engine already honours that: anything the
   * caller supplies is used as-is, and this only fills gaps.
   */
  function derive(inputs) {
    inputs = inputs || {};
    var dims = {}, applied = [], blocked = [];

    RULES.forEach(function (r) {
      var v = r.derive(inputs);
      if (v === EIR) {
        blocked.push({ component: r.component, dimension: r.dimension,
                       label: r.label, rule: r.rule,
                       needs: r.from.join(', ') + ' — not supplied' });
        return;
      }
      dims[r.component] = dims[r.component] || {};
      dims[r.component][r.dimension] = v;
      applied.push({ component: r.component, dimension: r.dimension,
                     label: r.label, rule: r.rule, value: v,
                     source: r.source });
    });

    BLOCKED_RULES.forEach(function (r) { blocked.push(r); });

    return { dims: dims, applied: applied, blocked: blocked };
  }

  /* Merge derived dimensions under anything the caller supplied. A
     supplied value is a manual override and always wins. */
  function applyTo(supply, inputs) {
    var d = derive(inputs);
    var out = {};
    Object.keys(supply || {}).forEach(function (k) { out[k] = supply[k]; });

    Object.keys(d.dims).forEach(function (compKey) {
      var comp = out[compKey] || (out[compKey] = {});
      var dims = comp.dims || (comp.dims = {});
      Object.keys(d.dims[compKey]).forEach(function (dimKey) {
        if (!isNum(dims[dimKey])) dims[dimKey] = d.dims[compKey][dimKey];
      });
    });

    return { supply: out, applied: d.applied, blocked: d.blocked };
  }

  function rules() { return RULES.slice(); }
  function blockedRules() { return BLOCKED_RULES.slice(); }
  function requiredMasters() { return REQUIRED_MASTERS.slice(); }
  function ruleCount() { return RULES.length; }

  window.AEW.geometry = {
    derive: derive,
    applyTo: applyTo,
    rules: rules,
    blockedRules: blockedRules,
    requiredMasters: requiredMasters,
    ruleCount: ruleCount,
    EIR: EIR
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AEW.geometry;
  }
})();
