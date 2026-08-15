# PATCHES-PROPOSED.md — draft, not applied

Three patches for the defects in `WORKED_EXAMPLE.md`. **Nothing in this
document has been applied.** Review, then say which to land.

---

# PATCH 1 — one function computes the money

**Defects 1 and 2. Root cause, not symptoms.**

Three surfaces each build their own manufacturing total:

| Surface | Line | Builds `mfg` from |
|---|---|---|
| `calcSummary` | 904 | csub + bear + seal + bom + asm + test + paint + trans + pack |
| `buildQuote` | 967 | `rows.reduce(...)` |
| `generatePDF` | 1000 | tube + rod + bear + seal + bom + … — **no covers** |

And each re-reads the margin independently as `gv('profit-pct') || 20`,
which is why the bootstrap's `enforceZeroMargin()` — which patches only
the Summary panel — cannot hold the other two.

**This requires modifying the frozen block.** It is the case the freeze
exists to protect against: a wrong number reaching a customer.

## 1a. Add four functions to the frozen block

Insert immediately **before** `function calcSummary()` (line 897):

```js
/* ── Single source of truth for the money ──────────────────────────
   Summary, Quotation and PDF must never compute this independently.
   Three separate roll-ups is what let the PDF drift Rs 4,200 below
   the screen without anything failing. */
function componentSub(){
  let csub=R.tube.tot+R.rod.tot;
  [...COVERS,...MISC].forEach(c=>{csub+=gv(c.id+'-mat')+gv(c.id+'-proc')+gv(c.id+'-lab');});
  return csub;
}
function mfgTotal(){
  return componentSub()+(R.bear||0)+(R.seal||0)+(R.bom||0)
        +(R.asm||0)+(R.test||0)+(R.paint||0)+(R.trans||0)+(R.pack||0);
}
/* 0 is a legitimate margin — a strategic order, an internal transfer,
   a rework. `gv(...)||20` silently turned it into 20. A blank field
   still means "use the default". */
function marginPct(){
  const e=document.getElementById('profit-pct');
  if(!e)return 20;
  const raw=String(e.value).trim();
  if(raw==='')return 20;
  const n=Number(raw);
  return isFinite(n)&&n>=0?n:20;
}
function commercials(){
  const mfg=mfgTotal(),pp=marginPct();
  const pa=r2(mfg*pp/100),sp=r2(mfg+pa),qty=gv('inq-qty')||1;
  return {mfg,pp,pa,sp,qty,ov:r2(sp*qty)};
}
```

## 1b. `calcSummary` calls them

Replace lines 897–911:

```js
function calcSummary(){
  [...COVERS,...MISC].forEach(c=>{st('ss-'+c.id,fI(gv(c.id+'-mat')+gv(c.id+'-proc')+gv(c.id+'-lab')));});
  const csub=componentSub();
  st('ss-tube',fI(R.tube.tot));st('ss-rod',fI(R.rod.tot));st('ss-csub',fI(csub));
  st('ss-bear',fI(R.bear||0));st('ss-seal',fI(R.seal||0));st('ss-bom',fI(R.bom||0));
  st('ss-asm',fI(R.asm||0));st('ss-test',fI(R.test||0));
  st('ss-paint',fI(R.paint||0));st('ss-trans',fI(R.trans||0));st('ss-pack',fI(R.pack||0));
  const C=commercials();
  st('ss-mfg',fI(C.mfg));
  sv('profit-amt',fI(C.pa));sv('profit-sp',fI(C.sp));sv('sum-qty',C.qty+' nos');sv('profit-ov',fI(C.ov));
  st('km-mfg',fI(C.mfg));st('km-mg',fI(C.pa));st('km-sp',fI(C.sp));st('km-ov',fI(C.ov));
  st('km-mgp','@ '+C.pp+'%');st('km-qty','for '+C.qty+' piece'+(C.qty>1?'s':''));
  renderCharts(csub);
}
```

## 1c. `buildQuote` calls them

Replace lines 967–974. Delete `const mfg=rows.reduce(...)` and the
`const pp=gv('profit-pct')||20,...` line entirely:

```js
  const C=commercials();
  document.getElementById('q-rows').innerHTML=
    rows.map(r=>`<tr><td>${r.l}</td><td>${r.m>0?fI(r.m):'—'}</td><td>${r.p>0?fI(r.p):'—'}</td><td>${fI(r.m+r.p)}</td></tr>`).join('')+
    `<tr class="qsub"><td colspan="3">Total Manufacturing Cost (per piece)</td><td>${fI(C.mfg)}</td></tr>
     <tr class="qmg"><td colspan="3">Profit Margin (${C.pp}%)</td><td>${fI(C.pa)}</td></tr>
     <tr class="qsp"><td colspan="3">Selling Price per Piece</td><td>${fI(C.sp)}</td></tr>
     <tr class="qov"><td colspan="3">Total Order Value (${C.qty} nos)</td><td>${fI(C.ov)}</td></tr>`;
```

## 1d. `generatePDF` calls them — and prints the missing row

Replace lines 1000–1004. Note the **new machined-components row**:
without it the printed table would not sum to the printed total, which
is the first thing a customer checking by hand would find.

```js
  const C=commercials();
  const coversTot=componentSub()-R.tube.tot-R.rod.tot;
  const bomTot=(R.bear||0)+(R.seal||0)+(R.bom||0);
  const atTot=(R.asm||0)+(R.test||0);
  const ptpTot=(R.paint||0)+(R.trans||0)+(R.pack||0);
  const trows=[
    [document.getElementById('t-mat')?.value+' Tube',fI(R.tube.mat),fI(R.tube.proc),fI(R.tube.tot)],
    [document.getElementById('r-mat')?.value+' Piston Rod',fI(R.rod.mat),fI(R.rod.proc),fI(R.rod.tot)]
  ];
  if(coversTot>0)trows.push(['Machined Components (covers, gland, eyes, piston)','—',fI(coversTot),fI(coversTot)]);
  trows.push(['Bill of Materials (Bearings, Seals, Bought Out)',fI(bomTot),'—',fI(bomTot)]);
  trows.push(['Assembly + Testing','—',fI(atTot),fI(atTot)]);
  trows.push(['Painting + Transport + Packing','—',fI(ptpTot),fI(ptpTot)]);
  if(typeof doc.autoTable==='function'){
    doc.autoTable({startY:96,head:[['Description','Material ₹','Process ₹','Total ₹']],body:trows,
      foot:[['Total Manufacturing Cost','','',fI(C.mfg)],
            ['Profit Margin ('+C.pp+'%)','','',fI(C.pa)],
            ['Selling Price per Piece','','',fI(C.sp)],
            ['Total Order Value ('+C.qty+' nos)','','',fI(C.ov)]],
      /* remaining style options unchanged */});
  }
```

## 1e. Remove the now-duplicate bootstrap guard

`enforceZeroMargin()` (line 2615) and its `watchMargin()` listener
become redundant — `marginPct()` honours 0 at source, so the Summary
panel is already correct. Keeping both re-creates exactly the problem
being fixed: two places deciding the same number.

- delete `bootStep('margin guard', watchMargin);` (line 1213)
- delete `try { enforceZeroMargin(); } catch (e) {}` (line 2106)
- delete `enforceZeroMargin()` and `watchMargin()` (lines 2601–2660)

No test references either function.

## Effect

Reference job, Ø100 × Ø56 × 500, qty 10:

| | Summary | Quotation | PDF |
|---|---|---|---|
| **before**, 20 % | ₹17,589 | ₹17,589 | ₹13,389 |
| **after**, 20 % | ₹17,589 | ₹17,589 | **₹17,589** |
| **before**, 0 % — selling price | ₹17,589 | ₹21,107 | ₹16,067 |
| **after**, 0 % — selling price | ₹17,589 | **₹17,589** | **₹17,589** |

## Freeze bookkeeping

Modifying the frozen block requires, in the same commit:

1. `tests/integrity.js` — add `componentSub`, `mfgTotal`, `marginPct`,
   `commercials` to the `FNS` list so they cannot be silently removed.
2. `tests/integrity.js` — new `BASELINE` hash.
3. `CLAUDE.md` — record the exception under rule 1, with the reason.
4. `CHANGELOG.md` — new entry.

---

# PATCH 2 — rod raw diameter guard

**Defect 3.** Bootstrap only; the frozen block is untouched.

`propagate()` sets `r-fdia` from the enquiry and never touches
`r-rdia`, which ships at 52 mm. `autoFixTubeOD()` already does exactly
this job for the tube.

Add beside `autoFixTubeOD()` (after line 1712):

```js
/**
 * deriveRodRawDia(fin)
 * Bar stock must exceed the finished rod. +4 mm gives a workable
 * turning and grinding allowance; commercial bright bar comes in 5 mm
 * steps, so round up to the next one.
 */
function deriveRodRawDia(fin) {
  return Math.ceil((fin + 4) / 5) * 5;
}

/**
 * autoFixRodDia()
 * Raises the raw bar diameter when the finished rod has grown past it.
 * Unlike the tube bug nothing collapses to zero here — the cost stays
 * plausible while being computed from stock that cannot exist, which
 * is what makes it more dangerous.
 */
function autoFixRodDia() {
  var finEl = document.getElementById('r-fdia');
  var rawEl = document.getElementById('r-rdia');
  if (!finEl || !rawEl) return false;

  var fin = Number(finEl.value) || 0;
  var raw = Number(rawEl.value) || 0;
  if (!fin || raw > fin) return false;          /* geometry is fine */

  var nd = deriveRodRawDia(fin);
  rawEl.value = nd;

  try { calcRod(); calcAll(); }
  catch (e) { console.error('[ERP] recalc after rod dia fix failed:', e); }

  showGeometryNotice('Raw rod diameter raised to ' + nd + ' mm to suit a ' +
                     fin + ' mm finished rod. Change it if your bar stock differs.');
  return true;
}
```

Hook it alongside the tube guard at line 1234:

```js
        if (id === 'inq-bore' || id === 't-id')  autoFixTubeOD();
        if (id === 'inq-rod'  || id === 'r-fdia') autoFixRodDia();
        validateGeometry();
```

And once at boot, after the rate card seeds (near line 1247), so a
restored or seeded state is corrected too:

```js
    bootStep('rod dia guard', autoFixRodDia);
```

## Effect

| Rod Ø | raw before | raw after | raw mass → correct | material understated |
|---|---|---|---|---|
| 50 | 52 | 55 | 14.17 → 15.85 kg | ₹134.40 |
| 56 | 52 | **60** | 14.17 → 18.87 kg | **₹376.00** |
| 63 | 52 | **70** | 14.17 → 25.68 kg | **₹920.80** |
| 70 | 52 | **75** | 14.17 → 29.48 kg | **₹1,224.80** |
| 80 | 52 | **85** | 14.17 → 37.86 kg | **₹1,895.20** |
| 90 | 52 | **95** | 14.17 → 47.30 kg | **₹2,650.40** |
| 100 | 52 | **105** | 14.17 → 57.78 kg | **₹3,488.80** |

(Bold rows are geometrically impossible today — raw stock smaller than
the finished rod. Figures are larger than the ones in
`WORKED_EXAMPLE.md`, which assumed a bare +4 mm allowance rather than
rounding up to the next 5 mm bar size.)

Rough turning also stops clamping to `srF = 1.00`, so the severity
multiplier applies as designed.

**Judgement call for you:** `+4 mm rounded up to the next 5 mm` is my
assumption about HISPL's bar stock, not a fact. It belongs in
ASSUMPTIONS.md and should be confirmed with Aniktha. The alternative is
to warn without auto-correcting — but that reintroduces the silent-wrong-
number problem the tube guard was written to kill.

---

# PATCH 3 — the test that stops tomorrow's bug

Append to `tests/formulas.js`. Requires restructuring the tail of the
file into an async IIFE because jsdom boot is asynchronous; the pure-maths
section above stays dependency-free and runs unchanged when jsdom is absent.

```js
/* ═══ 8. CROSS-SURFACE AGREEMENT ═══════════════════════════════════
   Summary, Quotation and PDF must report the same money to the rupee.
   This is the assertion that would have caught the Rs 4,200 PDF drift
   the day it was introduced. */
let JSDOM, VirtualConsole;
try { ({ JSDOM, VirtualConsole } = require('jsdom')); } catch (e) {}

const finish = () => {
  console.log('\n═══════════════════════════════════');
  console.log('  ' + pass + ' correct, ' + fail + ' wrong, ' + defects + ' known defects');
  console.log('═══════════════════════════════════');
  if (defects) console.log('  See docs/WORKED_EXAMPLE.md for the full write-up.\n');
  process.exit(fail ? 1 : 0);
};

if (!JSDOM) { console.log('\n  (jsdom absent — cross-surface checks skipped)'); finish(); }
else (async () => {
  const fs = require('fs'), path = require('path');
  const ROOT = path.join(__dirname, '..');
  let html = fs.readFileSync(ROOT + '/products/costing/index.html', 'utf8');
  html = html.replace(/<script src="(\.\.\/\.\.\/assets\/js\/[a-z]+\.js)[^"]*"><\/script>/g,
    (m, p) => '<script>' + fs.readFileSync(path.join(ROOT, 'products/costing', p), 'utf8') + '</script>');
  html = html.replace(/<script src="https:\/\/[^"]*"><\/script>/g, '');

  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(), url: 'http://127.0.0.1:5500/products/costing/index.html' });
  const w = dom.window;
  w.Chart = function () { return { destroy() {}, update() {} }; };
  w.__pdf = {};
  w.jspdf = { jsPDF: function () { return {
    setFillColor(){},rect(){},setTextColor(){},setFont(){},setFontSize(){},text(){},
    setDrawColor(){},save(){},
    autoTable(o){ w.__pdf.body = o.body; w.__pdf.foot = o.foot; },
    lastAutoTable: { finalY: 200 }, internal: { pageSize: {} }
  };}};

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const money = s => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
  const d = w.document;
  const setv = (id, v) => { const e = d.getElementById(id); if (e) { e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); } };
  const txt = id => { const e = d.getElementById(id); return e ? (e.textContent || e.value) : ''; };

  w.bootERP({ name: 'Test', avatar: 'T', color: '#059669' });
  await wait(400);
  setv('inq-bore', 100); setv('inq-rod', 56); setv('inq-stroke', 500); setv('inq-qty', 10);
  w.propagate(); await wait(150); w.calcAll(); await wait(150);

  const readSurfaces = async () => {
    w.buildQuote(); await wait(80);
    w.__pdf = {}; w.generatePDF(); await wait(120);
    const q = d.getElementById('q-rows').textContent;
    const grab = (re, s) => { const m = s.match(re); return m ? money(m[1]) : null; };
    const footCell = label => {
      const row = (w.__pdf.foot || []).find(r => String(r[0]).indexOf(label) >= 0);
      return row ? money(row[3]) : null;
    };
    return {
      summary: { mfg: money(txt('ss-mfg')), pa: money(txt('km-mg')), sp: money(txt('km-sp')), ov: money(txt('km-ov')) },
      quote:   { mfg: grab(/Total Manufacturing Cost \(per piece\)\s*₹([\d,]+)/, q),
                 pa:  grab(/Profit Margin \(\d+%\)\s*₹([\d,]+)/, q),
                 sp:  grab(/Selling Price per Piece\s*₹([\d,]+)/, q),
                 ov:  grab(/Total Order Value \(\d+ nos\)\s*₹([\d,]+)/, q) },
      pdf:     { mfg: footCell('Total Manufacturing'), pa: footCell('Profit Margin'),
                 sp:  footCell('Selling Price'),       ov: footCell('Total Order Value') }
    };
  };

  const agree = (label, s) => {
    ['mfg', 'pa', 'sp', 'ov'].forEach(k => {
      ok(label + ' — Summary vs Quotation ' + k, s.quote[k], s.summary[k], 0.5);
      ok(label + ' — Summary vs PDF ' + k,       s.pdf[k],   s.summary[k], 0.5);
    });
  };

  console.log('\n━━━ Cross-surface agreement ━━━\n');
  console.log('  -- margin 20% --');
  agree('20%', await readSurfaces());

  console.log('  -- margin 0% (must not silently become 20%) --');
  setv('profit-pct', 0); w.calcSummary(); await wait(150);
  const zero = await readSurfaces();
  agree('0%', zero);
  ok('0% margin really is zero', zero.summary.pa, 0, 0.5);
  ok('0% selling price equals manufacturing cost', zero.summary.sp, zero.summary.mfg, 0.5);

  /* The PDF must never quote below cost. */
  ok('PDF selling price >= manufacturing cost',
     zero.pdf.sp >= zero.summary.mfg ? 1 : 0, 1);

  finish();
})();
```

**Against today's code these fail** — that is the point. They pass only
once Patch 1 lands. Expected failures before Patch 1:

```
✗ 20% — Summary vs PDF mfg   expected 17589, got 13389
✗ 0%  — Summary vs Quotation pa   expected 0, got 3518
✗ 0%  — Summary vs PDF sp    expected 17589, got 16067
✗ PDF selling price >= manufacturing cost   expected 1, got 0
```

---

# Minor issues — customer-facing or internal?

| # | Issue | Reaches a customer document? | Money |
|---|---|---|---|
| 4b | Printed column sums to ₹17,588, total prints ₹17,589 | **Yes** — Summary panel and the quotation table | ₹1 |
| 5b | Order value vs selling price × qty | **Yes** — quotation and PDF footer | ₹4 at qty 10 |
| 7 | Rounded mass drives material cost | **Yes** — tube and rod material lines | ₹0.20 |
| 6 | Honing hours displayed but not costed | No — Tube routing sheet only | ₹0 |
| — | `TF` table never referenced | No — invisible | ₹0 |
| 4 | `hwt(od, 0, l)` = 0 for a solid bar | No — needs ID = 0 entered by hand | edge case |
| 5 | Negative length yields negative mass | No — needs a negative entered by hand | edge case |

**The three customer-facing ones are all rounding artefacts**, worth at
most ₹5 on a ₹2.1 lakh order. They are cosmetic-but-visible: an
estimator who adds the column by hand will find the ₹1 and lose
confidence in everything else on the sheet. Fixing them means deciding
whether to round once at the end or round every line and sum the
rounded values — a presentation decision, not an engineering one, and
I would not touch it without your call.

**Honing is not costing you money** (see the analysis above) but the
0.9 hr display is misleading on an internal sheet. Cheapest honest fix
is to relabel it or remove the `TD` lookup and the `TF` table together.
