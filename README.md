# AEW Manufacturing Intelligence Platform

Software for Indian manufacturing SMEs. A single sign-on portal delivering
engineering tools that factories currently run on paper and spreadsheets.

**Status** Working prototype · **Build** 2026.07.31-2
**First customer** HISPL — Hydraulics India Services Pvt. Ltd., Peenya Industrial Area, Bangalore
**Live** https://aew-costing-erp.pages.dev

---

## The problem

A hydraulic cylinder manufacturer receives an enquiry:

> *"Quote 10 double-acting cylinders, 100 mm bore × 56 mm rod × 500 mm stroke, 210 bar."*

Producing that quotation today takes an experienced estimator **2 to 4 hours**
with a calculator and a spreadsheet: raw material mass from geometry, machining
time per operation from lookup tables, bearing and seal prices from supplier
catalogues, then assembly, testing, packing, freight and margin.

Three consequences follow. The knowledge lives in one person's head, so when
they are on leave, quoting stops. Two estimators quoting the same job produce
different numbers. And nobody can tell you afterwards which line item made a
job unprofitable.

## The solution

Enter three dimensions. Every downstream value computes automatically. A
costed, itemised PDF quotation in **under 30 seconds**, with identical
methodology every time, usable by any member of staff.

```
Enquiry received  ────────────────────────►  Quotation issued
   2–4 hours, one person who knows              30 seconds, anyone
```

---

## Modules

| Module | Purpose | Status |
|---|---|---|
| **Product Costing ERP** | Hydraulic cylinder costing and quotation | 🟢 **Working** |
| Carbon Tracking (CBAM) | CO₂ per tonne, EU CBAM compliance declarations | ⚪ Planned |
| Vibration AI | Photograph an FFT spectrum; AI identifies bearing faults before failure | ⚪ Planned |
| Asset Management | Per-machine QR codes, maintenance history, depreciation | ⚪ Planned |

Planned modules exist as real, session-protected pages. They make the roadmap
tangible in a sales conversation, and they prove that adding a module requires
no change to authentication or routing.

---

## What the Costing ERP does

### Nine panels

| # | Panel | Purpose |
|---|---|---|
| 1 | **Inquiry & Rates** | Customer, enquiry number, the three driving dimensions, 15 master rates |
| 2 | **Tube** | Material, dimensions, 8-operation machining route |
| 3 | **Piston Rod** | Material, dimensions, 8-operation machining route |
| 4 | **CEC/HEC/Gland** | Cap end cover, head end cover, gland, cushion bush, stop tube |
| 5 | **Misc** | Rear eye, rod eye, piston, fasteners |
| 6 | **Bill of Materials** | Bearings, seals and bought-out items with supplier pricing |
| 7 | **Assembly & Packing** | Assembly labour, testing, painting, packing, freight |
| 8 | **Cost Summary** | Full breakdown with distribution and comparison charts |
| 9 | **Quotation** | Formatted customer document, PDF export and print |

### Calculation

**Engineering** — hollow-section mass for the tube and solid-section mass for
the rod from geometry and density; surface area for painting; weld length and
consumable estimation.

**Machining time** — looked up per operation from calibrated tables (cutting,
turning, honing, grinding), applied across an 8-operation route for the tube
and an 8-operation route for the rod, each converted to cost at the machine's
hourly rate.

**Bought-out components** — 12 bearing types, 12 seal types, 7 seal materials,
5 cover types, 4 misc categories, all selectable.

**Commercial** — assembly, testing, painting, packing, transport, overhead and
margin, giving per-unit cost and total order value.

### Worked example

Bharat Forge Ltd — 10 cylinders, 100 × 56 × 500 mm, 210 bar:

| Line | Value |
|---|---|
| Tube — 24.28 kg | ₹5,620 |
| Piston rod — 14.17 kg | ₹4,716 |
| Bill of materials | ₹1,215 |
| CEC / HEC / Gland | ₹660 / ₹760 / ₹630 |
| Assembly · Packing · Transport | ₹400 · ₹192 · ₹450 |
| **Manufacturing cost per cylinder** | **₹17,589** |
| Margin @ 22% | ₹3,870 |
| Selling price per cylinder | ₹21,458 |
| **Order value (10 units)** | **₹2,14,584** |

Every figure in that table is reproduced by the test suite on each run, so the
arithmetic is verified rather than asserted.

---

## Reading the interface

Fields are colour-coded, with a legend above the tab bar.

| Appearance | Meaning |
|---|---|
| Green, **dashed** border | **Calculated.** Worked out from your entries. Read-only by design. |
| Green, **solid** border | **Auto-filled.** A starting point — type over it whenever you need to. |
| White | **Your entry.** Fill in from your own figures. |

Hovering any green field explains which kind it is.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  BROWSER                                                 │
│  HTML · CSS · Vanilla JavaScript      (no framework)     │
│  Chart.js 4.4.0             cost distribution charts     │
│  jsPDF 2.5.1 + AutoTable    quotation PDF                │
│  Supabase JS v2 (UMD)       identity client              │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼──────────────────────────────┐
│  SUPABASE          identity + PostgreSQL                 │
│  Auth · JWT · bcrypt · Row Level Security                │
└──────────────────────────────────────────────────────────┘

  Hosting  Cloudflare Pages (static, global CDN)
  Dev      VS Code Live Server — no build step
```

### Why no framework

React or Vue would require Node, npm, a bundler and a build step: every change
would need compiling before it could be tested, deployment would gain a failure
mode, and a future maintainer would need the whole toolchain installed. This
application has four pages and no complex client state.

The trade-off is more manual DOM work. At this size it is worth it for the
property that matters most: **open any file, change it, refresh the browser.**

### Infrastructure modules

Eight modules under `assets/js/`, each with one responsibility. Dependencies
point one way only — the graph is acyclic.

| Module | Owns | Depends on |
|---|---|---|
| `config.js` | Base URL discovery, all routes, constants | — |
| `supabase.js` | The single Supabase client | config |
| `session.js` | Auth state machine, the single auth listener | supabase |
| `router.js` | The single navigator, redirect-loop guards | config |
| `auth.js` | Auth policy — connects session to router | session, router |
| `ui.js` | DOM helpers | — |
| `api.js` | Backend seam (dormant until the API is deployed) | config |
| `common.js` | Formatting, debounce | — |

Enforced throughout: exactly **one** `createClient` call, **one** auth state
listener, **one** place that writes `window.location`, and **zero**
authentication code in any page file.

### Authentication has three states, not two

The single most important idea in this codebase.

| State | Meaning | May the app act on it? |
|---|---|---|
| `UNKNOWN` | Still determining | **No** |
| `AUTHENTICATED` | Session confirmed | Yes |
| `ANONYMOUS` | No session confirmed | Yes |

Treating `UNKNOWN` as `ANONYMOUS` causes redirect loops: a token refresh in
flight briefly looks like "no session". The app waits for Supabase's
`INITIAL_SESSION` event, which fires once, after any pending refresh settles,
carrying the definitive answer.

### Logout cannot fail

Four steps. Three are synchronous, so logout works even with no network.

```
1  Disarm the session listener        (synchronous)
2  Purge session data from storage    (synchronous)
3  Tell Supabase to revoke the token  ← fire-and-forget, NOT awaited
4  Navigate to login                  (synchronous)
```

Earlier versions awaited step 3. When it failed, the user was stranded.

### The frozen ERP

`products/costing/index.html` contains 326 lines of business logic —
engineering formulas, machining tables, costing methodology — validated by
HISPL. It is treated as **read-only**.

Its entire coupling to the platform is one line:

```js
function doLogout(){ AEW.auth.logout(); }
```

Everything else — field seeding, geometry validation, the master labour rate,
the field legend — lives in a separate bootstrap block. `tests/integrity.js`
verifies the frozen block by content hash on every run, so "the ERP was not
modified" is a proof, not a claim.

---

## Repository layout

```
aew-platform/
├── index.html                    Public landing page
├── login.html                    Authentication
├── dashboard.html                Module portal            [protected]
├── reset-password.html           Password reset
│
├── assets/js/                    Eight infrastructure modules
│
├── products/
│   ├── costing/index.html        Costing ERP  (frozen)    [protected]
│   ├── cbam/index.html           Placeholder              [protected]
│   ├── vibration/index.html      Placeholder              [protected]
│   └── asset/index.html          Placeholder              [protected]
│
├── tests/                        15 suites, 302 assertions
│   ├── run-all.sh                Run everything
│   └── package.json              jsdom — testing only
│
├── docs/
│   ├── 01-SRS.md                 Requirements specification
│   └── 02-Architecture.md        Architecture specification
│
├── README.md
└── SETUP_GUIDE.md                Supabase setup, step by step
```

---

## Running locally

Requires VS Code with the Live Server extension. Nothing else — no Node, no
npm, no build step.

```
1  Clone the repository
2  VS Code → File → Open Folder → select the aew-platform folder
       ↑ open THIS folder, not the folder containing it
3  Right-click login.html → "Open with Live Server"
4  Browser opens at http://127.0.0.1:5500/login.html
```

A small build stamp appears at the bottom of the login page. If it does not
match the current build, hard-refresh with **Ctrl+Shift+R** — the browser is
serving a cached copy.

---

## Testing

```bash
cd tests
npm install          # jsdom, for the suites that need a DOM
bash run-all.sh
```

```
integrity      ERP INTACT
liveserver     8 safe, 0 vulnerable
test           19 passed        routing        10 passed
handlers       25 bound         erp            17 passed
values         15 passed        tube           22 passed
verify          9 passed        bores          17 passed
inputs         33 passed        inquiry        54 passed
demo           20 passed        scenario       32 passed
full           0 blank or zero outputs across all 9 panels
```

The suites load the **real, unmodified** source files. Every one was written in
response to an actual defect:

| Suite | The bug it prevents returning |
|---|---|
| `liveserver` | Live Server injects its reload script at the first `</body>`. The ERP had that text inside a JS string, so the injection broke the string and the entire script block failed to parse — every function undefined, while the page still rendered. |
| `bores` | Raw OD ships at 75 mm. Any bore above that made ID > OD, the weight formula went negative, and every cost silently became zero. Bores 80, 100, 125, 160 and 200 were all affected. |
| `handlers` | The Sign In button called `signIn()` while the script defined only `doSignIn()`. It silently did nothing. |
| `erp` | `bootERP` ran eight calls with no error handling. One throw aborted the rest. |
| `inquiry` | "Default Lab ₹/hr" sat under "UPDATES ALL SHEETS INSTANTLY" but was read by nothing. |
| `demo` | 0 % margin silently became 20 %, because `0 \|\| 20` is `20` in JavaScript. |
| `values`, `tube`, `full` | Manual-entry fields shipped blank or at zero, so totals read ₹0. |
| `integrity` | Accidental modification of the frozen ERP. |

**Run the suite before every deployment.** It exits non-zero on failure.

---

## Deployment

Cloudflare Pages, connected to GitHub. Every push to `main` deploys.

```bash
git add .
git commit -m "description of change"
git push
```

No build command, no output directory — the repository root *is* the site.
Rollback is a one-click revert to any previous deployment.

For first-time Supabase configuration, see `SETUP_GUIDE.md`.

---

## Configuration

Costing rates live in one clearly-commented object, `ERP_RATE_CARD`, near the
bottom of `products/costing/index.html`:

```js
var ERP_RATE_CARD = {
  components: { cec: { mat: 180, proc: 360, lab: 120 }, ... },
  process:    { 'td-hd': 12, 'tpw-d': 6, ... },
  bearings:   [ ... ],  seals: [ ... ],  other: [ ... ],
  freight:    { 'trans-out': 250, ... }
};
```

> **The shipped figures are engineering-plausible placeholders, not HISPL's
> actual costs.** Replace them with real numbers from HISPL's costing sheets
> before quoting a live job. The formulas, material rates and machining rates
> are correct; only these opening values need confirming.

Console commands:

```js
AEW.erp.rateCard      // inspect or change any rate live
AEW.erp.clearRates()  // zero everything, quote from scratch
AEW.erp.reseed()      // restore the opening values
AEW.erp.diagnose()    // full ERP health report
```

---

## Known limitations

| Limitation | Impact |
|---|---|
| No data persistence | Quotations are not saved. Closing the tab loses the costing. A FastAPI backend exists but is not deployed. |
| Rate card is placeholder data | Must be replaced with HISPL's figures before live quoting. |
| Single tenant in practice | Multi-tenant isolation is designed but not yet enforced by database policies. |
| Role stored in `user_metadata` | Writable by the authenticated user. No impact today (no server-side data) but must move to `app_metadata` before persistence is added. Tracked as **SEC-1** in `docs/02-Architecture.md`. |
| Three of four dependencies are single points of failure | Supabase, jsDelivr and Cloudflare outages each take the application down. |
| Print output not visually verified | The PDF path is exercised programmatically; visual fidelity needs a manual check. |

---

## Roadmap

**Before the customer demonstration**
- Replace `ERP_RATE_CARD` with HISPL's actual costs
- Verify the PDF output visually against a real quotation
- Rehearse on the Cloudflare URL, with Live Server as fallback

**Next**
- Deploy the FastAPI backend so quotations persist
- Move `role` and `products` to `app_metadata` (SEC-1)
- Quotation history: reopen and revise a past costing
- Customer administration UI, replacing the Supabase dashboard

**Later**
- CBAM carbon tracking
- Vibration AI (Python, PyTorch, sharing the same database)
- Asset management with QR codes
- Mobile application via Capacitor, reusing the same API

---

## Documentation

| Document | Contents |
|---|---|
| `README.md` | This file |
| `SETUP_GUIDE.md` | Supabase account setup and user creation |
| `docs/01-SRS.md` | Requirements: functional, non-functional, roles, acceptance criteria |
| `docs/02-Architecture.md` | HLD, LLD, state machine, flow diagrams, database design |
| `tests/README.md` | Test suite reference |

---

## Licence

Proprietary. © 2026 AEW. All rights reserved.
