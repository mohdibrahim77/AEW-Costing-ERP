/* Dump a sheet as a grid, showing formula or value per cell. */
const { readWorkbook } = require('./xlsx.js');
const wb = readWorkbook(process.argv[2]);
const want = process.argv[3];
const mode = process.argv[4] || 'grid';   /* grid | formulas */

const sheet = wb.sheets.find(function (s) {
  return s.name.toLowerCase() === want.toLowerCase();
});
if (!sheet) {
  console.log('sheets: ' + wb.sheets.map(function (s) { return s.name; }).join(' | '));
  process.exit(1);
}

const cells = Object.values(sheet.cells);
if (!cells.length) { console.log('(empty)'); process.exit(0); }

if (mode === 'formulas') {
  cells.filter(function (c) { return c.f; })
    .sort(function (a, b) { return a.row - b.row || a.col - b.col; })
    .forEach(function (c) {
      console.log(c.ref.padEnd(6) + ' = ' + c.f);
      console.log('      -> cached: ' + JSON.stringify(c.v));
    });
  process.exit(0);
}

const maxRow = Math.max.apply(null, cells.map(function (c) { return c.row; }));
const maxCol = Math.max.apply(null, cells.map(function (c) { return c.col; }));
const W = +(process.argv[5] || 30);

for (let r = 1; r <= maxRow; r++) {
  const parts = [];
  let any = false;
  for (let c = 1; c <= maxCol; c++) {
    const letters = (function (n) {
      let s = '';
      while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; }
      return s;
    })(c);
    const cell = sheet.cells[letters + r];
    let txt = '';
    if (cell) {
      any = true;
      txt = cell.f ? '=' + cell.f + (cell.v !== null ? ' {' + cell.v + '}' : '')
                   : (cell.v === null ? '' : String(cell.v));
    }
    parts.push(txt.length > W ? txt.slice(0, W - 1) + '…' : txt.padEnd(W));
  }
  if (any) console.log(String(r).padStart(3) + ' | ' + parts.join('| ').replace(/\s+$/, ''));
}
