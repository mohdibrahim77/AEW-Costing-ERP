# RECONCILIATION — source files vs. transcription

Every rate, table, constant and formula in `Trunion_Included.xlsx`,
`COST_SHEET.xlsx` and the Word reference, checked against
`hispl-masters.json` and `SPECIFICATION.md`.

**Extraction route:** pure Node. `.xlsx` and `.docx` are ZIP archives of
XML; `zlib.inflateRawSync` plus a ZIP central-directory walk reads them
with no dependency. Formulas come from the `<f>` element and cached
values from `<v>`, exactly as Excel stored them. Nothing was installed.

**Source-of-truth order applied:** workbook > `hispl-masters.json` >
specification documents.

---

## Headline

Your extraction is **accurate**. Across 37 rate values, 9 time tables,
2 rate cards, 7 welding constants, 11 inquiry inputs and the 295-row
historical clean, I found **no transcription error**.

What I did find is that **the workbook itself is broken in its saved
state**, and that one blocking question is already answered inside it.

| | |
|---|---|
| Transcription errors found | **0** |
| Defects found in the workbook | **3** (two of them fatal to its total) |
| Blocking questions the workbook resolves | **1 of 7** (C1, welding) |
| Blocking questions the workbook proves are *unanswerable* from it | **6** (geometry) |

---

## 1. Master data verification — MATCHES

### Material Master — 9 of 9 exact

Every code, density and rate round-trips against `hispl-masters.json`.
`tests/masters.js` now asserts this mechanically against the JSON rather
than against my reading of it.

Per-grade densities confirmed at source: `SS-410` **7.7**,
`BR-SAE660` **8.9**, all others **7.85**.

**One finding.** Material Master has a **tenth row**, `A13 = "MS"`, with
no name, no density and no rate. It is an orphan. See defect 2 below —
it is the tail of an unfinished rename, and it is the reason eight
component sheets are in error.

### Machine Rate Master — 7 of 7 exact

`CNC Lathe` 550 · `Center Lathe` 500 · `Milling Machine` 350 ·
`Drilling Machine` 250 · `Honing Machine` 450 · `Grinding Machine` 400 ·
`Cutting Machine` 350.

### Process Rate Master — 10 of 10 exact

All ten rates and units match, including the two that are easy to
transpose: `Chrome Plating` 0.6 and `Dechrome Plating` 0.35 Rs/cm².

### Machine Time Master — 9 tables, all exact

Cutting, Rough Turning, Boring, Honing, Grinding, Milling, Drilling,
Profile Cutting and the Stock Removal factor table all match cell for
cell, including every bin boundary.

Two things the workbook confirms that were previously inference:

- **Section 4** is not an empty section. Its heading *is* the rule:
  *"Finish Turning Time = Rough Turning Time (looked up the same way)
  × 0.70"*. The 0.70 factor is sourced, not assumed.
- **Section 11** states the area formula: `π × D(mm) × L(mm) / 100` for
  cm², on OD for external processes and on ID for honing. This matches
  the frozen ERP's `eA()` exactly.

### Turning and Honing Rate Cards — exact

| Card | Workbook | JSON | |
|---|---|---|---|
| Turning ≤100 mm | 300 rough / 400 finish | same | ✓ |
| Turning 101–250 | 550 / 550 | same | ✓ |
| Turning >250 | 700 / 700 | same | ✓ |
| Honing within | **0.30 Rs/cm²** | same | ✓ |
| Honing beyond | **0.40 Rs/cm²** | same | ✓ |
| Stroke threshold | 4000 mm | same | ✓ |
| ID threshold | 100 mm | same | ✓ |

### Welding constants — 7 of 7 exact

375 · 360 · 0.8 · 3600 · 250 · 5 · 8.

---

## 2. The two flagged traps — BOTH CONFIRMED

### Trap 1 — the Word document's honing table. Confirmed, and worse than reported.

Under the heading **"5.2 Honing Rate Card"** the document's table reads:

```
0.0    | Up to 100 mm  | 300.0 | 400.0
101.0  | 101-250 mm    | 550.0 | 550.0
251.0  | Above 250 mm  | 700.0 | 700.0
```

Those are the **Turning** rates. Your flag is correct.

The mechanism is systematic, not a one-off. The Word export shifted
**every table body one heading later**, so each heading displays the
*preceding* section's data. The giveaway is visible in the extraction:
the table printed under "5.2 Honing Rate Card" *ends* with the rows
`HONING RATE CARD (Rough Honing & Finished Honing)` and
`Cost = Internal Surface Area (cm2) x Rate…` — the real heading rows,
pushed to the bottom of the table above.

**Consequence: the true honing rates 0.30 and 0.40 appear nowhere in the
Word document at all.** Anyone building from that document alone would
cost honing at roughly **1,000× the correct rate**. Treat every table in
that file as belonging to the previous heading, or do not use it.

### Trap 2 — the real honing rates. Confirmed against the workbook.

`Process Rate Master` A25:B26:

```
Rate up to 4000mm Stroke & 100mm ID (Rs./cm2)      0.3
Rate beyond 4000mm Stroke or 100mm ID (Rs./cm2)    0.4
```

The threshold semantics are also confirmed, and they are subtle. A24
reads *"Threshold applies to BOTH Length (Stroke) AND ID together"*, and
the live formula is:

```excel
=IF(AND(B10<=HoningLengthThreshold,B9<=HoningIDThreshold),HoningRateLow,HoningRateHigh)
```

The **low** rate needs *both* within threshold; the **high** rate applies
if *either* is exceeded. `masters.js` implements
`beyond = stroke > 4000 || id > 100`, which is the same statement.
Verified against the workbook's own cached value: ID 100.4 > 100 with
stroke 900 < 4000 yields **0.4**. Correct.

---

## 3. Does the workbook resolve C1–C7?

### C1 — Welding. **RESOLVED.** The workbook implements it, live.

This is the most consequential finding. Welding is not an open question
in the workbook — it is fully built, in four places.

```excel
B37 = IF(B36<=WeldDiaThreshold,WeldBeadsLow,WeldBeadsHigh)   -> 5
B38 = PI()*B36*B37                                            -> 1696.460033
B39 = B38/WeldSpeed                                           -> 0.471238898
B40 = B39*WeldLabourRate                                      -> 176.7145868
B41 = B39*WeldDepositionRate*WeldWireRate                     -> 135.7168026
B42 = B40+B41                                                 -> 312.4313894
```

Weld locations: **Tube ×3** (Part Welding, CEC Welding, Rear Eye
Welding) and **Piston Rod ×1** (Rod Eye Welding). Each is a full
six-row block. All four feed the component's process subtotal:

```excel
B63 = F26+F27+F28+F29+F30+F31+F32 + B42+B51+B60
```

**Reconciliation against your spec.** Your Q1 transcription of hours,
labour, wire and beads is **exact**. One line is missing from it:

> **MISSING** — `Total Weld Length = π × Weld Diameter × No. of Beads`.
> Your spec gives the four downstream steps but not the weld length that
> drives them. It is the circumference times the bead count.

**The conflict is now quantified.** For the workbook's own sample —
108 mm weld diameter, 5 beads:

| Method | Result |
|---|---|
| Workbook formula | **₹312.43** per weld |
| "Rs 14 per inch per bead" | 108 mm = 13.36 in → 13.36 × 5 × 14 = **₹935** per weld |

The approved instruction gives **≈3× the workbook**. On a tube with
three welds that is ₹937 vs ₹2,805 — a ₹1,868 swing per cylinder.

Per your instruction I have **not chosen**. But the decision is now
narrow and concrete: the workbook ranks above the spec in your own
hierarchy, and the workbook implements the formula. The Rs 14 figure
exists only as a sentence in the Word reference, with no implementation
anywhere. My reading is that this makes C1 answerable by you without
going back to HISPL — but it is your call, and `masters.js` still
returns no weld cost until you make it.

### C2–C7 — Geometry. **NOT RESOLVED. The workbook proves it cannot be.**

I checked every formula in all 24 sheets for any reference to the
inquiry inputs. There are **16**, and every one is for labelling:

| Sheet | Cells | Purpose |
|---|---|---|
| Cost Summary | B2, B3 | header text |
| Cylinder Database | A5, B5, C5, D5, E5, F5, G5, H5, M5 | record keeping |
| Final Output | B1, B3, B4, B5, B6 | the quotation description string |

**Zero component dimensions derive from Bore, Rod Diameter or Stroke.**
Every dimension on every component sheet is typed by the estimator:

```
Tube  B6 Material Grade  "EN8"    <- typed
      B7 Raw OD          110      <- typed
      B8 Finished OD     108      <- typed
      B9 Finished ID     100.4    <- typed
      B10 Length         900      <- typed
```

This is the single most important structural fact for Stage 3. The v2
goal is to derive ~157 fields from 11 inputs. **The workbook contains no
such derivation, because in HISPL's actual practice the estimator
supplies them.** The geometry standards do not exist to be transcribed —
they would have to be created.

The sample sheet does show relationships, and I record them here
explicitly as **observations from one cylinder, not rules**:

| Observed | Value | Note |
|---|---|---|
| Bore 100 → Tube Finished ID | 100.4 | +0.4 mm |
| Tube Finished OD | 108 | no stated basis |
| Tube Raw OD | 110 | +2 over finished |
| Stroke 800 → Tube Length | 900 | +100 mm |

One sample cannot establish a standard. Deriving a rule from these four
numbers would be exactly the interpolation I undertook not to do. C2–C7
remain open and must surface `ENGINEERING INPUT REQUIRED`.

---

## 4. Defects in the workbook itself

The workbook is a reference implementation, so its defects matter as much
as its formulas. There are three, and two are fatal to its own total.

### Defect 1 — `"Conventional Lathe"` does not exist. Every boring rate is `#N/A`.

```excel
Tube!E28 = INDEX(MachineRateMaster_Range,MATCH("Conventional Lathe",…),2)
        -> #N/A
```

The Machine Rate Master names it **`Center Lathe`**. The lookup string
never matches. In the saved sample the tube's Boring row is set to
`Apply? = No`, so `F28 = IF(A28="Yes", D28*E28, 0) = 0` and the error is
masked. **The moment an estimator sets Boring to `Yes`, the boring cost
becomes `#N/A` and the entire component subtotal follows it.**

The display label in column C also reads "Conventional Lathe", so the
sheet looks internally consistent while being unresolvable.

### Defect 2 — an unfinished rename puts 8 of 12 components in error

Eight component sheets name a material grade that is not in the master:

| Sheet | Grade named | In master? |
|---|---|---|
| Cap End Cover | `MS-C45` | no |
| Head End Cover | `MS-C45` | no |
| Gland | `MS-C45` | no |
| Stop Tube | `MS-EN8` | no |
| Rear Eye | `MS-PLATE-IS2062` | no |
| Rod Eye | `MS-PLATE-IS2062` | no |
| Piston | `MS-EN8` | no |
| Flange | `MS-C45` | no |

The master holds `C45`, `EN8`, `PLATE-IS2062` — and that bare orphan
`MS` row. Someone began prefixing grades with `MS-` and stopped partway,
leaving the master half-edited and the component sheets pointing at
codes that were never created.

Only **Tube** (`EN8`), **Piston Rod** (`EN19`), **Cushion Bush**
(`BR-SAE660`) and **Trunnion** (`EN8`) resolve.

**Consequence — 130 cells across the workbook are in error, and the
workbook does not produce a total:**

```excel
Cost Summary!B19 = SUM(B7:B18)      -> #N/A
Cost Summary!B38 = B19+B32+B35      -> #N/A     TOTAL MANUFACTURING COST
```

Any cached value downstream of those eight components is unusable. This
also means the workbook cannot serve as a numerical baseline for
validation — only as a structural and formula reference.

### Defect 3 — a silent zero, in the pattern the handoff forbids

```excel
Cost Summary!B22 = IFERROR(Tube_Weight,0)+IFERROR(PistonRod_Weight,0)+…
                -> 76.54190031
```

The cylinder weight sums twelve components with `IFERROR(…,0)` on each.
Because eight are `#N/A`, it silently counts them as **zero kilograms**
and reports a confident 76.54 kg for a cylinder missing two thirds of its
parts. The total cost correctly shows `#N/A`; the weight quietly does not.

This is worth flagging beyond the immediate bug: the workbook's own house
style includes a silent-fallback-to-zero. Stage 3 must not inherit it.

---

## 5. Bin boundary semantics — one genuine DIFFERS

The workbook looks up bins with a **"Bin Start"** helper column and
`MATCH(value, bins, 1)`, which selects the largest bin start not
exceeding the value:

```excel
D27 = INDEX(RoughTurningTable, MATCH(B8,TurningODBins,1), MATCH(B10,TurningLenBins,1))
        * VLOOKUP((B7-B8), StockRemovalTable, 3, TRUE())
```

Bin starts are `0, 81, 151, 251` for diameter and `0, 501, 1001, 2001`
for length. `masters.js` implements the same tables as **upper-inclusive
bounds** `[80, 150, 250, null]` and `[500, 1000, 2000, 3000]`.

**These agree on every integer, and differ in the gap between them.**

| Value | Workbook (bin start ≥) | `masters.js` (upper ≤) | Same? |
|---|---|---|---|
| 80 | row 1 | row 1 | ✓ |
| **80.5** | **row 1** | **row 2** | ✗ |
| 81 | row 2 | row 2 | ✓ |
| 250.5 | row 3 | row 4 | ✗ |

This is not hypothetical — the workbook's own sample uses a **fractional
finished ID of 100.4 mm**, so fractional dimensions do occur in practice.
The exposure is narrow (values strictly between a bound and the next bin
start) but real.

**Per the hierarchy, the workbook wins.** Stage 3 should switch
`binIndex()` to bin-start semantics. I have not changed it — no
implementation this pass.

---

## 6. Structural findings against `SPECIFICATION.md`

### MATCHES

- Welding hours / labour / wire / bead-count formulas — exact
- All material, machine, process rates and every time table
- Both rate cards, including the honing threshold semantics
- The 11 inquiry inputs
- Area formula `π × D × L / 100`
- Finish turning = rough × 0.70
- Stock removal factor applied to rough turning only
- Turning rate card keyed on **finished** diameter (`VLOOKUP(B8,…)`,
  where B8 is Finished OD) — col 3 rough, col 4 finish

### MISSING (in the workbook, absent from the spec)

1. **`Total Weld Length = π × Weld Diameter × Beads`** — the line that
   drives the whole welding calculation.
2. **Four weld locations, not one.** Tube carries Part, CEC and Rear Eye
   welds; Piston Rod carries the Rod Eye weld. A per-cylinder welding
   cost is the sum of four blocks, each with its own weld diameter input.
3. **The `New Material?` flag.** Every component sheet has
   `IF(B4="No", 0, …)` on its material cost — the reuse/reconditioning
   path that zeroes material while retaining process cost.
4. **`Apply?` is per-process, not per-component.** Each process row has
   its own Yes/No gate: `F = IF(A="Yes", D*E, 0)`.
5. **Rough Honing and Finished Honing are charged separately at full
   area.** `D30` and `D32` are identical (`π × ID × L / 100`), both at
   the full rate — honing is billed twice over the same surface. This is
   deliberate (the card is titled "Rough Honing & Finished Honing"), but
   it is not in the spec and it doubles the honing line.
6. **Bin-start lookup semantics** (section 5 above).

### EXTRA (in the spec, absent from the workbook)

1. ~~**Geometry derivation from the 11 inputs.**~~ **CORRECTION — this
   is not an EXTRA.** It is a genuine document-vs-workbook disagreement,
   and it belongs in that category, not this one.

   I first logged the cascade requirement as possibly invented in
   `SPECIFICATION.md`. It is not. It is in Aniktha's reference document
   verbatim:

   > "Changing Bore, Tube OD, Stroke or Rod Diameter must cascade to
   > dependent geometry and costing."

   **No such cascade exists in the workbook**, so the document and the
   workbook contradict each other on the central design question. Under
   rule 5 that is a finding to report, not a call to make alone — it is
   question 1 to HISPL.

   Two neighbouring lines in the same document sharpen it:

   > "Do not invent missing geometry values. Missing engineering
   > dimensions must be marked ENGINEERING INPUT REQUIRED."

   — which is precisely the behaviour `engine.js` implements, so the
   document already sanctions the fallback; and

   > "Maintain source/basis and confidence for **future** geometry
   > standards."

   — which reads as though the standards are still to be established.
   Combined with a workbook in which every dimension is typed, the
   likeliest reading is that no written standard exists yet. That is a
   reading, not a conclusion, and HISPL must confirm it.
2. **`rawTubeID = Bore + Tube Boring Allowance`** (`geometryRules` in
   `hispl-masters.json`). The Tube sheet has **no Raw ID input at all** —
   only Raw OD, Finished OD, Finished ID. The rule describes a quantity
   the workbook does not model. See defect note below.
3. **The Rs 14/inch/bead welding rate.** Present in the Word reference as
   prose; implemented nowhere.

Nothing in your spec appears **invented**. The two EXTRA geometry items
are both explicitly flagged as open questions in your own Q5/Q6, which is
the correct handling — they are requirements awaiting an answer, not
fabricated logic.

---

## 7. A formula worth questioning

Reported, not fixed, per the rules.

```excel
Tube!B16 = (PI()/4)*((B7)^2-(B9)^2)*B10*B14/1000000
```

- `B7` = **Raw** OD (110)
- `B9` = **Finished** ID (100.4)

The tube's raw weight is computed from the **raw** outside diameter and
the **finished** inside diameter. If the tube is bored during
manufacture, the raw ID is smaller than the finished ID, so the true raw
annulus is thicker than this and the formula **understates** purchased
weight.

It may well be deliberate — if HISPL buys seamless tube already close to
finished bore, raw ID ≈ finished ID and the formula is right. But it is
inconsistent with `hispl-masters.json`'s own
`rawTubeID = Bore + Tube Boring Allowance`, which asserts a distinct raw
ID that the sheet has no field for. One of the two is wrong. This needs
HISPL's word.

The unit conversion is correct: mm³ × (g/cm³) / 10⁶ = kg.

---

## 8. `COST_SHEET.xlsx` — your cleaning verified exactly

| | |
|---|---|
| Rows in workbook (header at row 2) | **304** |
| Dropped: `stroke <= 0` | 1 |
| Dropped: `stroke >= 5000` | 4 |
| Dropped: non-numeric | 4 |
| Dropped: `weight <= 0` | **0** — never fired |
| Dropped: `bore >= 600` | **0** — never fired |
| **Survivors** | **295** ✓ |

**295 is correct.** Two of your five filters were defensive and never
triggered; no harm, but the effective clean was stroke-based only.

### The 5 impossible rows are HISPL's, not yours

Six rows in the original have rod diameter ≥ bore. One (`stroke = 0`) was
removed by your stroke filter, leaving five in the CSV.

| xlsx row | Bore | Rod | Stroke | Weight | Total | |
|---|---|---|---|---|---|---|
| 13 | 31 | 110 | 125 | 421 kg | ₹1,31,850 | survives |
| 28 | 110 | 272 | **0** | 668 kg | ₹1,72,050 | dropped by stroke filter |
| 117 | 127 | 143 | 1221 | 43 kg | ₹15,350 | survives |
| 167 | 36 | 36 | 280 | 78 kg | ₹34,000 | survives |
| 232 | 480 | 480 | 1000 | 5974 kg | ₹14,96,641 | survives |
| 280 | 70 | 320 | 850 | 4785 kg | ₹9,30,844 | survives |

**Your processing introduced nothing.** These are defects in HISPL's
source data. A 31 mm bore cylinder weighing 421 kg is not a cylinder, and
a 70 mm bore cannot house a 320 mm rod. Most likely the BORE and ROD
columns hold something else on those rows.

They matter beyond tidiness: the ₹/kg band targets **1003 / 522 / 352 /
318 reproduce exactly only when these rows are included**, so HISPL
derived those targets with the corrupt rows in the population.

---

## 9. What changes for Stage 3

1. **C1 is answerable now.** The workbook implements welding completely.
   You need only rule on workbook formula vs. Rs 14/inch/bead — a ~3×
   difference, ₹1,868 per cylinder on a three-weld tube.
2. **C2–C7 are confirmed unanswerable from any source you hold.** The
   geometry standards do not exist in the workbook. They must come from
   HISPL as new approved standards, or every derived dimension surfaces
   `ENGINEERING INPUT REQUIRED`. This is not a gap in your extraction; it
   is a gap in the source.
3. **`masters.js` needs one change** — bin-start lookup semantics, to
   match the workbook on fractional dimensions.
4. **Three workbook defects** (`Conventional Lathe`, the `MS-` rename,
   the `IFERROR` weight) should go back to HISPL. The first two mean
   their own workbook has not produced a total in its current state.
5. **Four new component-model facts** must be built in: four weld
   locations, the `New Material?` reuse flag, per-process `Apply?` gates,
   and honing charged twice at full area.

Nothing was modified. No implementation this pass.
