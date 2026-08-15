# CLAUDE.md — AEW Platform (frontend)

Context for any AI assistant working on this repository. Read this before
changing anything.

**Build** 2026.08.14-1 · **Status** Working prototype, pre-customer-demo
**Owner** Technical founder · **First customer** HISPL, Peenya Industrial Area, Bangalore

---

## What this is

A static, buildless, multi-page web application. A single sign-on portal
delivering engineering tools to Indian manufacturing SMEs. The live
product is a hydraulic cylinder costing ERP.

There is a companion repository, `aew-backend` (FastAPI), which is built
but not yet deployed.

---

## The five rules

Break any of these and something will fail silently. Every one of them
exists because it already went wrong.

### 1. The ERP business logic is frozen

`products/costing/index.html` contains one inline `<script>` block
identified by the constant `BEAR_TYPES`. That block holds 326 lines of
engineering formulas, machining tables and costing methodology validated
by HISPL.

**Do not modify it.** Its entire coupling to the platform is one line:

```js
function doLogout(){ AEW.auth.logout(); }
```

Everything else — field seeding, geometry validation, the Calculate
bars, Save and History — lives in a **separate bootstrap block** further
down the same file.

Verify after any change:

```bash
node tests/integrity.js     # must print: ERP INTACT
```

Current business-logic hash: `afb92d49a6c7315589835c2402781b9a`

#### Freeze exception — 2026-08-14

The block **was** modified, once, deliberately. The freeze exists to
stop a wrong number reaching a customer; this was that case.

Three surfaces — Summary, Quotation and PDF — each computed the
manufacturing total independently. The PDF's version omitted every
machined component, so it printed **₹13,389 where the screen said
₹17,589**, understating by 23.9 %. Each surface also re-read the margin
as `gv('profit-pct') || 20`, so a 0 % margin silently became 20 % on
two of the three. Together, a 0 %-margin PDF quoted **₹1,522 below
manufacturing cost** on a document that looked entirely correct.

Patching each surface separately would have guaranteed they diverged
again, so the fix was structural:

| Added to the frozen block | Purpose |
|---|---|
| `coverTot(id)` | one machined component, whole rupees |
| `componentSub()` | tube + rod + all covers |
| `mfgTotal()` | the manufacturing cost — **the only one** |
| `marginPct()` | honours an explicit 0 %; blank still defaults to 20 % |
| `commercials()` | `{mfg, pp, pa, sp, qty, ov}` for every surface |

`calcSummary`, `buildQuote` and `generatePDF` now all call
`commercials()` and compute nothing themselves. `calcTube`, `calcRod`,
`calcBOM` and `calcAsm` round each line to whole rupees so a printed
column always sums to its printed total.

The bootstrap's `enforceZeroMargin()` and `watchMargin()` were
**deleted**: they were a second authority on the same number, and they
recomputed from the rounded `ss-mfg` text, which would have re-broken
the agreement by a rupee.

Guarded by `tests/formulas.js`, which fails if the three surfaces
disagree by even ₹1. See `docs/WORKED_EXAMPLE.md` for the evidence and
`docs/PATCHES-PROPOSED.md` for the patch as reviewed.

### 2. Never write `</body>` inside a JavaScript string

VS Code Live Server injects its reload client at the **first**
`</body>` in the served HTML. The ERP once had that exact text inside a
JS string in `printQuote()`:

```js
pw.document.write('</body></html>');   // Live Server injected HERE
```

The injection broke the string literal, the entire ERP script block
failed to parse, and every function was undefined — while the page still
rendered normally. It looked like a calculation bug for days.

Fixed with an identity escape, which produces a byte-identical runtime
string:

```js
pw.document.write('<\/body><\/html>');
```

```bash
node tests/liveserver.js    # must print: 8 safe, 0 vulnerable
```

### 3. Exactly one `</body>` and one `</html>` per page

An earlier build script appended closing tags without stripping the
existing ones. `dashboard.html` accumulated **five** pairs. Scripts ended
up after `</html>`, so `DOMContentLoaded` had already fired and no
handler ever ran. Every button on every page stopped working.

When assembling a page, always strip first:

```python
html = re.sub(r'(\s*</body>\s*</html>)+\s*$', '', html.rstrip())
html = html + scripts + '\n</body>\n</html>'
```

### 4. Every inline `onclick` must be bound to `window`

The Sign In button called `signIn()` while the page script defined only
`doSignIn()`. It silently did nothing for weeks — the login page was
auto-redirecting at the time, so the dashboard appeared anyway and the
dead button stayed invisible.

```bash
node tests/handlers.js      # must print: 25 bound, 0 dead
```

### 5. Do not touch authentication without a very good reason

It took many iterations to stabilise. The current design works. See the
architecture section below before changing anything in
`assets/js/{config,supabase,session,router,auth}.js`.

---

## Architecture

Eight modules under `assets/js/`, loaded in this order. Dependencies
point one way only — the graph is acyclic.

| Module | Owns | Depends on |
|---|---|---|
| `config.js` | Base URL discovery, all routes, constants | — |
| `supabase.js` | The single Supabase client | config |
| `session.js` | Auth state machine, the single auth listener | supabase |
| `router.js` | The single navigator, redirect-loop guards | config |
| `auth.js` | Auth policy — connects session to router | session, router |
| `ui.js` | DOM helpers | — |
| `api.js` | Backend client | config, supabase |
| `common.js` | Formatting, debounce | — |

Enforced throughout: exactly **one** `createClient` call, **one** auth
state listener, **one** place that writes `window.location`, and **zero**
authentication code in any page file.

### Authentication has three states, not two

The single most important idea in this codebase.

| State | Meaning | May the app act on it? |
|---|---|---|
| `UNKNOWN` | Still determining | **No** |
| `AUTHENTICATED` | Session confirmed | Yes |
| `ANONYMOUS` | No session confirmed | Yes |

Treating `UNKNOWN` as `ANONYMOUS` causes redirect loops. A token refresh
in flight briefly looks like "no session"; code that redirected on that
produced login → ERP → login several times per second.

The fix: wait for Supabase's `INITIAL_SESSION` event, which fires once,
**after** any pending refresh settles, carrying the definitive answer.
Never call `getSession()` directly outside `session.js`.

### Why redirect loops are now impossible

Four independent properties, any one of which breaks a cycle:

1. **One navigation per page load.** A commit latch is set on the first
   redirect; further attempts are ignored.
2. **Never navigate to the current page.** The router compares target to
   current URL and refuses a match.
3. **Pages cannot disagree.** One client, one session result. Login and
   the ERP read identical facts.
4. **Circuit breaker.** Four navigations within six seconds halts and
   shows a diagnostic instead of continuing.

### Logout cannot fail

Four steps; three are synchronous, so it works with no network.

```
1  Disarm the session listener        (synchronous)
2  Purge session data from storage    (synchronous)
3  Tell Supabase to revoke the token  ← fire-and-forget, NOT awaited
4  Navigate to login                  (synchronous)
```

An earlier version awaited step 3. When it failed, the user was stranded
on the page.

### Login page policy (owner decision, revised)

`login.html` **always** shows the sign-in form. It never auto-redirects,
even with a valid session. The owner wants credentials entered every
time. Session persistence is unaffected — refreshing the dashboard or
the ERP keeps you signed in.

---

## Bugs already fixed — do not reintroduce

| Bug | Root cause |
|---|---|
| Every cost read ₹0 above 63 mm bore | Raw OD ships at 75 mm. Any larger bore made ID > OD, the weight formula `(π/4)(OD²−ID²)` went negative, was clamped to zero, and every downstream cost silently became zero. Bores 80/100/125/160/200 all affected. Now auto-corrects with a visible warning. |
| 0 % margin silently applied 20 % | `gv('profit-pct') \|\| 20` — in JavaScript `0 \|\| 20` is `20`. Quoting at cost is legitimate. Guarded in the bootstrap block. |
| Master labour rate did nothing | `pr-lab` sat under "UPDATES ALL SHEETS INSTANTLY" but was read by nothing. All 18 per-operation rates were hardcoded to 100. Now wired; rows set individually are preserved. |
| Calculate wiped manual overrides | `propagate()` rewrites tube length from stroke. Now tracked by watching input events — typing in a derived field marks it yours; changing the driving dimension releases it. |
| Every manual-entry field shipped at 0 | Totals read ₹0 until eight components were typed in. `ERP_RATE_CARD` seeds opening values without ever overwriting user input. |
| `bootERP` aborted on first error | Eight unguarded calls; one throw stopped the rest. Now each step runs isolated via `bootStep()`. |
| PDF quoted ₹4,200 below the screen | `generatePDF` built its own manufacturing total and left out every machined component. Three surfaces each rolled up independently. One `commercials()` now serves all three. |
| 0 % margin became 20 % on the quotation and PDF | The bootstrap guard patched only the Summary panel; the other two re-read `gv('profit-pct') \|\| 20`. `marginPct()` now honours an explicit zero at source. |
| A 56 mm rod machined from 52 mm bar | `propagate()` set the finished rod diameter but never the raw bar, which shipped at 52 mm. Nothing zeroed — the cost stayed plausible while being computed from stock that cannot exist. `autoFixRodDia()` now raises it, as `autoFixTubeOD()` does for the tube. |
| Printed columns did not sum to printed totals | Lines displayed to whole rupees, totals summed at 2 dp. Every line is now rounded before summing. |

---

## Testing

```bash
cd tests
npm install          # jsdom — testing only; the app has zero dependencies
bash run-all.sh
```

**388 assertions across 17 suites. All must pass before any deployment.**

| Suite | Guards against |
|---|---|
| `integrity` | Accidental modification of the frozen ERP |
| `liveserver` | The `</body>`-in-a-string injection bug |
| `handlers` | Dead inline event handlers |
| `bores` | Invalid geometry silently zeroing every cost |
| `inquiry` | Master rates wired to nothing |
| `calcbar` | Calculate bars, override preservation |
| `persistence` | Save/History, and graceful degradation offline |
| `demo` | Adversarial input: zero, negative, text, extremes |
| `scenario` | The full customer demonstration flow |
| `full` | Any blank or zero output across all 9 panels |

Every suite was written in response to a real defect. None are
speculative.

---

## Conventions

- **Vanilla JavaScript only.** No framework, no build step, no bundler.
  Deployment is `git push`; Cloudflare Pages serves the repository root.
- **ES5-compatible syntax** in `assets/js/` — `var`, `function`, no
  arrow functions or template literals. The ERP block is exempt.
- **Bump the build number** in `assets/js/config.js` after any change,
  and update the `?v=` on every page's script tags. Browsers cache
  aggressively and a correct fix can look like it did nothing.
- **Never use `innerHTML` on a container the ERP owns** — it destroys
  the existing event handlers. Use `createElement`.
- **Comments explain *why*, never *what*.**

### The landing page figure is derived from the ERP

`index.html` shows a hydraulic cylinder costing **₹18,092** broken into
twelve components. Those are not illustrative numbers — every one is a
real line from an ERP costing run of **Ø100 bore × Ø56 rod × 500
stroke, qty 10** at the shipped rate card. They sum to the ERP's
manufacturing cost exactly, with no balancing entry.

**Regenerate them whenever costing logic changes.** They drifted once
already: the page advertised ₹17,589 while the tool had moved to
₹18,092, and the honest answer to "which is right?" would have been
"not the marketing one".

To regenerate: run that enquiry in the ERP, read the Summary panel, and
update `PARTS` in `index.html`. The eight meshed entries take their own
ERP line; the four `noMesh` entries aggregate the ten smaller lines the
way the ERP's PDF groups them. `GRAND_TOTAL` is computed from the
array, so the total follows automatically — but the array must still
sum to what the ERP reports.

---

## Known limitations

| Limitation | Impact |
|---|---|
| `ERP_RATE_CARD` holds placeholder figures | **Must be replaced with HISPL's real costs before quoting a live job.** The formulas and machining rates are correct; only these opening values need confirming. |
| No persistence until the backend deploys | Closing the tab loses the costing. The ERP degrades gracefully and says "Local only". |
| Print output never visually verified | The PDF path is exercised programmatically; nobody has looked at it on paper. |
| Single tenant in practice | Multi-tenant isolation is designed in `aew-backend` but not yet live. |

---

## Next steps

1. Replace `ERP_RATE_CARD` with HISPL's actual costs
2. Print one quotation and check it visually
3. Deploy `aew-backend`, then set `BASE_URL` in `assets/js/api.js`
4. Landing page — a 3D exploded-cylinder hero is designed but not built
5. Fix SEC-1 in the backend before any real data exists (see that repo)
