# Engineering Handoff — HISPL Costing v2

**For Claude Code.** Operational instructions, in order. Stop and report
at every gate. Do not run ahead.

**Read first:** `CLAUDE.md`, `hispl-v2/SPECIFICATION.md`,
`hispl-v2/REQUIREMENT_MATRIX.md`.

---

## A. Objective

HISPL has supplied authoritative master data and a target architecture.
The costing tool must move from a ~157-field manual form to an
**11-input, master-driven calculation pipeline**.

Validation against 295 real FY 25-26 quotations shows the current tool is
**~2.8× low** — Rs 18,092 against an actual median of Rs 50,900 for
comparable cylinders. The cause is architectural, not arithmetic: the tool
weighs only tube and rod (43 kg) where HISPL's actual comparable weight is
131 kg. Every machined component is carried as a flat typed-in price.

**This is a staged migration, not a rewrite.** The formulas are correct.
The master data and the component architecture are what change.

---

## B. Environment — already audited and verified

**The capability audit is complete.** Do not repeat it. Confirm nothing
has drifted, then proceed.

### Verified working

| Capability | Status |
|---|---|
| Node.js v22.23.2 · npm v10.9.8 · Git v2.54.0 | verified |
| jsdom + existing test harness (17 suites, ~388 assertions) | verified |
| **Playwright CLI 0.1.18, Chromium 151** | **fully verified** — real headless launch, local project navigation, live DOM inspection, in-page JS execution |
| **Supabase MCP** | **authenticated and operational** — read-only requests succeeded |

### Not available — plan around these

| Missing | Consequence |
|---|---|
| **Python / python3** | The validation harness **must be Node**, not Python. The `ui-ux-pro-max` skill's `search.py` will not run — read its CSV databases directly instead. |
| **GitHub CLI (`gh`)** | Use plain `git` for commits and pushes. Do not script `gh repo create`. |

Neither is a blocker. Do not install them for this work.

### Supabase — operational, but the app project is not visible

MCP authenticates and works. However the authenticated account has **no
visible access** to `qqtctmrdawjcwnqszplx`, the project this application
uses.

**This does not block Stages 1–5.** The repository uses Supabase for
authentication and session handling only — no `.from()` data queries, no
migrations, no schema files, no costing persistence. Backend persistence
is deliberately deferred.

**Therefore:** do not create substitute projects, tables or migrations,
and do not change Supabase configuration. Report the visibility gap as a
known limitation and continue.

### Deferred by decision

**CodeRabbit** — future GitHub PR review workflow. Do not install WSL or
Linux for it. **Manus** — only if a specific task demonstrates a clear
advantage.

---

## B5. Available Tools and Required Usage

Mapped against the **verified** inventory. Each entry has a reason.
The *none* entries matter as much as the rest — do not use a tool because
it is installed.

| Stage | Capability | Purpose |
|---|---|---|
| C · repository discovery | **Native Read / Grep / Glob** | Understand architecture before editing. No plugin needed. |
| C · design context | **`design-system`**, **`design`** skills | Learn the existing visual system before any UI stage. Read the SKILL.md first. |
| E1 · master data | *none* | Transcription from `hispl-masters.json`. A tool adds nothing. |
| E2 · validation harness | **Existing Node/jsdom harness** | 17 suites already exist. Extend them — do not build new test infrastructure. **Node, not Python.** |
| E3 · component sheets | *none for logic* | Calculation work. No UI, so no UI tooling. |
| E3 · after landing | **`code-review`**, **`simplify`** | Once the component architecture exists, review it before building on top. |
| E4 · mounting activation | **Existing harness** | Assert inactive components cost exactly zero. |
| E5 · input-reduction UI | **`ui-ux-pro-max`**, **`ui-styling`**, **`web-design-guidelines`** | Reducing 157 fields to 11 is a UX problem before it is a code problem. Hierarchy, grouping, progressive disclosure. |
| E5 · UI patterns | **21st.dev**, **KokonutUI** — *patterns only* | Form layout and derived-field patterns. See the caveat below. |
| E6 · browser verification | **Playwright** (verified) + **`playwright-cli`** skill | The eight workflows below. Read the skill before writing specs. |
| Any stage · library behaviour | **Context7** | Version-specific behaviour of **jsPDF, jsPDF AutoTable, Chart.js, Supabase APIs**, or browser compatibility. **Not** for anything the repository, source, HISPL documents or existing tests already answer deterministically. |
| Deferred | **Supabase MCP** | Only when real database work begins. Not Stages 1–5. |
| When touched | **`security-review`** | Whenever authentication, credentials, external services or sensitive configuration are modified. Also for the backend deployment and SEC-1. Not for costing logic. |
| Deferred | **CodeRabbit** | Post-implementation, via GitHub PR. |

### Tools that are installed but wrong for this work

Say so plainly rather than finding a use for them.

**Motion (`motion-dev-animations`)** — expects a framework runtime. This
is static vanilla JS. **Do not introduce it.**

**Anime.js** — permitted only for *meaningful state feedback*: a total
visibly transitioning when it recalculates, or a field changing state
when it becomes `ENGINEERING INPUT REQUIRED`. That communicates something.

Not for decoration. An estimator entering numbers for forty minutes
experiences animation as delay. Prefer existing CSS transitions where
they suffice — which is nearly always. The landing page already has
hand-rolled animation that passes its suite; do not replace it.

**Bklit UI / `dataviz`** — the Cost Summary already has Chart.js doughnut
and bar charts. Do not add visualisation because charting is available.
Only if a genuine new business need appears.

**`image-to-code`, `slides`, `banner-design`, `brand`** — no task here
calls for them.

### 21st.dev and KokonutUI — read before using

Both emit **React + TypeScript + Tailwind + shadcn/ui**. This project is
**vanilla JavaScript, no build step, no npm dependency, no framework**,
deployed static to Cloudflare Pages.

**Nothing they generate can be pasted in.** Use them as pattern
intelligence, then reimplement in vanilla CSS and JS.

> *"Search 21st.dev for compact data-entry forms with derived read-only
> fields. Show me the layout and interaction approach — then implement in
> vanilla JS matching this repository's existing design system. No React,
> no Tailwind."*

Before introducing any pattern, inspect what exists: the `.fi` / `.fi-a`
field classes, the panel structure, the three-state field legend
(calculated · auto-filled · your entry), and the existing colour tokens.
**Never migrate the project to another framework to accommodate a tool's
output format.**

### Playwright — the specific workflows

Verified and ready. Read the `playwright-cli` skill first, then write
these. Not a generic smoke test.

1. Open the costing tool authenticated; assert the ERP boots and the
   overlay is removed from the DOM.
2. Enter **only** the permitted inputs; assert no other field is editable
   at that stage.
3. Assert master lookups resolve — material rate, machine rate, turning
   rate card band.
4. Assert derived geometry cascades when bore, rod or stroke changes.
5. Enter a bore with no geometry standard; assert
   `ENGINEERING INPUT REQUIRED` appears and **no guessed number does**.
6. Select a mounting type; assert excluded components contribute exactly
   zero.
7. Export the PDF; assert its manufacturing total equals the on-screen
   total to within Rs 0.50.
8. Regression: sign-in, sign-out and tab navigation still work.

**Never report browser verification complete unless Playwright actually
ran and passed.** A page that renders is not a page that works — that
distinction cost this project several days on the Live Server bug.

**Claude-in-Chrome** is available but has dropped repeatedly in this
project's history. Playwright is the deterministic choice. Use
Claude-in-Chrome only for one-off manual inspection.

---

## B5b. Source-of-truth priority

When requirements conflict or are ambiguous, resolve in this order.
Never skip a level to reach a more convenient answer.

| # | Source |
|---|---|
| 1 | Aniktha's explicit instructions |
| 2 | HISPL requirements document |
| 3 | HISPL approved master data (`hispl-masters.json`, the workbook) |
| 4 | Explicitly approved engineering standards and formulas |
| 5 | Existing validated project architecture |
| 6 | Historical data — **as validation evidence only** |

### The 295 historical cylinders are a TEST SET, not a TRAINING SET

This distinction is load-bearing.

**Permitted:** validate calculations · compare predicted against actual ·
identify systematic under- or over-estimation · detect missing cost
components · build regression cases · find outliers.

**Forbidden:** deriving an engineering rule, rate, allowance or geometry
standard from them. A pattern visible across 295 rows is **evidence to
show Aniktha**, never a rule to implement.

Historical entries must not become master data or engineering standards
under any circumstance, however strong the correlation looks.

---

## B5c. The five value states — a UI requirement, not just a data model

Every number on screen belongs to exactly one of these, and a user must
be able to tell which **at a glance, without reading documentation**:

| # | State | The user should understand |
|---|---|---|
| 1 | **User input** | "I have to enter this" |
| 2 | **Master-data value** | "The system selected this from approved data" |
| 3 | **Automatically derived** | "This followed from what I entered" |
| 4 | **Calculated** | "This was computed; it is read-only" |
| 5 | **ENGINEERING INPUT REQUIRED** | "This cannot be calculated — engineering data is missing" |

State 5 must be **visually unmistakable** and must never resemble a zero,
a blank, or a placeholder. A missing dimension that looks like `0` is more
dangerous than one that looks broken.

The existing three-state legend (calculated · auto-filled · your entry)
is the starting point. It needs extending to five — and a **manual
override** of a customer drawing dimension must remain distinguishable
from an automatically derived value, since the override wins without
altering the master.

Use `ui-ux-pro-max`, `ui-styling` and `web-design-guidelines` for this.
**Do not create a second, disconnected design system** — extend the
existing `.fi` / `.fi-a` conventions.

---

## B6. Scope of "unblocked" — read before planning any stage

**"Unblocked" does not mean accurate final costing is unblocked.**

### Unblocked — proceed

- Master-data integration (Stage 1)
- Centralising HISPL rates, material properties and rate cards
- Node/jsdom validation harness (Stage 2)
- Component-sheet **architecture** (Stage 3)
- Formula implementation **where every required input is explicitly
  supplied**
- UI restructuring and limited-input preparation

### Blocked — surface, do not solve

- Automatic component geometry
- Any calculation depending on a missing engineering dimension
- Welding cost, until the approved formula is identified
- Any overhead or uplift treatment

### Value classification — must be preserved end to end

Every number in the system carries a provenance, and the UI must be able
to distinguish them. Do not collapse these into "a value".

| Class | Meaning |
|---|---|
| **Approved master data** | From `hispl-masters.json`. Authoritative. |
| **Approved engineering formula** | Validated calculation from the workbook. |
| **Manual override** | Customer drawing dimension entered by the estimator. **Wins over the standard, without altering the master.** |
| **Derived** | Computed from approved inputs by an approved formula. |
| **ENGINEERING INPUT REQUIRED** | Missing. **Never** a fallback, an estimate, or a silent zero. |

### The geometry scope limit

The specification suggests requesting four standard bores (80, 100, 125,
160) as a tractable first ask. **That is a request strategy, not
permission to generalise.**

If HISPL supplies values for those four bores:

- Implement **exactly those four mappings**.
- Do **not** interpolate to 90 or 110.
- Do **not** extrapolate beyond the range.
- Do **not** fit a curve, ratio or scaling rule across them.
- Every other bore surfaces `ENGINEERING INPUT REQUIRED`.

A derivation rule for unapproved sizes requires Aniktha's **explicit
written approval**. Until then, only HISPL-approved geometry standards may
populate automatic geometry masters.

### The 42% uplift — do not implement

The 42.3% median gap between (material + process) and TOTAL across 295
historical cylinders is a **finding**, not a rule. It may be overhead,
margin, missing cost components, or a mixture.

**Do not apply it, in any form, anywhere.** Not as a default, not as a
configurable with that default, not commented out ready to enable. It
stays an open business question until Aniktha classifies it.

### Welding — do not choose

The workbook formula and the Rs 14 per inch per bead instruction conflict.
**Do not select one.** Do not average them. Do not implement one behind a
flag. Identify which is currently approved, or report the blocker and
leave welding cost unimplemented.

---

## B7. Pre-implementation report — mandatory gate

**Before modifying any application code**, produce and stop for review:

**A.** The exact handoff file and version being followed —
path, and confirmation the content matches what you were given.

**B.** The complete list of unblocked tasks, as you understand them.

**C.** The complete list of blocked tasks, each with the specific missing
decision or data.

**D.** A dependency map: for each missing engineering decision, which
calculations and outputs depend on it. Show the blast radius — for
example, *"welding formula → CEC weld, rear eye weld, part weld → tube
total → manufacturing cost → selling price → order value."*

**E.** Explicit written confirmation that you will introduce **none** of
the following:

- interpolated or extrapolated geometry
- guessed engineering dimensions
- a chosen welding formula
- an applied uplift or overhead percentage
- a silent fallback or default in place of missing master data

**Then stop.** Do not begin the first code modification until this report
is reviewed and approved.

---

## C. Repository discovery — inspect before editing

Report findings before changing anything.

1. **`CLAUDE.md`** — the five rules. Rule 1 (frozen ERP) governs
   everything below.
2. **`products/costing/index.html`** — three inline blocks. Identify by
   content, never by position:
   - the block containing `BEAR_TYPES` — **frozen calculation logic**
   - the block containing `ERP_RATE_CARD` — bootstrap, freely editable
3. **`assets/js/`** — eight modules, acyclic dependency graph. Note the
   loading order and the `window.AEW` namespace convention.
4. **`tests/`** — 20 suites, `run-all.sh`. Note `integrity.js` (hash
   guard) and `formulas.js` (92 correctness assertions).
5. **`aew-backend/`** — FastAPI, built, not deployed. `core/db.py`
   explains the RLS model.
6. **`hispl-v2/hispl-masters.json`** — HISPL's authoritative data.
7. **`hispl-v2/historical-cylinders.csv`** — 295-row validation set.

**Reality check on architecture.** This is vanilla JavaScript, no build
step, no framework, no bundler, deployed static to Cloudflare Pages. Do
not introduce React, npm dependencies, or a build step. The "service
layer" below means **plain JS modules under `assets/js/`**, following the
existing IIFE + `window.AEW` pattern.

---

## D. Target architecture

### D1 — Where things live

```
assets/js/costing/
  masters.js     loads hispl-masters.json — THE single source of rates
  geometry.js    derives dimensions from bore/rod/stroke
                 returns ENGINEERING_INPUT_REQUIRED where unknown
  engine.js      the calculation pipeline
  components.js  per-component definitions (material + process routing)
```

Calculation logic must **not** live in UI code. The UI reads inputs, calls
the engine, renders outputs.

### D2 — The layered pipeline

```
INPUT LAYER                only the approved inputs
      ↓
INPUT VALIDATION           ranges, types, rod < bore
      ↓
MASTER DATA RESOLUTION     rates, densities, rate cards
      ↓
GEOMETRY / STANDARD        approved mappings only;
RESOLUTION                 otherwise ENGINEERING INPUT REQUIRED
      ↓
CALCULATION ENGINE         approved formulas
      ↓
COMPONENT COST BREAKDOWN   per component, itemised
      ↓
TOTAL COST                 roll-up
      ↓
EXPORT / REPORTING         quotation, PDF
```

Business logic stays **out of UI event handlers**. The UI reads inputs,
calls the engine, renders the result.

### D2b — Traceability: "where did this number come from?"

Every calculated cost must be explainable by tracing:

```
user input → master lookup → formula → component calculation → total
```

A future developer, or Aniktha, must be able to answer that question for
any figure on screen. This is not a nice-to-have — it is what makes the
tool defensible to an estimator who has been quoting cylinders for thirty
years.

The engine's return value must therefore carry the breakdown, not just
the totals. Each line should record which master record and which formula
produced it.

### D3 — The frozen block

`CLAUDE.md` rule 1 freezes the `BEAR_TYPES` block. HISPL has now supplied
authoritative masters, and her own rule states:

> *"Do not overwrite validated costing formulas while adding geometry
> automation."*

**Resolution:** the *formulas* stay. The *data* is replaced. The
*architecture* extends alongside.

Do not edit the frozen block to change rates. Instead, the new
`masters.js` becomes the source and the engine reads from it. Where the
frozen block must be superseded, propose it explicitly with reasoning,
get approval, then record the exception in `CLAUDE.md` and re-lock the
integrity hash — the process already used for the PDF-total patch.

### D4 — Non-negotiable rules, from HISPL

1. Do not invent geometry. Mark `ENGINEERING INPUT REQUIRED`.
2. Manual override wins over the standard, **without changing the master**.
3. Master data centralised. **No rate hard-coded twice.**
4. Changing bore, tube OD, stroke or rod diameter **must cascade**.
5. Inactive mounting components contribute **exactly zero**.
6. Maintain Source, Basis and Confidence on geometry records.
7. The output must carry HISPL's disclaimer: not a structural design
   approval unless separately checked by HISPL engineering.

---

## E0. Required workflow for every stage

Apply this to each stage in E. A stage is not complete until step 11 is
reported.

```
 1  Read the relevant skill instructions before using a skill
 2  Inspect existing code before modifying it
 3  Identify which installed tools are relevant to THIS stage
 4  Use the ones that provide genuine value
 5  Implement inside the existing architecture unless a change is justified
 6  Add or update deterministic Node/jsdom tests
 7  Run the relevant tests
 8  Run code-review and simplify before declaring the stage done
 9  Run Playwright for anything user-facing
10  Inspect the resulting UI and its states
11  Report — see below
```

### The stage report

| Item | Detail |
|---|---|
| Files changed | full list |
| Tools and skills **used** | which, and why |
| Tools **considered and rejected** | which, and why not — this matters as much |
| Tests run | suite names and results |
| Browser workflows verified | which Playwright specs actually ran and passed |
| Known limitations | what is incomplete or approximate |
| Blocked requirements | named engineering or business decisions still outstanding |

**Do not declare a stage complete on successful code generation or a
clean syntax check.** That distinction has already cost this project
several days.

Before beginning each gate, state which capabilities are relevant and how
they will be used.

---

## E. Implementation — staged, with gates

### ── STAGE 1 — Master data ──

**Blocked by:** nothing. Start here.

Build `assets/js/costing/masters.js` from `hispl-masters.json`:

- 9 material grades **with per-grade density** — SS-410 is 7.7, bronze
  is 8.9. The current tool hard-codes 7.85 everywhere. This is a defect.
- 7 machine rates
- Turning Rate Card — overrides the flat rate for rough and finish
  turning, by finished diameter
- Honing Rate Card — `area(cm²) × 0.30`, or `× 0.40` if stroke > 4000
  **or** ID > 100
- Boring, milling and profile-cutting time tables (all new)
- Process rate master

**Validation:** every rate reachable through one accessor. Grep the
codebase — no rate literal may appear outside `masters.js`.

**Report:** how many hard-coded rates were replaced, and where any remain.

### ── STAGE 2 — Validation harness ──

**Blocked by:** Stage 1.

Build `tests/validate-historical.js` — **Node, not Python** (Python is
not installed). Extend the existing jsdom harness; do not create new test
infrastructure. Run all 295 rows of `historical-cylinders.csv` through the
engine and report:

- median absolute error, overall and by bore band
- predicted vs actual weight, material cost, process cost
- the ten worst outliers with their inputs
- cost per kg against these targets:

| Bore | Target total Rs/kg |
|---|---|
| < 60 | 1,003 |
| 60–110 | 522 |
| 110–180 | 352 |
| > 180 | 318 |

**This is the most valuable artefact in the project.** It converts "I
think it's right" into "it matches your last 295 quotations to within X%".

**Gate: report the error figures before proceeding.** They tell us how
much of the 2.8× the rates alone account for, and how much is the missing
component mass.

### ── STAGE 3 — Component sheets ──

**Blocked by:** Stage 2 numbers.

Convert the eight flat-price components to the HISPL pattern:

```
SECTION A  material   geometry → weight → cost   (zero if reused)
SECTION B  process    Apply? | Process | Machine | Hours | Rate | Cost
SECTION D  additional manual entry + remarks
```

Components: Cap End Cover · Head End Cover · Gland · Cushion Bush ·
Stop Tube · Rear Eye · Rod Eye · Piston. Then Flange and Trunnion.

Dimensions remain **manual entry with an `ENGINEERING INPUT REQUIRED`
marker** until HISPL supplies standards. Do not guess a cap end cover OD.

**This is what closes most of the 2.8× gap.**

**Validation:** re-run Stage 2. Error should fall substantially.

### ── STAGE 4 — Mounting activation ──

**Blocked by:** confirmation of mounting codes.

Map each code to its active component set. Inactive contributes exactly
zero — assert this in a test.

### ── STAGE 5 — Reduce to 11 inputs ──

**Blocked by:** geometry masters from HISPL.

Only once geometry is populated. Until then the 11 inputs cascade as far
as they can and the rest surfaces as `ENGINEERING INPUT REQUIRED`.

### ── STAGE 6 — Browser verification ──

**Blocked by:** Playwright confirmed operational in B1.

End-to-end: enter the 11 inputs, assert derived geometry, assert the
roll-up, export the PDF, assert the PDF total equals the screen total.
Regression: the existing 20 suites must still pass.

---

## F. Testing plan

| Layer | What |
|---|---|
| Static | every module parses; `integrity.js` reports ERP INTACT |
| Calculation | `formulas.js` 92 assertions still pass |
| Accuracy | `validate-historical.js` — 295 rows, error by bore band |
| Edge cases | bore 0, negative, rod ≥ bore, stroke > 20000, missing grade |
| Missing master | absent geometry surfaces `ENGINEERING INPUT REQUIRED`, never a guess or a zero |
| Zero-contribution | inactive mounting components cost exactly 0 |
| Cross-surface | Summary, Quotation and PDF agree to within Rs 0.50 |
| Browser | Playwright, once verified |
| Regression | all 20 existing suites green |

---

## G. Completion criteria

A stage is complete when **all** of these hold:

1. Only approved inputs are exposed for that stage.
2. Every value derivable from masters is derived — no manual entry of a
   known value.
3. No rate literal exists outside `masters.js`.
4. Missing master data produces `ENGINEERING INPUT REQUIRED`, never a
   guessed value and never a silent zero.
5. Inactive components contribute exactly zero.
6. `validate-historical.js` error is reported and inside the target bands.
7. All existing suites still pass; `integrity.js` reports ERP INTACT.
8. Relevant browser workflow verified with Playwright.
9. Blockers are reported by name, not worked around.
10. No interpolated, extrapolated or guessed geometry exists anywhere.
11. No welding formula has been chosen.
12. No uplift or overhead percentage is applied, defaulted, or present
    behind a flag.
13. All five value states are visually distinguishable on screen, and
    `ENGINEERING INPUT REQUIRED` can never be mistaken for a zero.
14. Every figure is traceable: user input → master lookup → formula →
    component → total.
15. No engineering rule has been derived from the historical data.
16. The stage report is complete, including tools considered and rejected.

---

## H. Stop and report — do not guess

Halt and ask when you hit any of these:

| Blocker | Why it matters |
|---|---|
| **Welding formula** | workbook says `length ÷ 3600 × rates`; the reference document notes an approved instruction of **Rs 14 per inch per bead**. Materially different. Do not average, do not choose. |
| **Geometry standards** | no master exists. Do not derive a cap end cover OD from a bore. |
| **Overhead** | absent from the workbook, but historical TOTAL exceeds material + process by a median 42.3%. Do not invent a percentage. |
| **Mounting codes** | RE, CL, TR, MF, FF, LUG, DA, BC — presumed meanings only. |
| **Tube OD** | listed as an input in the geometry rules but absent from the 11 inquiry inputs. |
| **Allowances** | boring and OD turning allowances unknown. |

For each: state the blocker, what you would need, and what you have done
in the meantime. Then stop.

---

## I. Order of work

```
1  B      confirm nothing has drifted        → brief REPORT
2  B6/B7  scope + pre-implementation report  → STOP for approval  ← gate
3  C      repository discovery              → REPORT
4  E1     master data                       → REPORT rates replaced
5  E2     validation harness                → REPORT error figures  ← key gate
6  E3     component sheets                  → REPORT error improvement
7  E4     mounting activation               (needs codes confirmed)
8  E5     reduce to 11 inputs               (needs geometry masters)
9  E6     Playwright verification
```

**Stages 1 and 2 are unblocked and can start now.** Everything from 4
onward needs answers from HISPL.

Do not proceed past a gate without reporting.
