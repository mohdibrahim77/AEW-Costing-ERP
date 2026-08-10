# Software Requirements Specification
## AEW Manufacturing Intelligence Platform

| Field | Value |
|---|---|
| Document | SRS v1.0 |
| Phase | 1 of 12 — Software Requirements |
| Status | **DRAFT — awaiting sign-off** |
| Date | 29 July 2026 |
| Author | Engineering Team (PM hat) |
| Approver | Founder |
| Supersedes | — |

> **No code is specified in this document.** This document defines *what* the
> system must do. *How* it does it is Phase 2 (Architecture).

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete requirements for the AEW Manufacturing
Intelligence Platform: a multi-tenant SaaS product sold to Indian
manufacturing SMEs. It establishes the contract against which Phases 2–12
are designed, built, tested and released.

### 1.2 Scope

**In scope for v1.0 (the release we are building):**

- Platform infrastructure: authentication, session management, routing,
  authorization, configuration
- Customer dashboard (product portal)
- Product 1 — Hydraulic Cylinder Costing ERP (**existing, frozen**)
- Placeholder shells for Products 2–4

**Explicitly out of scope for v1.0:** see §10.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| **Platform** | The surrounding SaaS application: login, session, routing, dashboard |
| **ERP** | The Hydraulic Cylinder Costing tool at `products/costing/` |
| **Frozen Block** | The 331-line / 25,838-char inline script containing all ERP business logic |
| **Product** | A purchasable module (`costing`, `cbam`, `vibration`, `asset`) |
| **Entitlement** | A customer's right to access a given Product |
| **Tenant** | A customer factory (e.g. HISPL) |
| **Panel** | An ERP screen within the costing tool (Inquiry, Tube, Rod, …) |
| **Route** | A navigable page of the Platform (login, dashboard, a product) |

### 1.4 Reference context

| Item | Value |
|---|---|
| First customer | HISPL — Hydraulics India Services Pvt. Ltd., Peenya Industrial Area, Bangalore |
| Primary contact | Aniktha Patirat |
| Production URL | `https://aew-costing-erp.pages.dev` |
| Hosting | Cloudflare Pages (static) |
| Identity provider | Supabase Auth |
| Development server | VS Code Live Server (no build step) |
| Backend (built, undeployed) | FastAPI on Railway — routes: auth, customers, products, quotations |

---

## 2. System Overview

The Platform is a **static, buildless, multi-page web application**. Each
Product is a self-contained page. A shared infrastructure layer provides
identity and navigation to every page uniformly.

```
Visitor  →  index.html (public marketing)
                │
                ▼
           login.html  ──authenticate──►  Supabase Auth
                │
                ▼
         dashboard.html (portal)
                │
      ┌─────────┼─────────┬─────────┐
      ▼         ▼         ▼         ▼
   costing    cbam    vibration   asset
   (LIVE)    (soon)    (soon)     (soon)
```

**Architectural intent:** every Product page is a *consumer* of
infrastructure. A Product page requests a guaranteed-authenticated user and
receives one. It contains no knowledge of how identity is established.

---

## 3. User Roles

| Role | Description | Product access | Admin capability |
|---|---|---|---|
| **Anonymous** | Unauthenticated visitor | Public landing page only | None |
| **Viewer** | Read-only staff member | Entitled products only | None |
| **Estimator** | Day-to-day ERP user | Entitled products only | None |
| **Admin** | Customer-side administrator | **All** products | Manage own tenant's users |
| **AEW Operator** | Internal AEW staff (out of band) | N/A — uses Supabase console | Provision tenants and entitlements |

**RBAC-1** — Role is stored per user in the identity provider and is
authoritative. The client renders based on role; it does not grant it.

**RBAC-2** — `Estimator` and `Viewer` differ only in write capability within
a Product. For v1.0 the ERP is client-side and has no persistence, so this
distinction has no enforceable effect and is recorded for forward
compatibility (see OQ-4).

---

## 4. Functional Requirements

Requirement IDs are traceable through Phases 2–12.

### 4.1 FR-A — Authentication

| ID | Requirement | Priority |
|---|---|---|
| FR-A1 | The system shall authenticate users by email and password against Supabase Auth. | MUST |
| FR-A2 | The system shall never transmit, store or log a password outside the identity provider's SDK call. | MUST |
| FR-A3 | On invalid credentials the system shall display a single generic error that does not disclose whether the email exists. | MUST |
| FR-A4 | On authentication failure the system shall clear the password field and retain the email field. | SHOULD |
| FR-A5 | The system shall provide password reset via emailed one-time link. | MUST |
| FR-A6 | On successful password change the system shall terminate the session and require fresh login. | MUST |
| FR-A7 | The system shall provide logout from every authenticated page. | MUST |
| FR-A8 | Logout shall succeed and reach the login page **even if the identity provider is unreachable**. | MUST |
| FR-A9 | Self-service signup shall not exist. Accounts are provisioned by AEW. | MUST |
| FR-A10 | Exactly one authentication implementation shall exist in the codebase. | MUST |

### 4.2 FR-B — Session Management

| ID | Requirement | Priority |
|---|---|---|
| FR-B1 | A session shall survive full page refresh. | MUST |
| FR-B2 | A session shall survive navigation between Products. | MUST |
| FR-B3 | Session state shall be determined **once** per page load, from a single authoritative signal. | MUST |
| FR-B4 | The system shall not act on an indeterminate session state (e.g. mid-token-refresh). | MUST |
| FR-B5 | Session determination shall complete within 2 s under normal network conditions. | SHOULD |
| FR-B6 | If session state cannot be determined within 10 s, the system shall fail closed (treat as unauthenticated). | MUST |
| FR-B7 | Logout in one browser tab shall propagate to all other open tabs within 5 s. | MUST |
| FR-B8 | Expiry of the refresh token shall return the user to login without a loop. | MUST |
| FR-B9 | Exactly one session manager shall exist in the codebase. | MUST |

### 4.3 FR-C — Routing & Navigation

| ID | Requirement | Priority |
|---|---|---|
| FR-C1 | All navigation shall pass through a single routing module. | MUST |
| FR-C2 | The router shall not navigate to the page currently displayed. | MUST |
| FR-C3 | Once a navigation is committed, no further navigation shall be initiated in that page lifetime. | MUST |
| FR-C4 | **No redirect loop shall be possible under any sequence of events.** | MUST |
| FR-C5 | Authenticated navigation shall use history replacement so the Back button cannot re-enter a protected page after logout. | MUST |
| FR-C6 | All route URLs shall be derived from a single configuration source. No route string shall be duplicated. | MUST |
| FR-C7 | Routes shall resolve correctly irrespective of the directory the development server treats as its web root. | MUST |
| FR-C8 | Routes shall reference explicit page files, not directory paths, to remain compatible with servers that do not perform index resolution. | MUST |
| FR-C9 | Intra-ERP panel switching is **not** routing and shall remain the ERP's own concern. | MUST |

### 4.4 FR-D — Authorization & Entitlement

| ID | Requirement | Priority |
|---|---|---|
| FR-D1 | Every non-public page shall require a valid session before rendering content. | MUST |
| FR-D2 | Direct URL entry to a protected page without a session shall redirect to login exactly once. | MUST |
| FR-D3 | Protected page content shall not be visible at any point before the session is confirmed. | MUST |
| FR-D4 | The dashboard shall display only Products the user is entitled to, plus locked previews of the remainder. | MUST |
| FR-D5 | A user with role `admin` shall be entitled to all Products. | MUST |
| FR-D6 | Selecting an unentitled Product shall be prevented and shall explain how to obtain access. | SHOULD |
| FR-D7 | Client-side entitlement is presentational. It shall not be relied upon as a security boundary once server-side data exists. | MUST |

### 4.5 FR-E — Costing ERP  🔒 **FROZEN**

> **This section documents existing behaviour that must be preserved
> byte-for-byte. It is not a specification for new work.**

| ID | Requirement | Priority |
|---|---|---|
| FR-E1 | All ERP business logic shall remain unmodified. | MUST |
| FR-E2 | The ERP shall receive an authenticated user and initialise via a single entry point. | MUST |
| FR-E3 | The ERP shall contain no authentication, session or routing logic. | MUST |
| FR-E4 | The only permitted edits inside the ERP page are: (a) shared infrastructure script includes, (b) replacing the body of the logout handler, (c) replacing the auth bootstrap block. | MUST |

**Frozen surface — preserved exactly:**

*Panels (9):* Inquiry · Tube · Rod · BOM · Covers · Misc · Assembly ·
Summary · Quotation

*Functions (26):* `addBOM` `addBearing` `addDefaultBOM` `addSeal`
`buildBOMRow` `buildCompTables` `buildQuote` `calcAll` `calcAsm` `calcBOM`
`calcRod` `calcSummary` `calcTube` `doLogout`\* `generatePDF` `go`
`handleFile` `lkp` `nn` `pc` `printQuote` `propagate` `renderCharts`
`toggleTheme` `updHdr` `weld`

\* `doLogout` is the single sanctioned integration point per FR-E4(b).

*Reference data:* `BEAR_TYPES` `SEAL_TYPES` `SEAL_MATS` `COVERS` `MISC`,
plus machining time tables (cutting, turning, honing, grinding)

*Engineering computation:* hollow/solid mass, surface area, weld estimation,
8-operation Tube route, 8-operation Rod route, BOM roll-up, assembly,
packing, transport, margin

*Output:* Chart.js doughnut and bar visualisations; jsPDF + AutoTable
quotation export; browser print path

### 4.6 FR-F — Dashboard

| ID | Requirement | Priority |
|---|---|---|
| FR-F1 | The dashboard shall greet the user by name and display their company. | SHOULD |
| FR-F2 | The dashboard shall display role and entitlement count. | SHOULD |
| FR-F3 | The dashboard shall render one card per Product with status (Active / Locked / Coming Soon). | MUST |
| FR-F4 | The dashboard shall provide logout. | MUST |

### 4.7 FR-G — Future Products

| ID | Requirement | Priority |
|---|---|---|
| FR-G1 | Placeholder pages for `cbam`, `vibration`, `asset` shall exist and shall be session-protected identically to the ERP. | MUST |
| FR-G2 | Adding a Product shall require no change to authentication, session or routing modules. | MUST |

---

## 5. Non-Functional Requirements

### 5.1 Reliability

| ID | Requirement | Target |
|---|---|---|
| NFR-R1 | No infinite redirect loop under any input sequence | **Zero tolerance** |
| NFR-R2 | Uncaught JavaScript exceptions on any page | Zero |
| NFR-R3 | Console errors during normal operation | Zero |
| NFR-R4 | Logout success rate, including under network failure | 100 % |
| NFR-R5 | Every asynchronous operation has an explicit failure path | 100 % |

### 5.2 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-P1 | Time from page request to authenticated content | ≤ 2 s |
| NFR-P2 | Session determination | ≤ 500 ms typical |
| NFR-P3 | ERP recalculation on input change | ≤ 100 ms |

### 5.3 Security

| ID | Requirement |
|---|---|
| NFR-S1 | Only the publishable (anon) key may appear in client code. |
| NFR-S2 | The service-role key shall never be present in any client-delivered file. |
| NFR-S3 | No credential shall be logged to the console. |
| NFR-S4 | Session material shall be removed from browser storage on logout, synchronously, before navigation. |
| NFR-S5 | Error messages shall not disclose account existence. |
| NFR-S6 | All identity traffic shall use TLS. |

### 5.4 Compatibility

| ID | Requirement |
|---|---|
| NFR-C1 | Chrome, Edge, Firefox, Safari — current and previous major version. |
| NFR-C2 | Identical behaviour on VS Code Live Server and Cloudflare Pages. |
| NFR-C3 | No build step, bundler, transpiler or package manager required to run. |
| NFR-C4 | Correct operation regardless of which directory the dev server serves as root. |
| NFR-C5 | Graceful degradation when opened directly from disk (`file://`). |

### 5.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-M1 | Exactly one identity-provider client instance in the codebase. |
| NFR-M2 | Exactly one session manager, one auth manager, one router, one config module. |
| NFR-M3 | Each module has a single, documented responsibility. |
| NFR-M4 | No duplicated logic across modules or pages. |
| NFR-M5 | No magic strings — all constants centralised. |
| NFR-M6 | Every public function carries an intent-explaining comment. |
| NFR-M7 | A new engineer can trace the full authentication path in under 15 minutes. |

### 5.6 Deployability

| ID | Requirement |
|---|---|
| NFR-D1 | Deployment is `git push` — no build pipeline. |
| NFR-D2 | Environment differences are resolved at runtime, not build time. |
| NFR-D3 | Rollback is a Cloudflare Pages revert to a prior deployment. |

---

## 6. Business Rules

| ID | Rule |
|---|---|
| BR-1 | A customer is billed per Product per factory. Entitlements are the commercial record. |
| BR-2 | AEW provisions all accounts. Customers cannot self-register. |
| BR-3 | Each customer sees only their own users and, once persistence exists, only their own data. |
| BR-4 | `admin` role grants full Product access within that customer only — never across customers. |
| BR-5 | The Costing ERP is the paid, live Product. The other three are pre-sale demand signals. |
| BR-6 | Costing outputs are commercially sensitive and shall not leak between tenants. |

---

## 7. Constraints

| ID | Constraint | Origin |
|---|---|---|
| CON-1 | Vanilla HTML/CSS/JS only. No framework. | Existing codebase |
| CON-2 | No build step of any kind. | Founder requirement |
| CON-3 | Static hosting only (Cloudflare Pages). | Cost / simplicity |
| CON-4 | Supabase is the identity provider. | Existing integration |
| CON-5 | The ERP is a single HTML file with an inline script block. | Existing artefact |
| CON-6 | ERP business logic is immutable. | Founder requirement |
| CON-7 | Must run under VS Code Live Server unchanged. | Development workflow |
| CON-8 | Third-party libraries load from CDN, not from disk. | No package manager |

---

## 8. Assumptions & Dependencies

**Assumptions**

- A-1: The Supabase project is correctly configured with users provisioned.
- A-2: User metadata reliably carries `name`, `company`, `role`, `products`.
- A-3: The demo machine has internet access for CDN and Supabase.
- A-4: The ERP's business logic is correct and has been validated by HISPL.

**External dependencies**

| Dependency | Purpose | Failure impact |
|---|---|---|
| Supabase Auth | Identity | Total — no login possible |
| jsDelivr CDN | Supabase SDK | Total — no login possible |
| cdnjs | Chart.js, jsPDF | Partial — charts and PDF unavailable |
| Cloudflare Pages | Hosting | Total in production |

**Risk note:** three of four dependencies are single points of total
failure. Mitigation is deferred to Phase 2.

---

## 9. Acceptance Criteria (release gate)

The release is accepted only when **all** of the following hold.

**Authentication**
- [ ] AC-1 Valid credentials authenticate and land on the correct destination
- [ ] AC-2 Invalid credentials show a generic error; no navigation occurs
- [ ] AC-3 Logout returns to login and clears session material
- [ ] AC-4 Logout works with the network disabled
- [ ] AC-5 Password reset email arrives, link works, session is terminated

**Session**
- [ ] AC-6 Refresh on any protected page preserves the session
- [ ] AC-7 Back button after logout cannot re-enter a protected page
- [ ] AC-8 Logout in tab A returns tab B to login
- [ ] AC-9 Expired session returns to login without looping

**Routing**
- [ ] AC-10 Direct URL to a protected page without a session redirects once
- [ ] AC-11 No page transitions more than once per user action
- [ ] AC-12 Network panel shows no repeated request storm at any point

**ERP regression**
- [ ] AC-13 All 9 panels render and switch
- [ ] AC-14 Tube and Rod calculations produce values identical to pre-refactor
- [ ] AC-15 BOM add/remove for bearings, seals and misc items functions
- [ ] AC-16 Summary charts render
- [ ] AC-17 Quotation builds correctly
- [ ] AC-18 PDF export produces the same document as pre-refactor
- [ ] AC-19 Print path opens and renders
- [ ] AC-20 Theme toggle functions

**Environment**
- [ ] AC-21 All of the above pass on VS Code Live Server
- [ ] AC-22 All of the above pass on Cloudflare Pages
- [ ] AC-23 Zero console errors throughout

**Architecture**
- [ ] AC-24 Exactly one identity client, session manager, auth manager, router
- [ ] AC-25 No authentication logic in any page file

---

## 10. Out of Scope for v1.0

- Backend persistence of quotations (FastAPI service exists but is undeployed)
- Customer self-service user administration UI
- CBAM, Vibration AI and Asset Management functionality
- Mobile-native applications
- Offline operation
- Multi-factor authentication
- Audit logging
- Internationalisation
- Automated test suite (validation is manual against §9 for v1.0)

---

## 11. Open Questions — **decisions required before Phase 2**

These are requirements decisions, not defects. Phase 2 cannot begin without
answers to OQ-1 through OQ-4.

---

**OQ-1 — Login page behaviour for an already-authenticated user** ⚠️ *blocking*

Currently, a user with a live session who opens `login.html` is sent
straight to their Product. This is standard SaaS behaviour (Stripe, Notion,
Linear all do it) and prevents a signed-in user from being stranded on a
login form.

You have twice reported this as "it logs in automatically", which suggests
it is not the behaviour you want — at minimum during a demo.

| Option | Behaviour | Trade-off |
|---|---|---|
| **A** | Auto-redirect (current) | Professional; but you cannot reach the login form without logging out first |
| **B** | Always show the form; never auto-redirect | Demo-friendly; a signed-in user sees a login screen, which looks broken |
| **C** | Auto-redirect, plus `login.html?force=1` to override | Both behaviours; slightly more surface |

**Recommendation: C.** Correct product behaviour with a demo escape hatch.

---

**OQ-2 — Session lifetime** ⚠️ *blocking*

How long should a user stay signed in without re-entering credentials?
Options: browser session only · 8 hours (shift) · 30 days · 30 days with a
"Remember me" checkbox.

**Recommendation: 30 days with rolling refresh.** Factory staff should not
re-authenticate daily.

---

**OQ-3 — Logout scope** ⚠️ *blocking*

Does logout end the session on this device only, or on every device the user
is signed in on?

**Recommendation: this device only.** Global sign-out is surprising and is
normally offered as a separate, explicit "sign out everywhere" action.

---

**OQ-4 — Demo scope** ⚠️ *blocking*

Is saving quotations to a database required for the company presentation, or
is the client-side ERP sufficient?

This determines whether the FastAPI backend deployment is on the critical
path. It also determines whether the Estimator/Viewer role distinction is
enforceable in v1.0 (see RBAC-2).

**Recommendation: not required for v1.0.** The costing tool demonstrates the
value proposition without persistence. Deploying and integrating the backend
adds meaningful risk to a presentation date.

---

**OQ-5 — Tenancy model** *(non-blocking; affects Phase 2 database design)*

One Supabase project for all customers with row-level isolation, or a
separate project per customer?

**Recommendation: single project with row-level security.** Standard,
cheaper, and the only model that scales past a handful of customers.

---

**OQ-6 — Password policy** *(non-blocking)*

Current minimum is 8 characters. Confirm, or specify complexity rules.

---

**OQ-7 — Demonstration environment** *(non-blocking, but please confirm)*

Will the company presentation run from the Cloudflare URL, or from Live
Server on a laptop?

**Recommendation: Cloudflare, with Live Server rehearsed as fallback.** A
public URL is more credible and removes local-environment variables — which
is where most of the difficulty of the past week originated.

---

## 12. Sign-off

Phase 2 (Architecture) begins only on written approval of this document.

| Role | Name | Decision | Date |
|---|---|---|---|
| Product Owner | | ☐ Approved ☐ Approved with changes ☐ Rejected | |

**Changes requested:**

_________________________________________________________________

_________________________________________________________________
