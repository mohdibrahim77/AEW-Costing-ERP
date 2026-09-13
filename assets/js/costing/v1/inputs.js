/* HISPL costing — the input layer, VERSION 1 workbook.
   Source: VERSION_1.xlsx, sheet 'Inquiry Input'.

   Twenty-two fields, and that is the whole of what an estimator types.
   Six identify the job, nine describe the cylinder, four choose the
   process and seal, three confirm which optional components are fitted.
   Everything else in the model — every dimension, every machine hour,
   every rate — is derived from these.

   The count is the workbook's, not a target we designed toward. Where
   the earlier file forced a choice between "ask for it" and "invent
   it", this one supplies a lookup table, so the ask shrank on its own. */
(function (root) {
  'use strict';

  var SECTIONS = [
    {
      id: 'identification', title: 'Identification', cell: 'Inquiry Input!B5:B10',
      fields: [
        { id: 'inquiryNo',    label: 'Inquiry No.',     type: 'text', cell: 'B5',  seed: 'INQ-0001' },
        { id: 'inquiryDate',  label: 'Inquiry Date',    type: 'date', cell: 'B6',  seed: '' },
        { id: 'cylinderNo',   label: 'Cylinder No.',    type: 'text', cell: 'B7',  seed: '' },
        { id: 'customerName', label: 'Customer Name',   type: 'text', cell: 'B8',  seed: '' },
        { id: 'customerLocation', label: 'Customer Location', type: 'text', cell: 'B9', seed: 'Bengaluru' },
        { id: 'cylinderName', label: 'Cylinder Name / Application', type: 'text', cell: 'B10', seed: '' }
      ]
    },
    {
      id: 'specification', title: 'Cylinder specification', cell: 'Inquiry Input!B13:B21',
      fields: [
        { id: 'bore',      label: 'Bore / ID',            type: 'number', unit: 'mm',  cell: 'B13', seed: 125,
          drives: 'End covers, piston, CEC clevis, front flange, seal kit, tie rod sizing' },
        { id: 'rodDia',    label: 'Piston Rod Diameter',  type: 'number', unit: 'mm',  cell: 'B14', seed: 90,
          drives: 'Gland, cushion bush, stop tube, rod eye' },
        { id: 'stroke',    label: 'Stroke',               type: 'number', unit: 'mm',  cell: 'B15', seed: 115,
          drives: 'Tie rod length' },
        { id: 'tubeOD',    label: 'Tube OD',              type: 'number', unit: 'mm',  cell: 'B16', seed: 150,
          drives: 'Rear eye, flange, trunnion, foot lug, every weld diameter' },
        { id: 'boringAllowance', label: 'Tube Boring Allowance', type: 'number', unit: 'mm', cell: 'B17', seed: 5,
          drives: 'Tube raw ID = Bore + this' },
        { id: 'odTurningAllowance', label: 'Tube OD Turning Allowance', type: 'number', unit: 'mm', cell: 'B18', seed: 5,
          note: 'Not used in the cost yet. Raw OD is entered under Engineering inputs.' },
        { id: 'workingPressure', label: 'Working Pressure', type: 'number', unit: 'bar', cell: 'B19', seed: 250,
          drives: 'Tie rod diameter (structural calculation)' },
        { id: 'mounting',  label: 'Mounting Type', type: 'select', cell: 'B20', seed: 'Rod Eye + Trunnion',
          options: ['Rod Eye', 'Rod Eye + Trunnion', 'Rod Eye + CEC Clevis', 'Trunnion',
                    'Rod Eye + Tie Rod', 'Rod Eye + Foot Lug', 'Front Flange'],
          drives: 'Which mounting components are costed at all' },
        { id: 'tieRodQty', label: 'Tie Rod Quantity', type: 'number', cell: 'B21', seed: 4,
          note: 'Only read when the mounting includes tie rods.' }
      ]
    },
    {
      id: 'process', title: 'Process & seal', cell: 'Inquiry Input!B25:B28',
      fields: [
        { id: 'rodProcess', label: 'Piston Rod Process', type: 'select', cell: 'B25',
          seed: 'Toughening and Induction Hardening',
          options: ['Toughening and Induction Hardening', 'Only Induction Hardening',
                    'Only Deep Hole Drilling', 'None'],
          drives: 'Whether heat treatment and induction hardening are costed' },
        { id: 'sealBrand',  label: 'Seal Brand',    type: 'select', cell: 'B26', seed: 'Freudenberg',
          options: ['Freudenberg', 'Others'] },
        { id: 'sealMaterial', label: 'Seal Material', type: 'select', cell: 'B27', seed: 'Viton',
          options: ['Viton', 'PU'] },
        { id: 'sealType',   label: 'Seal Type',     type: 'select', cell: 'B28', seed: 'Normal Glide Ring',
          options: ['Normal Glide Ring', 'Chevron'],
          note: 'Chevron is unpriced in the source catalogue — selecting it returns a refusal, not a number.' }
      ]
    },
    {
      id: 'presence', title: 'Optional components', cell: 'Inquiry Input!B32:B34',
      note: 'Tube, Piston Rod, both end covers, Gland, Piston and Flange are always fitted and are not asked about.',
      fields: [
        { id: 'hasCushionBush', label: 'Cushion Bush fitted?', type: 'yesno', cell: 'B32', seed: 'Yes' },
        { id: 'hasStopTube',    label: 'Stop Tube fitted?',    type: 'yesno', cell: 'B33', seed: 'No' },
        { id: 'hasRearEye',     label: 'Rear Eye fitted?',     type: 'yesno', cell: 'B34', seed: 'No' }
      ]
    }
  ];

  /* ══ MOUNTING LOGIC TABLE ═════════════════════════════════════════
     'Inquiry Input'!A45:G51, read by INDEX/MATCH. One row per mounting
     option; the mounting alone decides which of six components exist.

     Front Flange is the one that carries no rod eye: a flange-mounted
     cylinder takes its load through the flange, not a rod-end pivot. */
  var MOUNTING_LOGIC = {
    'Rod Eye':              { rodEye: 1, trunnion: 0, cecClevis: 0, tieRod: 0, footLug: 0, frontFlange: 0 },
    'Rod Eye + Trunnion':   { rodEye: 1, trunnion: 1, cecClevis: 0, tieRod: 0, footLug: 0, frontFlange: 0 },
    'Rod Eye + CEC Clevis': { rodEye: 1, trunnion: 0, cecClevis: 1, tieRod: 0, footLug: 0, frontFlange: 0 },
    'Trunnion':             { rodEye: 0, trunnion: 1, cecClevis: 0, tieRod: 0, footLug: 0, frontFlange: 0 },
    'Rod Eye + Tie Rod':    { rodEye: 1, trunnion: 0, cecClevis: 0, tieRod: 1, footLug: 0, frontFlange: 0 },
    'Rod Eye + Foot Lug':   { rodEye: 1, trunnion: 0, cecClevis: 0, tieRod: 0, footLug: 1, frontFlange: 0 },
    'Front Flange':         { rodEye: 0, trunnion: 0, cecClevis: 0, tieRod: 0, footLug: 0, frontFlange: 1 }
  };

  function mountingFor(name) {
    var m = MOUNTING_LOGIC[name];
    if (!m) return null;
    return { rodEye: !!m.rodEye, trunnion: !!m.trunnion, cecClevis: !!m.cecClevis,
             tieRod: !!m.tieRod, footLug: !!m.footLug, frontFlange: !!m.frontFlange };
  }

  function defaults() {
    var out = {}, i, j, f;
    for (i = 0; i < SECTIONS.length; i++) {
      for (j = 0; j < SECTIONS[i].fields.length; j++) {
        f = SECTIONS[i].fields[j];
        out[f.id] = f.seed;
      }
    }
    return out;
  }

  function fieldList() {
    var out = [], i, j;
    for (i = 0; i < SECTIONS.length; i++) {
      for (j = 0; j < SECTIONS[i].fields.length; j++) out.push(SECTIONS[i].fields[j]);
    }
    return out;
  }

  /* Validation that refuses rather than repairs. The one thing this
     will not do is quietly adjust a dimension the estimator typed —
     that was the rod bug, and it over-quoted by 81% while looking
     entirely healthy. */
  function validate(inp) {
    var errs = [], warns = [];
    function num(id, label) {
      var v = inp[id];
      if (typeof v !== 'number' || isNaN(v) || v <= 0) {
        errs.push(label + ' must be a positive number.');
        return false;
      }
      return true;
    }
    var okBore = num('bore', 'Bore');
    var okRod  = num('rodDia', 'Rod diameter');
    num('stroke', 'Stroke');
    var okOD = num('tubeOD', 'Tube OD');
    num('workingPressure', 'Working pressure');

    if (okBore && okRod && inp.rodDia >= inp.bore) {
      errs.push('Rod diameter (' + inp.rodDia + 'mm) must be smaller than the bore (' +
                inp.bore + 'mm). A rod cannot be wider than the tube it runs in.');
    }
    if (okBore && okOD && inp.tubeOD <= inp.bore) {
      errs.push('Tube OD (' + inp.tubeOD + 'mm) must exceed the bore (' + inp.bore +
                'mm), or the tube has no wall.');
    }
    if (!MOUNTING_LOGIC[inp.mounting]) {
      errs.push('Unknown mounting type: ' + inp.mounting);
    }
    if (okBore && okOD) {
      var wall = (inp.tubeOD - inp.bore) / 2;
      if (wall < 5) {
        warns.push('Tube wall works out at ' + wall.toFixed(1) +
                   'mm. Thin for a hydraulic cylinder — check the OD.');
      }
    }
    return { ok: errs.length === 0, errors: errs, warnings: warns };
  }

  root.HISPL_INPUTS_V1 = {
    sections: SECTIONS,
    fields: fieldList,
    defaults: defaults,
    mountingOptions: Object.keys(MOUNTING_LOGIC),
    mountingFor: mountingFor,
    mountingLogic: MOUNTING_LOGIC,
    validate: validate
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.HISPL_INPUTS_V1;
  }
})(typeof window !== 'undefined' ? window : this);
