# FORMULAS.md — every calculation in the frozen ERP block

Transcribed from `products/costing/index.html`, the inline `<script>`
block identified by `BEAR_TYPES` (lines 742–1069). Nothing here is
paraphrased; each entry states what the code does, not what it was
meant to do.

Business-logic hash at time of transcription: `304a7d3070ebe34f72706af4d60c23a1`

**Notation.** `r2(x)` = round to 2 decimals. `r4(x)` = round to 4
decimals. `fI(x)` = `'₹' + Math.round(x)` with Indian digit grouping —
this is **display only** and always rounds to whole rupees.

---

## 1. Primitives

### 1.1 Hollow mass — `hwt(od, id, l)` · line 757

```
hwt = (od > id AND id > 0)
        ? (π/4)·(od² − id²)·l·7.85e-6
        : 0
```

| | |
|---|---|
| `od` | outside diameter, **mm** |
| `id` | inside diameter, **mm** |
| `l` | length, **mm** |
| output | **kg** |

Constant `7.85e-6` — steel density. 7.85 g/cm³ = 7.85×10⁻³ g/mm³ =
7.85×10⁻⁶ kg/mm³. Dimensionally: mm³ × kg/mm³ = kg. **Correct.**

Guard returns 0 when `id ≥ od` or `id ≤ 0`.

### 1.2 Solid mass — `swt(od, l)` · line 758

```
swt = od > 0 ? (π/4)·od²·l·7.85e-6 : 0
```
Inputs mm, output **kg**. Same density constant. **Correct.**

### 1.3 External surface area — `eA(od, l)` · line 759

```
eA = (od > 0 AND l > 0) ? π·od·l/100 : 0
```
mm × mm = mm²; ÷100 → **cm²**. **Correct.**

### 1.4 Internal surface area — `iA(id, l)` · line 760

```
iA = (id > 0 AND l > 0) ? π·id·l/100 : 0
```
Output **cm²**. **Correct.**

### 1.5 Stock-removal factor — `srF(sr)` · line 754

```
srF = sr ≤ 2  → 1.00
      sr ≤ 5  → 1.15
      sr ≤ 10 → 1.35
      else    → 1.60
```
`sr` in **mm** (diametral stock removed). Dimensionless multiplier.
Source: unattributed. See ASSUMPTIONS.md.

### 1.6 Drill time per hole — `drT(d)` · line 755

```
drT = d ≤ 10 → 0.03
      d ≤ 20 → 0.05
      d ≤ 30 → 0.08
      else   → 0.12
```
`d` = hole diameter **mm**, output **hours per hole**.

### 1.7 Table lookup — `lkp(T, d, l)` · line 753

Finds the first row band `T.r` where `d ≤ bound`, first column band
`T.c` where `l ≤ bound`, returns `T.v[ri][ci]`. Falls back to the last
band if the value exceeds every bound. Output **hours**.

### 1.8 Machining cost — `pc(mh, mr, lh, lr)` · line 792

```
pc = max(0, r2( mh·mr + lh·lr ))
```
machine hours × machine ₹/hr + labour hours × labour ₹/hr → **₹**.
`nn(v) = max(0, +v || 0)` coerces every input to a non-negative number.

### 1.9 Weld — `weld(d, b)` · line 768

```
len  = π·d·b                    [mm]
h    = len / 3600               [hr]
lab  = h · pr-wl                [₹]
wire = h · 0.8 · pr-ww          [₹]
returns { t: r2(lab + wire), h: r4(h) }
```

`d` = bead diameter mm, `b` = number of beads.

**Two unlabelled constants.** `3600` is an implied welding speed of
3600 mm/hr (60 mm/min). `0.8` is an implied wire consumption of
0.8 kg/hr. Neither is named or documented in the code.

---

## 2. Machining-time tables

All values in **hours**. Rows = diameter band (mm), columns = length
band (mm).

### TA — cutting · line 749
| dia ≤ | len ≤500 | ≤1000 | ≤2000 | >2000 |
|---|---|---|---|---|
| 80 | 0.08 | 0.10 | 0.15 | 0.20 |
| 150 | 0.10 | 0.15 | 0.20 | 0.30 |
| 250 | 0.15 | 0.20 | 0.30 | 0.40 |
| >250 | 0.25 | 0.35 | 0.50 | 0.70 |

### TB — rough turning · line 750
| dia ≤ | len ≤500 | ≤1000 | ≤2000 | >2000 |
|---|---|---|---|---|
| 80 | 0.30 | 0.60 | 1.20 | 1.80 |
| 150 | 0.50 | 0.90 | 1.70 | 2.50 |
| 250 | 0.80 | 1.50 | 2.80 | 4.00 |
| >250 | 1.20 | 2.20 | 4.00 | 6.00 |

### TD — honing · line 751
| dia ≤ | len ≤500 | ≤1000 | >1000 |
|---|---|---|---|
| 80 | 0.30 | 0.60 | 1.20 |
| 150 | 0.50 | 0.90 | 1.60 |
| 250 | 0.80 | 1.40 | 2.40 |
| >250 | 1.20 | 2.00 | 3.50 |

**TD is displayed but never costed.** Line 808 prints
`lkp(TD, id, len)` as the honing hours, but the honing *cost* on the
same line is computed from surface area, not from these hours. The
number shown to the estimator does not drive any money.

### TF — defined, never referenced · line 752
| dia ≤ | len ≤500 | ≤1000 | >1000 |
|---|---|---|---|
| 80 | 0.30 | 0.50 | 0.90 |
| 150 | 0.50 | 0.80 | 1.40 |
| 250 | 0.80 | 1.30 | 2.20 |
| >250 | 1.20 | 2.00 | 3.20 |

`TF` appears nowhere else in the file. Dead constant.

---

## 3. Tube — `calcTube()` · lines 794–818

Inputs: `t-rod` raw OD mm, `t-fod` finished OD mm, `t-id` bore mm,
`t-len` length mm, `t-mat` grade.

```
wt = r2( hwt(t-rod, t-id, t-len) )              [kg]
mc = r2( wt · rate )                            [₹]   rate = ₹/kg for grade
```

Note `mc` uses the **already-rounded** `wt`, not the exact mass.

The eight operations:

| # | Operation | Hours | Cost |
|---|---|---|---|
| 1 | Cutting | `ch = r4(lkp(TA, t-rod, t-len))` | `pc(ch, tc-mr, tc-lh, tc-lr)` |
| 2 | Rough turning | `sr = t-rod − t-fod`; `sf = srF(max(0,sr))`; `rth = r4(max(0, lkp(TB, t-fod, t-len)·sf))` | `pc(rth, trt-mr, trt-lh, trt-lr)` |
| 3 | Drilling | `dh = td-hd>0 ? r4(drT(td-hd)·td-hn) : 0` | `pc(dh, td-mr, td-lh, td-lr)` |
| 4 | Part weld | `weld(tpw-d, tpw-n)` | `max(0, r2(weld.t + tpw-lh·tpw-lr))` |
| 5 | Honing | *displayed* `lkp(TD, t-id, t-len)` | `max(0, r2( iA(t-id,t-len)·pr-hon + th-lh·th-lr ))` |
| 6 | Finish turning | `fth = r4(rth · 0.70)` | `pc(fth, trt-mr, tft-lh, tft-lr)` |
| 7 | CEC weld | `weld(tcw-d, tcw-n)` | `max(0, r2(weld.t + tcw-lh·tcw-lr))` |
| 8 | Rear-eye weld | `weld(trw-d, trw-n)` | `max(0, r2(weld.t + trw-lh·trw-lr))` |

Constant `0.70` — finish turning is costed at 70 % of rough-turning
hours. Unattributed.

Operation 6 bills at `trt-mr`, the **rough**-turning machine rate; this
is deliberate and displayed as such on line 810.

```
proc = op1 + op2 + ... + op8
tot  = mc + proc
```

### 4. Rod — `calcRod()` · lines 820–845

Inputs: `r-rdia` raw dia mm, `r-fdia` finished dia mm, `r-len` mm.

```
wt = r2( swt(r-rdia, r-len) )                   [kg]   raw bar
mc = r2( wt · rate )                            [₹]
```

| # | Operation | Basis | Cost |
|---|---|---|---|
| 1 | Cutting | `ch = r4(lkp(TA, r-rdia, r-len))` | `pc(ch, rc-mr, rc-lh, rc-lr)` |
| 2 | Rough turning | `sr = r-rdia − r-fdia`; `sf = srF(max(0,sr))`; `rth = r4(max(0, lkp(TB, r-fdia, r-len)·sf))` | `pc(rth, rrt-mr, rrt-lh, rrt-lr)` |
| 3 | Heat treatment | **weight** | `max(0, r2( wt·pr-ht + rht-lh·rht-lr ))` |
| 4 | Induction hardening | **area** `eA(r-fdia, r-len)` | `max(0, r2( area·pr-ih + rih-lh·rih-lr ))` |
| 5 | Finish turning | `fth = r4(rth·0.70)` | `pc(fth, rrt-mr, rft-lh, rft-lr)` |
| 6 | Grinding | area `eA(r-fdia, r-len)` | `max(0, r2( area·pr-gr + rgr-lh·rgr-lr ))` |
| 7 | Chrome plating | area `eA(r-fdia, r-len)` | `max(0, r2( area·r-cr + rch-lh·rch-lr ))` |
| 8 | Polishing | area `eA(r-fdia, r-len)` | `max(0, r2( area·pr-pol + rpol-lh·rpol-lr ))` |

Operations 4, 6, 7, 8 all use the identical area `eA(r-fdia, r-len)`.

```
proc = op1 + ... + op8
tot  = mc + proc
```

---

## 5. Bill of materials — `calcBOM()` · lines 869–877

For each row in `#bear-rows`, `#seal-rows`, `#bom-rows`, taking the
**last two** numeric inputs in that row:

```
line  = r2( qty · rate )
```

```
bear  = Σ lines in #bear-rows
seal  = Σ lines in #seal-rows
other = Σ lines in #bom-rows
grand = bear + seal + other
```

---

## 6. Assembly, painting, freight, packing — `calcAsm()` · lines 878–896

```
asm     = r2( asm-h · asm-lr )                  [₹]
test    = r2( test-h · test-lr )                [₹]
paintT  = r2( tubeArea · pt-rate )              tubeArea = eA(t-fod, t-len) cm²
paintR  = r2( rodArea  · pr-rate )              rodArea  = eA(r-fdia, r-len) cm²
paint   = paintT + paintR
trans   = r2( trans-in + trans-out + trans-v )
packWt  = r2( tube.wt + rod.wt )                [kg]
pack    = loose  → r2( packWt · pr-pkl )
          wooden → r2( packWt · pr-pkw )
          else   → pack-cust
```

Note `paint` is stored as `ptc + prc` — a sum of two already-rounded
values, not re-rounded.

---

## 7. Roll-up — `calcSummary()` · lines 897–911

```
csub = tube.tot + rod.tot
       + Σ over [CEC, HEC, Gland, Cushion Bush, Stop Tube,
                 Rear Eye, Rod Eye, Piston] of (mat + proc + lab)

mfg  = csub + bear + seal + other + asm + test + paint + trans + pack

pp   = profit-pct || 20                          ← see DEFECT 2
pa   = r2( mfg · pp / 100 )
sp   = r2( mfg + pa )
qty  = inq-qty || 1
ov   = r2( sp · qty )
```

---

## 8. Quotation tab — `buildQuote()` · lines 943–975

Rebuilds the same roll-up independently:

```
mfg = Σ rows  where rows = tube, rod, each cover/misc with mat+proc+lab > 0,
      BOM total, asm+test, paint, trans, pack
```

This **matches** `calcSummary`'s `mfg`. Verified numerically.

```
pp = profit-pct || 20                            ← see DEFECT 2
```

Order-value cell prints `fI(sp · qty)` — not `r2`-ed first, unlike
`calcSummary`.

## 9. PDF — `generatePDF()` · lines 976–1015

```
mfg = tube.tot + rod.tot + bear + seal + other
      + asm + test + paint + trans + pack
```

**The cover and misc components are absent.** See DEFECT 1.

---

## 10. Defects found during transcription

Full evidence in `WORKED_EXAMPLE.md`. Summary:

| # | Defect | Effect |
|---|---|---|
| 1 | `generatePDF` omits covers/misc from `mfg` | PDF under-states cost by ₹4,200 on the reference job (23.9 %) |
| 2 | `buildQuote` and `generatePDF` keep `\|\| 20`; the zero-margin guard only patches the Summary panel | At 0 % margin the quotation and PDF apply 20 % |
| 3 | `r-rdia` (raw rod dia) is never validated or derived | Any rod > 52 mm gives raw < finish — impossible geometry, silently under-costed |
| 4 | `hwt(od, 0, l) = 0` | A solid tube reports zero mass and zero material cost |
| 5 | `hwt` with negative length returns a negative mass | No guard on `l` |
| 6 | `TD` displayed but never costed; `TF` never referenced | Honing hours shown are decorative |
| 7 | `mc = r2(wt) · rate` uses rounded mass | ₹0.20 loss on the reference tube |
| 8 | Lines displayed to whole ₹, summed at 2 dp | Printed lines can differ from printed total by ₹1 |
| 9 | `round(sp) × qty ≠ round(ov)` | ₹4 apart at qty 10 on the reference job |
