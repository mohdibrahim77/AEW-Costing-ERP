# Costing v2 — questions before we build

> **Two things are blocking us.** (1) Section 8 of your document lists
> eighteen geometry masters still to be created — which should we start
> with, and who populates them? Without them the ten inputs reach 1.4%
> of a cylinder's cost. (2) Is welding costed by the workbook formula or
> the later Rs 14 per inch per bead instruction?
>
> Everything else below is a data issue you'll want to know about, but
> it isn't holding up work.

Aniktha,

We've extracted every formula from `Trunion Included.xlsx` and checked it
against the reference document and the cost sheet. The workbook is a good
spec — the process routing, rate cards and welding logic are all clear
enough to build from.

Eight things below. The first two block us. The third is a set of
defects in the workbook that you'll want to fix regardless — it does not
currently produce a total. The last five are short data questions.

Each is answerable in a sentence.

---

## First, a check: we costed your own cylinder

We took the sample cylinder in your workbook — bore 100, rod 56, stroke
800 — read its typed dimensions straight out of the sheets, and ran them
through our engine. Against the four components your workbook still
resolves:

| | Your workbook | Our engine | |
|---|---|---|---|
| Tube | Rs 4,914 | Rs 4,914 | match |
| Piston Rod | Rs 7,314 | Rs 7,314 | match |
| Cushion Bush | Rs 3,798 | Rs 3,798 | match |
| Trunnion | Rs 1,198 | Rs 1,198 | match |

Complete cylinder: **Rs 25,167** — using the workbook's welding formula,
and mapping the eight `MS-` grades to the real ones (see question 3a;
without that mapping the workbook produces no total at all).

**What this demonstrates is that the engine is correct — not that the
numbers are real.** Some of the sample's dimensions look like
placeholders rather than a measured cylinder (question 8). Reproducing
them exactly proves we compute your formulas the way you do; it does not
prove the cylinder was ever built. Both are worth having, but they are
different claims.

Everything below is about what the workbook doesn't contain, not about
whether we've understood what it does.

One number from that run matters for question 1: **all twelve components
weigh 127.59 kg, where the tube and rod alone weigh 38.46 kg.** The
median cylinder in your cost sheet weighs 127 kg.

---

## 1. Geometry masters — which first, and who populates them? — **blocks everything**

Your ten inputs currently reach **1.4%** of a cylinder's cost.

On your own sample cylinder, costed at Rs 25,167, bore + rod + stroke
get us to **Rs 360** — and that Rs 360 is the bought-out bearing, which
needs no geometry at all. **Zero of the twelve components can be
costed.** Seventy-six dimensions are outstanding.

That is not a limitation of our build. It is what section 8 of your own
document already says:

> "The supplied workbook does not currently contain dedicated geometry
> masters for the following. These should be created as controlled
> engineering reference tables and populated from HISPL historical
> drawings/data or approved engineering standards."

So we are not asking whether standards exist — you have already answered
that, and you have specified the required fields for all eighteen
masters. Three practical questions follow from it.

### 1a. Which masters matter most first?

We ranked the components by value on your sample cylinder:

| | Component | Cost | Cumulative |
|---|---|---|---|
| 1 | Piston Rod | Rs 7,314 | 29% |
| 2 | Tube | Rs 4,914 | 49% |
| 3 | Cushion Bush | Rs 3,798 | 64% |
| 4 | Trunnion (x2) | Rs 2,396 | 73% |
| 5 | Flange | Rs 1,777 | 80% |

The Cap End Cover, Head End Cover and Gland are further down than we
expected — Rs 789, Rs 839 and Rs 834, about 3% each.

> **Would the Piston Rod and Tube Geometry Masters be the two to start
> with?** Those alone would take us from 1.4% to roughly half the
> cylinder. This is one cylinder, so if the ranking looks wrong for your
> typical job, tell us and we will follow yours.

### 1d. Why we need three or four bores, not one

This is the part worth a minute, because it decides how much work we are
asking for.

Your sample has a Cap End Cover Finished OD of **220 mm at bore 100**.
That is one data point, and every plausible rule fits it exactly:

| Rule | b100 | b125 | b160 | b200 |
|---|---|---|---|---|
| 2.2 x bore | 220 | 275 | 352 | 440 |
| bore + 120 | 220 | 245 | 280 | 320 |
| 1.8 x bore + 40 | 220 | 265 | 328 | 400 |
| 2 x bore + 20 | 220 | 270 | 340 | 420 |

All four agree at bore 100 and diverge from there. In material cost for
that one cover, at 60 mm thick in C45:

| | b100 | b125 | b160 | b200 |
|---|---|---|---|---|
| lowest | Rs 1,182 | Rs 1,466 | Rs 1,914 | Rs 2,500 |
| highest | Rs 1,182 | Rs 1,846 | Rs 3,025 | Rs 4,727 |
| spread | — | Rs 381 | Rs 1,111 | **Rs 2,227** |

At bore 200 the candidates differ by **1.89x** on that component alone,
and nothing in the workbook indicates which is right.

> **So the ask is three or four bores across your range, not one.** With
> a single point every rule fits by definition. With four, most stop
> fitting. That is the difference between a standard and a guess, and we
> would rather ask you for more data than quietly pick one of the four.

### 1b. Who populates them?

Section 8 says "from HISPL historical drawings/data or approved
engineering standards".

> **Which is it in practice — is there a drawing set someone can work
> from, or does this come out of the estimator's working knowledge?**

That decides whether this is a data-entry exercise or a series of
conversations, and the two have very different timelines.

### 1c. Section 9's rules — where do the missing values live?

Section 9 gives eight calculation rules. Sorting them by what they need:

- **One runs today**: Finished Tube ID = Bore.
- **Three are already built**: the volume, weight and surface-area
  formulas.
- **Four are stated but cannot run** — they need Tube OD, Tube Boring
  Allowance, OD Turning Allowance, Trunnion OD and Pin Diameter.

> **Are those five values inside section 8's masters, or are they
> separate constants?** Tube OD in particular reads as an input in
> section 9 but is not one of the ten, so we assume it comes from the
> Tube Geometry Master — worth confirming.

### Worth twenty minutes on a call

A written answer to 1a and 1b will be short; watching whoever estimates
pick a cap end cover OD for a given bore would tell us more than either.
Whether he reaches for a chart, a past job, or judgement decides what we
build.

There is a preview that makes this concrete — it lists all the
dimensions we need, by component and by your own cell reference, and
shows what we can already compute without them:

**https://aew-costing-erp.pages.dev/products/costing/preview**

It is unlinked and not indexed, so it will not be seen by anyone you do
not send it to. Worth a look before we speak.

---

## 2. Welding — which method is current? — **blocks welding cost**

The workbook implements welding fully:

```
beads       = 5 if weld dia <= 250, else 8
weld length = pi x weld dia x beads
time        = weld length / 3600 mm/hr
labour      = time x Rs 375/hr
wire        = time x 0.8 kg/hr x Rs 360/kg
cost        = labour + wire
```

Your reference document also notes a later approved HISPL instruction of
**Rs 14 per inch per bead**, to be applied as a controlled update if not
already in the workbook.

They give very different numbers — consistently about **3x**.

A cylinder has four welds, and they are not all the same size: the three
tube welds are on the 108 mm tube, the rod eye weld is on the 56 mm rod.
So the difference per weld varies. On your own workbook sample:

| Weld | Dia | Workbook | Rs 14/in/bead | Difference |
|---|---|---|---|---|
| Tube — Part Welding | 108 mm | Rs 312 | Rs 935 | Rs 623 |
| Tube — CEC Welding | 108 mm | Rs 312 | Rs 935 | Rs 623 |
| Tube — Rear Eye Welding | 108 mm | Rs 312 | Rs 935 | Rs 623 |
| Piston Rod — Rod Eye Welding | 56 mm | Rs 162 | Rs 485 | Rs 323 |
| **Per cylinder** | | **Rs 1,099** | **Rs 3,290** | **Rs 2,191** |

So it is roughly **Rs 2,191 per cylinder**, and at qty 10 that is
**Rs 21,910** on one order.

(Our Rs 312 and Rs 162 reproduce your workbook's own cached figures
exactly — B42 and B46 — so the only open point is which method, not
whether we've read it correctly.)

> **Which is current — the workbook formula, or Rs 14 per inch per bead?**

Until you confirm, the tool will not produce a welding cost at all rather
than quietly pick one.

---

## 3. Three defects in the workbook — **it currently has no total**

We haven't changed anything; these are yours to correct.

### 3a. Eight of twelve components are broken

Eight sheets name a material grade that isn't in the Material Master:

| Sheet | Grade named | Master has |
|---|---|---|
| Cap End Cover, Head End Cover, Gland, Flange | `MS-C45` | `C45` |
| Stop Tube, Piston | `MS-EN8` | `EN8` |
| Rear Eye, Rod Eye | `MS-PLATE-IS2062` | `PLATE-IS2062` |

It looks like a rename to an `MS-` prefix was started and not finished —
the Material Master has a bare `MS` row (A13) with no name, density or
rate, and the prefixed codes were never created.

Consequence: those eight lookups return `#N/A`, which propagates to

```
Cost Summary!B19  SUBTOTAL                 = #N/A
Cost Summary!B38  TOTAL MANUFACTURING COST = #N/A
```

**The workbook does not currently produce a total.** Only Tube, Piston
Rod, Cushion Bush and Trunnion resolve.

> **Should the eight sheets point back to the existing codes (`C45`,
> `EN8`, `PLATE-IS2062`), or is `MS` a new grade you intend to add with
> its own density and rate?**

### 3b. Boring rate is `#N/A` on every sheet that uses it

```excel
Tube!E28 = INDEX(MachineRateMaster_Range, MATCH("Conventional Lathe", ...), 2)
```

The Machine Rate Master calls that machine **`Center Lathe`**. The lookup
string never matches. It's currently hidden because the Tube's Boring row
is set to `Apply? = No` — the moment anyone sets it to `Yes`, the boring
cost and the whole component subtotal become `#N/A`.

> **Confirm "Conventional Lathe" and "Center Lathe" are the same machine
> — then one of the two spellings needs changing.**

### 3c. Cylinder weight silently ignores missing components

```excel
Cost Summary!B22 = IFERROR(Tube_Weight,0) + IFERROR(PistonRod_Weight,0) + ...
                 = 76.54 kg
```

Because eight components are `#N/A`, the `IFERROR` counts each as **zero
kilograms**. The sheet reports a confident **76.54 kg** for a cylinder
missing two-thirds of its parts. The cost correctly shows `#N/A`; the
weight doesn't.

Worth fixing even after 3a, so a future error shows up instead of
quietly reducing the weight.

---

## 4. Tube weight uses Raw OD with Finished ID

```excel
Tube!B16 = (PI()/4) * (RawOD^2 - FinishedID^2) * Length * Density / 1000000
              ^^^^^                ^^^^^^^^
```

It mixes the **raw** outside diameter with the **finished** inside
diameter, and there is no Raw ID field anywhere on the sheet. If the tube
is bored during manufacture, the raw ID is smaller than the finished ID,
so the true purchased weight is higher than this.

Your reference notes list `raw tube ID = bore + boring allowance`, which
implies a raw ID the sheet doesn't have.

> **Do you buy tube already at (or near) finished bore, so raw ID equals
> finished ID — or should the raw weight use a separate raw ID?**

---

## 5. Five rows in the cost sheet are physically impossible

From `COST SHEET.xlsx`, these have a rod diameter **equal to or larger
than the bore**, which can't be a cylinder:

| Row | Bore | Rod | Stroke | Weight | Total |
|---|---|---|---|---|---|
| 13 | 31 | 110 | 125 | 421 kg | Rs 1,31,850 |
| 117 | 127 | 143 | 1221 | 43 kg | Rs 15,350 |
| 167 | 36 | 36 | 280 | 78 kg | Rs 34,000 |
| 232 | 480 | 480 | 1000 | 5974 kg | Rs 14,96,641 |
| 280 | 70 | 320 | 850 | 4785 kg | Rs 9,30,844 |

(A sixth, row 28, has stroke 0 and we've already excluded it.)

Row 13 is a 31 mm bore weighing 421 kg, which is impossible on its face.
Most likely the BORE and ROD columns hold something else on these rows.

> **Should we drop these five, or can you tell us what they should read?**

They matter more than tidiness: the Rs/kg benchmarks we're validating
against (1003 / 522 / 352 / 318 by bore band) only reproduce exactly when
these rows are *included*, so they're currently influencing the targets.

---

## 6. Six cylinders are longer than the machine time tables allow

The Cutting and Rough Turning tables' longest column is **"2001-3000"**.
There's no column beyond 3000 mm. Six cylinders in the cost sheet exceed
it:

| Row | Stroke |
|---|---|
| 115, 220, 225 | 3962 mm |
| 233 | 3250 mm |
| 136 | 4700 mm |
| 158 | 4950 mm |

Excel's lookup will quietly put a 4950 mm part in the "2001-3000" bucket
and cost it as if it were 3000 — under-charging the longest, most
expensive jobs.

> **Can you extend the tables above 3000 mm, or should the tool stop and
> ask for machining hours on those?**

---

---

## 7. Job Type — input or not?

Your workbook's Inquiry Input sheet has an eleventh row, `B13 Job Type`,
set to "Manufacturing". Section 7 of your document lists ten inputs and
does not mention Job Type anywhere.

> **Is Job Type a real input we should carry, or was it dropped
> deliberately?**

We have built to the document's ten. Adding an eleventh is easy if it
belongs.

---

## 8. Is the sample cylinder real, or placeholders?

Several components in the sample share dimensions in ways that a built
cylinder would not:

| Sheet | Dia | Width | Height | Thickness | 5th |
|---|---|---|---|---|---|
| Cap End Cover | 100 | 160 | 100 | 60 | 220 (Finished OD) |
| Head End Cover | 100 | 160 | 100 | 60 | 220 (Finished OD) |
| Rod Eye | 100 | 160 | 100 | 60 | 56 (Pin Hole) |

The Cap End Cover and Head End Cover are **identical on all five
values**, and the Rod Eye shares the first four. Separately:

| Sheet | OD | ID | Length |
|---|---|---|---|
| Gland | 130 | 57 | 70 |
| Cushion Bush | 130 | 57 | 70 |

Also identical.

A cap end cover and a head end cover cannot be the same part — the head
end has to carry the gland bore for the rod to pass through, and the cap
end is closed. A gland and a cushion bush are not the same part either.

> **Are these placeholder values typed in to make the sheet compute, or
> dimensions from a real job?**

It does not affect whether our engine is right — we reproduce your
arithmetic either way. It affects what the sample can be used for. If
they are placeholders, the sample cannot serve as a reference cylinder,
and it is a further reason we need real dimensions at three or four
bores (question 1d).

---

## One from our side — a live bug we found and fixed

Not a question, but you should know, because it would have reached an
estimator eventually.

The current tool raised the raw bar diameter when the finished rod grew,
but never lowered it again when the rod shrank. So quoting a 160 mm rod
cylinder and then a 28 mm one **in the same session** costed the small
rod as if it were machined from 165 mm bar — 100.71 kg of steel instead
of 10 kg.

The quote came out at **Rs 19,806 instead of Rs 10,991 — 81% high** — and
nothing warned, because 165 mm bar for a 28 mm rod is perfectly valid
geometry. Just not that cylinder's.

Fixed and deployed. We've also added a test that quotes a large cylinder,
then a small one, and checks all 147 fields against a fresh session, so
the same class of bug can't return anywhere else in the tool.

Mentioning it because it is exactly the kind of fault that produces a
quote nobody can explain six months later.

---

## What we're doing meanwhile

- Every number comes from the workbook — the document's tables were
  mangled in export, so we don't trust its figures. But the document is
  the higher authority on what the tool should *do*, which is why
  questions 1 and 2 come to you rather than us picking the workbook's
  answer.
- Nothing is guessed. Any dimension we can't derive from an approved rule
  will be shown as **ENGINEERING INPUT REQUIRED** rather than filled with
  a plausible-looking number.
- No welding cost is produced until question 2 is answered.

One note on the reference document, in case it's shared with anyone else:
its tables came out **shifted one heading down** in the Word export, so
each heading shows the previous section's table. Under *"5.2 Honing Rate
Card"* it prints 300 / 400 / 550 / 700 — those are the **Turning** rates.
The real honing rates (0.30 and 0.40 Rs/cm2) don't appear anywhere in the
document. We've taken them from the workbook, which is correct, but
anyone building from the document alone would price honing about a
thousand times too high.

Thanks — questions 1 and 2 are the ones holding us up.
