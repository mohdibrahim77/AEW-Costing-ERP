/* Minimal XLSX reader on top of ooxml.js — pure Node.
   Exposes formulas (<f>) as well as cached values (<v>). */
const { unzip } = require('./ooxml.js');

function decode(s) {
  return String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (m, d) { return String.fromCharCode(+d); })
    .replace(/&#x([0-9a-fA-F]+);/g, function (m, h) { return String.fromCharCode(parseInt(h, 16)); })
    .replace(/&amp;/g, '&');
}

/* sharedStrings: each <si> may hold one <t> or several inside <r> runs */
function sharedStrings(parts) {
  const xml = parts['xl/sharedStrings.xml'];
  if (!xml) return [];
  const s = xml.toString('utf8');
  const out = [];
  const siRe = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(s))) {
    let text = '';
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let t;
    while ((t = tRe.exec(m[1]))) text += decode(t[1]);
    out.push(text);
  }
  return out;
}

function colToNum(col) {
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n;
}

function readSheet(parts, file, sst) {
  const xml = parts[file];
  if (!xml) return null;
  const s = xml.toString('utf8');

  const cells = {};          /* address -> {f, v, t, r, c} */
  const cellRe = /<c\s([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g;
  let m;
  while ((m = cellRe.exec(s))) {
    const attrs = m[1];
    const inner = m[3] || '';
    const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1];
    if (!ref) continue;
    const type = (attrs.match(/t="([^"]+)"/) || [])[1] || 'n';

    const fM = inner.match(/<f[^>]*>([\s\S]*?)<\/f>/);
    const fSelf = /<f[^>]*\/>/.test(inner);
    const vM = inner.match(/<v[^>]*>([\s\S]*?)<\/v>/);
    const isM = inner.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/);

    let value = null;
    if (isM) value = decode(isM[1]);
    else if (vM) {
      const raw = decode(vM[1]);
      if (type === 's') value = sst[+raw] !== undefined ? sst[+raw] : raw;
      else if (type === 'str' || type === 'e') value = raw;
      else value = raw === '' ? null : Number(raw);
    }

    const colLetters = ref.match(/^[A-Z]+/)[0];
    cells[ref] = {
      ref: ref,
      row: +ref.match(/\d+$/)[0],
      col: colToNum(colLetters),
      colLetters: colLetters,
      t: type,
      f: fM ? decode(fM[1]) : (fSelf ? '(shared//inherited)' : null),
      v: value
    };
  }
  return cells;
}

function readWorkbook(file) {
  const parts = unzip(file);
  const sst = sharedStrings(parts);

  const wb = parts['xl/workbook.xml'].toString('utf8');
  const rels = parts['xl/_rels/workbook.xml.rels'].toString('utf8');

  const relMap = {};
  const relRe = /<Relationship([^>]*)\/>/g;
  let r;
  while ((r = relRe.exec(rels))) {
    const id = (r[1].match(/Id="([^"]+)"/) || [])[1];
    let tgt = (r[1].match(/Target="([^"]+)"/) || [])[1];
    if (!id || !tgt) continue;
    tgt = tgt.replace(/^\//, '').replace(/^worksheets/, 'xl/worksheets');
    if (!/^xl\//.test(tgt)) tgt = 'xl/' + tgt;
    relMap[id] = tgt;
  }

  const sheets = [];
  const shRe = /<sheet([^>]*)\/>/g;
  let sh;
  while ((sh = shRe.exec(wb))) {
    const name = decode((sh[1].match(/name="([^"]*)"/) || [])[1] || '');
    const rid  = (sh[1].match(/r:id="([^"]+)"/) || [])[1];
    const st   = (sh[1].match(/state="([^"]+)"/) || [])[1] || 'visible';
    const file2 = relMap[rid];
    sheets.push({ name: name, state: st, part: file2,
                  cells: file2 ? readSheet(parts, file2, sst) : null });
  }

  /* defined names can carry lookup ranges the formulas reference */
  const defined = [];
  const dnRe = /<definedName([^>]*)>([\s\S]*?)<\/definedName>/g;
  let dn;
  while ((dn = dnRe.exec(wb))) {
    defined.push({
      name: (dn[1].match(/name="([^"]*)"/) || [])[1],
      value: decode(dn[2])
    });
  }

  return { sheets: sheets, sst: sst, definedNames: defined, parts: parts };
}

module.exports = { readWorkbook, readSheet, sharedStrings, unzip, decode };
