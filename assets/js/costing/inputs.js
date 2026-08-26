/**
 * inputs.js  —  HISPL Costing v2  —  The input layer
 * ─────────────────────────────────────────────────────────
 * The complete input surface: ten fields, no more.
 *
 * Transcribed from section 7 of the reference document, "Current
 * Primary Inquiry Inputs", which lists exactly these ten and ends at
 * Working Pressure.
 *
 * ONE DISAGREEMENT, REPORTED RATHER THAN RESOLVED
 *
 * The workbook's Inquiry Input sheet has ELEVEN rows: B3..B13, the
 * eleventh being "Job Type" at B13 (value "Manufacturing"). The
 * document does not list it in section 7 and does not mention Job Type
 * anywhere at all.
 *
 * Per rule 5 the document is level 2 and wins on intent, so the input
 * surface is the document's ten. Job Type is recorded below as a known
 * divergence rather than silently added or silently dropped — it is a
 * question for HISPL.
 *
 * NOTHING ELSE IS AN INPUT. If a component dimension cannot be derived
 * from these ten plus an approved rule, it surfaces
 * ENGINEERING_INPUT_REQUIRED. It does not become an eleventh field, it
 * is not defaulted, and it is not inferred from the single dimensioned
 * cylinder in the workbook.
 *
 * ES5-compatible per CLAUDE.md.
 */
(function () {
  'use strict';

  window.AEW = window.AEW || {};
  var M = window.AEW.masters;
  if (!M) throw new Error('inputs.js requires masters.js');

  var EIR = M.EIR;

  /* Section 7, in the document's own order and wording.
     `cell` is where the workbook holds the same field. */
  var INPUTS = [
    { key: 'inquiryNo',     label: 'Inquiry No.',                        cell: 'B3',  type: 'text',   required: true },
    { key: 'inquiryDate',   label: 'Inquiry Date',                       cell: 'B4',  type: 'date',   required: true },
    { key: 'customerName',  label: 'Customer Name',                      cell: 'B5',  type: 'text',   required: true },
    { key: 'customerLoc',   label: 'Customer Location',                  cell: 'B6',  type: 'text',   required: false },
    { key: 'cylinderName',  label: 'Cylinder Name / Application Department', cell: 'B7', type: 'text', required: false },
    { key: 'bore',          label: 'Bore (mm)',                          cell: 'B8',  type: 'number', required: true, min: 1 },
    { key: 'rodDia',        label: 'Rod Diameter (mm)',                  cell: 'B9',  type: 'number', required: true, min: 1 },
    { key: 'stroke',        label: 'Stroke (mm)',                        cell: 'B10', type: 'number', required: true, min: 1 },
    { key: 'mounting',      label: 'Mounting Type',                      cell: 'B11', type: 'text',   required: false },
    { key: 'workingPress',  label: 'Working Pressure (bar)',             cell: 'B12', type: 'number', required: false, min: 0 }
  ];

  /* Present in the workbook, absent from the document. Not an input. */
  var DIVERGENCE = [
    {
      field: 'Job Type',
      workbook: "Inquiry Input!B13 = 'Manufacturing'",
      document: 'not listed in section 7; not mentioned anywhere',
      handling: 'excluded from the input surface — the document is ' +
                'level 2 and wins on intent. Question for HISPL.'
    }
  ];

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  /**
   * validate(raw)
   * Returns { ok, values, errors }. A rod that is not smaller than the
   * bore is rejected outright — five rows of the historical cost sheet
   * describe cylinders that cannot exist, and the tool should not add
   * to them.
   */
  function validate(raw) {
    raw = raw || {};
    var values = {}, errors = [];

    INPUTS.forEach(function (f) {
      var v = raw[f.key];

      if (f.type === 'number') {
        var n = (v === '' || v === null || v === undefined) ? undefined : Number(v);
        if (n === undefined || !isFinite(n)) {
          if (f.required) errors.push({ key: f.key, label: f.label, why: 'required' });
          values[f.key] = undefined;
          return;
        }
        if (f.min !== undefined && n < f.min) {
          errors.push({ key: f.key, label: f.label,
                        why: 'must be at least ' + f.min });
        }
        values[f.key] = n;
        return;
      }

      var s = (v === null || v === undefined) ? '' : String(v).trim();
      if (!s && f.required) {
        errors.push({ key: f.key, label: f.label, why: 'required' });
      }
      values[f.key] = s;
    });

    if (isNum(values.bore) && isNum(values.rodDia) && values.rodDia >= values.bore) {
      errors.push({ key: 'rodDia', label: 'Rod Diameter (mm)',
                    why: 'must be smaller than the bore (' + values.bore + ' mm) — ' +
                         'a rod cannot be as wide as the bore it travels inside' });
    }

    return { ok: errors.length === 0, values: values, errors: errors };
  }

  function all() { return INPUTS.slice(); }
  function keys() { return INPUTS.map(function (f) { return f.key; }); }
  function count() { return INPUTS.length; }
  function divergences() { return DIVERGENCE.slice(); }

  /* Read the ten from a workbook Inquiry Input sheet, for testing
     against HISPL's own sample. */
  function fromCells(readCell) {
    var out = {};
    INPUTS.forEach(function (f) { out[f.key] = readCell(f.cell); });
    return out;
  }

  window.AEW.inputs = {
    all: all,
    keys: keys,
    count: count,
    validate: validate,
    divergences: divergences,
    fromCells: fromCells,
    EIR: EIR
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AEW.inputs;
  }
})();
