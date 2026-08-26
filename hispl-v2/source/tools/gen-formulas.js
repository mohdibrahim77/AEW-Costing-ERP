/* Generate hispl-v2/source/EXTRACTED_FORMULAS.md straight from the
   workbook, so the document cannot drift from the source it describes. */
const fs = require('fs');
const path = require('path');
const { readWorkbook } = require('./xlsx.js');

const ROOT = 'C:/Users/admin/Desktop/projects/AEW_Platform';
const WB = ROOT + '/hispl-v2/source/Trunion_Included.xlsx';
const wb = readWorkbook(WB);

const stat = fs.statSync(WB);
const L = [];
const w = function (s) { L.push(s === undefined ? '' : s); };

/* Resolve a defined name to its range */
const dn = {};
wb.definedNames.forEach(function (d) { if (d.name) dn[d.name] = d.value; });

const COMPONENTS = ['Tube', 'Piston Rod', 'Cap End Cover', 'Head End Cover',
  'Gland', 'Cushion Bush', 'Stop Tube', 'Rear Eye', 'Rod Eye', 'Piston',
  'Flange', 'Trunnion'];

w('# EXTRACTED_FORMULAS.md');
w();
w('Every formula in `Trunion_Included.xlsx`, transcribed verbatim from the');
w('file, with its cached value. Generated mechanically from the workbook —');
w('not retyped — so it cannot drift from its source.');
w();
w('| | |');
w('|---|---|');
w('| Source file | `hispl-v2/source/Trunion_Included.xlsx` |');
w('| Size | ' + stat.size.toLocaleString() + ' bytes |');
w('| Sheets | ' + wb.sheets.length + ' |');
w('| Defined names | ' + wb.definedNames.filter(function (d) { return d.name; }).length + ' |');
w('| Formula cells | ' + wb.sheets.reduce(function (n, s) {
    return n + (s.cells ? Object.values(s.cells).filter(function (c) { return c.f; }).length : 0); }, 0) + ' |');
w('| Extraction | pure Node: `zlib.inflateRawSync` + ZIP walk + XML read of `<f>` / `<v>` |');
w();
w('`(shared//inherited)` marks an Excel *shared formula* — Excel stores the');
w('expression once on the first cell of a run and the siblings inherit it');
w('with their references shifted. The cached value is still exact.');
w();
w('---');
w();

/* ── Reading order ─────────────────────────────────────────────── */
w('## Dependency order');
w();
w('The workbook computes in this order. Preserve it.');
w();
w('```');
w('  Inquiry Input          11 operator inputs');
w('        |');
w('  Master sheets          Material / Machine Rate / Machine Time / Process Rate');
w('        |                (pure data — zero formulas)');
w('        v');
w('  12 component sheets    Section A material -> B process -> C welding');
w('        |                -> D additional -> E component total');
w('        v');
w('  Cost Summary           sums the 12, adds bought-out/seal/assembly/');
w('        |                painting/packing, then reconditioning');
w('        v');
w('  Final Output           the quotation figure');
w('```');
w();
w('Within every component sheet the internal order is fixed:');
w();
w('```');
w('  Material Grade (input)');
w('    -> Density   = INDEX/MATCH into Material Master col 3');
w('    -> Rate      = INDEX/MATCH into Material Master col 4');
w('    -> Unit Weight  = geometry x Density / 1e6');
w('    -> Material Cost = IF(New Material?="No", 0, Unit Weight x Rate)');
w('  Process rows (each independently)');
w('    -> Hours = INDEX/MATCH or VLOOKUP into Machine Time Master');
w('    -> Rate  = INDEX/MATCH into Machine Rate Master, or a Rate Card');
w('    -> Cost  = IF(Apply?="Yes", Hours x Rate, 0)');
w('  Welding (Tube and Piston Rod only)');
w('  Process subtotal = SUM(process costs) + welding totals');
w('  Component total  = Material + Process + Additional');
w('```');
w();
w('---');
w();

/* ── Master sheets ─────────────────────────────────────────────── */
w('## Master sheets carry no formulas');
w();
w('| Sheet | Cells | Formulas |');
w('|---|---|---|');
['Material Master', 'Machine Rate Master', 'Machine Time Master', 'Process Rate Master'].forEach(function (n) {
  const s = wb.sheets.find(function (x) { return x.name === n; });
  const c = s && s.cells ? Object.keys(s.cells).length : 0;
  const f = s && s.cells ? Object.values(s.cells).filter(function (x) { return x.f; }).length : 0;
  w('| ' + n + ' | ' + c + ' | **' + f + '** |');
});
w();
w('They are pure lookup data. Every rate enters the calculation through a');
w('formula on a component sheet, never by being typed there.');
w();
w('---');
w();

/* ── Per-sheet formula dumps ───────────────────────────────────── */
w('## Component sheets');
w();

COMPONENTS.forEach(function (name) {
  const s = wb.sheets.find(function (x) { return x.name === name; });
  if (!s || !s.cells) { w('### ' + name + ' — NOT FOUND'); w(); return; }
  const cells = Object.values(s.cells);
  const formulas = cells.filter(function (c) { return c.f; })
    .sort(function (a, b) { return a.row - b.row || a.col - b.col; });
  const errors = cells.filter(function (c) {
    return typeof c.v === 'string' && /^#(N\/A|REF|VALUE|DIV|NAME|NULL|NUM)/.test(c.v); });

  w('### ' + name);
  w();
  w('`' + formulas.length + '` formulas, `' + cells.length + '` populated cells' +
    (errors.length ? ', **`' + errors.length + '` cells currently in error**' : ''));
  w();

  /* Section A inputs: labelled rows with a literal (non-formula) value */
  const labels = {};
  cells.forEach(function (c) {
    if (c.colLetters === 'A' && typeof c.v === 'string') labels[c.row] = c.v;
  });

  w('| Cell | Kind | Label | Formula | Cached |');
  w('|---|---|---|---|---|');
  cells.sort(function (a, b) { return a.row - b.row || a.col - b.col; })
    .forEach(function (c) {
      if (c.colLetters === 'A' && typeof c.v === 'string' && !c.f) return;  /* label cell */
      if (c.v === null && !c.f) return;
      const isErr = typeof c.v === 'string' && /^#/.test(c.v);
      const kind = c.f ? (/(INDEX|VLOOKUP|MATCH)/.test(c.f) ? 'looked-up' : 'derived') : 'INPUT';
      const label = labels[c.row] || '';
      const val = c.v === null ? '' : String(c.v);
      w('| `' + c.ref + '` | ' + (isErr ? '**ERROR**' : kind) + ' | ' +
        label.replace(/\|/g, '\\|').slice(0, 46) + ' | ' +
        (c.f ? '`' + c.f.replace(/\|/g, '\\|') + '`' : '') + ' | ' +
        (isErr ? '**' + val + '**' : (val.length > 16 ? val.slice(0, 15) + '…' : val)) + ' |');
    });
  w();
});

/* ── Roll-up sheets ────────────────────────────────────────────── */
w('---');
w();
w('## Roll-up sheets');
w();
['Bought Out & Seal Kit Master', 'Assembly Painting Packing', 'Reconditioning',
 'Cost Summary', 'Final Output'].forEach(function (name) {
  const s = wb.sheets.find(function (x) { return x.name === name; });
  if (!s || !s.cells) return;
  const cells = Object.values(s.cells);
  const labels = {};
  cells.forEach(function (c) {
    if (c.colLetters === 'A' && typeof c.v === 'string') labels[c.row] = c.v;
  });
  w('### ' + name);
  w();
  w('| Cell | Label | Formula | Cached |');
  w('|---|---|---|---|');
  cells.filter(function (c) { return c.f; })
    .sort(function (a, b) { return a.row - b.row || a.col - b.col; })
    .forEach(function (c) {
      const isErr = typeof c.v === 'string' && /^#/.test(c.v);
      w('| `' + c.ref + '` | ' + (labels[c.row] || '').replace(/\|/g, '\\|').slice(0, 44) +
        ' | `' + c.f.replace(/\|/g, '\\|') + '` | ' +
        (isErr ? '**' + c.v + '**' : String(c.v === null ? '' : c.v).slice(0, 16)) + ' |');
    });
  w();
});

/* ── Defined names ─────────────────────────────────────────────── */
w('---');
w();
w('## Defined names');
w();
w('Every named range the formulas resolve against.');
w();
w('| Name | Refers to |');
w('|---|---|');
wb.definedNames.filter(function (d) { return d.name; })
  .sort(function (a, b) { return a.name.localeCompare(b.name); })
  .forEach(function (d) { w('| `' + d.name + '` | `' + d.value + '` |'); });
w();

fs.writeFileSync(ROOT + '/hispl-v2/source/EXTRACTED_FORMULAS.md', L.join('\n'));
console.log('wrote EXTRACTED_FORMULAS.md  —  ' + L.length + ' lines');
