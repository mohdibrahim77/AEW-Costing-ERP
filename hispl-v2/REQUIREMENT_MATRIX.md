# HISPL Costing v2 — Requirement Matrix

Phase 2 deliverable. Every requirement traced from user input through
master data and rule to output. Built from `Trunion_Included.xlsx`,
the HISPL developer reference, and 295 historical cylinders.

**Legend**
`✅ ready` — master data supplied, buildable now
`⚠️ ambiguous` — conflicting or unclear instruction, needs Aniktha
`🔴 blocked` — required data does not exist yet

---

## A. Inquiry inputs — the only things a user types

| # | Input | Type | Source | Drives |
|---|---|---|---|---|
| 1 | Inquiry No. | text | user | identity, Cylinder Database key |
| 2 | Inquiry Date | date | auto = today | record |
| 3 | Customer Name | text | user | quotation header |
| 4 | Customer Location | text | user | quotation header, freight |
| 5 | Cylinder Name / Application | text | user | quotation header |
| 6 | **Bore (mm)** | number | user | tube ID, all bore-band geometry lookups |
| 7 | **Rod Diameter (mm)** | number | user | rod geometry, gland ID |
| 8 | **Stroke (mm)** | number | user | tube length, rod length, honing rate band |
| 9 | **Mounting Type** | select | user | which components are active |
| 10 | **Working Pressure (bar)** | number | user | wall thickness, trunnion sizing |
| 11 | Job Type | select | user | Manufacturing / Reconditioning path |

**Everything else must be derived.** Current tool exposes ~157 fields;
target is 11.

---

## B. Geometry derivation

| Requirement | User input | Master data | Rule | Output | Status |
|---|---|---|---|---|---|
| Finished tube ID | Bore | — | `= Bore` | mm | ✅ ready |
| Finished tube OD | — | Tube Geometry Master | lookup by bore | mm | 🔴 blocked |
| Raw tube ID | Bore | Tube Geometry Master | `Bore + boring allowance` | mm | 🔴 blocked |
| Raw tube OD | — | Tube Geometry Master | `OD + OD turning allowance` | mm | 🔴 blocked |
| Tube length | Stroke | Geometry Master | length basis | mm | ⚠️ ambiguous |
| Rod finished OD | Rod dia | — | `= Rod dia` | mm | ✅ ready |
| Rod raw OD | Rod dia | Piston Rod Geometry Master | `+ raw OD allowance` | mm | 🔴 blocked |
| Rod length | Stroke | Piston Rod Geometry Master | length basis | mm | ⚠️ ambiguous |
| CEC / HEC dimensions | Bore | CEC/HEC Geometry Master | band lookup | OD, thickness, length, bolts | 🔴 blocked |
| Gland dimensions | Bore, Rod | Gland Geometry Master | band lookup | OD, ID, length, guide length | 🔴 blocked |
| Piston dimensions | Bore | Piston Geometry Master | band lookup | OD, width | 🔴 blocked |
| Cushion bush | Bore | Cushion Bush Geometry Master | band lookup | OD, ID, length, material | 🔴 blocked |
| Stop tube | Bore | Stop Tube Geometry Master | required Y/N, ID, OD, length | mm | 🔴 blocked |
| Rear eye / Rod eye | Bore, Rod | Eye Geometry Masters | band lookup | pin dia, eye OD, width, weld length | 🔴 blocked |
| Trunnion | Bore, OD, Pressure | Trunnion Geometry Master | band lookup | trunnion OD, pin dia, length | 🔴 blocked |
| Trunnion thickness | — | — | `(Trunnion OD − Pin dia) / 2` | mm | ✅ ready |
| Flange | Bore, Tube OD | Flange Geometry Master | band lookup | OD, ID, thickness, bolts | 🔴 blocked |
| **Manual override** | any dimension | — | override wins over standard, **master unchanged** | mm | ✅ ready |

> **Her rule, verbatim:** *"Do not invent missing geometry values. Missing
> engineering dimensions must be marked ENGINEERING INPUT REQUIRED."*
> Every 🔴 row must surface that marker on screen, not a guess.

---

## C. Weight and area

| Requirement | Inputs | Master data | Rule | Output | Status |
|---|---|---|---|---|---|
| Tube / ring / bush volume | OD, ID, L | — | `π/4 × (OD² − ID²) × L` | mm³ | ✅ ready |
| Solid rod volume | OD, L | — | `π/4 × OD² × L` | mm³ | ✅ ready |
| Component weight | volume | Material Master → density | `volume × density × 1e-6` | kg | ✅ ready |
| Cylindrical surface area | dia, L | — | `π × D × L` | mm² | ✅ ready |
| Area conversion | — | — | `mm² / 100` | cm² | ✅ ready |

> **Defect to fix:** the current tool hard-codes density 7.85 everywhere.
> SS-410 is **7.7**, bronze SAE660 is **8.9**. Density must come from
> Material Master per grade.

---

## D. Material cost

| Requirement | Inputs | Master data | Rule | Output | Status |
|---|---|---|---|---|---|
| Material rate | grade | Material Master (9 grades) | lookup | Rs/kg | ✅ ready |
| Material cost | weight, rate | — | `weight × rate` | Rs | ✅ ready |
| Reused component | New Material? = No | — | **material cost = 0** | Rs | ✅ ready |

**Rates supplied.** EN8 68 · EN19 92 · EN24 118 · C45 66 · ST52 78 ·
SS-410 210 · BR-SAE660 520 · EN353 96 · PLATE-IS2062 62.

---

## E. Machining time and cost

| Process | Time inputs | Time source | Rate source | Status |
|---|---|---|---|---|
| Cutting | OD, length | Cutting table | Machine Rate 350 | ✅ ready |
| Rough turning | Finished OD, length | Rough Turning table **× stock removal factor** | **Turning Rate Card** | ✅ ready |
| Finish turning | Finished OD, length | `rough × 0.70` | **Turning Rate Card** | ✅ ready |
| Boring | Finished ID, bore length | Boring table | Center Lathe 500 | ✅ ready **(new)** |
| Milling | machined area `W × L` | Milling table | Milling 350 | ✅ ready **(new)** |
| Drilling | hole dia × holes | Drilling table | Drilling 250 | ✅ ready |
| Honing | ID, length | *utilisation only* | **Honing Rate Card, Rs/cm²** | ✅ ready |
| Grinding | OD, length | *utilisation only* | Process Rate 0.40 Rs/cm² | ✅ ready |
| Profile cutting | weight | *utilisation only* | Process Rate 1.25 Rs/kg | ✅ ready **(new)** |
| Welding | dia, beads | — | see F | ⚠️ **ambiguous** |

**Turning Rate Card** overrides the flat machine rate, by finished diameter:

| Diameter | Rough Rs/hr | Finish Rs/hr |
|---|---|---|
| ≤ 100 mm | 300 | 400 |
| 101–250 mm | 550 | 550 |
| > 250 mm | 700 | 700 |

**Honing Rate Card** — `cost = internal area (cm²) × rate`

`0.30` if stroke ≤ 4000 **and** ID ≤ 100 · `0.40` if **either** exceeded

> **Trap:** the Word document's table extraction is mangled and shows
> 300/400/550/700 under the Honing heading. Those are the **turning**
> rates. Verified against the workbook directly.

> **Design note:** honing, grinding and profile-cutting hours are
> **utilisation reference only** — the Dashboard uses them for machine
> loading. Cost comes from the rate cards. This explains the current
> tool's unused `TF` table and its displayed-but-uncosted honing hours.

---

## F. Welding — ⚠️ BLOCKING AMBIGUITY

| Source | Formula |
|---|---|
| **Workbook** | `hours = weld length ÷ 3600`, `labour = hours × 375`, `wire = hours × 0.8 × 360`, beads = 5 if dia ≤ 250 else 8 |
| **Reference doc note** | *"the later approved HISPL instruction to use **Rs 14 per inch per bead** should be applied as a subsequent controlled update if it is not yet reflected in the workbook"* |

These produce materially different numbers. **Must be resolved before any
welding cost is trusted.** Implement whichever she confirms; do not
average, do not pick.

---

## G. Bought-out items

| Item | Rate | Qty | Default |
|---|---|---|---|
| Bearing | 180 | 2 | **include** |
| Check Valve | 650 | 1 | exclude |
| Transducer | 4500 | 1 | exclude |
| Bellows | 850 | 1 | exclude |
| Other 1–5 | 0 | 1 | exclude, renameable |

Seal master **excluded at HISPL's request** — do not model seals.

---

## H. Mounting-driven activation — ⚠️ needs confirmation

Codes observed in 295 historical cylinders:

`RE+CL` 82 · `TR+RE` 33 · `RE+TR` 30 · `MF` 22 · `RE` 13 · `CL` 11 ·
`LUG` 8 · `CL+RE` 8 · `DA TR` 7 · `DA FF` 6 · `FF` 4 · `BC DA` 3

Presumed: RE = Rear Eye · CL = Clevis · TR = Trunnion · MF = Mounting
Flange · FF = Front Flange · LUG = Foot Lug · DA = Double Acting.
**Confirm with Aniktha.**

| Requirement | Rule | Status |
|---|---|---|
| Component activation | mounting code → set of active components | ⚠️ ambiguous |
| Inactive component cost | **must be exactly zero** | ✅ ready |

---

## I. Roll-up and commercials

| Requirement | Rule | Status |
|---|---|---|
| Component total | material + process + additional | ✅ ready |
| Assembly / painting / packing | area and weight based | ✅ ready |
| Packing | `weight × 5` loose, `× 15` wooden box | ✅ ready |
| Manufacturing cost | sum of all active components | ✅ ready |
| **Overhead** | **not present anywhere in the workbook** | ⚠️ ambiguous |
| Margin | user-entered % | ✅ ready |
| Order value | selling price × qty | ✅ ready |

> **Empirical finding:** across 295 historical cylinders, TOTAL exceeds
> (material + process) by a **median 42.3%** — quartiles 30.6% to 58.2%.
> Whether that is overhead, margin or both is unresolved. This is the
> overhead question, now backed by her own data.

---

## J. Validation targets

From 295 real FY 25-26 cylinders. Any rebuild must land in these bands.

| Bore band | n | Material Rs/kg | Process Rs/kg | **Total Rs/kg** |
|---|---|---|---|---|
| < 60 | 21 | 187 | 515 | **1,003** |
| 60–110 | 121 | 139 | 202 | **522** |
| 110–180 | 96 | 129 | 116 | **352** |
| > 180 | 57 | 134 | 85 | **318** |

Material cost per kg is stable across sizes, as expected. Process cost per
kg falls sharply — genuine economies of scale.

**Current gap:** tool produces Rs 18,092 for a 100 × 56 × 500. HISPL's
actual median for bore 90–110 is **Rs 50,900**. The tool is ~2.8× low,
because it weighs only the tube and rod (43 kg) against HISPL's actual
131 kg for a comparable cylinder. The missing 88 kg is every machined
component, currently carried as a flat typed price.

---

## K. Blockers, ranked

| # | Blocker | Impact | Owner |
|---|---|---|---|
| 1 | Welding formula ambiguity | every weld cost wrong | Aniktha |
| 2 | Geometry masters do not exist | automation impossible; the 2.8× gap | Aniktha |
| 3 | Overhead treatment unknown | 30–58% of final price | Aniktha |
| 4 | Mounting code meanings | wrong components activated | Aniktha |
| 5 | Tube OD source | listed as input but not among the 11 | Aniktha |
| 6 | Boring / turning allowances | raw-size derivation | Aniktha |

**Ask for geometry on four bores only — 80, 100, 125, 160.** For each:
CEC OD/thickness/length, HEC the same, gland OD/ID/length, piston
OD/width. Sixteen numbers per bore, sixty-four total — a half-hour for
her engineering team rather than eighteen complete masters.

> **Scope limit.** Those four sets authorise those four bore mappings
> only. No interpolation to intermediate sizes, no extrapolation beyond
> the range. Every other bore surfaces `ENGINEERING INPUT REQUIRED` until
> Aniktha approves either more values or an explicit derivation rule.
