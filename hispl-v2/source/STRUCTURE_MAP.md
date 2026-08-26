# STRUCTURE MAP — the 12 component sheets

The Section A / B / C / D / E shape of every component sheet in
`Trunion_Included.xlsx`, with cell addresses. This is the shape
`components.js` must reproduce.

Read alongside `EXTRACTED_FORMULAS.md`, which carries every formula and
cached value, and `RECONCILIATION.md`, which records what differs from
the specification.

---

## The common shape

Every one of the twelve sheets follows the same skeleton. Only the
geometry in Section A and the process list in Section B vary.

```
A1                     <component> - COSTING SHEET

SECTION A              MATERIAL INPUTS            <- all TYPED by estimator
  B4                     New Material? (Yes/No)
  B<n>                   Material Grade           -> keys the master lookup
  B<n+1..>               geometry: OD / ID / Length / Thickness
  B<q>                   Quantity (Nos)

AUTO CALCULATE         MATERIAL                   <- all DERIVED
  Density              = INDEX(MaterialMaster_Range, MATCH(grade,…), 3)
  Material Rate        = INDEX(MaterialMaster_Range, MATCH(grade,…), 4)
  Unit Weight (kg)     = <geometry> x Density / 1000000
  Total Weight for Qty = Unit Weight x Qty
  Material Cost / pc   = IF(New Material?="No", 0, Unit Weight x Rate)
  Total Material Cost  = Material Cost x Qty

SECTION B              PROCESS ROUTING            <- a table, one row per process
  col A                  Apply?      Yes / No     <- TYPED
  col B                  Process                  <- label
  col C                  Machine / Basis          <- label
  col D                  Hours / Qty Basis        <- LOOKED-UP
  col E                  Rate (Rs.)               <- LOOKED-UP
  col F                  Cost = IF(A="Yes", D*E, 0)

SECTION C              WELDING                    <- Tube and Piston Rod only

SUBTOTAL               Process & Vendor Cost = SUM(col F) + welding totals

SECTION D              ADDITIONAL COST (Manual Entry)   <- TYPED, default 0
  B<n>                   Additional Cost / pc
  B<n+1>                 Remarks

SECTION E              COMPONENT COST SUMMARY
  Material Cost        = <Section A material cost>
  Process Cost         = <subtotal>
  Additional Cost      = <Section D>
  TOTAL / pc           = Material + Process + Additional
  TOTAL for Qty        = TOTAL / pc x Qty
```

### The three cell kinds

| Kind | How to recognise it | Rule for `components.js` |
|---|---|---|
| **INPUT** | literal value, no `<f>` | estimator-supplied; if not derivable from the 11 inputs, `ENGINEERING INPUT REQUIRED` |
| **LOOKED-UP** | formula containing `INDEX` / `MATCH` / `VLOOKUP` | must resolve through `masters.js`, never a literal |
| **DERIVED** | formula with only arithmetic | pure function of cells above it |

### Two gates control everything

1. **`New Material?`** (`B4` on every sheet) — component-level.
   `IF(B4="No", 0, weight × rate)`. Zeroes **material only**; process
   cost still applies. This is the reconditioning / reuse path.
2. **`Apply?`** (column A of each Section B row) — per-process.
   `IF(A="Yes", D*E, 0)`. Each process is independently switchable.

A component is never "off" as a whole. It is off by having no material
and no applied processes.

---

## Per-sheet map

`+` = `Apply? = Yes` in the saved sample, `−` = `No`.

### Tube — 51 formulas · the reference implementation

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6`, Raw OD `B7`, Finished OD `B8`, Finished ID `B9`, Length `B10`, Qty `B11` |
| Drilling inputs | Hole Dia `B21`, No. of Holes `B22` |
| Auto — material | `A13`, density `B14`, rate `B15`, unit wt `B16`, total wt `B17`, mat cost `B18`, total mat `B19` |
| B — process routing | `A24`, rows **26–32** |
| C — welding | `A34`; Part `35–42`, CEC `44–51`, Rear Eye `53–60` |
| Subtotal | `A62`, `B63` |
| D — additional | `A65`, cost `B66`, remarks `B67` |
| E — summary | `A69`, rows `71–75` |

Processes (7): `+Cutting` `+Rough Turning` `−Boring` `+Drilling`
`+Rough Honing` `+Finish Turning` `+Finished Honing`

```excel
B63 = F26+F27+F28+F29+F30+F31+F32 + B42+B51+B60
B74 = B18+B63+B66
```

> **Boring row is broken.** `E28` looks up `"Conventional Lathe"`, which
> is not a machine in the master (`Center Lathe` is). It returns `#N/A`,
> masked only because `Apply? = No`. See `RECONCILIATION.md` defect 1.

### Piston Rod — 46 formulas · the widest process list

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6` |
| Auto — material | `A12` |
| B — process + vendor | `A24`, rows **26–35** |
| C2 — welding | `A38`; Rod Eye `39–46` |
| Subtotal | `A48` |
| D — additional | `A51` |
| E — summary | `A55` |

Processes (10): `+Cutting` `+Rough Turning` `+Heat Treatment`
`+Induction Hardening` `+Finish Turning` `+Grinding` `+Chrome Plating`
`+Polishing` `+Milling` `+Deep Hole Drilling`

The only sheet mixing machine-hour processes with area-based vendor
processes (chrome, polish, induction) in one Section B table.

### Cap End Cover — 21 formulas

| Section | Cells |
|---|---|
| A — material inputs | `A3`, shape `B5`, grade `B7`, Diameter `B8`, Width `B9`, Height `B10`, Thickness `B11`, Finished OD `B12`, qty `B13` |
| Auto — material | `A15`, density `B16`, rate `B17`, unit wt `B18`, mat cost `B20` |
| B — process routing | `A28`, rows **30–32** |
| Subtotal | `A34`, `B35` |
| D — additional | `A37`, `B38` |
| E — summary | `A41`, `B43` mat, `B46` total, `B47` for qty |

Processes (3): `+Turning` `+Milling` `−Drilling`

Note `B12` **Finished OD** is an input but takes no part in the weight
formula — weight comes from the raw blank (`B8` or `B9`×`B10`, × `B11`).

**Round-or-rectangular branch** — the only geometry conditional in the
workbook:

```excel
B18 = IF(B5="Round", (PI()/4)*(B8)^2*B11*B16/1000000,
                     (B9)*(B10)*B11*B16/1000000)
```

> Currently `#N/A` — grade `MS-C45` is not in the master.

### Head End Cover — 21 formulas

Cell-for-cell identical to Cap End Cover, including the `Round` branch.
Processes (3): `+Turning` `+Milling` `+Drilling` — the only difference
from CEC in the sample is that Drilling is applied.

> Currently `#N/A` — grade `MS-C45`.

### Gland — 24 formulas

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6`, OD `B7`, ID `B8`, Length `B9`, qty `B10` |
| Auto — material | `A12`, density `B13`, rate `B14`, unit wt `B15`, mat cost `B17` |
| B — process routing | `A25`, rows **27–30** |
| Subtotal | `A32`, `B33` |
| D — additional | `A35`, `B36` |
| E — summary | `A39`, `B41` mat, `B44` total, `B45` for qty |

Processes (4): `+Turning` `+Milling` `+Drilling` `+Grinding (ID bore)`

Annulus weight: `B15 = (PI()/4)*((B7)^2-(B8)^2)*B9*B13/1000000`

> Currently `#N/A` — grade `MS-C45`.

### Cushion Bush — 18 formulas · **resolves cleanly**

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6` (`BR-SAE660`) |
| Auto — material | `A12` |
| B — process routing | `A21`, rows **23–24** |
| Subtotal | `A26` |
| D — additional | `A29` |
| E — summary | `A33` |

Processes (2): `+Turning` `+Grinding (ID bore)`

The only sheet using bronze, and therefore the only one exercising a
non-7.85 density (**8.9**) end to end.

### Stop Tube — 15 formulas · the simplest

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6`, Raw Diameter `B7`, Finished Diameter `B8`, Length `B9`, qty `B10` |
| Auto — material | `A12`, unit wt `B15`, mat cost `B17` |
| B — process routing | `A20`, row **22** only |
| Subtotal | `A24` |
| D — additional | `A27` |
| E — summary | `A31`, `B36` total |

Processes (1): `+Turning`

Solid-cylinder weight: `B15 = (PI()/4)*((B7)^2)*B9*B13/1000000`

> Currently `#N/A` — grade `MS-EN8`.

### Rear Eye — 21 formulas · **profile-cut, not turned**

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6`, Raw Plate Thickness `B7`, Width `B8`, Height `B9`, Pin Hole Dia `B10`, qty `B11` |
| Auto — material | `A13`, unit wt `B16`, mat cost `B18` |
| B — process routing | `A23`, rows **25–27** |
| Subtotal | `A29`, `B30` |
| D — additional | `A32` |
| E — summary | `A36`, `B41` total |

Processes (3): `+Profile Cutting` `+Milling` `+Drilling`

Rectangular block, Width x Height x Thickness: `B16 = (B8)*(B9)*(B7)*B14/1000000`

**Profile Cutting is weight-based, not time-based** — `D25 = B16` feeds
the component *weight* into the cost row, charged at Rs/kg:

```excel
D25 = B16                          <- weight, not hours
F25 = IF(A25="Yes", D25*E25, 0)
```

> Currently `#N/A` — grade `MS-PLATE-IS2062`.

### Rod Eye — 21 formulas

Same profile-cut pattern as Rear Eye, plus the `Round`/rectangular
branch from the covers.

| Section | Cells |
|---|---|
| A — material inputs | `A3`, shape `B5`, grade `B7`, Diameter `B8`, Width `B9`, Height `B10`, Thickness `B11`, Pin Hole Dia `B12`, qty `B13` |
| Auto — material | `A15`, unit wt `B18`, mat cost `B20` |
| B — process routing | `A25`, rows **27–29** |
| Subtotal | `A31`, `B32` |
| D — additional | `A34` |
| E — summary | `A38`, `B43` total |

Processes (3): `+Profile Cutting` `+Milling` `+Drilling`
Weight into cost: `D27 = B18`.

> Currently `#N/A` — grade `MS-PLATE-IS2062`.

### Piston — 21 formulas

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6`, OD `B7`, Length `B8`, qty `B9` |
| Auto — material | `A11`, density `B12`, unit wt `B14`, mat cost `B16` |
| B — process routing | `A24`, rows **26–28** |
| Subtotal | `A30`, `B31` |
| D — additional | `A33` |
| E — summary | `A37`, `B42` total |

Processes (3): `+Finish Turning` `+Milling` `+Drilling`

Solid disc from OD and Length: `B14 = (PI()/4)*((B7)^2)*B8*B12/1000000`.
`D26 = B14` — weight-based first process, as on the eyes.

> Currently `#N/A` — grade `MS-EN8`.

### Flange — 21 formulas

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6`, OD `B7`, Length `B8`, qty `B9` |
| Auto — material | `A11`, unit wt `B14`, mat cost `B16` |
| B — process routing | `A24`, rows **26–28** |
| Subtotal | `A30` |
| D — additional | `A33` |
| E — summary | `A37`, `B42` total |

Processes (3): `+Turning` `+Milling` `+Drilling`
Same solid-disc geometry as Piston.

> Currently `#N/A` — grade `MS-C45`.

### Trunnion — 18 formulas · **resolves cleanly**

| Section | Cells |
|---|---|
| A — material inputs | `A3`, grade `B6` (`EN8`) |
| Auto — material | `A12` |
| B — process routing | `A25`, rows **27–31** |
| Subtotal | `A33` |
| D — additional | `A36` |
| E — summary | `A40` |

Processes (5): `+Rough Turning` `+Finished Turning` `+Pin Grinding`
`+Milling` `+Drilling`

The sheet the workbook is named for. `hispl-masters.json` records
`trunnionThickness = (Trunnion OD − Pin Diameter) / 2`; the sheet takes
those dimensions as typed inputs.

---

## Section D feeds the total unconditionally

On all twelve sheets, Section D is a manual rupee figure with a free-text
remark, defaulting to `0`, added straight into the component total:

```excel
TOTAL / pc = Material Cost + Process Cost + Additional Cost
```

It is not gated by `Apply?` or by `New Material?`. It is the estimator's
escape hatch, and it is the only place in a component sheet where a bare
rupee value enters the total without passing through a master.

`components.js` must keep it — removing it would leave estimators no way
to price anything the model does not cover.

---

## Roll-up

```
12 component sheets
   |  each exposes <Name>_TotalCost, <Name>_MaterialCost,
   |               <Name>_ProcessCost, <Name>_Weight  (defined names)
   v
Cost Summary
   B7..B18   the twelve component totals
   B19       = SUM(B7:B18)                      component manufacturing cost
   B22       = IFERROR(each weight, 0) summed   <- silent zero, see RECONCILIATION
   B24       = B22 + B23                        total cylinder weight
   B27..B31  seal kit, bought out, assembly, painting, packing
   B32       = SUM(B27:B31)
   B35       = IF(ReconditioningInclude="Yes", Reconditioning_TotalCost, 0)
   B38       = B19 + B32 + B35                  TOTAL MANUFACTURING COST
   v
Final Output    quotation surface
```

Components communicate with the summary **only through defined names** —
there are no direct sheet references. That indirection is worth
preserving: it is what lets a component sheet be restructured without
touching the roll-up.

> In the saved workbook `B19` and `B38` are both `#N/A`, because eight of
> the twelve components fail their material lookup. The workbook does not
> currently compute a total.
