# Architecture Specification
## AEW Manufacturing Intelligence Platform

| Field | Value |
|---|---|
| Document | ARCH v1.0 |
| Phase | 2 of 12 — Architecture |
| Status | **DRAFT — awaiting sign-off** |
| Traces to | SRS v1.0 (`01-SRS.md`) |
| Date | 29 July 2026 |

> **No code appears in this document.** Module contracts are expressed as
> interface tables. Implementation begins at Phase 6.

---

## 1. Decisions of Record

Phase 1 raised seven open questions. You approved continuation without
overriding them, so each is resolved to its recommended default and recorded
here as a binding decision. **Every one is cheaply reversible** — the
"Reversal cost" column states exactly what changes if you decide otherwise.

| ID | Decision | Rationale | Reversal cost |
|---|---|---|---|
| **DR-1** | ~~Auto-redirect~~ **REVISED 29 Jul 2026 (owner decision):** the sign-in form is **always** shown. `login.html` never navigates on load, even with a valid session. Credentials must be entered every time. | Owner requirement. Auto-redirect also concealed a dead Sign In button for weeks by making the manual path never exercised. | One block in `auth.js`. |
| **DR-2** | Session lifetime 30 days, rolling refresh. | Factory staff should not re-authenticate daily. | Supabase dashboard setting. Zero code. |
| **DR-3** | Logout terminates this device only. | Global sign-out is surprising; it belongs behind an explicit action. | One parameter on the sign-out call. |
| **DR-4** | No database persistence in v1.0. Backend stays undeployed. | The ERP demonstrates full value client-side. Deploying a backend before a presentation adds risk without adding demo value. | `api.js` exists as a dormant seam. Phase 13 work, not a refactor. |
| **DR-5** | Single Supabase project, row-level isolation per tenant. | Only model that scales past a handful of customers. | Would require data migration — expensive later, free now. |
| **DR-6** | Password minimum 8 characters, no complexity rules. | Complexity rules measurably reduce security by driving password reuse. | Supabase dashboard setting. |
| **DR-7** | Demo runs from the Cloudflare URL. Live Server rehearsed as fallback. | A public URL is more credible and removes the local-environment variables that caused most of the past week's difficulty. | None. |

**If you want any of these different, say so now** — changing them at Phase 2
is free. Changing DR-5 after data exists is not.

---

## 2. Design Principles

These are the rules the design is accountable to. Every subsequent decision
in this document derives from one of them.

| # | Principle | Consequence for this system |
|---|---|---|
| **P1** | **Single Source of Truth** | Exactly one client, one session manager, one router, one config. Duplication is the root cause of every defect in this project's history. |
| **P2** | **Authentication state is ternary, not binary** | `UNKNOWN` is a first-class state. The entire class of redirect-loop bugs came from code treating "still determining" as "not authenticated". |
| **P3** | **Decisions require certainty** | No navigation may be initiated while state is `UNKNOWN`. |
| **P4** | **Dependency Inversion at the event boundary** | `session.js` **emits** events. It does not navigate. The composition root decides what an event means. This is what removes the logout race. |
| **P5** | **Pages are consumers** | A page declares its requirement and receives a result. It holds no auth knowledge. |
| **P6** | **Fail closed, fail fast, fail loudly** | Indeterminate outcomes resolve to "not authenticated". Nothing fails silently. |
| **P7** | **Runtime environment detection** | Zero build-time configuration. The app discovers where it lives. |
| **P8** | **The ERP is immutable** | Enforced cryptographically, not by convention (§13). |

---

## 3. High-Level Design

### 3.1 Layered architecture

Dependencies point **downward only**. No layer may reference a layer above it.

```
┌──────────────────────────────────────────────────────────┐
│  L5  PRESENTATION                                        │
│      login.html · dashboard.html · reset-password.html   │
│      products/{costing,cbam,vibration,asset}/            │
│      Owns: DOM, page-specific behaviour                  │
│      Knows: nothing about authentication mechanics       │
└───────────────────────────┬──────────────────────────────┘
                            │ requireAuth() / guestOnly()
┌───────────────────────────▼──────────────────────────────┐
│  L4  COMPOSITION ROOT          auth.js                   │
│      The ONLY module that wires session ⇄ router.        │
│      Owns: policy — "what a session event means"         │
└──────────┬────────────────────────────────┬──────────────┘
           │                                │
┌──────────▼──────────────┐   ┌─────────────▼──────────────┐
│  L3  STATE   session.js │   │  L3  NAVIGATION  router.js │
│      Auth state machine │   │      The ONLY navigator    │
│      The ONLY listener  │   │      Loop guards           │
│      EMITS, never nav's │   │      Knows nothing of auth │
└──────────┬──────────────┘   └─────────────┬──────────────┘
           │                                │
┌──────────▼────────────────────────────────▼──────────────┐
│  L2  INFRASTRUCTURE     supabase.js                      │
│      The ONE client instance                             │
└───────────────────────────┬──────────────────────────────┘
┌───────────────────────────▼──────────────────────────────┐
│  L1  FOUNDATION         config.js                        │
│      Self-locating base URL · routes · constants         │
│      Zero dependencies                                   │
└──────────────────────────────────────────────────────────┘

     ── LEAF UTILITIES (no dependents, no dependencies) ──
       ui.js          DOM helpers
       common.js      pure functions
       api.js         backend seam (dormant per DR-4)
```

### 3.2 The critical structural change from all previous attempts

```
BEFORE (defective)                    AFTER (this design)

session.js                            session.js
   └─► router.gotoLogin()                └─► emit('signed-out')
       ▲                                        │
       │ layering violation                     ▼
       │ two owners of navigation         auth.js  (sole policy owner)
       │ race → logout fails                    │
auth.logout()                                   ▼
   └─► router.gotoLogin()                 router.goto(...)
```

`session.js` losing its dependency on `router.js` is the single most
important change in this document. It converts two competing navigation
owners into one, which is what makes logout deterministic (§10) and redirect
loops impossible (§9.3).

### 3.3 Module inventory

| Module | Layer | Responsibility | Depends on | ~LOC |
|---|---|---|---|---|
| `config.js` | L1 | Base URL discovery, routes, constants | — | 60 |
| `supabase.js` | L2 | The one client instance | config | 30 |
| `session.js` | L3 | Auth state machine, the one listener, event emission | supabase | 130 |
| `router.js` | L3 | The one navigator, loop guards, circuit breaker | config | 90 |
| `auth.js` | L4 | Auth policy, page contracts, logout orchestration | session, router, supabase, config | 160 |
| `ui.js` | leaf | DOM helpers | — | 55 |
| `api.js` | leaf | Backend seam (dormant) | config | 25 |
| `common.js` | leaf | Pure utilities | — | 35 |

**Dependency graph is acyclic — verified against the current codebase.**

---

## 4. Low-Level Design — Module Contracts

### 4.1 `config.js` — Foundation

**Responsibility:** discover where the application is deployed; publish
routes and constants. No behaviour.

**Base URL discovery — three-tier fallback:**

| Tier | Method | Reliability |
|---|---|---|
| 1 | `document.currentScript.src` | Exact — identifies the running script itself |
| 2 | Scan script tags for the `config.js` path marker | High — works if tier 1 unavailable |
| 3 | `location.origin + '/'` | Fallback — assumes deployment at web root |

The discovered base is truncated at the known suffix, yielding the project
root regardless of which directory the server treats as its web root
(satisfies **FR-C7**, **NFR-C4**).

| Export | Type | Notes |
|---|---|---|
| `BASE` | string | Absolute, trailing slash |
| `ROUTES.login` / `.dashboard` / `.reset` | string | Absolute URLs |
| `ROUTES.products.{key}` | string | Explicit `index.html`, never a directory (**FR-C8**) |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | string | Publishable key only (**NFR-S2**) |
| `IS_FILE` | boolean | `file://` protocol detected |
| `SESSION_TIMEOUT_MS` | number | 10 000 — watchdog (**FR-B6**) |
| `NAV_BUDGET` | number | 3 — circuit breaker threshold |

**Invariants:** no side effects · no DOM writes · no network · loads first.

---

### 4.2 `supabase.js` — Infrastructure

**Responsibility:** instantiate the identity client. Once. Ever.

| Export | Notes |
|---|---|
| `AEW.supabase` | The single client instance, or `null` if the SDK failed to load |

**Invariants:**
- The only `createClient` call in the codebase (**FR-A10**, **NFR-M1**)
- If the CDN failed, exports `null` rather than throwing — callers fail
  closed per **P6**
- No auth logic

---

### 4.3 `session.js` — State Machine ★

The heart of the design. Read §5 for the state machine before this table.

**Responsibility:** own authentication state. Emit transitions. **Never
navigate.**

| Export | Contract |
|---|---|
| `subscribe(onResolved, onTerminated)` | Register interest. `onResolved` fires exactly once with the session or `null`. `onTerminated` fires if the session is destroyed later. Safe to call any number of times. |
| `getState()` | Returns `UNKNOWN` \| `AUTHENTICATED` \| `ANONYMOUS` \| `TERMINATING` |
| `getSession()` | Cached session object or `null`. Meaningless while `UNKNOWN`. |
| `beginTermination()` | Moves to `TERMINATING`. Disarms the listener so a deliberate logout is not double-handled. Called only by `auth.logout()`. |

**Invariants:**
- Exactly one `onAuthStateChange` registration per page load (**FR-B9**)
- Resolution happens exactly once; late subscribers get the cached result
  asynchronously
- No reference to `router` — enforced structurally (**P4**)
- Watchdog resolves to `ANONYMOUS` at 10 s (**FR-B6**)

**Why `INITIAL_SESSION` and not a direct session query:** a direct query can
return `null` while a token refresh is in flight — an `UNKNOWN` state
misreported as `ANONYMOUS`. `INITIAL_SESSION` fires once, *after* any
pending refresh settles, carrying the definitive answer. This is the
provider-level guarantee that **P2** and **P3** depend on.

---

### 4.4 `router.js` — Navigation

**Responsibility:** the sole mutator of `window.location`.

| Export | Contract |
|---|---|
| `goto(url)` | Navigate, subject to all guards. Idempotent — the second call in a page lifetime is a no-op. |
| `gotoLogin()` / `gotoDashboard()` | Named destinations |
| `routeUser(user)` | Resolve entitlements to a destination, then `goto` |
| `isCurrent(url)` | Current-page test |

**Three independent guards:**

| Guard | Mechanism | Prevents |
|---|---|---|
| **G1 — Commit latch** | In-memory flag set on first navigation | Multiple navigations within one page lifetime |
| **G2 — Identity check** | Compare current URL to target, ignoring query and hash | Navigating to the page already displayed (**FR-C2**) |
| **G3 — Circuit breaker** | Counter in `sessionStorage`; if `NAV_BUDGET` navigations occur inside 5 s, halt and surface a diagnostic instead of navigating | Any residual loop, including one caused by a future bug |

G1 and G2 make loops impossible by construction (§9.3). G3 exists because a
system that has looped before earns defence in depth.

**Invariants:** uses history *replacement*, never push (**FR-C5**) · reads
routes only from config (**FR-C6**) · contains no auth knowledge.

---

### 4.5 `auth.js` — Composition Root

**Responsibility:** the only module that knows what a session event *means*.
Wires `session` to `router`.

| Export | Contract |
|---|---|
| `requireAuth(onReady)` | Protected-page contract. Resolves to `onReady(user)` or navigates to login. Arms termination handling. |
| `guestOnly()` | Login-page contract. Routes an authenticated user onward per **DR-1**; otherwise does nothing. Never arms termination. |
| `login(email, password)` | Returns outcome. Does not navigate — the page decides. |
| `logout()` | Deterministic four-step termination (§10). Cannot fail. |
| `sendPasswordReset(email)` | Returns outcome |
| `updatePassword(password)` | Returns outcome |

**Critical asymmetry:** `requireAuth` subscribes to termination;
`guestOnly` does **not**. A public page has no protected content to evict,
so it must never react to a sign-out event. This asymmetry is what prevents
the login page from participating in any navigation cycle.

---

### 4.6 Leaf modules

| Module | Exports | Notes |
|---|---|---|
| `ui.js` | `setText` `setStyle` `show` `hide` `setLoading` `markError` `clearErrors` | Pure DOM. No state. |
| `common.js` | `formatINR` `formatDate` `debounce` | Pure functions. No DOM, no network. |
| `api.js` | `saveQuotation` `getQuotations` | Dormant per **DR-4**. Exists so Phase 13 is an implementation, not a refactor. |

---

## 5. Authentication State Machine ★

The formal core of the design. Everything in §9 and §10 follows from this.

### 5.1 States

| State | Meaning | Navigation permitted? |
|---|---|---|
| `UNKNOWN` | Determination in progress | **No** — this is **P3** |
| `AUTHENTICATED` | Valid session confirmed | Yes |
| `ANONYMOUS` | No valid session confirmed | Yes |
| `TERMINATING` | Deliberate logout underway | By `auth.logout()` only |

### 5.2 Transition diagram

```
                        ┌───────────┐
      page load  ──────►│  UNKNOWN  │  no decisions permitted here
                        └─────┬─────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    INITIAL_SESSION(session)       INITIAL_SESSION(null)
    or watchdog with cache         or watchdog timeout (10 s)
              │                               │
              ▼                               ▼
      ┌───────────────┐               ┌──────────────┐
      │ AUTHENTICATED │               │  ANONYMOUS   │  ◄── terminal
      └───┬───────┬───┘               └──────────────┘
          │       │
          │       └── TOKEN_REFRESHED ──► (cache updated, NO transition)
          │
    ┌─────┴──────────────┬─────────────────────┐
    │                    │                     │
 auth.logout()    SIGNED_OUT (other tab)   refresh failure
    │                    │                     │
    ▼                    ▼                     ▼
┌─────────────┐   ┌──────────────────────────────┐
│ TERMINATING │   │ emit('terminated') → auth.js │
│  (terminal) │   │      decides to navigate     │
└─────────────┘   └──────────────────────────────┘
```

### 5.3 Properties that make the design safe

| Property | Statement | Why it matters |
|---|---|---|
| **Monotonic** | State never returns to `UNKNOWN` | A resolved page cannot be re-confused by a later event |
| **Resolve-once** | `UNKNOWN` → resolved happens exactly once | Subscribers fire once; no repeat decisions |
| **No silent transitions** | `TOKEN_REFRESHED` updates the cache but changes no state | Routine background refresh cannot trigger navigation — *this was a defect in an earlier build* |
| **Total** | Watchdog guarantees departure from `UNKNOWN` within 10 s | The app can never hang undecided (**FR-B6**) |
| **Fail-closed** | Every ambiguous path resolves to `ANONYMOUS` | Security default (**P6**) |

---

## 6. Startup Flow

Script placement is a documented architectural constraint, not a
formatting preference. Incorrect placement caused a total functional failure
in a previous build (see §14).

```
 1  Browser requests page
 2  <head> parsing begins
 3  ├─ Supabase SDK           (CDN, synchronous)
 4  ├─ config.js              (L1)  ─┐
 5  ├─ supabase.js            (L2)   │ synchronous,
 6  ├─ session.js             (L3)   │ strict dependency
 7  ├─ router.js              (L3)   │ order, all before
 8  ├─ auth.js                (L4)   │ <body> is parsed
 9  ├─ ui.js / api.js / common.js   ─┘
10  │
11  │  ═══ window.AEW namespace is now COMPLETE ═══
12  │
13  <body> parsing begins
14  ├─ Auth overlay rendered VISIBLE
15  ├─ Application content rendered HIDDEN  ◄── CSS default, satisfies FR-D3
16  │
17  Page script (immediately before the single </body>)
18  ├─ registers a DOMContentLoaded handler
19  │
20  DOMContentLoaded fires   ◄── handler is registered, so it runs
21  ├─ Protected page: auth.requireAuth(bootPage)
22  └─ Login page:     auth.guestOnly()
23  │
24  session.subscribe → state resolves → decision → render or navigate
```

**Why modules load in `<head>` synchronously:** the `AEW` namespace must be
complete before any page script executes. Deferring or moving them below the
body reintroduces ordering hazards.

**Why the page script sits immediately before `</body>`:** it must run after
the DOM it addresses exists, and it must be registered *before*
`DOMContentLoaded` fires. Placing it after `</html>` means the handler
registers after the event has already fired, and it never runs.

**Why content is hidden by CSS default rather than hidden by script:** a
script-driven hide has a window in which protected content is visible. A CSS
default has none.

---

## 7. Authentication Flow

```
LOGIN                          user submits credentials
  │
  ├─ page validates input locally (empty checks only)
  ├─ auth.login(email, password)
  │     └─► supabase.signInWithPassword
  │
  ├─ failure ─► generic message (FR-A3) · clear password (FR-A4)
  │             · NO navigation · page remains interactive
  │
  └─ success ─► router.routeUser(user)
                  ├─ role 'admin' or >1 entitlement ─► dashboard
                  └─ exactly 1 entitlement          ─► that product
```

```
PROTECTED PAGE                 page load
  │
  ├─ auth.requireAuth(bootPage)
  │     └─► session.subscribe(onResolved, onTerminated)
  │
  ├─ state UNKNOWN ─► overlay remains · nothing decided (P3)
  │
  ├─ resolves AUTHENTICATED ─► bootPage(user)
  │                              ├─ hide overlay
  │                              ├─ reveal content
  │                              └─ initialise page
  │
  └─ resolves ANONYMOUS ─────► router.gotoLogin()   [exactly once]
```

---

## 8. Session Flow

```
                    ┌──────────────────┐
                    │  ONE client      │
                    │  ONE listener    │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
 INITIAL_SESSION      TOKEN_REFRESHED         SIGNED_OUT
        │                    │                    │
   resolve once         update cache        emit 'terminated'
   notify all           NO transition              │
   subscribers          NO navigation              ▼
        │                                    auth.js decides
        ▼                                          │
  UNKNOWN → resolved                               ▼
                                            router.gotoLogin()
```

**Multi-tab propagation (FR-B7):** tab A logs out → provider clears shared
browser storage → tab B's listener receives `SIGNED_OUT` → `session.js`
emits `terminated` → `auth.js` navigates tab B to login. Tab B took no
navigation decision of its own; it responded to an authoritative event.

**Token refresh (FR-B4):** handled entirely inside the provider SDK. The
application observes only the settled outcome. There is no code path in
which the application reads a mid-refresh value — this is the architectural
elimination of the original loop cause.

---

## 9. Routing Flow & Loop-Freedom

### 9.1 Route resolution

Every route is derived from the discovered base URL. No route string appears
in more than one place (**FR-C6**).

| Logical route | Resolves to |
|---|---|
| login | `{BASE}login.html` |
| dashboard | `{BASE}dashboard.html` |
| reset | `{BASE}reset-password.html` |
| product *k* | `{BASE}products/{k}/index.html` |

Product routes name `index.html` explicitly. A directory URL relies on the
server performing index resolution, which VS Code Live Server does not do —
the observed `Cannot GET /products/costing/` failure (**FR-C8**).

### 9.2 Navigation decision table

| Page | State | Action |
|---|---|---|
| login | `UNKNOWN` | **none** |
| login | `AUTHENTICATED` | route to entitled destination (DR-1) |
| login | `ANONYMOUS` | **none** — remain, show form |
| login | `terminated` event | **not subscribed** |
| protected | `UNKNOWN` | **none** |
| protected | `AUTHENTICATED` | render |
| protected | `ANONYMOUS` | → login |
| protected | `terminated` event | → login |

Every cell is either "none" or a single navigation. No cell produces two.

### 9.3 Why a redirect loop cannot occur

A loop requires a sustained cycle: page A navigates to B, B navigates back
to A, repeatedly. Four independent properties each break this.

**1 — At most one navigation per page load (G1).**
The commit latch is set on the first navigation. A loop needs an unbounded
number of navigations; a page lifetime permits one. Each cycle therefore
requires a full page load, bounding frequency to page-load rate rather than
event rate.

**2 — Pages cannot disagree.**
The cycle A→B→A requires A and B to reach *opposite* conclusions from the
same facts. Previously they could: each page ran its own client and queried
state at a different instant relative to a token refresh, so login saw a
session and the ERP saw none. Under this design both pages read one client
and one settled `INITIAL_SESSION` result. Opposite conclusions from identical
input are not possible.

**3 — `UNKNOWN` is never actionable (P3).**
The historical loop began by treating "still determining" as "not
authenticated". No transition out of `UNKNOWN` is a navigation trigger; only
arrival at a *resolved* state is.

**4 — Asymmetric subscription.**
The login page never subscribes to termination. Even a spurious sign-out
event cannot make the login page navigate — and a cycle requires *both*
participants to move.

**Defence in depth (G3).** Should a future change violate one of the above,
the circuit breaker halts after 3 navigations in 5 seconds and surfaces a
diagnostic. The failure mode becomes a visible error rather than a browser
locking up.

> Satisfies **FR-C4** / **NFR-R1**, the zero-tolerance requirement.

---

## 10. Logout Flow ★

Logout has failed repeatedly in this project. The root cause and its
resolution:

### 10.1 Root cause of previous failures

```
auth.logout()
   ├─ await signOut()                 ← async, network-dependent
   │     └─ provider fires SIGNED_OUT synchronously, internally
   │           └─ session.js listener → router.gotoLogin()
   │                 └─ SETS COMMIT LATCH ✗
   │
   └─ .then() → router.gotoLogin()
         └─ latch already set → SILENT NO-OP ✗

Result: two owners raced for one navigation. If the listener path failed
for any reason — network error, event not delivered — nothing navigated
and the user was stranded.
```

### 10.2 Resolved sequence

Ownership is singular. Steps 1, 2 and 4 are synchronous and cannot fail.

```
STEP 1   session.beginTermination()
         └─ state → TERMINATING
         └─ listener DISARMED — it will not act on SIGNED_OUT
         └─ eliminates the second navigation owner    [synchronous]

STEP 2   purge local session material
         └─ remove provider keys from browser storage
         └─ satisfies NFR-S4                          [synchronous]

STEP 3   fire provider signOut — NOT awaited
         └─ revokes the refresh token server-side
         └─ failure logged, never blocks               [fire-and-forget]

STEP 4   router.gotoLogin()
         └─ sole navigation owner                     [synchronous]
```

### 10.3 Guarantees

| Condition | Outcome |
|---|---|
| Network unavailable | Steps 1, 2, 4 succeed. **Logout works.** (**FR-A8**) |
| Provider returns an error | Step 3 logs; steps 1, 2, 4 unaffected. **Logout works.** |
| Provider hangs indefinitely | Never awaited. **Logout works.** |
| SDK failed to load | `supabase` is `null`; step 3 skipped. **Logout works.** |

Because local material is purged *before* navigation, the login page that
loads next cannot find a session. This is why logout is deterministic rather
than probabilistic.

---

## 11. Database Design

Per **DR-4** no application tables ship in v1.0. This section defines the
target so that Phase 13 is an implementation rather than a redesign.

### 11.1 v1.0 — identity only

```
┌─────────────────────────────────────────────────────┐
│  auth.users                       (provider-managed)│
├─────────────────────────────────────────────────────┤
│  id              uuid    PK                         │
│  email           text    unique                     │
│  encrypted_password      (never exposed)            │
│                                                     │
│  raw_user_meta_data      jsonb   ◄── USER-WRITABLE  │
│    { name, company, avatar, color }                 │
│                                                     │
│  raw_app_meta_data       jsonb   ◄── SERVER-ONLY    │
│    { tenant_id, role, products }                    │
└─────────────────────────────────────────────────────┘
```

### 11.2 🔴 Security finding — SEC-1

**Severity: High (latent) · Current impact: Low · Must fix before DR-4 is
reversed**

Role and entitlement currently reside in `user_metadata`. In Supabase,
`user_metadata` is **writable by the authenticated user** through the
standard update-user call. A user can therefore grant themselves
`role: 'admin'`.

| Aspect | Assessment |
|---|---|
| Impact **today** | Low. With no server-side data (DR-4), escalation only alters what the client displays. Nothing is exposed that the user could not already reach. |
| Impact **once persistence exists** | **Critical.** Self-granted admin would confer real data access across a tenant. |
| Fix | Move `role`, `products` and `tenant_id` to `app_metadata`, which the client cannot write. Read-only to the browser. |
| When | Before any application table is created. It is a data migration, not a code change, and is cheap now. |

Recorded here so it cannot be forgotten. Full analysis belongs to Phase 11.

### 11.3 Target schema (Phase 13)

```
  tenants                    profiles
  ─────────                  ─────────
  id          PK      ┌─────►id           PK, FK → auth.users
  name                │      tenant_id    FK → tenants
  created_at          │      display_name
      ▲               │      created_at
      │               │
      │               │      entitlements
      │               │      ─────────────
      └───────────────┴──────tenant_id    FK → tenants
      │                      product_key  costing|cbam|vibration|asset
      │                      active       boolean
      │
      │                      quotations
      │                      ───────────
      └──────────────────────tenant_id    FK → tenants   ◄── RLS pivot
                             user_id      FK → profiles
                             inquiry_no
                             customer
                             bore, rod, stroke
                             total_cost, selling_price, qty
                             payload      jsonb  (full costing snapshot)
                             created_at
```

**Isolation (DR-5, BR-3, BR-6):** every tenant-scoped table carries
`tenant_id`. Row-level security restricts all access to the caller's
`tenant_id`, read from `app_metadata` — which the user cannot forge once
SEC-1 is closed. Isolation is enforced by the database, not by the
application.

---

## 12. Folder Structure

```
aew-platform/
│
├── index.html                    public landing
├── login.html                    authentication
├── dashboard.html                product portal          [protected]
├── reset-password.html           password reset
│
├── assets/
│   ├── js/
│   │   ├── config.js             L1  foundation
│   │   ├── supabase.js           L2  the one client
│   │   ├── session.js            L3  state machine ★
│   │   ├── router.js             L3  the one navigator
│   │   ├── auth.js               L4  composition root ★
│   │   ├── ui.js                 leaf
│   │   ├── api.js                leaf (dormant, DR-4)
│   │   └── common.js             leaf
│   ├── css/                      reserved
│   └── images/                   reserved
│
├── products/
│   ├── costing/index.html        🔒 ERP — FROZEN        [protected]
│   ├── cbam/index.html           placeholder            [protected]
│   ├── vibration/index.html      placeholder            [protected]
│   └── asset/index.html          placeholder            [protected]
│
└── docs/
    ├── 01-SRS.md                 Phase 1
    ├── 02-Architecture.md        Phase 2  (this document)
    └── …                         Phases 3–12
```

---

## 13. ERP Integration Plan

### 13.1 Cryptographic baseline — established

The frozen block has been measured and hashed. This is the control that
makes **P8** verifiable rather than aspirational.

| Property | Value |
|---|---|
| Location | `products/costing/index.html`, between the script tags at lines 699 and 1026 |
| Size | 326 lines · 25,816 bytes |
| SHA-256 (full block) | `18b5571bbf7b9ae0a9d532c4969a8fc9a5f65c4ec03ceee6e6602c77f94ebfc3` |
| Business logic only, excluding the single integration line | 25,776 bytes |
| SHA-256 (business logic only) | `d1b484663dc6858ce3ea596f9bd86762af94d66191c23112f6de4ab66ecf0ffa` |

### 13.2 Integration surface — measured, not asserted

A scan of the frozen block for references to platform infrastructure returns
**exactly one line**:

```
line 30 of block:   function doLogout(){ AEW.auth.logout(); }
```

One line out of 326. That is the entire coupling between the ERP and the
platform. The remaining 25,776 bytes contain no platform reference of any
kind.

### 13.3 Permitted modifications — exhaustive

| # | Location | Change | Frozen block affected? |
|---|---|---|---|
| 1 | `<head>` | Insert 9 script tags (SDK + 8 modules) | **No** — outside the block |
| 2 | Frozen block, line 30 | Body of `doLogout` delegates to `auth.logout()` | Yes — the one sanctioned line (**FR-E4b**) |
| 3 | Trailing script block | Replaced by `requireAuth(bootERP)` | **No** — outside the block |

Nothing else. All 26 functions, all reference tables, all 9 panels, all
engineering computation, charting and PDF generation remain byte-identical.

### 13.4 Verification method

After every future change to this file, the business-logic hash is
recomputed and compared to `d1b48466…`. A mismatch means the ERP was
modified and the change is rejected. This converts "we did not touch the
ERP" from a claim into a proof, and it runs in Phases 9 and 12.

---

## 14. Structural Invariants

Machine-checkable rules. Violations are build-blocking. Each exists because
its violation has already caused a failure in this project.

| ID | Invariant | Historical failure prevented |
|---|---|---|
| **INV-1** | Exactly one `</body>` and one `</html>` per page | Duplicate closing tags placed scripts after document end. `DOMContentLoaded` had already fired, so no handler ran. **Every button on every page stopped working.** |
| **INV-2** | All `<script>` tags strictly precede the single `</body>` | Same root cause |
| **INV-3** | Exactly one `createClient` call project-wide | Competing clients with divergent state → redirect loop |
| **INV-4** | Exactly one `onAuthStateChange` registration project-wide | Duplicate listeners → duplicate navigation |
| **INV-5** | Zero direct session queries outside `session.js` | Mid-refresh reads → `UNKNOWN` misread as `ANONYMOUS` |
| **INV-6** | Zero `window.location` writes outside `router.js` | Ungoverned navigation bypassing the loop guards |
| **INV-7** | `session.js` contains no reference to `router` | Layering violation → two navigation owners → logout race |
| **INV-8** | Business-logic hash matches `d1b48466…` | Accidental ERP modification |
| **INV-9** | Every inline script parses cleanly | Injection into a string literal corrupted the parser and killed all downstream functions |

INV-1 and INV-2 are listed first deliberately: their violation produced the
most recent total failure, and it originated in the *build process*, not the
design. Phase 6 will therefore treat page assembly as a controlled operation
with an explicit invariant check, not as string concatenation.

---

## 15. Failure Mode Analysis

| # | Failure | Detection | Behaviour | Requirement |
|---|---|---|---|---|
| F1 | Supabase SDK CDN unreachable | `window.supabase` absent | `supabase.js` exports `null`; guards fail closed; user sees login with a clear error | NFR-R5 |
| F2 | Identity service unreachable | Login call rejects | Generic error; page stays interactive; no navigation | FR-A3 |
| F3 | `INITIAL_SESSION` never delivered | 10 s watchdog | Resolve `ANONYMOUS` → login. Never hangs. | FR-B6 |
| F4 | Refresh token expired | `SIGNED_OUT` emitted | Single navigation to login. No loop. | FR-B8 |
| F5 | Sign-out call fails | Caught, logged | Logout still completes — steps 1, 2, 4 are synchronous | FR-A8 |
| F6 | Chart or PDF library unreachable | ERP internal | ERP degrades; auth unaffected | — |
| F7 | Browser storage unavailable (private mode) | Write throws | Caught; session becomes tab-scoped; app functions | NFR-R5 |
| F8 | Corrupted stored session | Provider rejects | Treated as `ANONYMOUS` → login | P6 |
| F9 | Residual navigation cycle | Circuit breaker G3 | Halt after 3 navigations in 5 s; show diagnostic | NFR-R1 |

---

## 16. Requirements Traceability

| Requirement group | Satisfied by |
|---|---|
| FR-A Authentication | `auth.js`, `supabase.js` |
| FR-B Session | `session.js` state machine (§5) |
| FR-C Routing | `router.js` guards (§9) |
| FR-D Authorization | `auth.requireAuth`, `router.routeUser`, CSS-default hiding |
| FR-E ERP frozen | §13 integration plan + INV-8 hash control |
| FR-F Dashboard | `dashboard.html` + `ui.js` |
| FR-G Extensibility | Placeholder pages; adding a product touches config only (**FR-G2**) |
| NFR-R Reliability | §15 failure analysis, guards G1–G3, watchdog |
| NFR-S Security | Publishable key only, synchronous purge, generic errors, SEC-1 recorded |
| NFR-C Compatibility | Runtime base discovery (§4.1), no build step |
| NFR-M Maintainability | Acyclic 5-layer graph, INV-3…INV-7 |

**No requirement is unassigned. No module is without a requirement.**

---

## 17. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **AR-1** | Page assembly reintroduces INV-1/INV-2 violations | **High** — has happened | **Critical** — total failure | Phase 6 assembly is a controlled operation with a pre-write invariant gate. Never blind concatenation. |
| **AR-2** | `INITIAL_SESSION` semantics change in a future SDK version | Low | High | Pin the SDK major version; watchdog degrades safely |
| **AR-3** | SEC-1 forgotten when persistence is added | Medium | **Critical** | Recorded in §11.2, traced into Phase 11 review, gates Phase 13 |
| **AR-4** | CDN outage during the customer demo | Low | **Critical** — demo fails | Pre-demo connectivity check; consider vendored copies before the presentation |
| **AR-5** | ERP modified inadvertently | Medium | High | INV-8 hash comparison, run in Phases 9 and 12 |
| **AR-6** | Manual acceptance testing misses a case | Medium | Medium | Phase 7 executes the full §9 matrix against the standalone prototype *before* ERP integration |

**AR-1 is the most important line in this document.** The design has been
sound for two iterations; the *assembly process* destroyed it. Phase 6
addresses the process, not just the code.

---

## 18. Sign-off

Phase 3 (Project Inventory) begins on approval.

| Role | Decision | Date |
|---|---|---|
| Product Owner | ☐ Approved ☐ Approved with changes ☐ Rejected | |

**Decisions of Record to revise (§1):**

_________________________________________________________________

**Architecture changes requested:**

_________________________________________________________________
