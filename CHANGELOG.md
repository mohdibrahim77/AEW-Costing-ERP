# Changelog

## 2026.08.14 — Costing audit: three surfaces, one number

The first audit of whether the calculations are **correct**, not merely
whether they run. Every formula was transcribed, hand-checked against
first principles and traced through one complete costing. The
arithmetic was sound; three defects around it were not.

### Freeze exception

`products/costing/index.html` — the frozen `BEAR_TYPES` block was
modified. Business-logic hash `304a7d3070ebe34f72706af4d60c23a1` →
`afb92d49a6c7315589835c2402781b9a`. Rationale in CLAUDE.md under rule 1.

**Fixed**

- **The exported PDF understated manufacturing cost by 23.9 %.**
  `generatePDF` built its own total and omitted every machined
  component — CEC, HEC, gland, cushion bush, stop tube, rear eye, rod
  eye, piston. On the reference job it printed ₹13,389 where the screen
  printed ₹17,589. The PDF now also carries a "Machined Components"
  row, because a printed table that does not sum to its own footer is
  worse than a longer one.
- **A 0 % margin became 20 % on the quotation and the PDF.** The
  bootstrap's `enforceZeroMargin()` patched only the Summary panel;
  `buildQuote` and `generatePDF` each re-read `gv('profit-pct') || 20`.
  Combined with the defect above, a 0 %-margin PDF quoted **₹1,522
  below cost per cylinder** on a document that looked correct.
- **A 56 mm rod was costed from 52 mm bar.** `propagate()` set the
  finished rod diameter from the enquiry and never touched the raw bar,
  which shipped at 52 mm. Any rod above that was machined from stock
  smaller than the finished part — impossible, and unlike the tube bug
  nothing collapsed to zero, so the number stayed plausible. Material
  was understated by up to ₹3,489 at Ø100.
- **Printed columns did not sum to printed totals.** Lines were shown
  to whole rupees but summed at two decimals, so the Summary column
  added up to ₹1 less than its own total. Every line is now rounded
  before summing, across all three surfaces. The ₹4 order-value drift
  and the ₹0.20 material-cost rounding go with it.

**Changed**

- One function computes the manufacturing total. `coverTot`,
  `componentSub`, `mfgTotal`, `marginPct` and `commercials` were added
  to the frozen block; `calcSummary`, `buildQuote` and `generatePDF`
  now call `commercials()` and compute nothing themselves.
- `enforceZeroMargin()` and `watchMargin()` **deleted** from the
  bootstrap. They were a second authority on the same number and
  recomputed from the rounded `ss-mfg` text, which would have
  re-broken the agreement by a rupee.
- Reference job Ø100 × Ø56 × 500: manufacturing cost ₹17,589 → **₹18,092**.
  ₹503 of that is the rod stock correction; the rest is rounding.

**Added**

- `tests/formulas.js` — 88 assertions that the numbers are *right*,
  each carrying its hand calculation. Includes cross-surface checks
  that fail if Summary, Quotation and PDF disagree by even ₹1, and
  that every printed column sums to its own printed total.
- `autoFixRodDia()` — raises raw bar above the finished rod with a
  visible notice, mirroring `autoFixTubeOD()`.
- `docs/FORMULAS.md` — every formula, unit, constant and source line.
- `docs/WORKED_EXAMPLE.md` — one costing traced by hand against the ERP.
- `docs/ASSUMPTIONS.md` — every unverified number with a 20 %-error
  sensitivity, ranked.
- `docs/PATCHES-PROPOSED.md` — the patch as reviewed before applying.

## 2026.07.31-2 — Prototype ready for customer demonstration

**Fixed**
- 0 % margin silently applied 20 %. `gv('profit-pct') || 20` evaluates to 20
  when the value is 0, because `0` is falsy in JavaScript. Quoting a job at
  cost is a legitimate decision and is now honoured.
- The master "Default Lab ₹/hr" field was read by nothing. It sat under the
  heading "UPDATES ALL SHEETS INSTANTLY" while all 18 per-operation labour
  rates stayed hardcoded at 100. It is now wired; rows the estimator has set
  individually are preserved.

**Added**
- Field legend distinguishing calculated (read-only) from auto-filled
  (editable) fields, which previously looked identical.
- `tests/demo.js` — adversarial input: zero, negative, text, extreme values,
  rapid input, margin edge cases.
- `tests/scenario.js` — the full customer demonstration flow, end to end.
- `tests/run-all.sh` — single-command test runner.

## 2026.07.30-8 — Live Server injection

**Fixed**
- VS Code Live Server injects its reload client at the first `</body>` in the
  served HTML. The ERP contained that exact text inside a JavaScript string in
  `printQuote()`, so the injection broke the string literal and the entire ERP
  script block failed to parse. Every function was undefined while the page
  still rendered, which made it look like a calculation bug. Fixed with an
  identity escape (`'<\/body>'`), which produces a byte-identical runtime
  string.

**Added**
- `tests/liveserver.js` — simulates the injection on every page.

## 2026.07.30-6 — Invalid geometry

**Fixed**
- Raw OD shipped at 75 mm. Any bore above that made ID > OD, so the weight
  formula `(π/4)(OD²−ID²)` went negative, was clamped to zero, and every
  downstream cost silently became ₹0. Bores 80, 100, 125, 160 and 200 — all
  standard sizes — were affected. The OD now derives from the bore using
  standard wall thicknesses, with a visible warning and a one-click fix when
  an impossible combination is entered by hand.

**Added**
- `tests/bores.js` — all nine standard bore sizes plus the geometry guard.

## 2026.07.30-3 — Zero values

**Fixed**
- Every manual-entry cost field shipped at zero, so a fresh session showed
  ₹0 until eight components were typed in by hand. An editable rate card now
  seeds opening values without ever overwriting user input.

## 2026.07.30-1 — Authentication

**Fixed**
- The Sign In button called `signIn()` while the page script defined only
  `doSignIn()`. It silently did nothing.
- Redirect loop between login and dashboard, caused by a dead session in
  storage and a race between the sign-out listener and the logout call.
- Logout could strand the user when the network call failed.

**Added**
- `tests/handlers.js` — verifies every inline event handler is bound.
