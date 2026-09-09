# HISPL Costing System v2 — Specification

**Source of truth:** `VERSION_1.xlsx` (supersedes `Trunion_Included.xlsx`,
2026-09-09) and
`HISPL_Costing_Master_Tables_Developer_Reference.docx`, supplied by
Aniktha Patirat, HISPL.

**Validation set:** `historical-cylinders.csv` — 295 real cylinders quoted
in FY 25-26.

**Master data:** `hispl-masters.json` — every rate, table and constant,
code-ready.

---

## 1. The finding that drives this rebuild

The current tool was validated for *arithmetic*. It has now been validated
for *accuracy* against 295 real quotations, and it is badly low.

| | |
|---|---|
| Current tool, 100 × 56 × 500 | **Rs 18,092** |
| HISPL actual, comparable cylinders (n=51, bore 90-110) | **Rs 50,900** median |
| HISPL actual, 100 × 56 × 600 | **Rs 51,350** |
| HISPL actual, 100 × 56 × 310 | **Rs 51,700** |

**The tool is roughly 2.8x low.**

### Why

Not the formulas — they are correct. The *architecture* is wrong.

The current tool computes material weight for the **tube and rod only**:
24.28 + 18.87 = **43 kg**. HISPL's own weight for a comparable 100 × 56 ×
600 cylinder is **131 kg**.

The missing 88 kg is the cap end cover, head end cover, gland, cushion
bush, stop tube, rear eye, rod eye, piston, trunnion and flange — all of
which the current tool treats as **flat typed-in prices** (Rs 660,
Rs 760, Rs 630 ...) rather than computing from geometry.

A cap end cover on a 100-bore cylinder is a 220 mm diameter, 60 mm thick
C45 forging. That is roughly 18 kg of steel plus turning, milling and
drilling. It is not Rs 660.

**This is exactly what Aniktha's requirements document addresses.**

### Cost per kg — a useful sanity check

| Bore band | n | Material | Process | **Total** |
|---|---|---|---|---|
| < 60 | 21 | 187 | 515 | **1,003** Rs/kg |
| 60-110 | 121 | 139 | 202 | **522** Rs/kg |
| 110-180 | 96 | 129 | 116 | **352** Rs/kg |
| > 180 | 57 | 134 | 85 | **318** Rs/kg |

Material cost per kg is stable at Rs 129-187 across all sizes — as you
would expect. Process cost per kg falls sharply with size, which is real
economies of scale: a 480-bore cylinder is not 6x the machining of an
80-bore one.

Any rebuild should land inside these bands. If it does not, something is
wrong.

### Weight is not derivable from bore and stroke alone

Correlation between weight and `bore² × stroke` is **0.675** — moderate,
not strong. Weight depends on which mounting components are fitted, which
is exactly why per-component geometry masters are needed rather than a
single scaling formula.

---

## 2. What Aniktha has asked for

### 2.1 Eleven inputs, and nothing else

| Input | Example |
|---|---|
| Inquiry No. | INQ-0001 |
| Inquiry Date | today |
| Customer Name | Sample Customer Pvt Ltd |
| Customer Location | Bengaluru |
| Cylinder Name / Application | Excavator Boom Cylinder |
| **Bore (mm)** | 100 |
| **Rod Diameter (mm)** | 56 |
| **Stroke (mm)** | 800 |
| **Mounting Type** | Clevis |
| **Working Pressure (bar)** | 250 |
| Job Type | Manufacturing / Reconditioning |

The current tool has roughly 157 input fields. **The target is eleven.**

Everything else — every component dimension, every process, every cost —
is derived.

### 2.2 The component sheet pattern

Every component follows the same three-section structure. This is the
shape to build:

```
SECTION A — MATERIAL
  New Material? (Yes/No)      reuse a component => zero material cost
  Raw Material Shape          Round | Profile/Cuboid
  Material Grade              -> density and rate from Material Master
  Diameter / Width / Height / Thickness / Finished OD
  Quantity
  -> Unit Weight   = geometry x density
  -> Material Cost = weight x rate    (zero if New Material = No)

SECTION B — PROCESS ROUTING
  Apply? | Process | Machine | Hours | Rate | Cost
  Yes    | Turning | CNC Lathe | lookup(RoughTurning) | TurningRateCard | h x r
  Yes    | Milling | Milling   | lookup(Milling, W x L) | MachineRate   | h x r
  No     | Drilling| Drilling  | lookup(Drilling, dia) x holes | rate  | 0

SECTION D — ADDITIONAL COST
  Manual entry + remarks
```

**"Apply? = No" must contribute exactly zero.** This is how mounting
variants work: a cylinder with a clevis has no trunnion cost.

### 2.3 The components

Tube · Piston Rod · Cap End Cover · Head End Cover · Gland · Cushion Bush ·
Stop Tube · Rear Eye · Rod Eye · Piston · Flange · Trunnion

Plus: Bought Out, Assembly/Painting/Packing, Reconditioning, Cost Summary,
Actual Cost Tracker, Cylinder Database.

---

## 3. Master data — replaces every invented rate

Full values in `hispl-masters.json`. The differences from the current tool
are substantial.

### 3.1 Material rates — most are LOWER

| Grade | Current tool | **HISPL** | Delta |
|---|---|---|---|
| ST52 | 160 | **78** | **-51%** |
| EN8 | 80 | **68** | -15% |
| C45 | 90 | **66** | -27% |
| EN19 | 90 | **92** | +2% |
| SS-410 | 250 | **210** | -16% |

Plus four grades the tool does not have: **EN24** (118), **BR-SAE660**
bronze (520), **EN353** (96), **PLATE-IS2062** (62).

Note SS-410 density is **7.7**, not 7.85. Bronze is **8.9**. The current
tool hard-codes 7.85 everywhere.

### 3.2 Machine rates — all HIGHER

| Machine | Current tool | **HISPL** |
|---|---|---|
| Cutting | 150 | **350** |
| CNC Lathe | 300 | **550** |
| Center Lathe | — | **500** |
| Milling | 250 | **350** |
| Drilling | 250 | **250** |
| Honing | 200 | **450** |
| Grinding | 220 | **400** |

The material rates falling and the machine rates rising roughly cancel.
**The 2.8x gap is the missing component mass, not the rates.**

### 3.3 New: Turning Rate Card

Overrides the flat machine rate for rough and finish turning, **by
finished diameter**:

| Diameter | Rough Rs/hr | Finish Rs/hr |
|---|---|---|
| Up to 100 mm | 300 | 400 |
| 101-250 mm | 550 | 550 |
| Above 250 mm | 700 | 700 |

### 3.4 New: Honing Rate Card

```
Cost = Internal Surface Area (cm2) x rate

rate = 0.30  if stroke <= 4000 AND ID <= 100
rate = 0.40  if EITHER threshold is exceeded
```

> **Trap:** the Word document's table extraction mangled this section and
> shows 300/400/550/700 under the Honing heading. Those are the **turning**
> rates. The honing rates are **0.30 and 0.40 Rs/cm²**. Verified against
> the workbook directly.

### 3.5 New time tables

**Boring** (ID x bore length), **Milling** (by machined area
`width x length`), **Profile Cutting** (by weight) — none exist in the
current tool.

Honing and grinding hours are **utilisation reference only**. Cost is via
the rate cards, not the hours. The current tool's unused `TF` table and
displayed-but-uncosted honing hours are explained by this.

---

## 4. The gap — geometry masters do not exist

This is the crux. To derive a cap end cover's dimensions from a 100 mm
bore, a lookup table is needed. **HISPL has not supplied one.**

Her document lists eighteen required geometry masters (Section 8):
Geometry, Tube, Piston Rod, Piston, CEC, HEC, Gland, Cushion Bush, Stop
Tube, Rod Eye, Rear Eye, Trunnion, Flange, CEC Clevis, Foot Lug, Tie Rod,
Pin, Port/Connection.

Each needs: bore/rod/stroke band, the derived dimensions, allowances, plus
**Source, Basis and Confidence** columns.

### Her rule — quote it exactly

> *"Do not invent missing geometry values. Missing engineering dimensions
> must be marked **ENGINEERING INPUT REQUIRED**."*
>
> *"Historical HISPL drawings/data and approved internal standards take
> priority over generic engineering assumptions."*

**This is not optional.** Where a dimension is unknown, the tool must
refuse to guess and say so on screen. That is a feature, not a limitation
— it tells her exactly what engineering data to supply next.

---

## 5. Build sequence

Her Section 12, in her order. Do not reorder it.

| # | Step | Notes |
|---|---|---|
| 1 | Freeze the validated costing workbook | Her workbook is now the reference |
| 2 | Preserve Material, Machine Rate, Machine Time, Process Rate masters | Load from `hispl-masters.json` |
| 3 | Create Geometry Master structure | Empty, with Source/Basis/Confidence |
| 4 | Load HISPL historical component dimensions | **Blocked — needs her drawings** |
| 5 | Link Inquiry Input to geometry keys | The 11 inputs cascade |
| 6 | Link geometry outputs to component sheets | Without replacing costing formulas |
| 7 | Connect to machine-time, welding, area, weight calcs | |
| 8 | **Test known cylinders against existing outputs** | Use the 295-row validation set |
| 9 | Only then activate automatic geometry | |
| 10 | Store completed costings in Cylinder Database | |

**Steps 1-3 and 5-8 can proceed now.** Step 4 is blocked on her.

Until step 4 is complete, component dimensions remain manual entry with an
`ENGINEERING INPUT REQUIRED` marker — which is exactly what she asked for.

---

## 6. Developer control rules — from her Section 11

1. Use the supplied master values as the source for the costing engine.
2. **Do not overwrite validated costing formulas** while adding geometry.
3. **Do not invent missing geometry.** Mark `ENGINEERING INPUT REQUIRED`.
4. Historical HISPL data beats generic engineering assumptions.
5. Customer drawing dimensions must be supported by **manual override
   without changing the master**.
6. **Keep master data centralised.** No rate hard-coded twice.
7. Changing Bore, Tube OD, Stroke or Rod Diameter **must cascade** to all
   dependent geometry and costing.
8. **Inactive mounting components must contribute zero cost.**
9. Maintain Source, Basis and Confidence for geometry standards.
10. Not a structural design approval unless separately checked by HISPL
    engineering. **This disclaimer must appear on the output.**

---

## 7. Open questions for Aniktha

Ranked. The first two block accurate costing.

### Q1 — Welding: which formula applies? **BLOCKING**

The workbook contains:
```
hours  = weld length / 3600 mm/hr
labour = hours x Rs 375/hr
wire   = hours x 0.8 kg/hr x Rs 360/kg
beads  = 5 if dia <= 250, else 8
```

Her reference document notes: *"the later approved HISPL instruction to
use Rs 14 per inch per bead should be applied as a subsequent controlled
update if it is not yet reflected in the workbook."*

**Which is current?** They give very different numbers.

### Q2 — Geometry standards **BLOCKING for automation**

For each component, what dimensions follow from a given bore?

Starting with the highest-value four:
- **Cap End Cover** — OD, thickness, length, bolt pattern, by bore band
- **Head End Cover** — same
- **Gland** — OD, ID, length, guide length, by bore and rod
- **Piston** — OD, width, rod connection, by bore band

Ask for **drawings or a dimension table for four standard bores**
(80, 100, 125, 160) as a tractable first request — far less work for her
than eighteen complete masters.

> **These populate those four bore mappings and nothing else.**
> Approved values for 80, 100, 125 and 160 do **not** authorise
> interpolation to 90 or 110, nor extrapolation to 200. A derivation rule
> for unapproved sizes requires Aniktha's explicit approval. Any bore
> without an approved mapping must surface `ENGINEERING INPUT REQUIRED`.

### Q3 — The 42% uplift

Across her 295 cylinders, TOTAL exceeds (material + process) by a median
of **42.3%** (quartiles 30.6% to 58.2%).

*Is that overhead, margin, or both? Is it applied as a percentage, or
built up from components we are not seeing?*

This is the overhead question, now with her own data behind it.

### Q4 — Mounting codes

The historical data uses: `RE+CL` (82), `TR+RE` (33), `RE+TR` (30),
`MF` (22), `RE` (13), `CL` (11), `LUG` (8), `DA TR` (7), `DA FF` (6),
`FF` (4), `BC DA` (3).

*Confirm: RE = Rear Eye, CL = Clevis, TR = Trunnion, MF = Mounting
Flange, FF = Front Flange, LUG = Foot Lug, DA = Double Acting?*

Each code must map to the exact set of components to activate.

### Q5 — Tube OD

Section 9 lists "Finished Tube OD = Tube OD input" — implying tube OD is
an input, but it is not among the eleven inquiry inputs.

*Is tube OD selected from a standard-size table by bore, or entered per
job?*

### Q6 — Allowances

*What are the standard boring allowance (raw ID − bore) and OD turning
allowance (raw OD − finished OD)?* The current tool assumes 4 mm rounded
up to the next 5 for rod stock — unverified.

---

## 8. What to build first

Do not attempt the whole rebuild at once.

**Phase 1 — Load her masters.** Replace every invented rate with
`hispl-masters.json`. Add the four new material grades, per-grade density,
the turning and honing rate cards, and the boring/milling/profile-cutting
tables. *Testable immediately against the validation set.*

**Phase 2 — Component sheets from geometry.** Convert the eight flat-price
components to the Section A/B/D pattern: geometry in, weight and process
out. Dimensions stay manual with `ENGINEERING INPUT REQUIRED` until she
supplies standards. *This is what closes most of the 2.8x gap.*

**Phase 3 — Mounting-driven activation.** Map mounting codes to active
components. Inactive contributes zero.

**Phase 4 — Reduce to eleven inputs.** Only once geometry masters are
populated.

**Phase 5 — Validate against all 295 cylinders.** Report median error by
bore band. Target: inside the cost-per-kg bands in Section 1.

---

## 9. Validation harness — build this in Phase 1

`historical-cylinders.csv` has 295 rows of
`bore, rod, stroke, mounting, weight, material, process, total`.

Build a test that runs every row through the engine and reports:

- Median absolute error, overall and by bore band
- Predicted vs actual weight
- Predicted vs actual material cost
- Predicted vs actual process cost
- The ten worst outliers, with their inputs

**This is the single most valuable artefact in the project.** It converts
"I think it's right" into "it matches your last 295 quotations to within
X%", which is what earns the sale.

---

# ADDENDUM — corrections from the source files (2026-08-26)

Added after extracting `Trunion_Included.xlsx` directly. Each item below
was **present in the workbook and absent from this specification**. The
workbook ranks above this document, so where they differ the workbook
governs and this section records the correction.

Evidence: `hispl-v2/source/EXTRACTED_FORMULAS.md` (all 436 formulas with
cached values), `RECONCILIATION.md`, `STRUCTURE_MAP.md`.

## A1 — The weld length formula

This spec gave the four downstream welding steps but not the one that
drives them:

```
Total Weld Length (mm) = PI() x Weld Diameter x No. of Beads
```

`Tube!B38 = PI()*B36*B37`, cached 1696.460033 for 108 mm x 5 beads. It
is the circumference times the bead count. Everything else — time,
labour, wire — follows from it.

## A2 — There are four weld locations, not one

Welding is not a single line on the cylinder. The workbook has four
complete six-row blocks:

| Sheet | Weld | Rows |
|---|---|---|
| Tube | Part Welding (tube parts joint) | 35–42 |
| Tube | CEC Welding | 44–51 |
| Tube | Rear Eye Welding | 53–60 |
| Piston Rod | Rod Eye Welding | 39–46 |

Each takes its own weld diameter and all four feed the component's
process subtotal: `Tube!B63 = F26+…+F32 + B42+B51+B60`.

A per-cylinder welding cost is therefore the sum of four blocks. Costing
one weld under-states welding by roughly three quarters.

## A3 — The `New Material?` reuse flag

Every component sheet carries `B4 New Material? (Yes/No)`, and every
material cost is gated on it:

```excel
Material Cost / pc = IF(B4="No", 0, Unit Weight x Material Rate)
```

It zeroes **material only**. Process cost still applies, and the
component still contributes its weight. This is the reconditioning and
reuse path, and it is component-level, not job-level.

## A4 — `Apply?` is per-process, not per-component

Section B is a table with one row per process, and column A of each row
is its own Yes/No gate:

```excel
Cost (col F) = IF(A="Yes", Hours x Rate, 0)
```

A component is never switched off as a whole. It is switched off by
having no material and no applied processes. The routing varies widely —
Stop Tube has one process, Piston Rod has ten.

## A5 — Honing is charged twice, at full area

`Tube!D30` (Rough Honing) and `Tube!D32` (Finished Honing) are the
identical expression `PI()*B9*B10/100`, and both take the same rate from
the Honing Rate Card. The same internal surface is billed twice at full
area, cached at Rs 1,135.50 each.

This is deliberate — the rate card is titled *"Rough Honing & Finished
Honing"* — but it was not in this spec, and it doubles the honing line.

## A6 — Bin lookups use Bin Start, not upper bounds

This spec described the machine time tables as "first bucket where value
<= bound". The workbook does not resolve them that way. Each table
carries a literal **Bin Start** helper column and every lookup is
`MATCH(value, binStarts, 1)` — the largest start not exceeding the value.

Verified at source: `'Machine Time Master'!A7:A10 = 0 / 81 / 151 / 251`,
column starts `0 / 501 / 1001 / 2001`, and stock removal starts
`0 / 2.0001 / 5.0001 / 10.0001`.

The two readings agree on every integer and differ in the gap between a
bound and the next start:

| Value | Bin Start (workbook) | Upper bound (old spec) |
|---|---|---|
| 80 | row 1 | row 1 |
| **80.5** | **row 1** | row 2 |
| 81 | row 2 | row 2 |

Fractional dimensions are real — the workbook's own sample tube has a
finished ID of **100.4 mm** — so this is not a theoretical difference.
`masters.js` now implements bin-start semantics and reproduces the
workbook's cached lookups exactly.

### A6.1 — but not the clamp that comes with it

`MATCH` alone puts any value above the last bin start into the top
bucket. The Cutting and Rough Turning tables stop at **"2001-3000"**, so
a 4950 mm stroke would be priced as if it were 3000 — silently
under-charging the longest jobs. Six of the 295 historical cylinders are
in that range.

`masters.js` therefore carries the bin-start rule **and** an explicit
declared ceiling per table, returning `ENGINEERING_INPUT_REQUIRED` above
it. *The workbook governs the rule, not its defects.*

## A7 — What the workbook does NOT contain

Recorded here because it is the single most consequential finding, and
because this spec's §7 ("changing Bore, Tube OD, Stroke or Rod Diameter
**must cascade**") could be misread as transcribed HISPL logic.

**There is no geometry derivation anywhere in the workbook.** All 24
sheets were checked. The inquiry inputs are referenced 16 times, every
one for labelling — Cost Summary headers, the Cylinder Database record,
the Final Output description string. Not one component dimension is
computed from bore, rod or stroke. They are all typed by the estimator.

§7 is a valid v2 *requirement*. It is not existing logic to transcribe,
and the standards behind it may not exist in writing at all. That is
question 1 in `QUERY-TO-ANIKTHA.md`.

Until it is answered, every component dimension surfaces
`ENGINEERING INPUT REQUIRED`. `geometry.js` will supply them later
without the engine changing.

## A8 — Three defects in the workbook, left uncorrected

Documented for HISPL, not fixed here. See `RECONCILIATION.md` §4.

1. **`"Conventional Lathe"` is not a machine.** Every boring rate lookup
   uses that string; the master says `Center Lathe`. Returns `#N/A`,
   masked only because the sample sets Boring to `Apply? = No`.
2. **An unfinished `MS-` rename breaks 8 of 12 components**, so
   `Cost Summary!B38 TOTAL MANUFACTURING COST = #N/A`. The workbook does
   not currently produce a total.
3. **`Cost Summary!B22` wraps each weight in `IFERROR(…,0)`** and reports
   76.54 kg for a cylinder missing two thirds of its parts.

Defect 3 is the pattern this project must not inherit: the engine
reports a blocked weight as `EIR` and names the omissions, rather than
summing what happens to resolve.

---

# SOURCE RULE — three sources, three distinct roles

Governs every value in the v2 application. Enforced by
`tests/source-purity.js`, not by convention.

| Source | Role | Supplies | Never supplies |
|---|---|---|---|
| `HISPL_..._Developer_Reference.docx` | **Structure and intent** | What the tool should do, which inputs are permitted, how components are organised, the rules of the process | **Any numeric value** |
| `VERSION_1.xlsx` | **Values and calculations** | All rates, tables, rate cards, constants, weight formulas, geometry tables, process routing, roll-up logic | — |
| `COST_SHEET.xlsx` | **Reference and validation** | What a realistic job looks like, which mounting codes occur, what size range matters; may be compared against | **Any value used by the application** |

**Structure from the document, values and calculations from the
workbook, sanity-checking from the cost sheet.**

If a number appears in the application, it came from the workbook. No
exceptions.

## Why the document is barred from supplying numbers

Its tables came out of the Word export **shifted one heading down**:
every heading displays the *previous* section's table. The giveaway is
visible in the extraction — the table printed under *"5.2 Honing Rate
Card"* ends with the rows `HONING RATE CARD (Rough Honing & Finished
Honing)` and `Cost = Internal Surface Area (cm2) x Rate…`, which are the
real heading rows pushed to the bottom of the table above.

So under the honing heading it prints:

```
0.0    | Up to 100 mm  | 300.0 | 400.0
101.0  | 101-250 mm    | 550.0 | 550.0
251.0  | Above 250 mm  | 700.0 | 700.0
```

Those are the **Turning Rate Card**. The true honing rates — `0.30` and
`0.40` Rs/cm² — appear nowhere in the document.

Honing costed from that table would be roughly **1,000x** too high, on
code that reads as correct. This is why the bar is absolute rather than
"check the document carefully": a rule that depends on vigilance fails
exactly when vigilance lapses.

The document remains authoritative on **structure**: the 11 permitted
inputs it lists were verified correct against the workbook's Inquiry
Input sheet.

## Why the cost sheet is barred from supplying values

It is last financial year's quotations. It tells us truthfully what a
real job looks like, and it is the basis for validation — but a rate
taken from it would be last year's price with last year's margin already
inside it, which is not a cost.

One exception, tightly bounded: the four ₹/kg band targets
(1003 / 522 / 352 / 318) are cost-sheet derived and live in `masters.js`
under `BORE_BANDS`. They are **validation reporting only**. No costing
path reads them, `engine.js` and `components.js` never reference
`boreBand` or `targetTotalPerKg`, and `source-purity.js` fails the build
if that changes.

## When the document and the workbook disagree on structure

**Report it. Do not silently resolve it.**

The document is level 2 in the source hierarchy and the workbook level
3, so the document wins on *intent*. But it has already proved unreliable
on *detail*, so a disagreement is a finding to raise, not a decision to
take alone.

Disagreements found so far, all reported rather than resolved:

| Point | Document | Workbook | Handling |
|---|---|---|---|
| Honing rates | 300 / 400 / 550 / 700 | 0.30 / 0.40 Rs/cm² | Workbook used; document's table is the mangled turning card |
| Welding method | "later approved instruction: Rs 14 per inch per bead" | full formula, Rs 312 per 108 mm weld | **Unresolved** — held behind `weldingStatus()`, question 2 to HISPL |
| Geometry cascade | "Changing Bore, Tube OD, Stroke or Rod Diameter must cascade to dependent geometry and costing" — verified verbatim in the .docx | no derivation exists anywhere; every dimension typed by the estimator | **Unresolved** — question 1 to HISPL. The same document also says "do not invent missing geometry values… mark ENGINEERING INPUT REQUIRED" and refers to "future geometry standards", so the fallback is already sanctioned |

## What the test enforces

```bash
node tests/source-purity.js
```

- No `COST_SHEET` or historical-data reference anywhere in
  `assets/js/costing/`
- No `300 / 400 / 550 / 700` run in any costing module — the signature
  of a transcribed mangled honing table
- Honing rates are `0.30` / `0.40`, and the honing card carries no
  hour-scale rate
- Band targets appear only inside `BORE_BANDS`, and no other module
  reads them
- No rate literal restated outside `masters.js`
- Welding stays behind `weldingStatus().resolved`; `14` is recorded but
  never used as a rate
- Every costing module names the workbook as its provenance
- `CLAUDE.md` and this document actually state the rule

---

# VERSION 1 — the workbook that closed the geometry question

**Received** 2026-09-09. Supersedes `Trunion_Included.xlsx` as the value
source. 33 sheets, 1,714 formulas, 231 defined names.

Everything in this section is recorded in full in
`hispl-v2/v1/RECONCILIATION.md`; this is the short form.

## What it settles

The first build could not dimension a cylinder. The workbook it was
built from contained exactly one dimensioned example, and one example is
not a rule, so every dimension past bore, rod and stroke surfaced as
`ENGINEERING INPUT REQUIRED`. The ten permitted inputs reached ₹360 of a
₹25,167 cylinder.

VERSION 1 ships a **stepped geometry table per component**, keyed on
bore, rod diameter or tube OD and read with `VLOOKUP(...,TRUE)`. Eleven
of thirteen components now derive their geometry; the tie rod is sized
from thrust and allowable stress instead.

Measured on the workbook's own worked example:

- **32 of 36 dimensions** derive from the 22 inputs (89 %)
- **₹42,958 of ₹63,384** needs no engineering input at all (68 %)
- The remaining 32 % is the tube and rod **raw stock** sizes only

It also settles the welding question the earlier file left open. One
method, priced, on all eight welds:
`circumference(inch) × ₹14/inch/bead × beads × locations`.

## What it does not settle

Confidence is not uniform and the workbook says so per sheet. Five
tables are HISPL-approved against a published standard (ISO 6020-1/-2,
ISO 6022, ISO 8140, NFPA MS2/MS7). Three carry the wording *"general
proportion, no formal published source found"* — cushion bush, stop tube
and flange — and on the reference job the two that are fitted are
**₹10,556, 17 % of the cylinder**. That wording is carried into the
interface verbatim rather than averaged away.

Four dimensions remain engineering inputs because no validated allowance
exists for them: tube raw OD and length, rod raw diameter and length.
They are seeded with the values HISPL's own sheets carry. **Seeding is
not deriving**, and the interface says which is which.

## Defects

**Nine, reproduced rather than corrected**, per the standing instruction.
Full detail and rupee impacts in `RECONCILIATION.md` §5. The two that
matter most:

- **W-1** — the tube is charged ₹1,298 to weld on a rear eye that the
  inquiry says is not fitted. All three tube weld blocks are
  unconditional.
- **FO-1 / FO-2** — the workbook's two grand totals disagree by
  **₹1,498.78**. `Final Output` bills four components without checking
  their presence flags, and omits tie rod, foot lug and front flange
  entirely. Both totals are reproduced; the tool shows both and names
  the gap, because choosing between them is not ours to do.

## Build

```
assets/js/costing/v1/{masters,geometry,inputs,engine}.js
products/costing/v1.html          unlinked, not wired to the ERP
tests/workbook-v1.js              222 assertions
```

Every assertion in `workbook-v1.js` is a value read out of the
workbook's own cached formula results — weights, material costs, process
costs, individual machine hours, weld bead counts, both grand totals.
None was chosen by hand.
