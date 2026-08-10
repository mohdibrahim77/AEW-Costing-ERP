# Test Suite

Loads the **real, unmodified** source and the actual HTML pages. Production
code paths, not mocks.

```bash
cd tests

# No dependencies
node test.js       # authentication, session, logout, failure modes    (19)
node routing.js    # routing matrix, navigation guards                 (10)
node handlers.js   # every inline onclick is bound                     (25)

# Need jsdom:  npm install jsdom
node erp.js        # ERP boot, all 9 tabs, fault isolation             (17)
node values.js     # every value computes, custom input honoured       (15)
node tube.js       # Tube auto-fields + manual override                (22)
node verify.js     # post-boot self-check and fault report              (9)
node bores.js      # all 9 standard bore sizes + geometry guard        (17)
node inputs.js     # 33 custom inputs across every panel               (33)
node full.js       # exhaustive blank/zero audit, all 9 panels
```

All exit non-zero on failure. Without jsdom the last six skip cleanly.

## Why each suite exists — every one traces to a real defect

| Suite | The bug it prevents returning |
|---|---|
| `handlers.js` | The Sign In button called `signIn()` while the script defined only `doSignIn()`. It silently did nothing for weeks. |
| `erp.js` | `bootERP` ran eight calls with no error handling. One throw aborted the rest, leaving a page that rendered but did not work. |
| `values.js` | Every manual-entry cost field shipped at zero, so the total read ₹0 until eight components were typed in by hand. |
| `tube.js` | Four diameter fields shipped blank, so drilling and welding computed zero hours and printed "—". |
| `bores.js` | **The big one.** Raw OD ships at 75 mm. Any bore above that made ID > OD, the weight formula went negative, and every cost silently became zero with no warning. Bores 80, 100, 125, 160, 200 — all standard sizes — were affected. |
| `verify.js` | Failures were invisible unless you opened the console. |
| `inputs.js` | Confirms all 33 editable fields accept custom values and recalculate. |

## Run all of them before every deployment.
