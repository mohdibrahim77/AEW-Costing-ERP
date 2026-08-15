# ASSUMPTIONS.md — every number the ERP treats as fact

Nothing in this list has been confirmed with HISPL. Each row states
what the value is, where it lives, and what a 20 % error does to the
final quotation.

**Sensitivity baseline:** the reference job in `WORKED_EXAMPLE.md` —
Ø100 × Ø56 × 500, qty 10, manufacturing cost **₹18,092**, selling price
₹21,710, order value ₹2,17,100. "Impact" is the change in manufacturing
cost per cylinder if that one value is 20 % wrong, with everything else
held constant.

> Figures below were computed against the pre-patch baseline of
> ₹17,588.87 and are within ~3 % of the current ones. They are
> proportions, not quotations — treat them as "which numbers matter
> most", which is unchanged.

---

## 1. Physical constants

| Value | What it is | Location | If 20 % wrong |
|---|---|---|---|
| `7.85e-6` | steel density, kg/mm³ (7.85 g/cm³) | frozen block, lines 757–758 | tube + rod material moves ±₹1,003.68 (**±5.7 % of mfg**) |

7.85 g/cm³ is the standard figure for carbon steel and is very
unlikely to be wrong. It is listed because it is hard-coded in two
places and applies to **every** grade — including SS316 (actual
≈ 8.00 g/cm³) and SS410 (≈ 7.70 g/cm³). Stainless jobs are costed
against carbon-steel density.

## 2. Material rates (₹/kg)

Editable on screen; these are the shipped defaults.

| Grade | Rate | Field | If 20 % wrong (this job) |
|---|---|---|---|
| ST52 | 160 | `m-st52` | tube material ±₹776.96 (**±4.4 %**) |
| EN8 | 80 | `m-en8` | rod material ±₹226.72 (±1.3 %) |
| EN19 | 90 | `m-en19` | not used on this job |
| C45 | 90 | `m-c45` | not used |
| SS410 | 250 | `m-ss410` | not used |
| SS316 | 320 | `m-ss316` | not used |

## 3. Machining-time tables (hours)

The core engineering content. All four tables are unattributed.

| Table | Drives | Location | If 20 % wrong |
|---|---|---|---|
| `TA` cutting | tube op 1, rod op 1 | line 749 | ±₹7.50 (±0.04 %) |
| `TB` rough turning | tube op 2, rod op 2 — **and** finish turning via the 0.70 factor | line 750 | ±₹166.77 (**±0.95 %**) |
| `TD` honing | **nothing** — displayed only | line 751 | ₹0 |
| `TF` — | **nothing** — never referenced | line 752 | ₹0 |

`TB` is the highest-leverage table because it feeds two operations on
both components.

## 4. Derived multipliers

| Value | Meaning | Location | If 20 % wrong |
|---|---|---|---|
| `srF` 1.00 / 1.15 / 1.35 / 1.60 | rough-turning severity by stock removal | line 754 | tube op 2 ±₹62.10; rod op 2 ±₹41.40 (srF 1.15 now applies since the rod guard raises raw to 60 mm) |
| `0.70` | finish turning as a fraction of rough turning hours | lines 809, 834 | ±₹68.67 (±0.4 %) |
| `drT` 0.03/0.05/0.08/0.12 | drilling hours per hole by diameter | line 755 | ±₹10.00 (±0.06 %) |
| `3600` | implied welding speed, mm/hr | line 768 | welds ±₹4.28 total |
| `0.8` | implied welding wire consumption, kg/hr | line 768 | welds ±₹2.20 total |

The last two are unnamed numeric literals inside `weld()`. Their
physical meaning is inferred from dimensional analysis, not stated
anywhere in the code.

## 5. Machine and labour rates (₹/hr)

| Rate | Default | Field | If 20 % wrong |
|---|---|---|---|
| Cutting machine | 150 | `tc-mr`, `rc-mr` | ±₹7.50 |
| Turning machine | 300 | `trt-mr`, `rrt-mr` | ±₹166.77 (**±0.95 %**) |
| Drilling machine | 250 | `td-mr` | ±₹10.00 |
| Operation labour | 100 | the sixteen `*-lh` × `*-lr` pairs (8.5 hr total) | ±₹170.00 (±0.97 %) |
| Welding labour | 375 | `pr-wl` | ±₹2.62 |
| Welding wire | 360 | `pr-ww` | ±₹2.21 |
| Assembly labour | 100 | `asm-lr` | ±₹80.00 (±0.5 %) |
| Testing labour | 100 | `test-lr` | ±₹20.00 |

## 6. Process rates (₹ per cm² or per kg)

| Rate | Default | Unit | Field | If 20 % wrong |
|---|---|---|---|---|
| Honing | 0.30 | ₹/cm² | `pr-hon` | ±₹131.95 (±0.75 %) |
| Heat treatment | 12 | ₹/kg | `pr-ht` | ±₹34.01 |
| Induction hardening | 0.45 | ₹/cm² | `pr-ih` | ±₹134.59 (±0.77 %) |
| Grinding | 0.30 | ₹/cm² | `pr-gr` | ±₹89.72 |
| Chrome plating | 0.85 | ₹/cm² | `r-cr` | ±₹254.22 (**±1.4 %**) |
| Polishing | 0.20 | ₹/cm² | `pr-pol` | ±₹59.82 |
| Tube painting | 0.15 | ₹/cm² | `pt-rate` | ±₹79.17 |
| Rod painting | 0.20 | ₹/cm² | `pr-rate` | ±₹59.82 |
| Packing, loose | 5 | ₹/kg | `pr-pkl` | ±₹38.45 |
| Packing, wooden | 15 | ₹/kg | `pr-pkw` | not used on this job |

## 7. `ERP_RATE_CARD` — the whole thing

Location: `products/costing/index.html` line 1100 (bootstrap, not
frozen). CLAUDE.md already flags this as placeholder data. It
contributes **₹5,415** of the ₹18,092 — **29.9 % of manufacturing
cost** — and none of it is calculated. It is typed-in.

### 7.1 Machined components — ₹4,200 (23.2 % of mfg)

| Component | mat | proc | lab | total | If 20 % wrong |
|---|---|---|---|---|---|
| Cap End Cover | 180 | 360 | 120 | 660 | ±₹132 |
| Head End Cover | 200 | 420 | 140 | 760 | ±₹152 |
| Gland | 140 | 380 | 110 | 630 | ±₹126 |
| Cushion Bush | 60 | 150 | 50 | 260 | ±₹52 |
| Stop Tube | 80 | 90 | 40 | 210 | ±₹42 |
| Rear Eye | 150 | 280 | 100 | 530 | ±₹106 |
| Rod Eye | 150 | 280 | 100 | 530 | ±₹106 |
| Piston | 170 | 340 | 110 | 620 | ±₹124 |
| **All eight** | | | | **4 200** | **±₹840 (±4.8 %)** |

**This is the single largest block of unverified numbers in the
system.** It was also the block the exported PDF silently dropped
until the 2026-08-14 patch.

### 7.2 Bought-out items — ₹1,215 (6.7 % of mfg)

| Item | qty | rate | total |
|---|---|---|---|
| Bronze Guide Bush 63 ID | 1 | 280 | 280 |
| Wear Ring PTFE 63 | 2 | 110 | 220 |
| Piston Seal 63 (Double Acting) | 1 | 210 | 210 |
| Rod Seal 45 | 1 | 165 | 165 |
| Fasteners, ports, nipple, nameplate | 1 | 340 | 340 |

20 % error across all five: **±₹243 (±1.4 %)**.

Note the part numbers name **63 mm** components on a **100 mm bore**
cylinder. They are sample rows, not a real bill of materials.

### 7.3 Process defaults

| Field | Value | Meaning |
|---|---|---|
| `td-hd` | 12 mm | drilled hole diameter |
| `td-hn` | 4 | number of holes |
| `tpw-d` / `tcw-d` / `trw-d` | 6 / 8 / 8 mm | weld bead diameters |
| `tpw-n` / `tcw-n` / `trw-n` | 2 / 2 / 2 | number of beads |
| `tpw-lh` / `tcw-lh` / `trw-lh` | 0.5 hr each | weld labour |
| `rht-lh` | 0.25 hr | heat-treatment labour |
| `rih-lh` | 0.5 hr | induction-hardening labour |
| `rch-lh` | 0.25 hr | chrome-plating labour |
| `asm-h` | 4 hr | assembly time |
| `test-h` | 1 hr | testing time |

Assembly at 4 hours and testing at 1 hour are pure guesses in the
code. 20 % on assembly alone is ±₹80.

### 7.4 Freight and packing — ₹642 (3.5 % of mfg)

| Field | Value |
|---|---|
| `trans-in` | ₹120 inward |
| `trans-out` | ₹250 outward |
| `trans-v` | ₹80 vehicle/handling |
| `pack-cust` | ₹150 custom packing |

20 % error: **±₹128**.

## 8. Geometry defaults

| Field | Value | Consequence if wrong |
|---|---|---|
| `t-rod` raw OD | 75 mm | overridden by `autoFixTubeOD()` when the bore demands it |
| `t-fod` finished OD | raw − 5 mm | a fixed 5 mm allowance, not derived from anything |
| `r-rdia` **raw rod dia** | 52 mm, then raised by `autoFixRodDia()` | see PRIORITY 0 below — the allowance rule is my assumption |
| `t-len` | stroke + 200 mm | fixed 200 mm allowance |
| `r-len` | stroke + 350 mm | fixed 350 mm allowance |
| tube wall (`deriveTubeOD`) | 8/10/12.5/15/20 mm by bore band | line 1670 |

The +200 mm and +350 mm length allowances and the −5 mm OD allowance
are unattributed constants that apply to every cylinder regardless of
mounting type or duty.

## 9. Commercial

| Value | Default | Location | Note |
|---|---|---|---|
| Profit margin | 20 % | `profit-pct` | ±20 % relative = ±₹703.55 on selling price |
| Overhead | **not modelled** | — | there is no overhead line anywhere in the ERP |
| GST | 18 % | PDF terms text only | stated on the quotation, never calculated |

**There is no overhead recovery in this ERP.** The manufacturing cost
is direct material + direct process + bought-out + freight + packing.
Factory overhead, tooling, rejection allowance, inspection and
warranty provision are absent. If HISPL expects overhead inside the
"manufacturing cost", the figure is understated by whatever their
overhead rate is — typically 15–30 % in this sector, which would be
**₹2,600–₹5,300 per cylinder** on this job.

This is the largest single open question in the costing methodology
and is not a defect in the code — it is a scope question for Aniktha.

---

## Ranked: what to confirm first

| Priority | Item | Share of cost | Why |
|---|---|---|---|
| **0** | **Rod bar-stock allowance — `deriveRodRawDia()`** | **up to 3 % per job** | **my assumption, now shipping and auto-correcting the estimator's input. See below.** |
| 1 | Whether overhead belongs in mfg cost | 0 % today, potentially 15–30 % | changes the entire basis |
| 2 | `ERP_RATE_CARD` components | 23.9 % | largest typed-in block |
| 3 | `TB` rough-turning table | ~1.1 % direct, but sets two ops | core engineering content |
| 4 | ST52 rate ₹160/kg | 4.4 % | single largest material line |
| 5 | Chrome plating ₹0.85/cm² | 1.4 % | largest process rate |
| 6 | Bought-out items | 6.9 % | sample rows name 63 mm parts on a 100 mm cylinder |
| 7 | Assembly 4 hr / testing 1 hr | 2.8 % | acknowledged guesses |
| 8 | Length/OD allowances (+200, +350, −5) | indirect | affect every mass and area |
| 9 | Density for stainless grades | up to 1.9 % on SS jobs | one constant serves all grades |

---

# PRIORITY 0 — the rod bar-stock allowance

**This is the one assumption in this document that actively changes the
estimator's input rather than merely sitting behind a calculation.**

`autoFixRodDia()` raises the raw bar diameter whenever it is not larger
than the finished rod, using:

```js
function deriveRodRawDia(fin) {
  return Math.ceil((fin + 4) / 5) * 5;   /* +4 mm, rounded up to next 5 mm */
}
```

| Finished rod | Raw bar chosen | Raw mass | Material at ₹80/kg |
|---|---|---|---|
| 50 mm | 55 mm | 15.85 kg | ₹1,268 |
| 56 mm | **60 mm** | 18.87 kg | ₹1,510 |
| 63 mm | 70 mm | 25.68 kg | ₹2,054 |
| 70 mm | 75 mm | 29.48 kg | ₹2,358 |
| 80 mm | 85 mm | 37.86 kg | ₹3,029 |
| 90 mm | 95 mm | 47.30 kg | ₹3,784 |
| 100 mm | 105 mm | 57.78 kg | ₹4,622 |

**What needs confirming with Aniktha:**

1. Is **+4 mm** the right machining allowance for a chromed, ground and
   polished rod? It has to cover rough turning, finish turning,
   grinding and polishing on the diameter.
2. Does HISPL's bright bar really come in **5 mm steps**? If the yard
   stocks 58 / 63 / 68, rounding to 60 / 65 / 70 buys the wrong bar.
3. Should the tool **auto-correct at all**, or warn and stop?

On (3) the reasoning was: the tube already auto-corrects
(`autoFixTubeOD`), and that guard exists because a plausible wrong
number is more dangerous than an obvious one. The rod case is worse —
the tube bug collapsed every cost to ₹0, which is loud; the rod bug
left a believable figure computed from bar that cannot exist. So it
auto-corrects, with a visible notice, and the estimator can override.

If Aniktha's answer differs on any of the three, the fix is one
function: `deriveRodRawDia()`. Nothing else depends on the rule.

---

# KNOWN ISSUES — logged, deliberately not fixed

Internal only. None of these reach a customer document. Recorded so
nobody spends a day rediscovering them.

## The `TD` table drives nothing

`TD` (frozen block, line 751) is looked up once, on the tube honing
row, and the result is **displayed as the honing time** — 0.9 hr on the
reference job. It never enters a cost.

Honing **is** charged, on a different basis: internal area × `pr-hon`
(₹0.30/cm²) plus labour hours × rate. On the reference job that is
2,199.11 cm² × 0.30 + 0.5 × 100 = **₹709.73**.

There is no honing machine-rate field anywhere (`th-lh`/`th-lr` are
labour only), which confirms the area rate *is* the intended
machine-cost basis and `TD` is vestigial from an earlier hourly design.

**This is not an undercharge.** Billing those 0.9 hours at the ₹300/hr
turning rate would yield ₹320 against ₹709.73 actually charged — the
implied rate is ₹733/hr. The risk is an estimator cross-checking the
displayed hours against shop-floor time and losing confidence in the
sheet.

Fix when convenient: relabel the column, or delete the `TD` lookup and
the `TF` table together.

## The `TF` table is never referenced

`TF` (line 752) is defined and used nowhere in the file. Dead constant.

## `hwt(od, 0, l)` returns zero for a solid bar

The hollow-mass guard requires `id > 0`, so entering a tube with zero
bore reports 0 kg and ₹0 material. Requires an ID of 0 typed by hand;
`propagate()` never produces it. `swt()` exists for solid sections and
is what the rod uses.

## Negative length yields negative mass

`hwt` guards `od > id` and `id > 0` but not `l > 0`, so a negative
length produces a negative mass — −13.02 kg for 100/76/−500. Requires
a negative typed by hand. Every downstream cost is clamped at zero by
`pc()` and `Math.max(0, …)`, so it cannot produce a negative price.

Both boundary cases are asserted in `tests/formulas.js` as DEFECT-4 and
DEFECT-5, so if either is ever fixed the suite says so.
