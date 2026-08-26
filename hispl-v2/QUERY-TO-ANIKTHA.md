# Costing v2 — questions before we build

> **Two things are blocking us.** (1) Do written standards exist for
> deriving component dimensions from bore, rod and stroke, or does the
> estimator work from experience? (2) Is welding costed by the workbook
> formula or the later Rs 14 per inch per bead instruction?
>
> Everything else below is a data issue you'll want to know about, but
> it isn't holding up work.

Aniktha,

We've extracted every formula from `Trunion Included.xlsx` and checked it
against the reference document and the cost sheet. The workbook is a good
spec — the process routing, rate cards and welding logic are all clear
enough to build from, and the engine already reproduces your own cached
figures where we have the dimensions (your Cushion Bush sheet comes out
at Rs 3,798 against your Rs 3,798.47).

Six things below. The first two block us. The third is a set of defects
in the workbook that you'll want to fix regardless — it does not
currently produce a total. The last three are data questions.

Each is answerable in a sentence.

---

## 1. Do written geometry standards exist? — **blocks everything**

Your reference document and your workbook disagree on this, and it is
the central question for the whole build.

**Your reference document says:**

> "Changing Bore, Tube OD, Stroke or Rod Diameter must cascade to
> dependent geometry and costing."

**Your workbook derives no dimension from any of them.** We checked all
24 sheets. Bore, Rod and Stroke are referenced 16 times, every one of
them for a label or a database record. Tube Raw OD 110, Finished OD 108,
Finished ID 100.4, Length 900 — all typed in by hand.

So:

> **Which is the intent — is the cascade something that already exists
> and we haven't found it, something you want built, or something the
> estimator does in his head?**

Three lines above the cascade requirement, the same document says:

> "Do not invent missing geometry values. Missing engineering dimensions
> must be marked ENGINEERING INPUT REQUIRED."

That is exactly what we have built, so we are not proposing a change of
direction. And two lines below it:

> "Maintain source/basis and confidence for **future** geometry
> standards."

which reads as though the standards are still to be established. If that
is right, we would rather hear it plainly than keep looking for a
document that was never written.

### Why it matters this much

We have now measured it rather than guessed at it.

We ran all 295 cylinders from your cost sheet through the engine and
compared against what you actually charged. The tool comes in about
**3x under** your real prices. Splitting that gap:

| | |
|---|---|
| Missing component mass | **99.3%** |
| Rates being too low | **2.3%** |

**Your rates are essentially right.** The engine prices a kilogram at
397 Rs/kg where you charged 435. That is not the problem.

The problem is mass. The engine predicts a median **48 kg** where the
cylinder actually weighed **127 kg**, because it only models the tube and
the rod. It cannot compute the covers, gland, piston, eyes, bushes or
trunnion — and it cannot compute them because there is nothing to
compute them *from*.

To show how little the rates matter here: correcting them alone would
move a median quote from Rs 19,197 to Rs 19,672, against a real figure
of Rs 55,350. It barely moves. The mass is the whole gap, and no rate
change reaches it.

Any answer is workable and we'll build accordingly. If standards *do*
exist, even partially — tube OD by bore, boring allowance, tube length
vs stroke, rod raw bar sizing — anything you have is useful. If they
don't, the tool asks the estimator for those dimensions rather than
inventing them, which is what your own document instructs. What we
cannot do is guess.

There is a working preview that makes this concrete: it lists all 52
dimensions it needs, by component and by your own cell reference, and
shows what it can already compute without them.

**This might be faster on a call — twenty minutes with whoever does the
estimating would probably settle it.** A written answer to "do standards
exist" will be one word either way. What would actually help is watching
him pick a cap end cover OD for a given bore: whether he reaches for a
chart, a past job, or judgement tells us what to build. We can share the
preview on screen and go through the 52 dimensions with him directly.

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

- Everything is built from the workbook, not from the reference document.
  Where the two disagree, the workbook wins.
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
