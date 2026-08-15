# WORKED_EXAMPLE.md — one costing traced by hand

> ## ⚠ This document records the audit as it stood on 2026-08-14, **before** the patch
>
> The hand-trace in sections 0–8 is what the ERP did at business-logic
> hash `304a7d3070ebe34f72706af4d60c23a1`. Every calculated line matched
> — that finding stands, and it is why the patch touched the plumbing
> and not the formulas.
>
> **Defects 1, 2 and 3 and the ₹1 / ₹4 rounding discrepancies are now
> fixed** (hash `afb92d49a6c7315589835c2402781b9a`, CHANGELOG 2026.08.14).
> The evidence below is kept as the record of what was wrong and how it
> was proved.
>
> **Current figures for the same job**, Ø100 × Ø56 × 500 qty 10:
>
> | | before | after |
> |---|---|---|
> | raw rod bar | 52 mm (impossible) | **60 mm** |
> | rod total | ₹4,716 | **₹5,195** |
> | tube total | ₹5,620 | **₹5,621** |
> | manufacturing cost | ₹17,589 | **₹18,092** |
> | selling price @20 % | ₹21,107 | **₹21,710** |
> | order value ×10 | ₹2,11,066 | **₹2,17,100** |
> | PDF manufacturing cost | ₹13,389 | **₹18,092** |
> | PDF selling price @0 % | ₹16,067 *(below cost)* | **₹18,092** |
>
> ₹503 of the increase is the rod stock correction; the rest is
> round-then-sum. Live assertions for all of it are in
> `tests/formulas.js` sections 4, 5 and 8.

**Job:** Ø100 mm bore × Ø56 mm rod × 500 mm stroke, quantity 10.
Tube ST52, rod EN8, all other inputs at shipped defaults.

Every figure below was computed by hand from the formulas in
`FORMULAS.md`, then compared against what the ERP displays. The ERP
column is what appears on screen; the hand column is independent
arithmetic.

---

## 0. Derived geometry

`propagate()` sets these from the enquiry; `autoFixTubeOD()` then
raises the tube OD because the shipped 75 mm raw OD cannot contain a
100 mm bore.

| Field | Value | Source |
|---|---|---|
| `t-id` bore | 100 mm | = enquiry bore |
| `t-len` | 700 mm | = stroke + 200 |
| `t-rod` raw OD | 125 mm | `deriveTubeOD(100)` = 100 + 2×12.5 |
| `t-fod` finished OD | 120 mm | raw − 5 |
| `r-fdia` finished rod | 56 mm | = enquiry rod dia |
| `r-len` | 850 mm | = stroke + 350 |
| `r-rdia` **raw rod** | **52 mm** | **shipped default, never updated** |

⚠ **Raw rod diameter 52 mm is smaller than the finished 56 mm.** See
DEFECT 3.

---

## 1. Tube — material

```
volume = (π/4)(125² − 100²)(700)
       = 0.7853981634 × 5625 × 700
       = 3 092 505.27 mm³
mass   = 3 092 505.27 × 7.85e-6 = 24.276 166 kg → r2 → 24.28 kg
cost   = 24.28 × 160 = ₹3 884.80
```

| | Hand | ERP | |
|---|---|---|---|
| weight | 24.28 kg | 24.28 kg | ✔ |
| rate | ₹160/kg | ₹160/kg | ✔ |
| material cost | ₹3 884.80 | ₹3,885 | ✔ |

## 2. Tube — the eight operations

| # | Op | Hours (hand) | Cost (hand) | ERP | |
|---|---|---|---|---|---|
| 1 | Cutting | `lkp(TA,125,700)` = **0.15** | 0.15×150 + 0.5×100 = **₹72.50** | ₹73 | ✔ |
| 2 | Rough turn | sr = 125−120 = 5 → srF = 1.15; `lkp(TB,120,700)` = 0.90; 0.90×1.15 = **1.035** | 1.035×300 + 1×100 = **₹410.50** | ₹411 | ✔ |
| 3 | Drilling | `drT(12)` = 0.05 × 4 holes = **0.20** | 0.20×250 + 0.5×100 = **₹100.00** | ₹100 | ✔ |
| 4 | Part weld | len = π×6×2 = 37.699 mm; h = /3600 = **0.010472** | lab 3.927 + wire 3.016 = 6.94; +0.5×100 = **₹56.94** | ₹57 | ✔ |
| 5 | Honing | area = π×100×700/100 = **2199.11 cm²** | 2199.11×0.30 + 0.5×100 = **₹709.73** | ₹710 | ✔ |
| 6 | Finish turn | 1.035 × 0.70 = **0.7245** | 0.7245×300 + 0.5×100 = **₹267.35** | ₹267 | ✔ |
| 7 | CEC weld | len = π×8×2 = 50.265; h = **0.013963** | lab 5.236 + wire 4.021 = 9.26; +50 = **₹59.26** | ₹59 | ✔ |
| 8 | Rear-eye weld | same as 7 | **₹59.26** | ₹59 | ✔ |

```
process total = 72.50 + 410.50 + 100.00 + 56.94
              + 709.73 + 267.35 + 59.26 + 59.26
              = ₹1 735.54                      ERP: ₹1,736  ✔
tube total    = 3 884.80 + 1 735.54 = ₹5 620.34  ERP: ₹5,620  ✔
```

Honing **hours** displayed as 0.9 hr come from `lkp(TD,100,700)`. They
do not enter the cost — see DEFECT 6.

---

## 3. Rod — material

```
mass = (π/4)(52²)(850)(7.85e-6) = 14.170 5 kg → r2 → 14.17 kg
cost = 14.17 × 80 = ₹1 133.60
```

| | Hand | ERP | |
|---|---|---|---|
| weight | 14.17 kg | 14.17 kg | ✔ |
| material cost | ₹1 133.60 | ₹1,134 | ✔ |

⚠ This is the mass of **52 mm** bar. The finished rod is 56 mm. See
DEFECT 3.

## 4. Rod — the eight operations

| # | Op | Basis (hand) | Cost (hand) | ERP | |
|---|---|---|---|---|---|
| 1 | Cutting | `lkp(TA,52,850)` = 0.10 hr | 0.10×150 + 0.5×100 = **₹65.00** | ₹65 | ✔ |
| 2 | Rough turn | sr = 52−56 = **−4** → clamped 0 → srF 1.00; `lkp(TB,56,850)` = 0.60 | 0.60×300 + 1×100 = **₹280.00** | ₹280 | ✔ |
| 3 | Heat treat | 14.17 kg × ₹12 | 170.04 + 0.25×100 = **₹195.04** | ₹195 | ✔ |
| 4 | Induction hard | area = π×56×850/100 = 1495.40 cm² | 1495.40×0.45 + 0.5×100 = **₹722.93** | ₹723 | ✔ |
| 5 | Finish turn | 0.60 × 0.70 = 0.42 hr | 0.42×300 + 0.5×100 = **₹176.00** | ₹176 | ✔ |
| 6 | Grinding | 1495.40 cm² | ×0.30 + 0.5×100 = **₹498.62** | ₹499 | ✔ |
| 7 | Chrome | 1495.40 cm² | ×0.85 + 0.25×100 = **₹1 296.09** | ₹1,296 | ✔ |
| 8 | Polishing | 1495.40 cm² | ×0.20 + 0.5×100 = **₹349.08** | ₹349 | ✔ |

```
process total = 65.00 + 280.00 + 195.04 + 722.93
              + 176.00 + 498.62 + 1 296.09 + 349.08
              = ₹3 582.76                      ERP: ₹3,583  ✔
rod total     = 1 133.60 + 3 582.76 = ₹4 716.36  ERP: ₹4,716  ✔
```

---

## 5. Machined components (from `ERP_RATE_CARD`)

| Component | mat | proc | lab | total | ERP | |
|---|---|---|---|---|---|---|
| Cap End Cover | 180 | 360 | 120 | 660 | ₹660 | ✔ |
| Head End Cover | 200 | 420 | 140 | 760 | ₹760 | ✔ |
| Gland | 140 | 380 | 110 | 630 | ₹630 | ✔ |
| Cushion Bush | 60 | 150 | 50 | 260 | ₹260 | ✔ |
| Stop Tube | 80 | 90 | 40 | 210 | ₹210 | ✔ |
| Rear Eye | 150 | 280 | 100 | 530 | ₹530 | ✔ |
| Rod Eye | 150 | 280 | 100 | 530 | ₹530 | ✔ |
| Piston | 170 | 340 | 110 | 620 | ₹620 | ✔ |
| **Sum** | | | | **4 200** | | ✔ |

## 6. Bill of materials

| Line | qty × rate | total | ERP | |
|---|---|---|---|---|
| Bronze Guide Bush 63 ID | 1 × 280 | 280 | | |
| Wear Ring PTFE 63 | 2 × 110 | 220 | | |
| **Bearings** | | **500** | ₹500 | ✔ |
| Piston Seal 63 DA | 1 × 210 | 210 | | |
| Rod Seal 45 | 1 × 165 | 165 | | |
| **Seals** | | **375** | ₹375 | ✔ |
| Fasteners, ports, nipple, plate | 1 × 340 | 340 | ₹340 | ✔ |
| **BOM grand** | | **1 215** | ₹1,215 | ✔ |

## 7. Assembly, painting, freight, packing

| Item | Hand | ERP | |
|---|---|---|---|
| Assembly 4 hr × ₹100 | ₹400.00 | ₹400 | ✔ |
| Testing 1 hr × ₹100 | ₹100.00 | ₹100 | ✔ |
| Tube area π×120×700/100 | 2 638.94 cm² | 2638.94 cm² | ✔ |
| Tube paint × 0.15 | ₹395.84 | ₹396 | ✔ |
| Rod area | 1 495.40 cm² | 1495.4 cm² | ✔ |
| Rod paint × 0.20 | ₹299.08 | ₹299 | ✔ |
| **Painting** | **₹694.92** | ₹695 | ✔ |
| Transport 120+250+80 | ₹450.00 | ₹450 | ✔ |
| Packing weight 24.28+14.17 | 38.45 kg | 38.45 kg | ✔ |
| Packing loose × ₹5/kg | ₹192.25 | ₹192 | ✔ |

## 8. Roll-up

```
csub = 5 620.34 + 4 716.36 + 4 200.00        = ₹14 536.70   ERP ₹14,537 ✔
mfg  = 14 536.70 + 500 + 375 + 340
       + 400 + 100 + 694.92 + 450 + 192.25   = ₹17 588.87   ERP ₹17,589 ✔
pa   = r2(17 588.87 × 20 / 100)              = ₹3 517.77    ERP ₹3,518  ✔
sp   = r2(17 588.87 + 3 517.77)              = ₹21 106.64   ERP ₹21,107 ✔
ov   = r2(21 106.64 × 10)                    = ₹211 066.40  ERP ₹2,11,066 ✔
```

**Every calculated line matches the ERP exactly.** The arithmetic as
implemented is sound.

---

# Discrepancies

## DEFECT 1 — the PDF omits every machined component *(severity: high)*

`generatePDF()` line 1000 builds its own manufacturing cost:

```js
const mfg = R.tube.tot + R.rod.tot + bear + seal + bom
          + asm + test + paint + trans + pack;
```

The cover and misc subtotal — CEC, HEC, Gland, Cushion Bush, Stop
Tube, Rear Eye, Rod Eye, Piston — is not in that sum, and no row for
them appears in the PDF table.

Measured on this job:

| Surface | Manufacturing cost |
|---|---|
| Summary panel | ₹17,589 |
| Quotation tab | ₹17,589 |
| **Exported PDF** | **₹13,389** |

**Under-stated by ₹4,200 per cylinder — 23.9 %.** On this order of 10,
₹42,000 before margin. The PDF is the document the customer receives.

## DEFECT 2 — quotation and PDF ignore the zero-margin guard *(severity: high)*

`enforceZeroMargin()` (line 2615, bootstrap) patches only the Summary
panel's six display fields. `buildQuote()` (line 968) and
`generatePDF()` (line 1001) each re-read `gv('profit-pct') || 20`.

Entering **0 %** margin on this job:

| Surface | Margin applied | Selling price |
|---|---|---|
| Summary panel | 0 % → ₹0 | ₹17,589 ✔ |
| Quotation tab | **20 % → ₹3,518** | ₹21,107 ✗ |
| Exported PDF | **20 % → ₹2,678** | **₹16,067** ✗ |

The PDF figure compounds both defects. **₹16,067 is below the true
₹17,589 manufacturing cost** — a formatted quotation that sells at a
₹1,522 loss per unit, ₹15,220 across the order.

## DEFECT 3 — raw rod diameter is never validated *(severity: high)*

`propagate()` sets `r-fdia` from the enquiry but never touches
`r-rdia`, which stays at its shipped 52 mm. The tube has
`autoFixTubeOD()` for exactly this class of error; the rod has no
equivalent.

For any rod above 52 mm the stock is smaller than the finished part:

| Rod Ø | raw | stock removal | srF | raw mass | correct mass (Ø+4) | material under-stated |
|---|---|---|---|---|---|---|
| 50 | 52 | 2 | 1.00 | 14.17 kg | 15.28 kg | ₹88.80 |
| **56** | 52 | **−4** | 1.00 | 14.17 kg | 18.87 kg | **₹376.00** |
| **63** | 52 | **−11** | 1.00 | 14.17 kg | 23.52 kg | **₹748.00** |
| **80** | 52 | **−28** | 1.00 | 14.17 kg | 36.98 kg | **₹1 824.80** |
| **100** | 52 | **−48** | 1.00 | 14.17 kg | 56.68 kg | **₹3 400.80** |

Rough turning is under-costed too: stock removal clamps to 0, so the
1.15–1.60 severity multiplier never applies.

Unlike the tube bug, nothing collapses to zero — the number stays
plausible, which is what makes it dangerous.

## DEFECT 4 — the summary column does not add up *(severity: medium)*

Line items print to whole rupees; the total is computed at 2 dp then
rounded once. Adding the printed column:

```
5 620 + 4 716 + 4 200 + 500 + 375 + 340
      + 400 + 100 + 695 + 450 + 192      = ₹17 588
printed total                             = ₹17 589
```

**The visible figures sum to ₹1 less than the stated total.** An
estimator checking the sheet by hand will find this immediately.

## DEFECT 5 — order value vs selling price *(severity: low)*

```
ov displayed              = ₹2,11,066     (r2(21 106.64 × 10))
printed sp × qty          = 21 107 × 10 = ₹2,11,070
```
**₹4 apart.** `ov` derives from the unrounded selling price.

## DEFECT 6 — honing hours are decorative *(severity: low)*

Line 808 prints `lkp(TD, id, len)` as the honing time (0.9 hr here).
The honing cost on the same row is `area × pr-hon + labour` and never
uses that figure. `TF` (line 752) is defined and never referenced at
all.

## DEFECT 7 — rounded mass drives material cost *(severity: informational)*

`mc = r2(wt) × rate`, not `mass × rate`. On the reference 100×76×500
tube: exact ₹2 083.40 vs ERP ₹2 083.20 — **₹0.20**. Negligible alone,
systematic across every job.

## Boundary behaviour

| Input | `hwt` result | Verdict |
|---|---|---|
| ID = OD | 0 | safe |
| ID > OD | 0 | safe (clamped) |
| **ID = 0 (solid bar)** | **0** | **wrong — a solid tube costs nothing** |
| length = 0 | 0 | safe |
| **length negative** | **negative** | **unguarded** |
| OD = 0 | 0 | safe |
| NaN | 0 | safe |
