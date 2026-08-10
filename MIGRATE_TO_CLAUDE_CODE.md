# Moving to Claude Code

Everything you need to continue this project in Claude Code with full
context. Follow in order; the whole thing takes about 30 minutes.

---

## What transfers, and what would otherwise be lost

| | Where it lives | At risk? |
|---|---|---|
| Source code | The two ZIP files | No |
| Tests | `tests/` in each repo | No |
| Documentation | `docs/`, `README.md` | No |
| **Decisions, bugs, and why** | **Only in the chat conversation** | **Yes** |

That last row is the whole reason for `CLAUDE.md`. Both repositories now
carry one. Claude Code reads it automatically at the start of every
session, so the next assistant knows the ERP is frozen, knows why
`</body>` must never appear in a JavaScript string, and knows which
six bugs must not come back.

**Without those files you would be starting from zero.** With them, you
keep a week of hard-won context.

---

## Step 1 — Put the code on disk

Download both ZIPs and extract them side by side:

```
~/projects/
├── aew-platform/
└── aew-backend/
```

Two separate folders, two separate repositories. Do not nest them.

---

## Step 2 — Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Needs Node.js 18+. Check with `node --version`.

Then:

```bash
cd ~/projects/aew-platform
claude
```

Sign in when prompted. It picks up `CLAUDE.md` automatically.

---

## Step 3 — Verify the handover worked

In Claude Code, ask:

```
Read CLAUDE.md, then run the test suite and tell me the state
of this project.
```

You should get back: 388 assertions across 17 suites, ERP intact, build
2026.08.02-1. If it runs the tests and reports that, the context
transferred correctly.

Then test that it understood the constraints:

```
What am I not allowed to change in products/costing/index.html,
and why?
```

It should tell you the block containing `BEAR_TYPES` is frozen, that its
only coupling is the `doLogout` line, and that `tests/integrity.js`
verifies this by hash.

---

## Step 4 — Install the UI/UX skill

Now it will actually work — this is a Claude Code feature:

```
/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill
/plugin install ui-ux-pro-max@ui-ux-pro-max-skill
```

Or via CLI, which is more reliable:

```bash
npm install -g ui-ux-pro-max-cli
cd ~/projects/aew-platform
uipro init --ai claude
```

Requires Python 3.

---

## Step 5 — Git

If you already pushed an early version, you are replacing it wholesale.
Commit honestly rather than as one lump:

```bash
cd ~/projects/aew-platform
git add .
git commit -m "Working prototype: costing ERP with full test coverage

- Fix Live Server injection breaking the ERP script block
- Fix invalid geometry silently zeroing all costs above 63mm bore
- Fix 0% margin silently applying 20%
- Wire master labour rate to all 18 operations
- Add Calculate bars, Save and History, field legend
- 388 assertions across 17 suites
- Add CLAUDE.md for AI assistant context"

git push
```

The backend is a **new** repository:

```bash
cd ~/projects/aew-backend
git init
git add .
git commit -m "FastAPI backend v2 with RLS-enforced tenant isolation"
gh repo create aew-backend --private --source=. --push
```

`.gitignore` in both already excludes `.env`, `node_modules` and
`__pycache__`. **Check before pushing** that no service-role key is in
the diff:

```bash
git diff --cached | grep -i "service_role\|sb_secret" || echo "clean"
```

---

## Step 6 — Two windows

Keep them separate. Live Server needs `aew-platform` as its root, and
mixing the two folders is how the earlier path problems started.

| Window | Folder | Runs |
|---|---|---|
| Frontend | `aew-platform` | Live Server on `login.html` |
| Backend | `aew-backend` | `uvicorn main:app --reload` |

---

## What Claude Code gives you that this chat does not

**It runs your tests.** `bash tests/run-all.sh` directly, and reads the
output. No more me guessing whether something works.

**It edits files in place.** No download-extract-replace cycle, which is
where several of the earlier corruptions came from.

**It sees the real file system.** Including the file Live Server actually
serves — the exact blind spot that cost days on the injection bug.

**Skills work.** The UI/UX plugin, and any others you add.

**Git is native.** It can commit, branch and read history.

---

## Good first prompts

```
Read CLAUDE.md, run the full test suite, and report the state.
```

```
Replace ERP_RATE_CARD in products/costing/index.html with these
figures from HISPL: [paste Aniktha's real costs]. Then run the
test suite and confirm the ERP hash is unchanged.
```

```
Build the landing page. Use the ui-ux-pro-max skill for the design
system. Keep it a single self-contained index.html with no build
step, Three.js from CDN only, and link the CTA to /login.html.
```

```
Walk me through deploying aew-backend to Railway. Start by running
db/003_verify_rls.sql and confirming every line says PASS.
```

---

## If context ever feels lost

Say this:

```
Re-read CLAUDE.md and tests/README.md before continuing.
```

That is what those files are for.

---

## Priorities, in order

1. **HISPL's real costing figures.** The rate card is placeholder data.
   The only item with a hard deadline.
2. **Print one quotation and look at it.** Nobody has checked the PDF on
   paper.
3. **Push both repositories.** Your work currently lives in two folders.
4. Landing page.
5. Backend deployment — not needed for the demo.
