/* Validates the v1 engine against VERSION_1.xlsx's own cached values.

   The workbook stores the result Excel last computed in every formula
   cell. Those numbers are the specification: if the engine and the
   cached value disagree, the engine is wrong. Nothing here is a figure
   I chose — every expectation was read out of the file.

   The reference job is the workbook's own: Bore 125 x Rod 90 x Stroke
   115, Tube OD 150, 250 bar, Rod Eye + Trunnion, Freudenberg/Viton
   Normal Glide Ring, cushion bush fitted, no stop tube, no rear eye. */
'use strict';

const engine = require('../assets/js/costing/v1/engine.js');
const inputs = require('../assets/js/costing/v1/inputs.js');
const masters = require('../assets/js/costing/v1/masters.js');
const geometry = require('../assets/js/costing/v1/geometry.js');

let pass = 0, fail = 0;
const failures = [];

/* Two paise. The workbook stores full doubles; the only differences
   that should appear are floating-point noise in a different order of
   operations. Anything larger is a real disagreement. */
const TOL = 0.02;

function near(label, got, want, tol) {
  const t = tol === undefined ? TOL : tol;
  if (typeof got !== 'number' || isNaN(got)) {
    fail++; failures.push(`${label}: got ${got}, expected ${want}`); return;
  }
  if (Math.abs(got - want) <= t) { pass++; return; }
  fail++;
  failures.push(`${label}: got ${got.toFixed(4)}, workbook says ${want} ` +
                `(off by ${(got - want).toFixed(4)})`);
}

function eq(label, got, want) {
  if (got === want) { pass++; return; }
  fail++; failures.push(`${label}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
}

const JOB = {
  inquiryNo: 'INQ-0001', inquiryDate: '', cylinderNo: '2100870353',
  customerName: '', customerLocation: 'Bengaluru', cylinderName: '',
  bore: 125, rodDia: 90, stroke: 115, tubeOD: 150,
  boringAllowance: 5, odTurningAllowance: 5, workingPressure: 250,
  mounting: 'Rod Eye + Trunnion', tieRodQty: 4,
  rodProcess: 'Toughening and Induction Hardening',
  sealBrand: 'Freudenberg', sealMaterial: 'Viton', sealType: 'Normal Glide Ring',
  hasCushionBush: 'Yes', hasStopTube: 'No', hasRearEye: 'No'
};

const r = engine.cost(JOB);
eq('run completes', r.ok, true);

const by = {};
r.components.forEach(c => { by[c.id] = c; });

/* ── 1. GEOMETRY: every derived dimension against its sheet ──────── */
/* Cap End Cover H33:H37, Bore 125 */
eq('CEC diameter',    by.cec.dims.diameter,   168);
eq('CEC width',       by.cec.dims.width,      165);
eq('CEC height',      by.cec.dims.height,     165);
eq('CEC thickness',   by.cec.dims.thickness,  44);
eq('CEC finished OD', by.cec.dims.finishedOD, 165);
/* Gland H30:H32, Rod 90 */
eq('Gland ID',     by.gland.dims.id,     91);
eq('Gland OD',     by.gland.dims.od,     180);
eq('Gland length', by.gland.dims.length, 100);
/* Cushion Bush H30:H32, Rod 90 */
eq('Cushion bush OD',     by.cushionBush.dims.od,     126);
eq('Cushion bush ID',     by.cushionBush.dims.id,     91);
eq('Cushion bush length', by.cushionBush.dims.length, 72);
/* Piston H23:H24, Bore 125 */
eq('Piston OD',     by.piston.dims.od,     125);
eq('Piston length', by.piston.dims.length, 75);
/* Rod Eye F22:F25, Rod 90 */
eq('Rod eye ID',        by.rodEye.dims.eyeID,     36);
eq('Rod eye OD',        by.rodEye.dims.eyeOD,     162);
eq('Rod eye thickness', by.rodEye.dims.thickness, 45);
eq('Rod eye pin hole',  by.rodEye.dims.pinHole,   36.5);
/* Flange H31:H32, Tube OD 150 */
eq('Flange OD',     by.flange.dims.od,     225);
eq('Flange length', by.flange.dims.length, 45);
/* Trunnion H25:H28, Tube OD 150 */
eq('Trunnion pin dia',   by.trunnion.dims.pinDia,     85);
eq('Trunnion OD',        by.trunnion.dims.trunnionOD, 170);
eq('Trunnion thickness', by.trunnion.dims.thickness,  42);
eq('Trunnion length',    by.trunnion.dims.length,     95);

/* ── 2. WEIGHTS: every sheet's Unit Weight cell ──────────────────── */
near('Tube weight (B16)',         by.tube.weight,        39.52159883);
near('Piston Rod weight (B15)',   by.pistonRod.weight,   33.94193393);
near('CEC weight (B18)',          by.cec.weight,         7.65650866);
near('HEC weight (B18)',          by.hec.weight,         7.65650866);
near('Gland weight (B15)',        by.gland.weight,       14.87026937);
near('Cushion Bush weight (B15)', by.cushionBush.weight, 3.822435472);
near('Rod Eye weight (B18)',      by.rodEye.weight,      6.921620552);
near('Piston weight (B14)',       by.piston.weight,      7.225049511);
near('Flange weight (B14)',       by.flange.weight,      14.04549625);
near('Trunnion weight (B15)',     by.trunnion.weight,    21.552175);

/* ── 3. MATERIAL COSTS ───────────────────────────────────────────── */
near('Tube material (B18)',       by.tube.materialCost,        6323.455813);
near('Piston Rod material (B17)', by.pistonRod.materialCost,   3394.193393);
near('CEC material (B20)',        by.cec.materialCost,         765.650866);
near('Gland material (B17)',      by.gland.materialCost,       1487.026937);
near('Cushion Bush mat (B17)',    by.cushionBush.materialCost, 6880.383849);
near('Rod Eye material (B20)',    by.rodEye.materialCost,      588.3377469);
near('Piston material (B16)',     by.piston.materialCost,      541.8787133);
near('Flange material (B16)',     by.flange.materialCost,      1404.549625);
near('Trunnion material (B17)',   by.trunnion.materialCost,    1724.174);

/* ── 4. PROCESS COSTS (incl. welding where the sheet includes it) ── */
near('Tube process (B63)',        by.tube.processCost,        6112.48377);
near('Piston Rod process (B49)',  by.pistonRod.processCost,   4596.17003);
near('CEC process (B35)',         by.cec.processCost,         615);
near('Gland process (B33)',       by.gland.processCost,       680.3539726);
near('Cushion Bush proc (B27)',   by.cushionBush.processCost, 357.3348603);
near('Rod Eye process (B32)',     by.rodEye.processCost,      260.6520257);
near('Piston process (B31)',      by.piston.processCost,      156.0313119);
near('Flange process (B40)',      by.flange.processCost,      1913.031496);
near('Trunnion process (B43)',    by.trunnion.processCost,    1438.031496);

/* ── 5. INDIVIDUAL PROCESS ROWS, where the sheet caches them ─────── */
const tp = {}; by.tube.processes.forEach(p => { tp[p.name] = p; });
near('Tube cutting hours (D26)',   tp['Cutting'].basis,        0.15, 1e-9);
near('Tube cutting cost (F26)',    tp['Cutting'].cost,         52.5);
near('Tube rough turn hrs (D27)',  tp['Rough Turning'].basis,  0.8, 1e-9);
near('Tube rough turn cost (F27)', tp['Rough Turning'].cost,   440);
near('Tube boring hours (D28)',    tp['Boring'].basis,         0.7, 1e-9);
near('Tube boring cost (F28)',     tp['Boring'].cost,          350);
near('Tube drilling cost (F29)',   tp['Drilling'].cost,        21);
near('Tube honing area (D30)',     tp['Rough Honing'].basis,   1452.986602);
near('Tube honing rate (E30)',     tp['Rough Honing'].rate,    0.4, 1e-9);
near('Tube honing cost (F30)',     tp['Rough Honing'].cost,    581.1946409);
near('Tube finish turn hrs (D31)', tp['Finish Turning'].basis, 0.35, 1e-9);
near('Tube finish turn cost(F31)', tp['Finish Turning'].cost,  192.5);

const rp = {}; by.pistonRod.processes.forEach(p => { rp[p.name] = p; });
near('Rod cutting cost (F26)',      rp['Cutting'].cost,             52.5);
near('Rod rough turn hrs (D27)',    rp['Rough Turning'].basis,      1.035, 1e-9);
near('Rod rough turn cost (F27)',   rp['Rough Turning'].cost,       310.5);
near('Rod heat treat cost (F29)',   rp['Heat Treatment'].cost,      407.3032071);
near('Rod induction area (D30)',    rp['Induction Hardening'].basis, 1724.734367);
near('Rod induction cost (F30)',    rp['Induction Hardening'].cost, 776.1304651);
near('Rod finish turn cost (F31)',  rp['Finish Turning'].cost,      252);
near('Rod grinding cost (F32)',     rp['Grinding'].cost,            689.8937467);
near('Rod chrome cost (F33)',       rp['Chrome Plating'].cost,      1034.84062);
near('Rod polishing cost (F34)',    rp['Polishing'].cost,           344.9468734);
near('Rod milling cost (F35)',      rp['Milling'].cost,             105);

/* ── 6. WELDING ─────────────────────────────────────────────────── */
eq('Tube weld blocks', by.tube.welds.length, 3);
near('Tube weld circumference (B39)', by.tube.welds[0].circumferenceIn, 18.54330709);
eq('Tube weld beads (B37)',           by.tube.welds[0].beads, 5);
near('Tube weld cost (B42)',          by.tube.welds[0].cost,  1298.031496);
near('Rod eye weld cost (B46)',       by.pistonRod.welds[0].cost, 623.0551181);
eq('Rod eye weld beads (B41)',        by.pistonRod.welds[0].beads, 4);
near('Flange weld cost (B52)',        by.flange.welds[0].cost, 1298.031496);
near('Trunnion weld cost (B55)',      by.trunnion.welds[0].cost, 1298.031496);

/* ── 7. COMPONENT TOTALS (Cost Summary B7:B18) ──────────────────── */
near('Tube total (B75)',         by.tube.totalCost,        12435.93958);
near('Piston Rod total (B61)',   by.pistonRod.totalCost,   7990.363423);
near('CEC total (B47)',          by.cec.totalCost,         1380.650866);
near('HEC total (B47)',          by.hec.totalCost,         1380.650866);
near('Gland total (B45)',        by.gland.totalCost,       2167.380909);
near('Cushion Bush total (B39)', by.cushionBush.totalCost, 7237.71871);
near('Rod Eye total (B44)',      by.rodEye.totalCost,      848.9897726);
near('Piston total (B43)',       by.piston.totalCost,      697.9100252);
near('Flange total (B43)',       by.flange.totalCost,      3317.581121);
near('Trunnion total qty2 (B46)',by.trunnion.totalCost,    6324.410992);

/* Absent components contribute nothing and say why. */
eq('Stop Tube absent', by.stopTube.present, false);
eq('Rear Eye absent',  by.rearEye.present,  false);
eq('CEC Clevis absent',by.cecClevis.present,false);
eq('Tie Rod absent',   by.tieRod.present,   false);
near('Stop Tube is not billed', by.stopTube.billed, 0);
/* But it IS costed, so the estimator can be told what fitting one would add.*/
near('...though its cost is still known (B36)', by.stopTube.totalCost, 1403.611314);

/* ── 8. SEALS, BOUGHT OUT, FINISHING ────────────────────────────── */
near('Seal kit cost (Seal Master B39)',  r.sealKit.kitCost, 9750.4);
near('Seal sale price (B41)',            r.sealKit.cost,    12188);
near('Bought out total (B17)',           r.boughtOut.total, 360);
near('BOC calculated total (C109)',      r.bocCalculated.total, 3154.508522, 0.5);
near('Assembly cost (B7)',               r.finishing.assembly.cost, 750);
near('Painting cost (B12)',              r.finishing.painting.cost, 900);
near('Packing cost (B18)',               r.finishing.packing.cost,  2250);
near('Finishing total (B21)',            r.finishing.total, 3900);

/* ── 9. THE ROLL-UP (Cost Summary B19, B24, B32, B38) ───────────── */
near('Component subtotal (B19)',   r.componentTotal, 43781.59712, 0.5);
near('Total cylinder weight (B24)',r.totalWeight,    178.7657712, 0.01);
near('Other costs subtotal (B32)', r.otherTotal,     19602.50852, 0.5);
near('TOTAL MANUFACTURING (B38)',  r.grandTotal,     63384.10479, 0.5);

/* ── 9b. THE WORKBOOK'S SECOND TOTAL ────────────────────────────── */
/* Final Output disagrees with Cost Summary by Rs.1,499, and the gap is
   not rounding. That sheet bills a stop tube and a rear eye the inquiry
   says are absent (Rs.1,656), and leaves out the calculated bought-out
   items the Cost Summary includes (Rs.3,155). Both totals are
   reproduced so nobody has to take one on trust. */
near('Final Output raw material (C11)', r.totals.finalOutput.rawMaterial, 26735.42769, 0.5);
near('Final Output process (C12)',      r.totals.finalOutput.process,     18701.89385, 0.5);
near('Final Output total (C16)',        r.totals.finalOutput.total,       61885.32154, 0.5);
near('the two totals differ by',
     r.totals.costSummary - r.totals.finalOutput.total, 1498.78325, 0.5);

const foRefs = r.notes.filter(n => n.note.ref === 'FO-1');
eq('the phantom components are named', foRefs.length, 1);
eq('  ...and Stop Tube is one of them', /Stop Tube/.test(foRefs[0].note.text), true);
eq('  ...and Rear Eye is another',      /Rear Eye/.test(foRefs[0].note.text), true);
/* Rod eye and cushion bush ARE fitted here, so they must not be listed. */
eq('  ...but not the fitted rod eye',   /Rod Eye/.test(foRefs[0].note.text), false);

/* With everything fitted, the phantom-billing gap closes entirely and
   the remaining difference is exactly the bought-out items. */
const allFitted = engine.cost(Object.assign({}, JOB, { hasStopTube: 'Yes', hasRearEye: 'Yes' }));
near('with all fitted, the gap is just the BOC items',
     allFitted.totals.costSummary - allFitted.totals.finalOutput.total,
     allFitted.bocCalculated.total, 0.5);
eq('and FO-1 falls silent', allFitted.notes.filter(n => n.note.ref === 'FO-1').length, 0);

/* A foot-lug cylinder is missing its lugs from Final Output entirely. */
const lugRun = engine.cost(Object.assign({}, JOB, { mounting: 'Rod Eye + Foot Lug' }));
const fo2 = lugRun.notes.filter(n => n.note.ref === 'FO-2');
eq('FO-2 fires on a foot-lug mount', fo2.length, 1);
eq('  ...and names the foot lug', /Foot Lug/.test(fo2[0].note.text), true);

/* ── 10. LOOKUP SEMANTICS ───────────────────────────────────────── */
/* Bin starts, not upper bounds. A 150mm weld takes the 126-150 row
   (5 beads); 151mm crosses into the next (6). Off-by-one here would
   change every weld on the cylinder. */
eq('weld beads at 150', masters.weldBeads(150), 5);
eq('weld beads at 151', masters.weldBeads(151), 6);
eq('weld beads at 125', masters.weldBeads(125), 4);
eq('weld beads at 126', masters.weldBeads(126), 5);
/* Below the table start, Piston Rod's IFERROR takes row 1. */
eq('weld beads at 40 (below table)', masters.weldBeads(40), 3);

/* Stock removal: the workbook's 2.0001 start puts exactly 2mm in the
   first band, not the second. */
eq('stock removal at 2.0',  masters.stockRemovalFactor(2),    1);
eq('stock removal at 2.5',  masters.stockRemovalFactor(2.5),  1.15);
eq('stock removal at 5.0',  masters.stockRemovalFactor(5),    1.15);
eq('stock removal at 35',   masters.stockRemovalFactor(35),   1.6);

/* Turning rate card boundaries. */
eq('turning rough at 100', masters.turningRate(100, 'rough'), 300);
eq('turning rough at 101', masters.turningRate(101, 'rough'), 550);
eq('turning finish at 90', masters.turningRate(90, 'finish'), 400);
eq('turning finish at 150',masters.turningRate(150,'finish'), 550);

/* Honing crosses to the high rate when EITHER threshold is passed. */
eq('honing rate 370mm / ID 125', masters.honingRate(370, 125), 0.4);
eq('honing rate 370mm / ID 80',  masters.honingRate(370, 80),  0.3);
eq('honing rate 5000mm / ID 80', masters.honingRate(5000, 80), 0.4);

/* EN8 has real gaps: 141-149 and 201-209 are unpriced, and bin-start
   matching carries the band below across them. */
eq('EN8 rate at 140', masters.materialRate('MS-EN8', 140), 75);
eq('EN8 rate at 145', masters.materialRate('MS-EN8', 145), 75);
eq('EN8 rate at 150', masters.materialRate('MS-EN8', 150), 80);
eq('C45 below table falls to row 1', masters.materialRate('MS-C45', 44), 100);
eq('C45 at 110', masters.materialRate('MS-C45', 110), 120);

/* ── 11. TABLE CEILINGS ─────────────────────────────────────────── */
/* Excel's MATCH(...,1) refuses below the first bin and extrapolates
   silently above the last. Both halves are reproduced, because the
   figure on HISPL's sheet is what the tool has to agree with — but the
   silent half is announced. */
eq('below the first bin is #N/A', masters.cuttingHours(100, -1), null);
eq('cutting at 3000mm resolves',  masters.cuttingHours(100, 3000), 0.30);
eq('beyond 3000mm carries the top band', masters.cuttingHours(100, 3500), 0.30);
eq('...and says so', masters.ceilingWarnings(3500).length > 0, true);
eq('a 370mm tube triggers no ceiling warning', masters.ceilingWarnings(370).length, 0);
/* Boring's ceiling is 2000mm, lower than cutting's 3000mm, so a 2.5m
   cylinder outruns some tables and not others. */
const mid = masters.ceilingWarnings(2500).map(w => w.table);
eq('2500mm outruns boring',      mid.indexOf('Boring') >= 0, true);
eq('2500mm outruns honing',      mid.indexOf('Honing') >= 0, true);
eq('2500mm does not outrun cutting', mid.indexOf('Cutting') >= 0, false);

/* A long cylinder must carry the warning through to the component. */
const longJob = engine.cost(JOB, { tubeLength: 3500, rodLength: 3600 });
eq('a 3.5m tube warns about its time tables',
   longJob.components.filter(c => c.id === 'tube')[0]
     .notes.filter(n => n.ref === 'C-1').length > 0, true);
eq('and still produces a total', longJob.grandTotal > 0, true);

/* ── 12. GEOMETRY REFUSES BELOW THE FIRST BIN ───────────────────── */
const tiny = geometry.derive('gland', 20);
eq('gland below first bin errors', !!tiny.error, true);
const big = geometry.derive('gland', 400);
eq('gland above last bin still resolves', big.values.od, 200);
eq('  ...and says it is stretching the top row', big.atTopOfTable, true);

/* ── 13. MOUNTING LOGIC (Inquiry Input A45:G51) ─────────────────── */
eq('Rod Eye + Trunnion -> rodEye',   inputs.mountingFor('Rod Eye + Trunnion').rodEye, true);
eq('Rod Eye + Trunnion -> trunnion', inputs.mountingFor('Rod Eye + Trunnion').trunnion, true);
eq('Rod Eye + Trunnion -> no clevis',inputs.mountingFor('Rod Eye + Trunnion').cecClevis, false);
eq('Trunnion alone has no rod eye',  inputs.mountingFor('Trunnion').rodEye, false);
eq('Front Flange has no rod eye',    inputs.mountingFor('Front Flange').rodEye, false);
eq('Front Flange -> frontFlange',    inputs.mountingFor('Front Flange').frontFlange, true);
eq('all seven options mapped',       inputs.mountingOptions.length, 7);

/* ── 14. SEAL CATALOGUE REFUSALS ────────────────────────────────── */
eq('Chevron is refused, not guessed',
   masters.sealKit(125, 'Others', 'Viton', 'Chevron').unavailable, true);
eq('Freudenberg + PU is refused',
   masters.sealKit(125, 'Freudenberg', 'PU', 'Normal Glide Ring').unavailable, true);
eq('bore below the priced range is refused',
   masters.sealKit(30, 'Others', 'Viton', 'Normal Glide Ring').unavailable, true);
eq('bore above the priced range is refused',
   masters.sealKit(300, 'Others', 'Viton', 'Normal Glide Ring').unavailable, true);
near('Others + PU at bore 125', masters.sealKit(125, 'Others', 'PU', 'Normal Glide Ring').price,
     3545.6 * 1.25);

/* ── 15. INPUT VALIDATION REFUSES, NEVER REPAIRS ────────────────── */
/* The rod bug: a derived field silently adjusted in one direction only
   and over-quoted by 81% while looking healthy. Nothing here adjusts. */
const badRod = Object.assign({}, JOB, { rodDia: 150 });
eq('rod wider than bore is rejected', inputs.validate(badRod).ok, false);
const badOD = Object.assign({}, JOB, { tubeOD: 100 });
eq('tube OD below bore is rejected', inputs.validate(badOD).ok, false);
const badMount = Object.assign({}, JOB, { mounting: 'Something Else' });
eq('unknown mounting is rejected', inputs.validate(badMount).ok, false);
eq('the valid job passes', inputs.validate(JOB).ok, true);

/* An engine run on invalid input must not return a number at all. */
const badRun = engine.cost(badRod);
eq('invalid input yields no total', badRun.ok, false);
eq('  ...and no grandTotal field',  badRun.grandTotal, undefined);

/* ── 16. INPUT LAYER SHAPE ──────────────────────────────────────── */
eq('input count matches the sheet', inputs.fields().length, 22);
const seeded = inputs.defaults();
eq('defaults cover every field', Object.keys(seeded).length, 22);
eq('defaults reproduce the workbook job', seeded.bore, 125);

/* ── 17. DEFECTS ARE REPORTED, NOT SILENTLY FIXED ───────────────── */
const defects = r.notes.filter(n => n.note.level === 'defect');
eq('defects are surfaced', defects.length >= 5, true);
const refs = defects.map(d => d.note.ref);
['W-1', 'P-1', 'T-1', 'A-1', 'A-2'].forEach(ref => {
  eq(`defect ${ref} reported`, refs.indexOf(ref) >= 0, true);
});

/* ── 18. MOUNTING CHANGES WHAT IS COSTED ────────────────────────── */
const tieJob = Object.assign({}, JOB, { mounting: 'Rod Eye + Tie Rod' });
const tieRun = engine.cost(tieJob);
const tr = tieRun.components.filter(c => c.id === 'tieRod')[0];
eq('tie rod present when mounted', tr.present, true);
eq('tie rod diameter is calculated', tr.dims.diameter, 35);
near('tie rod length = stroke + 150', tr.dims.length, 265);
near('tie rod weight/rod (B33)', tr.weightPerRod, 2.001435049);
near('tie rod material (B35)',   tr.materialCost, 1280.918431);
near('tie rod process (B44)',    tr.processCost,  450);
const trunnionOff = tieRun.components.filter(c => c.id === 'trunnion')[0];
eq('trunnion drops out', trunnionOff.present, false);

const ffJob = Object.assign({}, JOB, { mounting: 'Front Flange' });
const ffRun = engine.cost(ffJob);
const ff = ffRun.components.filter(c => c.id === 'frontFlange')[0];
const re = ffRun.components.filter(c => c.id === 'rodEye')[0];
eq('front flange present', ff.present, true);
near('front flange weight (B19)', ff.weight, 21.02351576);
near('front flange material (B20)', ff.materialCost, 1786.99884);
near('front flange process (B43)', ff.processCost, 2040.031496);
eq('rod eye drops out on a flange mount', re.present, false);
eq('and the rod carries no weld', ffRun.components.filter(c => c.id === 'pistonRod')[0].welds.length, 0);

const clevisJob = Object.assign({}, JOB, { mounting: 'Rod Eye + CEC Clevis' });
const cl = engine.cost(clevisJob).components.filter(c => c.id === 'cecClevis')[0];
near('clevis weight (B24)',   cl.weight,       7.062675092);
near('clevis material (B25)', cl.materialCost, 706.2675092);
near('clevis process (B51)',  cl.processes.reduce((a, p) => a + p.cost, 0), 302.8283439);
near('clevis total (B41)',    cl.totalCost,    2307.127349);

const lugJob = Object.assign({}, JOB, { mounting: 'Rod Eye + Foot Lug' });
const fl = engine.cost(lugJob).components.filter(c => c.id === 'footLug')[0];
near('foot lug weight (B21)',   fl.weight,       2.845418968);
near('foot lug material (B22)', fl.materialCost, 284.5418968);
near('foot lug weld (B38)',     fl.welds[0].cost, 5192.125984);
near('foot lug total (B47)',    fl.totalCost,    5651.667881);

/* ── 19. OPTIONAL COMPONENTS ────────────────────────────────────── */
const withAll = engine.cost(Object.assign({}, JOB, { hasStopTube: 'Yes', hasRearEye: 'Yes' }));
const st = withAll.components.filter(c => c.id === 'stopTube')[0];
const rev = withAll.components.filter(c => c.id === 'rearEye')[0];
near('stop tube weight (B15)',   st.weight,       13.76481753);
near('stop tube material (B17)', st.materialCost, 1032.361314);
near('stop tube process (B25)',  st.processCost,  371.25);
near('stop tube total (B36)',    st.totalCost,    1403.611314);
near('rear eye weight (B16)',    rev.weight,      1.2187125);
near('rear eye material (B18)',  rev.materialCost,103.5905625);
near('rear eye process (B30)',   rev.processCost, 148.5233906);
near('rear eye total (B41)',     rev.totalCost,   252.1139531);
eq('fitting a rear eye clears the phantom-weld note',
   withAll.components.filter(c => c.id === 'tube')[0]
     .notes.filter(n => n.ref === 'W-1').length, 0);

/* Dropping the cushion bush must move the total by exactly its cost. */
const noBush = engine.cost(Object.assign({}, JOB, { hasCushionBush: 'No' }));
near('removing the bush removes exactly its cost',
     r.grandTotal - noBush.grandTotal, by.cushionBush.totalCost, 0.01);

/* ── 20. A DIFFERENT CYLINDER STILL RESOLVES END TO END ─────────── */
/* Nothing to compare against — the workbook has one worked example —
   so this checks only that a second size derives cleanly rather than
   silently costing something at zero. */
const other = engine.cost(Object.assign({}, JOB, { bore: 100, rodDia: 56, tubeOD: 125 }));
eq('second size runs', other.ok, true);
eq('second size CEC OD',   other.components.filter(c => c.id === 'cec')[0].dims.finishedOD, 130);
eq('second size gland ID', other.components.filter(c => c.id === 'gland')[0].dims.id, 57);
eq('second size piston OD',other.components.filter(c => c.id === 'piston')[0].dims.od, 100);
eq('no component costs zero', other.components.filter(
     c => c.present && c.totalCost <= 0).length, 0);
eq('no component is blocked', other.components.filter(c => c.blocked).length, 0);
eq('second size is cheaper than the 125 bore', other.grandTotal < r.grandTotal, true);

/* ── report ─────────────────────────────────────────────────────── */
if (fail) {
  console.log('\n  WORKBOOK-V1 FAILURES:');
  failures.forEach(f => console.log('    x ' + f));
  console.log(`\n  WORKBOOK-V1 — ${pass} passed, ${fail} failed`);
  process.exit(1);
} else {
  console.log(`✓ WORKBOOK-V1 — ${pass} passed, 0 failed`);
}
