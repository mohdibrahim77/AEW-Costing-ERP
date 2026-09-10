# VERSION_1.xlsx — extraction, reconciliation, and what it changes

**Source** `hispl-v2/source/VERSION_1.xlsx` (657 KB, 33 sheets, 1,714 formulas)
**Received** 2026-09-09 · **Status** extracted, ported, validated
**Supersedes** `Trunion_Included.xlsx` as the value source

---

## 1. What arrived

This is the file the eight-question query was waiting on. It answers
most of them outright and makes several of them moot.

| Earlier state | VERSION 1 |
|---|---|
| One dimensioned cylinder in the whole workbook | A stepped geometry table per component, keyed on bore, rod diameter or tube OD |
| Welding: two contradictory methods, neither costed | One method, priced, used on all eight welds |
| Geometry: `ENGINEERING INPUT REQUIRED` throughout | 11 of 13 components derive their geometry |
| ₹360 of ₹25,167 reachable from the inputs (1.4 %) | Every line resolves; see below |
| 436 formulas | 1,714 |

The costing reach is the headline. Under the previous workbook, the ten
permitted inputs unlocked ₹360 of a ₹25,167 cylinder — one bought-out
bearing — because nothing else could be dimensioned without inventing a
rule.

Measured on the reference job rather than asserted:

| | |
|---|---|
| Dimensions derived or calculated from the 22 inputs | **32 of 36 — 89 %** |
| Dimensions still typed by an engineer | 4 |
| Cost needing no engineering input at all | **₹42,958 of ₹63,384 — 68 %** |
| Cost touched by one of the four typed dimensions | ₹20,426 — 32 % |

The remaining 32 % is the tube and the piston rod, and only their **raw
stock** sizes and lengths: bore, tube OD and the boring allowance still
drive their finished dimensions, their machining and their welds. So no
part of the cylinder is un-costed — four numbers just cannot be derived,
because HISPL has never validated a stroke-to-length allowance. See §3.

---

## 2. Validation

`tests/workbook-v1.js` — **222 assertions, 0 failures.**

Every expectation is a value read out of the workbook's own cached
formula results, not a figure anyone chose. Excel stores what it last
computed in each formula cell; if the engine and that cached value
disagree, the engine is wrong.

Matched exactly, to two paise:

- **10 component weights** (each sheet's Unit Weight cell)
- **9 material costs**, **9 process costs**
- **23 individual process rows** — machine hours, area bases, rates
- **8 welding blocks** — circumference, bead count, cost
- **10 component totals**
- **Both grand totals**: Cost Summary ₹63,384.10 and Final Output ₹61,885.32
- Total cylinder weight 178.766 kg

Plus every geometry table cross-checked against the FINAL cells on its
own sheet, and the four alternative mountings (tie rod, foot lug, front
flange, CEC clevis) against their sheets' cached figures.

### Reference job

Bore 125 × Rod 90 × Stroke 115, Tube OD 150, 250 bar, Rod Eye +
Trunnion, Freudenberg/Viton Normal Glide Ring, cushion bush fitted, no
stop tube, no rear eye. This is the workbook's own worked example.

---

## 3. The input layer

**22 fields.** That count is the workbook's, not a target we designed
toward — it is exactly what the `Inquiry Input` sheet asks for.

| Group | Count | Fields |
|---|---|---|
| Identification | 6 | Inquiry no., date, cylinder no., customer, location, application |
| Cylinder specification | 9 | Bore, rod dia, stroke, tube OD, boring allowance, OD turning allowance, working pressure, mounting, tie rod qty |
| Process & seal | 4 | Rod process, seal brand, seal material, seal type |
| Optional components | 3 | Cushion bush, stop tube, rear eye |

The mounting selection alone decides whether six further components
exist, through the logic table at `Inquiry Input!A45:G51`.

### What is still asked for separately

Five dimensions, in the collapsed *Engineering inputs* panel:

| Dimension | Why it is not derived |
|---|---|
| Tube raw OD | Kept manual per HISPL instruction — a purchasing decision |
| Tube raw length | No validated stroke-to-tube-length allowance exists |
| Rod raw diameter | No validated rod turning allowance exists |
| Rod length | No validated stroke-to-rod-length allowance exists |
| Stop tube length | Application-specific; the sheet says so explicitly |

Each is seeded with the value HISPL's own sheet carries. **That is a
starting point, not a derivation**, and the UI says so — the workbook is
explicit that no validated allowance exists, so inventing one would put
a number into a quotation nobody has agreed to.

---

## 4. Geometry: derived, and how far to trust it

Eleven components now derive their geometry from a stepped lookup keyed
on one primary input. The confidence is **not uniform**, and the
workbook states it per sheet. The tool carries that wording through
verbatim rather than averaging it away.

| Component | Driver | Confidence | Basis |
|---|---|---|---|
| Rod Eye | Rod dia | **HISPL-approved** | Rod-end/clevis design guidance, rounded to standard sizes |
| Trunnion | Tube OD | **HISPL-approved** | ISO 6020-2 / NFPA MT1–MT4 |
| CEC Clevis | Bore | **HISPL-approved** | ISO 6022 MP1/MP3 + ISO 8140 |
| Front Flange | Bore | **HISPL-approved** | ISO 6020-1 MF1, rounded up deliberately |
| Foot Lug | Tube OD | **HISPL-approved** | NFPA MS2/MS7, Parker 2H reference |
| Piston | Bore | Medium-high | OD = bore, confirmed by every seal-sizing source |
| Cap / Head End Cover | Bore | Medium | Ratios are practical estimates |
| Gland | Rod dia | Medium | ID = rod + 1 mm is solid; OD and length are estimates |
| Cushion Bush | Rod dia | **Low** | "General proportion, no formal published source found" |
| Stop Tube | Rod dia | **Low** | Same |
| Flange | Tube OD | **Low** | Same |
| Tie Rod | Bore + pressure | *Calculated* | Thrust ÷ rods ÷ allowable stress → area → diameter |

The tie rod is the only component sized from physics rather than a
lookup: 306,796 N of thrust across four rods at 98 N/mm² allowable needs
782.6 mm², giving Ø31.6 mm, rounded up to Ø35 mm stock.

Three of the low-confidence tables carry real money. The cushion bush is
₹7,238 of a ₹63,384 cylinder — 11 % — and its dimensions rest on a ratio
with no published source. Worth raising with HISPL before this quotes a
live job.

---

## 5. Defects found, reproduced, and reported

Per the standing instruction, **none of these is corrected**. The tool
has to agree with the sheet HISPL quotes from; a silent divergence is
worse than a documented defect. Each is reproduced exactly and surfaced
in the interface's *Check before quoting* panel.

### W-1 — Phantom rear-eye weld · ₹1,298
The Tube sheet applies three weld blocks unconditionally. The third is
"Rear Eye Welding" and it is billed even when the inquiry says no rear
eye is fitted. The reference job has Rear Eye = No and still pays ₹1,298
to weld one on. That is **2 % of the cylinder**.

### FO-1 — Final Output bills absent components · ₹1,656
`Final Output!C11` and `C12` add Cushion Bush, Stop Tube, Rear Eye and
Rod Eye without checking any presence flag. The Cost Summary gates all
four. On the reference job this bills a stop tube and a rear eye that
are not fitted.

### FO-2 — Final Output omits three mounting components
Tie Rod, Foot Lug and Front Flange appear in neither Final Output
formula. A foot-lug cylinder is missing its lugs from that sheet
entirely — ₹5,652 unaccounted.

**Together FO-1 and FO-2 are why the workbook's two grand totals
disagree by ₹1,498.78.** Both are reproduced so nobody has to take
either on trust; the interface shows both and names the difference.

### TR-1 — Tie rod cutting lookup reads the wrong column
`Tie Rod!D39` calls `VLOOKUP(diameter, CuttingTable, …)` against a range
whose first column holds **hours** (0.08 / 0.10 / 0.15 / 0.25), not
diameters. Any real rod diameter overshoots every key, so the lookup
always lands on the last row — the "Above 250 mm OD" band — whatever the
rod size. It happens to return a plausible number, which is why it has
survived.

### T-1 — Trunnion machined for free
Rough turning, finish turning and pin grinding are all manual entry and
all default to ₹0. An unedited trunnion is costed with only milling and
drilling — ₹140 of machining on a ₹3,162 part.

### P-1 — Piston "Finish Turning" priced per kilo
The row is labelled Finish Turning but priced at the profile-cutting
rate of ₹1.25/kg. Finish-turning a piston for ₹9.03 is not credible.

### A-1 — Packing charged on a typed weight
Packing is billed on a hand-typed 150 kg while the Cost Summary computes
the actual 178.77 kg two rows above. ₹431 under-charged, and it will
drift with every cylinder size.

### A-2 — Painting area is a typed constant
4,500 cm², typed. The sheet's own note says it should be
`π × OD × (Stroke + Bore)`, which no formula computes.

### C-1 — Machine-time tables extrapolate silently
Excel's `MATCH(…,1)` returns `#N/A` below the first bin but silently
returns the last bin above the top one. Cutting stops at 3,000 mm and
boring at 2,000 mm, so a 5-metre cylinder is priced at the 3-metre rate
with no indication. Reproduced — but the tool now says so.

### Carried over, unchanged from the previous workbook
- Welding uses the literal **3.14**, not π, on all eight blocks (0.05 % low)
- Wire cost is computed on the Tube sheet and then not added to any total
- The welding labour rate, deposition rate and weld speed are all present and all unused

---

## 6. Source rule

Unchanged by the new file. `VERSION_1.xlsx` takes the workbook's place
in the hierarchy:

| Source | Supplies | Never supplies |
|---|---|---|
| `HISPL_..._Developer_Reference.docx` | Structure and intent | Any numeric value |
| **`VERSION_1.xlsx`** | Every value and every calculation | — |
| `COST_SHEET.xlsx` | Reference and validation only | Any value used by the application |

`tests/source-purity.js` now covers `assets/js/costing/v1/` — it did not
before, because its directory read is not recursive, which left the
newest and largest part of the costing code the only part the rule did
not police. The v1 section checks structurally rather than numerically:
an earlier numeric pass flagged the Valve's ₹650 bought-out price
because it collides with the grinding machine's hourly rate, and the
Honing Machine's ₹550/hr because it collides with a turning rate. Bare
integers recur across unrelated tables; matching on them tests
coincidence, not purity. The check now verifies that every process row
takes its rate from a masters accessor, verified against a deliberately
introduced leak.

---

## 7. Files

```
assets/js/costing/v1/masters.js     rate tables + Excel lookup semantics
assets/js/costing/v1/geometry.js    12 geometry tables + confidence
assets/js/costing/v1/inputs.js      22 fields + mounting logic
assets/js/costing/v1/engine.js      one function per component sheet
products/costing/v1.html            the working surface
tests/workbook-v1.js                222 assertions against cached values
hispl-v2/v1/FORMULAS_V1.md          all 1,714 formulas, verbatim
hispl-v2/v1/sheets/*.txt            every sheet, cell by cell
```

Not wired into the live ERP. `products/costing/v1.html` is unlinked.

---

## 8. Still open with HISPL

1. **The three low-confidence geometry tables** — cushion bush, stop
   tube and flange rest on unsourced ratios. On the reference job the
   two that are fitted carry ₹10,556, **17 % of the cylinder**; a job
   with a stop tube would add ₹1,404 more.
2. **W-1** — is the unconditional rear-eye weld deliberate, or should it
   follow the presence flag?
3. **Which grand total is the quoting figure** — Cost Summary or Final
   Output? They differ by ₹1,499 and the tool cannot choose.
4. **T-1** — should trunnion turning and pin grinding be automated, or
   is manual entry intended?
5. **A-1 / A-2** — should packing weight and paint area link to the
   values the workbook already computes?
6. **Bought-out placeholders** — the Unbrako bolt rate is flagged in the
   workbook itself as awaiting real vendor pricing, and bellows are
   costed at zero pending a quote.

---

## 9. Second pass — every sheet, and every note she typed (2026-09-10)

The first build ported 29 of 33 sheets and never opened four. This pass
accounts for all 33, and reads the 195 annotation cells Aniktha typed
beside the formulas as instructions, not decoration.

### Sheet coverage

| Sheets | Count | Where |
|---|---|---|
| Tube, Piston Rod, Cap End Cover, Head End Cover, Gland, Cushion Bush, Stop Tube, Rear Eye, Piston, Rod Eye, CEC Clevis, Trunnion, Flange, Foot Lug, Tie Rod, Front Flange | 16 | `engine.js`, one function each |
| Material, Machine Rate, Process Rate, Machine Time, Raw Material Rate masters | 5 | `masters.js` |
| Inquiry Input, Geometry Master, Seal Master, Bought Out & Seal Kit Master, BOC Calculated Items, Assembly Painting Packing, Cost Summary, Final Output | 8 | `inputs.js`, `geometry.js`, `engine.js` |
| Machine Time Calculator, Actual Cost Tracker, Cylinder Database | 3 | `views.js` — **new** |
| MASTER REVIEW - FREEZE CHECK | 1 | `tests/freeze-check-v1.js` — **new** |

The three new views do not feed the estimate; each derives from a
finished costing run and recomputes nothing.

- **Machine Time Calculator** reports hours only where a machine-time
  table was read. Area- and weight-priced operations print the sheet's
  own words, "TIME STANDARD NOT AVAILABLE", rather than an hour
  back-calculated from rupees.
- **Actual Cost Tracker** reproduces the sheet exactly — per piece and
  ungated — so its estimated subtotals match B17 (₹25,011.25) and D17
  (₹17,263.86). That is the same defect family as FO-1: it lists a stop
  tube and rear eye that are not fitted, and counts the trunnion pair once.
- **Cylinder Database** builds row 5, including the `CYL-18991230` id the
  sheet prints when no date is set. Margin exists only once a quoted
  price is typed: "no automatic profit % is applied anywhere in this
  workbook."

### The freeze-check sheet as a test

`MASTER REVIEW - FREEZE CHECK` is 980 live references that HISPL compiled
"for final review before freeze" — every master, rate card and geometry
table in one place. `tests/freeze-check-v1.js` reads the `.xlsx` and walks
it: **698 assertions, none typed by hand**, each geometry row checked to
land on its own bin. It found one slip of mine — `MS-EN353` transcribed as
"EN353 Case Hardening" instead of "…Hardening Steel". Fixed.

### Built from her notes

| Her cell | What it says | Built |
|---|---|---|
| B4 on every component sheet; Cost Summary A5 | "New Material? … set to No to zero out material cost for a reused part" | Toggle on all 16 components. Weight and machining stay. |
| Override block on every geometry table | "enter a value here to force it from an actual GA/design drawing" | Overrides on all 12 tables; blank falls through, the UI marks what came from a drawing |
| Cap / Head End Cover B5, C5 | "Round = solid round bar … Profile / Cuboid Block = flat/rectangular stock" | Raw shape per cover; turning still uses finished OD, as C12 says |
| Cost Summary A23, A34 | Weight allowance; "ADDITIONAL COST (manual - e.g. special packaging, freight, contingency)" | Both, both reaching the totals |
| Tie Rod C11, B20, B27 | Yield "Editable if HISPL uses a different tie rod steel/spec"; diameter and length overrides | Yield, safety factor, both overrides |
| CEC Clevis B14; Geometry Master H104 | Lugs = 2 is "a convention default, NOT a confirmed HISPL standard - do not treat it as one" | Input, with that sentence as warning **G-1** |
| Foot Lug B11, Trunnion B10 | 4 lugs standard; trunnions in pairs | Both inputs |
| Every weld block | "No. of Weld Locations" | Input per weld; foot lug stays =lugs, as its cell is a formula |
| Freeze-check §9d | "Tube total cost withheld (shows INVALID text) until fixed" | **No total** when a raw dimension is not larger than its finished one — tube, rod, stop tube (**V-1 to V-3**). The first build flagged and quoted anyway. |
| Final Output A18 | "This is an approximate manufacturing cost estimate for quotation purposes…" | Verbatim, under the total |
| BOC Calculated Items B87, E86, E97 | Bolt rate "PLACEHOLDER … do not treat as a real bolt price"; bellows "enter from an actual supplier quote" | Warnings **B-1**, **B-2** |
| Process Rate Master A44 | Bead table "covers 50-200mm only … extend if a diameter outside this range is needed" | Warning **W-2** above 200 mm |

### Confirmed by her notes, no change needed

- Honing threshold "applies to BOTH Length (Stroke) AND ID together" (PRM A24) — the AND already implemented.
- C-45 tiered pricing "applies to: CEC, HEC, Foot Lug, Gland, Flange, CEC Clevis" (RMRM A12) — exactly those six.
- Rod eye weld on piston rod diameter, "verified NOT Tube OD" (PRM A40, freeze-check §9b).
- Legacy welding constants "no longer used anywhere in the current model" (PRM A40).
- Tube OD turning allowance "Not wired into Raw OD" (Inquiry C18).
- BOC presence "deferred to a later phase, per HISPL instruction" (Inquiry A35).
- Stop tube "Costed using SOLID ROUND raw material" (Stop Tube A2); rod eye weight "always calculated as a ring" (Rod Eye C5).

### Statements the workbook's own formulas have overtaken

Recorded, not acted on. None changes a cost; all four would make a
careful reader think the tool is wrong.

| | Cell | Says | But |
|---|---|---|---|
| S-1 | Inquiry Input A31 | Rod Eye is "always costed" | Cost Summary B15 gates it on mounting; freeze-check §9c confirms |
| S-2 | CEC Clevis A2 | No approved table; "contributes Rs.0 until real dimensions are entered" | Its own C9–C13 read the HISPL-approved ISO 6022 table; B41 costs it at ₹2,307 |
| S-3 | Geometry Master A2, G100, E62 | "Phase 1 … NOT connected"; Trunnion OD pending, "do not invent" a ratio | Trunnion sheet carries an approved table with a Trunnion OD column; freeze-check §8 records all seven as implemented 31-Aug-2026 |
| S-4 | Geometry Master E40 | "no Applicable Yes/No flag yet" for stop tubes | Inquiry Input B33 now exists and the Cost Summary gates on it |

Worth asking her to tidy these before the workbook is frozen — someone
new reading A2 on the clevis sheet will believe the clevis is free.

### Files added in this pass

```
assets/js/costing/v1/views.js       Machine Time Calculator, Actual Cost Tracker, Cylinder Database
tests/freeze-check-v1.js            698 assertions walked from MASTER REVIEW - FREEZE CHECK
hispl-v2/v1/ANNOTATIONS.txt         all 195 annotation cells, by sheet and cell
```
