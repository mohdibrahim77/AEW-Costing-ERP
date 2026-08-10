# Changelog

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
