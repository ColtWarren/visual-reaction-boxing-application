# Step 13 v2 Execution Plan
# Visual Identity + Modern UI Shell

**Document status:** v2 complete execution-plan draft. All amendments from two reviewer rounds applied.
**Scope:** 20 blocks across 7 phases with 5 phase gates.
**Predecessor:** v1 (4756 lines) + Round 1 reviewer board (Phase 0-2 amendments) + Round 2 reviewer board (full v1 amendments).

**Predecessor design document:** `step-13-R72.5-design-decisions.md` (1154 lines, audit-corrected)
**Claude Code audit findings:** `~/Downloads/step-13-R72-audit-findings.md` (191 lines)
**Founder:** Colt Warren
**Repo (Claude execution environment):** `/Users/coltwarren/projects/visual-reaction-boxing-application`
**Repo (Codex environment):** `/Users/coltwarren/Documents/visual-reaction-boxing-application` (mirror)
**Remote:** `github.com/ColtWarren/visual-reaction-boxing-application`
**Branch base:** `main` at HEAD `2c4e5bf` (Step 12 shipped)

---

## Execution Decisions Record (NEW in v2 — cross-cutting per DeepSeek)

This section records architecture-level decisions made early in execution. All later blocks reference these values rather than restating assumptions. Block 0a outputs the routing/hosting decisions; subsequent blocks consume them.

```text
ROUTING_MODE:              [TBD — path | hash]  (resolved by Block 0a)
DEPLOY_BASE:               [TBD — / | /<subpath>/]  (resolved by Block 0a)
PRODUCTION_URL:            [TBD — founder-provided]  (resolved by Block 0a)
APP_VERSION_SOURCE:        package.json (single source of truth)
PWA_REGISTRATION_OWNER:    usePWAUpdate hook (Block 13 creates; Block 14 adds UI behavior)
ACCURACY_COLOR_THRESHOLDS: ≥80% success / 60-79% warning / <60% danger (ratified for v2; no founder TBD)
RESET_SEMANTICS:           true deletion — PREFS_STORAGE_KEY removed; reset orchestrator
                           sets suppressNextPersistenceRef to prevent immediate rewrite
REPO_ROOT:                 /Users/coltwarren/projects/visual-reaction-boxing-application
                           (Claude execution environment; Codex mirrors at /Documents/)
```

### Verification environments

```text
DEV       npm run dev (no SW; no PWA verification)
PREVIEW   npm run preview (local production-mode SW for offline/update tests)
PROD      deployed HTTPS origin (host rewrites, real subpath, real headers)
DEVICE    real iOS/Android installed app (PWA cert, install flows, safe-area)
```

Each PWA-related block specifies which environment proves each criterion.

---

## Plan Principles (load-bearing — Claude Code reads these BEFORE Block 0a)

These principles apply to every block. Failure to honor them is grounds for stopping execution.

### 1. Stop-and-report at every block boundary

After EACH block's verification step passes, Claude Code STOPS and reports completion before proceeding to the next block. The founder ratifies before the next block begins. No "let me continue with the next block" momentum.

Block completion report format:
```
Block N complete.
Files changed: [list]
Verification: [each check, ✅ or ❌]
Diff summary: [N files, +X/-Y lines]
Ready to proceed to Block N+1? Awaiting ratification.
```

### 2. Rule 1 — verify against live repo before edits

Before editing ANY file, Claude Code reads the current state. R72.5 claims and audit findings are inputs, NOT replacements for reading the file. If a file's current state contradicts the spec, Claude Code stops and reports the discrepancy (this is the Step 12 amendment-cycle pattern).

### 3. Real verification gates

The bare type-check command is a no-op due to solution-style root tsconfig. The real type-check command:

```bash
cd frontend && npx tsc --noEmit -p tsconfig.app.json
```

The real build command:

```bash
cd frontend && npm run build   # runs tsc -b && vite build
```

Both gates must pass before any commit.

### 4. Lint must be zero-warning

```bash
cd frontend && npm run lint
```

Exit code 0 with no warnings. ESLint flat config honors `^_` prefix for unused vars (Step 6 lesson). Use underscore-prefix freely for intentionally unused parameters.

### 5. TEMP DEV LOG cleanup discipline

Any temporary diagnostic logging added during a block must be prefixed with `// TEMP DEV LOG` and removed before the block's commit. Block 18 (final commit) includes a sweep:

```bash
git grep -nF 'TEMP DEV LOG' frontend/src/
```

This grep must return zero at Block 18's pre-commit gate.

### 6. Heredoc commit messages

Commit messages use single-quoted heredoc terminator (`<<'EOF'`) and write backticks naturally — do NOT pre-escape them (Step 5.5 commit `943e7b5` cosmetic defect lesson).

Template:
```bash
git commit -m "$(cat <<'EOF'
Step 13 Block N — short summary

Longer description if needed. Use `code` references naturally.

Anchor: R72.5 section X.Y
EOF
)"
```

NO `Co-Authored-By` line.

### 7. Git grep fixed-string mode

For searches containing regex metacharacters (parens, brackets, special chars), use `-F` (fixed-string):

```bash
git grep -F 'var(--safe-' frontend/src/
git grep -F 'useInputHandler' frontend/src/
```

### 8. LAN IP is dynamic

Do NOT hardcode the LAN IP. When manual testing requires the LAN URL, verify from Vite's `--host` log output. Currently resolves to `192.168.1.88` but changes via DHCP.

### 9. Path verification

The repo uses subdirectories, NOT flat `src/`. Files of interest:

- `frontend/src/App.tsx` — single render-tree entry
- `frontend/src/components/` — UI components
- `frontend/src/hooks/` — custom hooks
- `frontend/src/lib/` — domain logic (sessionConfig, preferencesStorage, etc.)
- `frontend/src/types/` — type definitions
- `frontend/src/index.css` — global styles + Tailwind v4 `@theme` block
- `frontend/tsconfig.app.json` — REAL tsconfig (root tsconfig is solution-style)

Always instruct "verify paths against live repo before editing."

### 10. Architectural sweep discipline

When applying changes that touch multiple sections of the plan, sweep ALL sections containing code examples — not just the file content section. Drift-prone sections include: decision rationale snippets, "What This Block Delivers," "What This Block Does NOT Include," instruction lists, commit messages, failure points, testing checklists. Step 5.5 v2 (R35A) and Step 5.6 v2 (R40A+R40C) caught drift; the sweep is not yet automatic.

### 11. Reviewer attribution preservation

When v1 plan amendments are made in response to founder direction or new findings, the v1 plan maintains an amendment log at the bottom of the document. Attributions preserve which reviewer surfaced which catch (for retrospective auditing).

---

## Anchor Statements

**Anchor 1 (Step 13 scope — revised per Round 1 DeepSeek):** Step 13 adds no new reaction-training or scoring behavior. Existing session flow, reaction detection, timing, scoring, miss semantics, and preference schema remain unchanged. Navigation, presentation, PWA installation, offline operation, and update behavior ARE Step 13 shell/infrastructure behavior and are explicitly in scope.

**Anchor 2 (Tool Principle):** Reaction Defense Training is a tool, not a platform. No accounts, no login, no history, no streak, no engagement loops. The URL is the product. PWA installation is an optional capability that ships, not a conversion goal.

**Anchor 3 (Step 14 boundary):** Stance-aware mapping is Step 14, NOT Step 13. If during execution any block surfaces a stance-related design decision, Claude Code stops and reports. Stance work does not creep into Step 13.

**Anchor 4 (Audit-verified accuracy):** The Claude Code repo audit at HEAD `2c4e5bf` produced 14 findings. v1 plan reflects audit corrections. Block specs reference audit findings by ID (A.1, A.5, B.3, C.5, etc.) where relevant.

---

## Pre-execution Preparation

### PE-1 — Branch creation

Founder creates the Step 13 working branch:

```bash
cd /Users/coltwarren/projects/visual-reaction-boxing-application
git checkout main
git pull origin main
git rev-parse HEAD  # MUST equal 2c4e5bf
git checkout -b step-13-visual-identity
```

If `git rev-parse HEAD` does NOT equal `2c4e5bf`, stop and reconcile before proceeding (Step 12 might have additional commits, or the working tree might be ahead of expectations).

### PE-2 — Environment verification

```bash
cd frontend
node --version    # Confirm Node version matches package.json engines (if specified)
npm --version
npm install       # Ensure dependencies are fresh
npm run lint      # Must exit 0
npm run build     # Must succeed
```

If any step fails, stop and reconcile.

### PE-3 — Working tree state confirmation

```bash
git status        # MUST be clean
git log -1 --pretty=oneline  # Confirm 2c4e5bf is HEAD
```

### PE-4 — Manual smoke test of Step 12 baseline

Before any Step 13 work begins, run the app and confirm Step 12 behavior is intact:

1. `npm run dev` from `frontend/`
2. Open `http://localhost:5173` (or whatever Vite reports)
3. Verify: PreSession loads, can select mode (Visual/Audio/Combined), can select preset (Quick Demo/3x3 Standard/Custom), Custom shows sliders
4. Start a Quick Demo session, complete it, verify Summary appears with "Done" button
5. Tap Done — returns to PreSession
6. Verify Settings/About do not exist yet (they'll be added in Step 13 Blocks 8-9)

If any Step 12 behavior is broken, stop. Do not proceed until Step 12 baseline is verified working.

### Pre-execution checkpoint

After PE-1 through PE-4, Claude Code reports to founder:
- Branch created and confirmed
- Environment OK
- Working tree clean at expected HEAD
- Step 12 baseline behavior verified

Founder ratifies. Then Phase 0 begins.

---

## Phase 0 — Pre-architecture Verification (1 block)

### Block 0a — Hosting/Deployment Audit

**Purpose:** Verify production hosting serves `index.html` for unknown paths BEFORE introducing client-side routing. If this verification fails, the routing strategy changes (hash routing) and several downstream blocks adjust.

**R72.5 anchor:** Section 4 A1 — Pre-shell verification block (per DeepSeek P2)

**Files touched:** None (read-only audit, plus optionally a deployment config file if hosting requires explicit SPA fallback configuration).

**Acceptance criteria:**

1. Production deployment URL is identified (founder confirms)
2. Direct request to `/settings` on production returns the app shell (HTTP 200 with index.html body)
3. Direct request to `/about` on production returns the app shell
4. Decision recorded: standard path routing OR hash routing fallback

**Execution steps:**

**Step 1 — Founder identifies production deployment URL.**

Claude Code asks the founder: "What is the production deployment URL for this app?" — and waits for the answer. The plan cannot proceed without this.

Likely candidates (verify with founder):
- A Vercel/Netlify deployment (most common for Vite apps)
- A self-hosted static server
- GitHub Pages
- Not yet deployed (in which case, choose hosting before proceeding)

**Step 2 — Run direct-load tests:**

**Important (per Round 1 DeepSeek):** `curl -I` (HEAD) only verifies headers. A host can return HTTP 200 with a custom error page. We must verify both headers AND that the response body contains the Vite application shell.

```bash
# Replace <DOMAIN> with the production URL from Step 1
curl -fsSL -D /tmp/settings-headers.txt \
  https://<DOMAIN>/settings \
  -o /tmp/settings-body.html

grep -i '^content-type:.*text/html' /tmp/settings-headers.txt
grep -F '<div id="root">' /tmp/settings-body.html
```

Repeat for `/about`.

Expected results for each:
- Content-Type header includes `text/html`
- Body contains `<div id="root">` (the Vite shell)

**Possible failure modes:**

- **404 response** — host does NOT have SPA fallback configured. Decision required.
- **200 but no `<div id="root">`** — host serves a different shell for unknown paths (custom error page). Decision required.
- **Connection refused / domain not resolving** — host is offline or URL is wrong, OR **app is not yet deployed to production** (see Step 3 fallback path).

**Step 3 — Decision based on results:**

**If app is NOT YET DEPLOYED to production (per Round 1 ChatGPT P13 + Round 2 Codex Finding 13):**

Founder explicitly chooses one path:
- **(a)** Deploy now and run Steps 1-2 against the live URL
- **(b)** Defer hosting setup as part of Step 13 execution (then re-run Block 0a once deployed)
- **(c)** Use hash routing (no host config needed) — skip to recording `ROUTING_MODE = hash` in the Execution Decisions Record and proceed directly to Block 0b

**If both URLs return 200 with the Vite shell body:**
- ✅ Standard path routing is safe (`/settings`, `/about`)
- Record `ROUTING_MODE = path` and `DEPLOY_BASE = /` (or the actual subpath) in the Execution Decisions Record
- Proceed to Block 0b unchanged

**If either URL returns 404 or wrong body:**
- Two options:
  1. **Configure host SPA fallback** (preferred for clean URLs)
     - Vercel: add `"rewrites": [{"source": "/(.*)", "destination": "/"}]` to `vercel.json`
     - Netlify: add `/* /index.html 200` to `_redirects` or `netlify.toml`
     - GitHub Pages: add `404.html` that mirrors `index.html` (workaround pattern) — note this typically means `DEPLOY_BASE = /<repo-name>/`
     - Self-hosted: configure server (nginx `try_files`, Apache mod_rewrite, etc.)
     - **Critical sequencing (per Round 1 DeepSeek):** the host configuration must actually be DEPLOYED before re-running the curl test. Editing `vercel.json` locally and re-running curl against the existing production domain will still fail. Either deploy a preview that contains the rewrite, OR commit the config and wait for production deploy, before marking host-fallback verified.
  2. **Hash routing fallback** (no host config needed)
     - Record `ROUTING_MODE = hash`
     - Wouter will use hash-based locations (`/#/settings`, `/#/about`)
     - URLs are slightly uglier but require zero host config
     - Block 2 spec adjusts (use Wouter's `useHashLocation` hook)

Founder records the decision in the Execution Decisions Record.

**Verification:**

After option 1 (if chosen):
```bash
curl -I https://<DOMAIN>/settings  # Must return 200
curl -I https://<DOMAIN>/about     # Must return 200
```

After option 2 (if chosen):
- No verification needed at this stage; hash routing will be implemented in Block 2.

**Stop-and-report:**

```
Block 0a complete.
Production URL: [URL]
SPA fallback status: [✅ supported / ⚠️ configured / 🔄 hash-routing fallback]
Decision: [standard path routing / hash routing]
Downstream impact: [Block 2 unchanged / Block 2 uses useHashLocation]
Ready to proceed to Block 0b? Awaiting ratification.
```

**Commit:**

If option 1 (host config) was performed:
```bash
git add [config file]
git commit -m "$(cat <<'EOF'
Step 13 Block 0a — configure SPA fallback on [provider]

Adds rewrite rule to serve index.html for unknown paths so that direct
loads of /settings and /about resolve to the app shell rather than 404.
Verified via curl -I against production URLs.

Anchor: R72.5 A1 pre-shell verification (DeepSeek P2)
EOF
)"
```

If option 2 (hash routing), no commit at this block — the routing choice is implemented in Block 2.

---

## Phase 1 — Foundation (2 blocks)

### Block 0b — Semantic CSS Tokens

**Purpose:** Introduce the `--rd-*` design token namespace as the foundation for all subsequent visual identity work. Tokens introduced in this block are CONSUMED by Blocks 3 (sidebar), 5 (PreSession), 6 (top-bar), 7 (Summary), 8 (Settings), 9 (About). No component changes in this block — only token declaration.

**R72.5 anchor:** Section 4 A5 (revised per Claude Code audit B.3 — Tailwind v4 reality)

**Files touched:**

- `frontend/src/index.css` (add `--rd-*` tokens to `@theme` block and `:root`)

**Audit-verified context (B.3):**

- There is NO `tailwind.config.*` file. Tailwind v4 uses `@theme` in `index.css:3-15`.
- Existing tokens: 7 `--color-cue-*` in `@theme`, 4 `--safe-*` in `:root`
- Color tokens must go in `@theme` (so Tailwind generates utilities)
- Dimension tokens go in `:root` (used via `var()` or `calc()`)

**Acceptance criteria:**

1. New `--rd-color-*` tokens added to `@theme` block in `index.css`
2. New `--rd-*` dimension tokens added to `:root` in `index.css`
3. Existing `--color-cue-*` and `--safe-*` tokens unchanged
4. No component imports these tokens yet (introduction is non-breaking)
5. Type-check, lint, build all pass

**Execution steps:**

**Step 1 — Read current `index.css`** to see existing structure:

```bash
cd frontend && cat src/index.css
```

Confirm the `@theme` block exists at the expected location (around lines 3-15 per audit B.3) and that `--safe-*` vars are at the expected location (around lines 53-56).

**Step 2 — Add new tokens to `@theme` block:**

**Critical (per Round 2 Codex Finding 7):** Read the live `@theme` block first. The existing cue tokens are `--color-cue-red`, `--color-cue-blue`, etc. (NOT `--color-cue-jab` / `--color-cue-cross` which were placeholders in earlier drafts). Do NOT rename existing tokens — append the new `--color-rd-*` tokens alongside them.

The new color tokens are added INSIDE the existing `@theme { ... }` block alongside the existing `--color-cue-*` tokens (whatever their actual names — verify before editing):

```css
@theme {
  /* Existing --color-cue-* tokens (preserved exactly as-is — verify names live) */
  /* DO NOT rename or alter these */

  /* NEW: Step 13 semantic surface/text/border tokens (12 total) */

  /* Surfaces (4) */
  --color-rd-bg-base: #09090b;          /* zinc-950 */
  --color-rd-bg-surface: #18181b;       /* zinc-900 */
  --color-rd-bg-elevated: #27272a;      /* zinc-800 */
  --color-rd-bg-overlay: rgba(9, 9, 11, 0.85);

  /* Text (3) */
  --color-rd-text-primary: #f4f4f5;     /* zinc-100 */
  --color-rd-text-secondary: #a1a1aa;   /* zinc-400 */
  --color-rd-text-muted: #71717a;       /* zinc-500 */

  /* Borders (2) */
  --color-rd-border-subtle: #27272a;    /* zinc-800 */
  --color-rd-border-default: #3f3f46;   /* zinc-700 */

  /* Accents (3) */
  --color-rd-accent-success: #10b981;   /* emerald-500, for correct */
  --color-rd-accent-warning: #f59e0b;   /* amber-500, for incorrect */
  --color-rd-accent-danger: #ef4444;    /* red-500, for missed */
}
```

These will generate Tailwind utilities like `bg-rd-bg-surface`, `text-rd-text-primary`, `border-rd-border-subtle`, etc.

**Counts to verify in acceptance report:**
- 4 background tokens
- 3 text tokens
- 2 border tokens
- 3 accent tokens
- **Total: 12 color tokens** (NOT 14 — earlier draft miscounted)

**Step 3 — Add dimension tokens to `:root`:**

```css
:root {
  /* Existing --safe-* tokens (preserved) */
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
  --safe-left: env(safe-area-inset-left);
  --safe-right: env(safe-area-inset-right);

  /* NEW: Step 13 dimension tokens */
  --rd-sidebar-width: 15rem;           /* 240px per Q10 */
  --rd-drawer-width: 17.5rem;          /* 280px per Q1 */
  --rd-topbar-height: 3rem;            /* 48px per A3 */
  --rd-radius-panel: 1rem;
  --rd-radius-card: 0.75rem;
  --rd-radius-pill: 9999px;
}
```

**Step 4 — Verify the changes:**

```bash
cd frontend
git diff src/index.css   # Review the diff visually
npm run lint             # Must exit 0
npx tsc --noEmit -p tsconfig.app.json  # Must exit 0 (CSS-only change won't affect TS but verify)
npm run build            # Must succeed
```

**Step 5 — Verify tokens are accessible via DevTools:**

**Important (per Round 1 DeepSeek):** Tailwind v4 emits theme variables only when they're consumed by a generated utility class. Color tokens in `@theme` may NOT be accessible via `getComputedStyle()` in Block 0b because no component uses them yet. Two paths:

**Path A (preferred — defer color verification):**
- In Block 0b, verify only the `:root` dimension tokens (which always emit):
  ```bash
  npm run dev
  # Open browser to localhost:5173
  # Open DevTools Console
  # Run: getComputedStyle(document.documentElement).getPropertyValue('--rd-sidebar-width')
  # Expected: '15rem' or '240px' (browser may compute to either)
  # Run: getComputedStyle(document.documentElement).getPropertyValue('--rd-topbar-height')
  # Expected: '3rem' or '48px'
  ```
- Defer color-token verification to Block 2 — when the placeholder views first consume `bg-rd-bg-base`, the color tokens will emit and become accessible.

**Path B (alternative — force emission):**
- Use `@theme static { ... }` block instead of `@theme { ... }` for the new tokens. The `static` modifier forces emission regardless of consumption.
- Trade-off: slightly larger CSS bundle (negligible for 12 tokens).
- If chosen, color verification can run in Block 0b directly.

**v2 uses Path A** (defer color verification to Block 2). The Block 0b DevTools test ONLY verifies dimension tokens.

If either dimension token returns empty, the token wasn't applied. Stop and investigate.

**Verification checklist:**

- [ ] `index.css` diff shows only additions (no removals)
- [ ] Lint passes with zero warnings
- [ ] Type-check passes
- [ ] Build succeeds
- [ ] Tokens accessible via DevTools (Step 5)
- [ ] Visual smoke test: app still loads and looks identical to Step 12 baseline (tokens added but not consumed)

**Stop-and-report:**

```
Block 0b complete.
Files changed: src/index.css (+~25 lines)
Tokens added: 14 color tokens to @theme, 6 dimension tokens to :root
Verification: lint ✅, tsc ✅, build ✅, DevTools accessibility ✅
Visual: unchanged from Step 12 baseline (expected — tokens not yet consumed)
Ready to proceed to Block 1? Awaiting ratification.
```

**Commit:**

```bash
git add src/index.css
git commit -m "$(cat <<'EOF'
Step 13 Block 0b — semantic design tokens

Introduces --rd-* token namespace as the foundation for Step 13's visual
identity. Color tokens are added to the @theme block so Tailwind v4 can
generate utilities (bg-rd-bg-surface, text-rd-text-primary, etc.).
Dimension tokens (sidebar width, top-bar height, radii) are added to
:root for direct var() / calc() usage.

Existing --color-cue-* and --safe-* tokens are unchanged. No components
consume the new tokens yet — introduction is non-breaking.

Anchor: R72.5 A5 (revised per Claude Code audit B.3 — Tailwind v4 has no
config file; tokens go in @theme + :root)
EOF
)"
```

---

### Block 1 — Persistence Type Contract Documentation

**Purpose:** Light documentation block. Preserve the existing `PersistedPreferencesV1` shape verbatim. Add inline JSDoc explaining what each field means. This block exists for thoroughness — no schema changes (per DeepSeek P10 — testing-driven schema bloat avoided).

**R72.5 anchor:** Section 7 Phase 1, Block 1

**Files touched:**

- `frontend/src/types/preferences.ts` (assumed location; verify with Rule 1)
- `frontend/src/lib/preferencesStorage.ts` (if comments need updating)

**Acceptance criteria:**

1. `PersistedPreferencesV1` interface has JSDoc comments on every field
2. Schema shape is BIT-FOR-BIT identical to Step 12 (no additions, no removals)
3. `PREFS_STORAGE_KEY` constant has a comment explaining the versioning convention
4. Type-check, lint, build all pass
5. Smoke test: existing localStorage values still load correctly

**Execution steps:**

**Step 1 — Locate the file:**

```bash
cd frontend
git grep -nF 'PersistedPreferencesV1' src/
```

Confirm the file path (likely `src/types/preferences.ts` or `src/lib/preferencesStorage.ts`).

**Step 2 — Read the current interface:**

```bash
cat src/types/preferences.ts   # adjust path based on Step 1 finding
```

**Step 3 — Add JSDoc comments WITHOUT changing field types or names:**

**Critical (per Round 2 Codex Finding 8):** Read the live `preferences.ts` and `preferencesStorage.ts` FIRST. The actual field names are:
- `selectedPresetId` (NOT `presetId`)
- The storage constant is `PREFS_STORAGE_KEY` (NOT `STORAGE_KEY`)

The JSDoc must match the actual code exactly. Here's the schema illustratively (Claude Code reads the actual file and applies JSDoc to whatever fields exist):

```typescript
/**
 * Versioned shape of preferences persisted to localStorage under PREFS_STORAGE_KEY.
 *
 * The version suffix (V1) is the schema contract; if any field type or
 * required-ness changes, a new V2 interface is introduced with a migration
 * function in preferencesStorage.ts.
 *
 * Persistence triggers:
 * - Effect 1 (immediate): mode change, preset change (R71.5 P1)
 * - Effect 2 (debounced): custom config slider changes (R71.5 P2)
 * - Effect 3 (flush on transition): when idle → running fires (R71.5 P3 Effect 3)
 * - Effect 4 (session-end save): when running/rest → summary fires (R71.5 P3 Effect 4)
 */
export interface PersistedPreferencesV1 {
  /** Schema version. Always 1 in V1. Used by load() to detect migration needs. */
  version: 1;

  /** User's selected stimulus mode. Quick Demo defaults to 'visual'. */
  mode: 'visual' | 'audio' | 'combined';

  /** ID of the selected workout preset. NOTE: field name is selectedPresetId, NOT presetId. */
  selectedPresetId: 'quick-demo' | '3x3-standard' | 'custom';

  /** Full session config (round duration, rest duration, rounds). Persisted so Custom edits survive reload. */
  config: SessionConfig;
}
```

**Important:** This is illustrative scaffolding. Per Rule 1, Claude Code reads `frontend/src/types/preferences.ts` first to capture the actual field names and types, then adds JSDoc that matches them exactly. If the actual interface has additional fields (e.g., timestamp, settings) or different types than shown above, the JSDoc adapts to reality, not the example.

**Step 4 — Verify NO schema changes:**

```bash
cd frontend
git diff src/types/preferences.ts   # Diff must show ONLY comment additions
```

If the diff shows ANY type changes, field additions, or field removals, Claude Code stops and reports. This block is documentation-only.

**Step 5 — Verify build still works:**

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

**Step 6 — Smoke test localStorage compatibility:**

```bash
npm run dev
# Open browser, open DevTools Application → Local Storage
# Confirm the existing PREFS_STORAGE_KEY entry is still present and parseable
# Refresh the page; verify mode/preset/config persist as before
```

**Verification checklist:**

- [ ] JSDoc added to every field of `PersistedPreferencesV1`
- [ ] Diff contains ONLY comment additions (no type/field changes)
- [ ] Lint, tsc, build all pass
- [ ] Existing localStorage entries still load without errors
- [ ] Page refresh preserves mode/preset/config

**Stop-and-report:**

```
Block 1 complete.
Files changed: src/types/preferences.ts (+~20 lines comments)
Schema changes: NONE (verified via diff)
Verification: lint ✅, tsc ✅, build ✅, localStorage smoke ✅
Ready to proceed to Block 2? Awaiting ratification.
```

**Commit:**

```bash
git add src/types/preferences.ts
git commit -m "$(cat <<'EOF'
Step 13 Block 1 — document PersistedPreferencesV1 schema

Adds JSDoc to every field of the persisted preferences interface
documenting field semantics and persistence triggers (Effect 1-4 from
R71.5). No schema changes — V1 shape is preserved bit-for-bit. Test 19
methodology uses spy-based verification, so no marker field is needed
(per DeepSeek P10).

Anchor: R72.5 Section 7 Phase 1 Block 1
EOF
)"
```

---

## Phase 2 — Navigation Shell (3 blocks)

### Block 2 — Wouter Integration + Session/Route Precedence

**Purpose:** Install Wouter, integrate it into App.tsx with the locked session/route precedence rule (per DeepSeek P1 + Codex Finding 1). Convert the nested ternary view selection (audit A.1) to explicit `status === X` checks. The router is additive — leaf routes (`/settings`, `/about`) coexist with session state without requiring Context refactor (per audit B.1).

**R72.5 anchor:** Section 4 A1 (with audit B.1 + A.1 constraint notes)

**Files touched:**

- `frontend/package.json` (add wouter dependency)
- `frontend/src/App.tsx` (integrate router; convert ternary to explicit checks)

**Acceptance criteria:**

1. `wouter` installed (latest stable version; version pinned in package.json)
2. App.tsx wraps content in `<Router>` (or uses Wouter's implicit router)
3. Session state takes precedence: when `status === 'running' || 'rest'`, only the session surface renders (no route content visible)
4. When session is idle/summary, the route determines what renders (`/` → Workout flow, `/settings` → Settings stub, `/about` → About stub)
5. Settings/About route components are placeholders for this block (real implementation in Blocks 8/9)
6. The nested ternary is converted to explicit `status === X` checks
7. Direct browser loads of `/settings` and `/about` work (per Block 0a verification)
8. Lint, tsc, build all pass

**Audit-verified context:**

- **A.1:** App.tsx:130-164 uses nested ternary. Summary is the implicit `else`. Block 2 converts to explicit checks.
- **B.1:** All 7 session hooks are wired in App.tsx with prop drilling. No Context exists. Block 2 does NOT introduce Context — leaf routes are additive only.

**Execution steps:**

**Step 1 — Install Wouter:**

```bash
cd frontend
npm install wouter
git diff package.json  # Verify the version pin
```

If hash routing was chosen in Block 0a, also install `wouter/use-hash-location` (it's part of the wouter package; no separate install needed, just a different import path).

**Step 2 — Read current App.tsx:**

```bash
cat src/App.tsx
```

Note the exact ternary structure (per audit A.1, it's at lines 130-164). Capture the existing layout so the refactor preserves it.

**Step 3 — Create placeholder route components:**

Create two minimal placeholder components for Settings and About (real content in Blocks 8/9):

`frontend/src/views/SettingsView.tsx`:
```typescript
export function SettingsView() {
  return (
    <div className="min-h-dvh w-full bg-rd-bg-base p-8 text-rd-text-primary">
      <h1 className="text-2xl">Settings</h1>
      <p className="text-rd-text-muted">Content arrives in Block 8.</p>
    </div>
  );
}
```

`frontend/src/views/AboutView.tsx`:
```typescript
export function AboutView() {
  return (
    <div className="min-h-dvh w-full bg-rd-bg-base p-8 text-rd-text-primary">
      <h1 className="text-2xl">About</h1>
      <p className="text-rd-text-muted">Content arrives in Block 9.</p>
    </div>
  );
}
```

These use the new `--rd-*` tokens from Block 0b. First consumers.

**Step 4 — Refactor App.tsx:**

Convert the nested ternary to explicit checks + add router. **Multiple critical patterns to apply (per Round 1 DeepSeek P0 + Round 2 Codex Findings 1, 2, 3):**

1. **Preserve the `<main>` wrapper around active sessions.** The Step 12 `<main className="relative min-h-dvh w-full bg-zinc-950">` is load-bearing for background coverage, full-bleed sizing, and the positioning surface for absolute TouchZones and Cue elements. Removing it would regress the training surface.

2. **Split `App` (provider wrapper) from `AppContent` (consumer).** Hooks consuming router context (`useLocation`) must live UNDER the provider, not in the same component that returns the provider.

3. **Use `navigate('/', { replace: true })`** when normalizing route on session start — NOT `setLocation('/')` which is a push.

4. **Add unknown-route fallback** at the end of `Switch` — Wouter renders only the first match; unsupported paths render blank without a fallback.

5. **Consume EDR `ROUTING_MODE`** — branch on path vs hash routing per the Block 0a decision.

Here is the corrected pattern:

```tsx
// Imports (path routing)
import { Route, Switch, useLocation, Redirect } from 'wouter';

// Imports (hash routing — if ROUTING_MODE === 'hash')
// import { Router, Route, Switch, useLocation, Redirect } from 'wouter';
// import { useHashLocation } from 'wouter/use-hash-location';

import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';

// Outer App: provider wrapper. For hash routing, wraps with <Router hook={useHashLocation}>.
// For path routing, no <Router> wrapper needed (Wouter's implicit router works fine).
function App() {
  // Hash routing variant:
  // return <Router hook={useHashLocation}><AppContent /></Router>;

  // Path routing variant:
  return <AppContent />;
}

// Inner AppContent: hook consumer. useLocation() runs UNDER the provider context.
function AppContent() {
  // ... existing hook wiring (useSessionState, useStimulusEngine, etc. — UNCHANGED) ...

  const [, navigate] = useLocation();  // destructure without unused location var

  const isSessionActive =
    session.status === 'running' ||
    session.status === 'rest';

  // Session takes precedence: active session renders fullscreen inside <main>, no route visible.
  // PRESERVE the <main> wrapper that Step 12 relied on for layout and positioning.
  if (isSessionActive) {
    return (
      <main className="relative min-h-dvh w-full bg-rd-bg-base">
        {session.status === 'running' && <RunningView {...runningProps} />}
        {session.status === 'rest' && <RestView {...restProps} />}
      </main>
    );
  }

  // Idle and summary states share the workout route surface
  return (
    <main className="relative min-h-dvh w-full bg-rd-bg-base">
      <Switch>
        <Route path="/settings"><SettingsView /></Route>
        <Route path="/about"><AboutView /></Route>
        <Route path="/">
          {session.status === 'idle' && <PreSessionScreen {...preProps} />}
          {session.status === 'summary' && <SessionSummary {...summaryProps} />}
        </Route>
        {/* Unknown-route fallback: redirect to / (per Round 1 DeepSeek P1) */}
        <Route>
          <Redirect to="/" replace />
        </Route>
      </Switch>
    </main>
  );
}

export default App;
```

**Key invariants in this code:**

- `<main className="relative min-h-dvh w-full bg-rd-bg-base">` is present in BOTH branches (session-active and route-rendered). The Step 12 layout is preserved.
- `AppContent` is where `useLocation` is called; `App` is only the provider wrapper. Context-before-provider is avoided.
- The fallback `<Route>` at the end of `<Switch>` catches unknown paths and redirects to `/` with `replace: true`.
- Hook wiring is UNCHANGED per audit B.1 — the seven session hooks remain in `AppContent`, not lifted to `App`.

**Step 5 — Implement route replace on session start (per Round 1 DeepSeek P1):**

When the user taps Start (transitioning from idle → running), the route should normalize to `/`. Use **`navigate('/', { replace: true })`** — NOT `setLocation('/')` which is a push.

Push semantics would mean browser Back returns to the pre-session route entry, which is wrong UX.

```tsx
// In AppContent, find where Start is wired to PreSessionScreen:
const handleStart = () => {
  navigate('/', { replace: true });  // Normalize route (replace, not push)
  session.startSession();
};
```

**Step 6 — Verify direct URL loads work:**

```bash
npm run dev
# In browser:
# Path routing (ROUTING_MODE = 'path'):
#   Navigate to http://localhost:5173/settings — must show SettingsView placeholder
#   Navigate to http://localhost:5173/about — must show AboutView placeholder
#   Navigate to http://localhost:5173/ — must show PreSessionScreen
#   Navigate to http://localhost:5173/nonexistent — must redirect to /
#   Click browser back button after navigating between routes — must work
#
# Hash routing (ROUTING_MODE = 'hash'):
#   Navigate to http://localhost:5173/#/settings — must show SettingsView
#   Navigate to http://localhost:5173/#/about — must show AboutView
#   Navigate to http://localhost:5173/#/ (or /) — must show PreSessionScreen
#   Navigate to http://localhost:5173/#/nonexistent — must redirect to /
```

**Step 7 — Verify session precedence:**

```bash
# In browser at /settings:
# Trigger a session start via DevTools (or temporarily nav to / and start)
# Confirm: when session.status becomes 'running', the route does not render
# Confirm: when session ends (status → summary), the user lands on / (per Step 5)
```

**Step 8 — Verify Step 12 behavior preserved:**

Run through the full Quick Demo flow:
1. Open `/` → PreSessionScreen
2. Select Quick Demo → defaults appear
3. Tap Start Session → countdown → first cue
4. Complete the session → Summary appears
5. Tap Done → returns to PreSessionScreen on `/`

If any Step 12 behavior is broken, stop and report.

**Verification checklist:**

- [ ] Wouter installed and pinned in package.json
- [ ] Nested ternary converted to explicit `===` checks
- [ ] Session precedence rule in place (`isSessionActive` early return)
- [ ] Settings/About placeholder routes work via direct URL load
- [ ] Browser back/forward works
- [ ] Start button performs `setLocation('/')` before dispatch
- [ ] All Step 12 behavior preserved (Quick Demo end-to-end)
- [ ] Lint, tsc, build all pass

**Stop-and-report:**

```
Block 2 complete.
Files changed: package.json, App.tsx, views/SettingsView.tsx (new), views/AboutView.tsx (new)
Routing strategy: [standard path / hash]
Wouter version: [exact version from package.json]
Verification: lint ✅, tsc ✅, build ✅, direct URL load ✅, session precedence ✅, Step 12 behavior preserved ✅
Ready to proceed to Block 3? Awaiting ratification.
```

**Commit:**

```bash
git add package.json package-lock.json src/App.tsx src/views/
git commit -m "$(cat <<'EOF'
Step 13 Block 2 — Wouter integration + session/route precedence

Installs Wouter (~1.5kb) as the client-side router for Settings and About
routes. App.tsx now enforces session-state precedence: when the session is
running or in rest, the session surface renders fullscreen regardless of
route. Idle/summary states share the / route with PreSession and Summary.

The nested ternary view selection (App.tsx:130-164 pre-Step 13) is
converted to explicit `status === X` checks per Claude Code audit A.1.
This prevents future status additions from accidentally falling through
to the Summary view as the implicit else branch.

The router is additive — none of the seven session hooks (useSessionState,
useStimulusEngine, useReactionInput, useAudioCueRenderer, useMissDetector,
useRoundTimer, usePreferencesPersistence) require Context introduction.
Per audit B.1, leaf routes coexist with state-machine-driven session views.

Anchor: R72.5 A1 (DeepSeek P1 + Codex Finding 1 + audit A.1, B.1)
EOF
)"
```

---

### Block 3 — AppShell + Desktop Sidebar

**Purpose:** Introduce the persistent App shell wrapping non-session routes. Desktop sidebar is left-aligned, 240px wide, contains nav items (Workout / Settings / About) with active-route indication. Mobile drawer is NOT in this block — Block 4 handles it.

**R72.5 anchor:** Q1, Q10, Q11, A2

**Files touched:**

- `frontend/src/components/AppShell.tsx` (new)
- `frontend/src/components/Sidebar.tsx` (new)
- `frontend/src/components/NavItem.tsx` (new)
- `frontend/src/components/NavSeparator.tsx` (new)
- `frontend/src/App.tsx` (wrap non-session routes in AppShell)

**Acceptance criteria:**

1. AppShell renders desktop sidebar + main content area
2. Sidebar is 240px wide (uses `--rd-sidebar-width` from Block 0b)
3. NavItems: Workout (→ `/`), Settings (→ `/settings`), About (→ `/about`)
4. Active route gets `bg-zinc-800` rounded-pill treatment (per Q11)
5. Sidebar is responsive: visible on desktop (≥ 768px), hidden on mobile (< 768px)
6. Mobile layout uses fullscreen content area (drawer comes in Block 4)
7. InstallButton placeholder slot exists at sidebar bottom (real implementation in Block 15)
8. All Step 12 behavior preserved
9. Lint, tsc, build all pass

**Execution steps:**

**Step 1 — Create NavItem component:**

**Important (per Round 1 DeepSeek P1):** Wouter's `<Link>` renders an anchor itself and proxies standard anchor props. Do NOT nest `<a>` inside `<Link>` — that creates a nested-anchor anti-pattern. Use `<Link>` directly with className.

`frontend/src/components/NavItem.tsx`:
```typescript
import { Link, useRoute } from 'wouter';

interface NavItemProps {
  to: string;
  label: string;
  onNavigate?: () => void;  // optional, used by mobile drawer to close on tap
}

export function NavItem({ to, label, onNavigate }: NavItemProps) {
  const [isActive] = useRoute(to);

  return (
    <Link
      href={to}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={`
        block px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isActive
          ? 'bg-rd-bg-elevated text-rd-text-primary'
          : 'text-rd-text-secondary hover:bg-rd-bg-surface hover:text-rd-text-primary'
        }
      `}
    >
      {label}
    </Link>
  );
}
```

Notes:
- `<Link>` renders the underlying anchor; we pass `className`, `aria-current`, and `onClick` directly to it
- `aria-current="page"` is the canonical a11y signal for active route
- `onNavigate` is consumed by Wouter's `Link` as `onClick` — fires when the link is clicked (Block 4 uses this to close the mobile drawer)

**Step 2 — Create NavSeparator component:**

`frontend/src/components/NavSeparator.tsx`:
```typescript
export function NavSeparator() {
  return <div className="my-3 h-px bg-rd-border-subtle mx-3" />;
}
```

**Step 3 — Create Sidebar component:**

**Important (per Round 1 ChatGPT P5 + Round 2 DeepSeek version-ownership):** Do NOT hardcode `v0.13.0`. The version source of truth is `package.json` (set via `npm version 0.13.0 --no-git-tag-version` in Block 18; in the meantime use whatever's in package.json). Read it via Vite's `__APP_VERSION__` define (set up in Block 8).

`frontend/src/components/Sidebar.tsx`:
```typescript
import { NavItem } from './NavItem';
import { NavSeparator } from './NavSeparator';

interface SidebarProps {
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;  // closes drawer on nav tap (Block 4)
}

export function Sidebar({ variant = 'desktop', onNavigate }: SidebarProps) {
  // Desktop variant uses md:flex (hidden < 768px); drawer variant is always visible
  const containerClasses =
    variant === 'desktop'
      ? 'hidden md:flex md:flex-col shrink-0'  // shrink-0 prevents squish from wide content
      : 'flex flex-col';

  return (
    <aside
      className={`
        ${containerClasses}
        w-[var(--rd-sidebar-width)]
        h-dvh
        bg-rd-bg-surface
        border-r border-rd-border-subtle
        p-3
      `}
    >
      {/* Logo / brand placeholder */}
      <div className="px-3 py-4 mb-2">
        <div className="text-rd-text-primary text-base font-semibold">
          Reaction Defense
        </div>
        <div className="text-rd-text-muted text-xs">Training</div>
      </div>

      {/* Nav items */}
      <nav aria-label="Primary navigation" className="flex-1 flex flex-col gap-1">
        <NavItem to="/" label="Workout" onNavigate={onNavigate} />
        <NavItem to="/settings" label="Settings" onNavigate={onNavigate} />
        <NavItem to="/about" label="About" onNavigate={onNavigate} />
      </nav>

      {/* Bottom area: separator + install placeholder + version */}
      <div>
        <NavSeparator />
        {/* InstallButton renders here in Block 15 — note: lifted to AppShell per Round 2 DeepSeek P0 to avoid duplicate listeners */}
        <div className="px-3 py-2 text-rd-text-muted text-xs tabular-nums">
          v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'}
        </div>
      </div>
    </aside>
  );
}
```

**Notes:**
- `shrink-0` on the desktop aside prevents shrinkage when main content is wide (Round 1 DeepSeek layout hardening)
- `aria-label="Primary navigation"` on the nav element provides landmark name
- Sidebar reads `__APP_VERSION__` via Vite define (set up in Block 8 + version-source decision in Execution Decisions Record)
- Brand text is currently "Reaction Defense" / "Training" — there's a Round 1 ChatGPT P12 question about whether this should match Step 12's existing title "Visual Reaction Boxing" in PreSessionScreen. The Block 5 PreSession spec preserves "Visual Reaction Boxing" verbatim per audit A.2. The two coexist intentionally: the product title in PreSessionScreen vs the brand text in the sidebar. If the founder prefers a single string, it's a Block 5 + Block 3 micro-amendment.

**Step 4 — Create AppShell component:**

`frontend/src/components/AppShell.tsx`:
```typescript
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full bg-rd-bg-base">
      <Sidebar />
      <div className="min-w-0 flex-1 min-h-dvh overflow-auto">
        {children}
      </div>
    </div>
  );
}
```

**Note (per Round 1 DeepSeek layout hardening):** `min-w-0 flex-1` on the content area prevents horizontal overflow from wide child content (e.g., very long single-line text).

**Step 5 — Wrap non-session routes in AppShell in App.tsx:**

Modify App.tsx's non-session render path:

```typescript
// Non-session render (idle or summary)
return (
  <AppShell>
    <Switch>
      <Route path="/settings"><SettingsView /></Route>
      <Route path="/about"><AboutView /></Route>
      <Route path="/">
        {session.status === 'idle' && <PreSessionScreen {...preProps} />}
        {session.status === 'summary' && <SessionSummary {...summaryProps} />}
      </Route>
    </Switch>
  </AppShell>
);
```

**Important:** session-active branch (running/rest) does NOT use AppShell. It renders fullscreen.

**Step 6 — Verify desktop layout:**

```bash
npm run dev
# In browser at width ≥ 768px:
# - Sidebar visible on left, 240px wide
# - Main content area to the right
# - PreSession renders inside main content
# - Click "Settings" nav → SettingsView placeholder appears, "Settings" highlights
# - Click "About" → AboutView placeholder, "About" highlights
# - Click "Workout" → PreSession returns
```

**Step 7 — Verify mobile layout (sidebar hidden):**

```bash
# In browser DevTools, set viewport to < 768px (e.g., 375px width)
# Sidebar should be HIDDEN
# Main content fills full width
# This is the pre-Block-4 state — drawer comes next block
```

**Step 8 — Verify session precedence still works:**

Start a session at width < 768px. The session surface should fill the entire viewport. Verify the sidebar does NOT re-appear during the session even on a desktop-width browser.

**Step 9 — Verify Step 12 behavior:**

Full Quick Demo flow on both mobile and desktop widths.

**Verification checklist:**

- [ ] Sidebar visible on desktop (≥ 768px) at 240px width
- [ ] Sidebar hidden on mobile (< 768px)
- [ ] Active route gets rounded pill background
- [ ] All three routes navigable
- [ ] Session-active rendering unaffected by AppShell
- [ ] InstallButton slot exists but is empty
- [ ] Step 12 behavior preserved
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 3 complete.
Files changed: 4 new components + App.tsx integration
Desktop sidebar: ✅ 240px, visible at ≥768px
Mobile sidebar: hidden (drawer arrives in Block 4)
Active route indication: ✅ rounded pill
Step 12 behavior: ✅ preserved
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 4? Awaiting ratification.
```

**Commit:**

```bash
git add src/components/AppShell.tsx src/components/Sidebar.tsx src/components/NavItem.tsx src/components/NavSeparator.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 3 — AppShell + desktop sidebar

Introduces the persistent App shell wrapping non-session routes. The
sidebar (240px, --rd-sidebar-width) contains Workout / Settings / About
nav items with subtle background-tint active state per Q11.

Mobile layout (< 768px) currently hides the sidebar; the hamburger drawer
arrives in Block 4. The InstallButton slot at the sidebar bottom is a
placeholder; real install affordance arrives in Block 15.

Session-active rendering bypasses AppShell entirely per A1 precedence —
the sidebar is hidden during running and rest by virtue of the running/
rest surfaces rendering above the shell rather than alongside it.

Anchor: R72.5 Q1, Q10, Q11, A2
EOF
)"
```

---

### Block 4 — Mobile Drawer Behavior

**Purpose:** Add mobile hamburger toggle and overlay drawer (280px). Drawer slides in from left with backdrop. Closes on route selection, backdrop tap, Escape. Respects `prefers-reduced-motion`. Returns focus to hamburger on close.

**R72.5 anchor:** Q1, Q2 (drawer-toggle slide; session-start instant)

**Files touched:**

- `frontend/src/components/MobileDrawer.tsx` (new)
- `frontend/src/components/HamburgerButton.tsx` (new)
- `frontend/src/components/AppShell.tsx` (add mobile drawer)
- `frontend/src/hooks/useDrawer.ts` (new — open/close state + Escape handler)

**Acceptance criteria:**

1. Hamburger button visible on mobile (< 768px), top-left of shell
2. Hamburger has safe-area padding (`var(--safe-top)` and `var(--safe-left)`)
3. Tap opens drawer; drawer slides in from left (~200ms ease-out)
4. Backdrop tap closes drawer
5. Selecting a nav item closes drawer + navigates
6. Escape key closes drawer
7. Background scroll prevented while drawer is open
8. Focus returns to hamburger on close
9. `prefers-reduced-motion` respected (no animation if user prefers)
10. Drawer width: 280px (`--rd-drawer-width`)
11. Drawer has `aria-expanded`, `aria-controls`
12. Step 12 behavior preserved

**Execution steps:**

**Step 1 — Create useDrawer hook:**

`frontend/src/hooks/useDrawer.ts`:
```typescript
import { useEffect, useState, useRef, useCallback } from 'react';

export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to trigger after close
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);

  // Escape closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Prevent body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  return { isOpen, open, close, triggerRef };
}
```

**Step 2 — Create HamburgerButton component:**

`frontend/src/components/HamburgerButton.tsx`:
```typescript
import { forwardRef } from 'react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  ariaControls: string;
}

export const HamburgerButton = forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  ({ isOpen, onClick, ariaControls }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls={ariaControls}
        className="
          md:hidden
          fixed z-40
          flex items-center justify-center
          w-11 h-11
          rounded-lg
          bg-rd-bg-surface/80
          backdrop-blur-sm
          text-rd-text-primary
          border border-rd-border-subtle
        "
        style={{
          top: `calc(0.75rem + var(--safe-top))`,
          left: `calc(0.75rem + var(--safe-left))`,
        }}
      >
        {/* Hamburger icon (three lines) — decorative, hidden from AT */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    );
  }
);

HamburgerButton.displayName = 'HamburgerButton';
```

**Step 3 — Create MobileDrawer component:**

**Critical HIGH severity amendments (per Round 1 DeepSeek P0):**

1. **Closed drawer must NOT remain keyboard-interactive.** A drawer mounted with `translate-x-full` is offscreen visually but its NavItem links remain focusable via Tab. Apply ALL of: `aria-hidden="true"`, `inert` attribute, `pointer-events-none` when closed.

2. **Drawer content must respect safe areas.** Hamburger respects them, but the drawer content starts at `top: 0` with plain `p-3` — on notched landscape devices, branding and nav items can sit under cutouts. Apply `paddingTop: 'calc(0.75rem + var(--safe-top))'` etc. Also cap width on narrow viewports: `width: 'min(var(--rd-drawer-width), calc(100vw - 2rem))'`.

3. **Avoid nested `<aside>` landmarks.** Don't render `<Sidebar variant="drawer">` (which renders an `<aside>`) inside `<MobileDrawer>` (which also renders an `<aside>`). Extract a `<SidebarContent>` shared component that renders only `<nav>`. Desktop `<Sidebar>` owns the desktop `<aside>`; `<MobileDrawer>` owns the drawer container.

`frontend/src/components/MobileDrawer.tsx`:
```typescript
import { useRef } from 'react';
import type { ReactNode } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  id: string;
}

export function MobileDrawer({ isOpen, onClose, children, id }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Apply `inert` to closed drawer via ref since React types may not include it
  // (inert removes element from tab order + AT focus + click handling)
  // This is the v2 amendment per Round 1 DeepSeek P0
  if (drawerRef.current) {
    if (isOpen) {
      drawerRef.current.removeAttribute('inert');
    } else {
      drawerRef.current.setAttribute('inert', '');
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`
          md:hidden
          fixed inset-0 z-30
          bg-rd-bg-overlay
          transition-opacity duration-200 ease-out
          motion-reduce:transition-none
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Drawer container (NOT an <aside> — wrapping component avoids nested landmark) */}
      <div
        ref={drawerRef}
        id={id}
        aria-hidden={isOpen ? undefined : 'true'}
        className={`
          md:hidden
          fixed top-0 left-0 z-30
          h-dvh
          bg-rd-bg-surface
          border-r border-rd-border-subtle
          transition-transform duration-200 ease-out
          motion-reduce:transition-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}
        `}
        style={{
          width: 'min(var(--rd-drawer-width), calc(100vw - 2rem))',
          paddingTop: 'calc(0.75rem + var(--safe-top))',
          paddingRight: 'calc(0.75rem + var(--safe-right))',
          paddingBottom: 'calc(0.75rem + var(--safe-bottom))',
          paddingLeft: 'calc(0.75rem + var(--safe-left))',
        }}
      >
        {children}
      </div>
    </>
  );
}
```

**Implementation notes:**

- `inert` is applied via ref because React 18 types may not include it. The ref-based approach works regardless.
- `aria-hidden` is conditional: removed when open, set when closed.
- `pointer-events-none` is added when closed to remove from click handling.
- Width is capped via `min()` so the drawer doesn't exceed `100vw - 2rem` on narrow viewports.
- Safe-area padding is additive — `calc(0.75rem + var(--safe-top))` etc.
- The drawer is a `<div>`, NOT an `<aside>`, to avoid nested landmark.

**Mandatory test (per Round 1 DeepSeek P0):**

```bash
# In browser at mobile width:
# 1. Open hamburger drawer
# 2. Tab through nav items — should focus drawer NavItems
# 3. Close drawer (Escape or backdrop tap)
# 4. Tab repeatedly — focus must NEVER enter the (now offscreen) drawer NavItems
# 5. Verify aria-hidden="true" set on drawer in DevTools when closed
# 6. Verify inert attribute set on drawer in DevTools when closed
```

If Tab can reach drawer items when drawer is closed, the test FAILS. Investigate and fix before proceeding.

**Step 4 — Update AppShell to integrate drawer + hamburger:**

`frontend/src/components/AppShell.tsx`:
```typescript
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileDrawer } from './MobileDrawer';
import { HamburgerButton } from './HamburgerButton';
import { useDrawer } from '../hooks/useDrawer';

interface AppShellProps {
  children: ReactNode;
}

const DRAWER_ID = 'mobile-nav-drawer';

export function AppShell({ children }: AppShellProps) {
  const { isOpen, open, close, triggerRef } = useDrawer();

  return (
    <div className="flex min-h-dvh w-full bg-rd-bg-base">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile hamburger */}
      <HamburgerButton
        ref={triggerRef}
        isOpen={isOpen}
        onClick={isOpen ? close : open}
        ariaControls={DRAWER_ID}
      />

      {/* Mobile drawer — reuses Sidebar contents */}
      <MobileDrawer isOpen={isOpen} onClose={close} id={DRAWER_ID}>
        <Sidebar variant="drawer" onNavigate={close} />
      </MobileDrawer>

      <div className="flex-1 min-h-dvh overflow-auto">
        {children}
      </div>
    </div>
  );
}
```

**Note:** The `Sidebar` component now needs a `variant` prop and `onNavigate` callback. Update Sidebar.tsx accordingly:

```typescript
interface SidebarProps {
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;
}

export function Sidebar({ variant = 'desktop', onNavigate }: SidebarProps) {
  // Desktop variant uses `hidden md:flex`; drawer variant is always visible
  // Pass onNavigate down to NavItem so taps close the drawer

  // ... (refactor existing Sidebar to thread variant + onNavigate through NavItem)
}
```

NavItem also needs an `onNavigate` prop:

```typescript
interface NavItemProps {
  to: string;
  label: string;
  onNavigate?: () => void;
}

export function NavItem({ to, label, onNavigate }: NavItemProps) {
  const [isActive] = useRoute(to);

  return (
    <Link href={to} onClick={onNavigate}>
      {/* ... */}
    </Link>
  );
}
```

**Step 5 — Verify drawer behavior:**

```bash
npm run dev
# Open browser, set viewport < 768px (e.g., 375x812 iPhone X)
# Tap hamburger (top-left) — drawer slides in
# Tap a nav item — drawer closes + navigates
# Open drawer again, tap backdrop — drawer closes
# Open drawer, press Escape — drawer closes
# Check focus returns to hamburger after Escape
# Open drawer, try to scroll background — should be locked
```

**Step 6 — Verify reduced motion:**

```bash
# In browser DevTools, set Emulate CSS prefers-reduced-motion: reduce
# Open/close drawer — should be instant (no slide animation)
```

**Step 7 — Verify a11y attributes:**

```bash
# Open DevTools, inspect hamburger button:
# - aria-expanded reflects drawer state
# - aria-controls points to drawer id
# Inspect drawer:
# - id matches aria-controls
```

**Step 8 — Verify session-active state:**

Start a session while drawer is open — drawer must close (session takes precedence). Or: drawer cannot be opened during running/rest because AppShell isn't rendered (per A1 precedence).

Actually, the second is correct — during session, AppShell doesn't render, so hamburger doesn't exist. No state to manage.

**Step 9 — Verify Step 12 behavior:**

Full Quick Demo on mobile width. Drawer interactions don't interfere.

**Verification checklist:**

- [ ] Hamburger visible only on mobile (< 768px)
- [ ] Hamburger has safe-area padding (top + left)
- [ ] Tap opens drawer with slide animation
- [ ] Nav item tap closes drawer + navigates
- [ ] Backdrop tap closes drawer
- [ ] Escape closes drawer + returns focus to hamburger
- [ ] Background scroll prevented while open
- [ ] `prefers-reduced-motion` respected
- [ ] `aria-expanded` and `aria-controls` correct
- [ ] Step 12 behavior preserved
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 4 complete.
Files changed: 3 new components + useDrawer hook + AppShell/Sidebar/NavItem updates
Drawer width: 280px
A11y: aria-expanded, aria-controls, focus return, Escape close
Reduced motion: respected
Step 12 behavior: preserved
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to PHASE GATE 1? Awaiting ratification.
```

**Commit:**

```bash
git add src/components/MobileDrawer.tsx src/components/HamburgerButton.tsx src/components/AppShell.tsx src/components/Sidebar.tsx src/components/NavItem.tsx src/hooks/useDrawer.ts
git commit -m "$(cat <<'EOF'
Step 13 Block 4 — mobile drawer behavior

Adds hamburger toggle (top-left, safe-area padded) and 280px overlay
drawer for mobile viewports (< 768px). Drawer slides in from left with
~200ms ease-out, with backdrop. Closes on route selection, backdrop tap,
or Escape key. Focus returns to hamburger on close. Background scroll
prevented while open. Respects prefers-reduced-motion.

Sidebar contents are shared between desktop (md:flex) and drawer (mobile)
via a variant prop on Sidebar/NavItem. The drawer reuses Sidebar's nav
items with onNavigate callback wired to close the drawer.

Session-active state is unaffected — AppShell doesn't render during
running/rest per A1 precedence, so the hamburger/drawer pair only exists
on idle/summary screens and additional routes.

Anchor: R72.5 Q1 (280px drawer), Q2 (slide for drawer-toggle)
EOF
)"
```

---

## PHASE GATE 1 — Navigation Foundation

**Cumulative state after Blocks 0a, 0b, 1, 2, 3, 4:**

- Hosting fallback verified (or hash routing committed via Execution Decisions Record)
- Design tokens established (`--rd-*` namespace)
- Persistence schema documented
- Wouter routing integrated with session/route precedence + `<main>` wrapper preserved
- Desktop sidebar (240px, active-route indication)
- Mobile drawer (280px, hamburger toggle, a11y attrs, safe-area padding, inert when closed)
- Settings and About placeholder views

**Gate criteria — ALL must pass before Phase 3 begins:**

1. **Routing — path or hash branch (per EDR ROUTING_MODE):**
   - **If `ROUTING_MODE = path`:** Direct browser load of `/`, `/settings`, `/about` all work on desktop and mobile
   - **If `ROUTING_MODE = hash`:** Direct browser load of `/#/`, `/#/settings`, `/#/about` all work on desktop and mobile
2. **Unknown route fallback (per Round 1 DeepSeek P1):** Unknown path (e.g., `/nonexistent` or `/#/nonexistent`) redirects to `/`
3. Browser back/forward navigation works
4. **`navigate('/', { replace: true })` semantics (per Round 1 DeepSeek P1):** After Start, browser Back does NOT return to the pre-session route entry
5. Active route indication visible in both sidebar and drawer
6. Hamburger opens drawer; drawer closes via nav-tap / backdrop / Escape
7. **Closed drawer Tab test (per Round 1 DeepSeek P0):** Close the drawer, press Tab repeatedly — focus must NEVER enter the drawer NavItems
8. **Drawer safe-area test (per Round 1 DeepSeek):** Drawer content respects portrait AND landscape safe areas (no content under notch cutouts)
9. **`<main>` wrapper preservation (per Round 1 DeepSeek P0 + Round 2 Codex Finding 2):** Running and Rest views render INSIDE a `<main className="relative min-h-dvh w-full bg-rd-bg-base">` wrapper; absolute touch zones and cue positioning still work
10. Session-active surface (running/rest) bypasses shell sidebar entirely (sidebar absent from DOM, not just hidden)
11. Returning from session lands on `/` (route normalization works)
12. Step 12 invariants verified: R44A, R54, R58, R63 locks 1&2, R68, R71.5 P2&P3
13. Quick Demo, 3x3 Standard, and Custom presets all complete sessions end-to-end
14. Persistence survives page reload (existing localStorage entries load correctly)
15. **Build check (per Round 1 ChatGPT P9):** `cd frontend && npm run build` succeeds; zero TEMP DEV LOG markers
16. Lint passes with zero warnings

**Gate execution:**

Founder + Claude Code run the manual test matrix above. Each item is ✅ or ❌. If any ❌, work backward to identify the regression block and fix before proceeding.

**Stop-and-report after gate:**

```
PHASE GATE 1: [✅ PASSED / ❌ FAILED]
Routing mode tested: [path | hash]
Failures: [list any]
Ready to proceed to Phase 3 (View migration)? Awaiting ratification.
```

---

## Phase 3 — View Migration (3 blocks)

### Block 5 — Workout (PreSession) Config Card

**Purpose:** Restyle PreSessionScreen as a config card pattern (per Q4). Preserve all content per audit A.2. Restyle ModeButton (child component). Apply tabular-nums to the 3 slider value previews (per audit A.5 — verified scope). NO behavior changes.

**R72.5 anchor:** Q4 (config card), audit A.2 (content inventory), audit A.5 (tabular-nums scope)

**Files touched:**

- `frontend/src/components/PreSessionScreen.tsx` (visual restyle)
- `frontend/src/components/ModeButton.tsx` (visual restyle)

**Audit-verified content to preserve (A.2):**

- Title "Visual Reaction Boxing"
- Three uppercase section labels: "Mode" (line 47) / "Workout" (line 70) / "Custom Settings" (line 96)
- Mode buttons: Visual / Audio / Combined
- Preset buttons: Quick Demo (emphasized — larger padding/text) / 3x3 Standard / Custom (preset names exact in `sessionConfig.ts:21-23`)
- Conditional sliders when `selectedPresetId === 'custom'` — 3 sliders (round duration / rest duration / rounds) with `font-mono` value previews at lines 103, 119, 135
- Instruction line "Tap the matching edge"
- Start button labeled "Start Session" (preserve exact label)

**Acceptance criteria:**

1. PreSession wrapped in config card (`bg-rd-bg-surface/50` container per Q4) with rounded corners, generous internal padding, no heavy border
2. Vertical layout preserved within card (NOT multi-column — mobile-first)
3. All three section labels preserved with their exact text
4. ModeButton uses new tokens (no more `gray-*` references in this component)
5. The 3 slider value previews replace `font-mono` with `tabular-nums`
6. Start button uses tokens, label remains "Start Session"
7. Behavior unchanged: clicking Mode/Preset buttons, dragging sliders, clicking Start all work identically to Step 12
8. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Read current files (Rule 1):**

```bash
cd frontend
cat src/components/PreSessionScreen.tsx
cat src/components/ModeButton.tsx
```

Note exact line numbers for the three section labels (47, 70, 96) and the three `font-mono` spans (103, 119, 135). Verify against audit findings.

**Step 2 — Wrap PreSession content in config card:**

```tsx
// In PreSessionScreen.tsx — restyle the outer wrapper
<div className="min-h-dvh w-full bg-rd-bg-base text-rd-text-primary flex items-center justify-center p-6">
  <div
    className="
      w-full max-w-md
      bg-rd-bg-surface/50
      rounded-[var(--rd-radius-card)]
      p-6 sm:p-8
      flex flex-col gap-6
    "
  >
    {/* Title */}
    <h1 className="text-rd-text-primary text-xl font-semibold text-center">
      Visual Reaction Boxing
    </h1>

    {/* Mode section */}
    <section>
      <h2 className="text-rd-text-muted text-xs uppercase tracking-wider mb-3">
        Mode
      </h2>
      {/* Mode buttons here */}
    </section>

    {/* Workout section */}
    <section>
      <h2 className="text-rd-text-muted text-xs uppercase tracking-wider mb-3">
        Workout
      </h2>
      {/* Preset buttons here */}
    </section>

    {/* Custom Settings (conditional) */}
    {selectedPresetId === 'custom' && (
      <section>
        <h2 className="text-rd-text-muted text-xs uppercase tracking-wider mb-3">
          Custom Settings
        </h2>
        {/* Sliders here */}
      </section>
    )}

    {/* Instruction line */}
    <p className="text-rd-text-secondary text-sm text-center">
      Tap the matching edge
    </p>

    {/* Start button */}
    <button
      onClick={onStart}
      className="
        w-full py-3 px-6
        bg-rd-text-primary text-rd-bg-base
        rounded-[var(--rd-radius-pill)]
        font-medium
        hover:opacity-90 active:opacity-80
        transition-opacity
      "
    >
      Start Session
    </button>
  </div>
</div>
```

**Important:** The above is illustrative scaffolding. Claude Code must integrate the existing Mode buttons, Preset buttons, and Sliders INTO this structure — preserving their existing event handlers, state, and behavior. Per Rule 1, read the current implementation before structuring the integration.

**Step 3 — Update ModeButton to use new tokens:**

**Important (per Round 2 DeepSeek):** `py-2` alone may reduce the touch target below the 44px minimum recommended for mobile. Add `min-h-11` to enforce the minimum.

```tsx
// In ModeButton.tsx
export function ModeButton({ mode, label, isActive, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 min-h-11 py-2 px-3 rounded-lg text-sm font-medium
        transition-colors
        ${isActive
          ? 'bg-rd-bg-elevated text-rd-text-primary'
          : 'text-rd-text-secondary hover:bg-rd-bg-surface'
        }
      `}
    >
      {label}
    </button>
  );
}
```

The previous `text-gray-400` (audit A.4 verified at line 14) is replaced with `text-rd-text-secondary`. `min-h-11` (44px) is the iOS HIG-recommended minimum touch target.

**Step 4 — Replace `font-mono` with `tabular-nums` on slider previews:**

```tsx
// At lines 103, 119, 135 (per audit A.5)
<span className="tabular-nums">{formatDuration(config.roundDurationMs)}</span>
<span className="tabular-nums">{formatDuration(config.restDurationMs)}</span>
<span className="tabular-nums">{config.totalRounds}</span>
```

**Step 5 — Verify no other gray-* in PreSession or ModeButton:**

**Important scope clarification (per Round 2 ChatGPT P14):** Block 5 ONLY removes `gray-*` from `PreSessionScreen.tsx` and `ModeButton.tsx`. If `git grep` finds `gray-*` in other files (RunningView, etc.), NOTE them for Block 10 but do NOT alter them in this block. The full palette migration is Block 10's responsibility — keeping it scoped prevents Block 5 from creeping into multi-file refactoring.

```bash
cd frontend
# Verify ONLY the two files Block 5 touches:
git grep -nE '\bgray-[0-9]' src/components/PreSessionScreen.tsx src/components/ModeButton.tsx
```

Must return zero matches.

```bash
# Optionally note remaining gray-* for Block 10:
git grep -nE '\bgray-[0-9]' src/
```

This list should match what audit A.4 found minus the two files Block 5 cleaned. Block 10 sweeps the rest.

**Step 6 — Verify behavior unchanged:**

```bash
npm run dev
# Open browser at desktop and mobile widths
# Verify: title, three sections, all buttons, sliders (when Custom selected), instruction, Start button all present
# Click each Mode button → active state toggles correctly
# Click each Preset button → behavior unchanged (Quick Demo defaults, 3x3 Standard defaults, Custom shows sliders)
# Drag each slider → value updates, persists across mode/preset changes
# Click Start Session → countdown begins, session runs
# Confirm Step 12 behavior preserved end-to-end
```

**Verification checklist:**

- [ ] PreSession visually restyled with config card pattern
- [ ] All section labels preserved (Mode / Workout / Custom Settings)
- [ ] Title preserved ("Visual Reaction Boxing")
- [ ] Start button label preserved ("Start Session")
- [ ] ModeButton uses new tokens, no gray-* remaining in this component
- [ ] 3 slider value previews use `tabular-nums` (audit A.5 scope)
- [ ] No gray-* in PreSessionScreen.tsx (Block 10 handles other files)
- [ ] All Step 12 behaviors preserved (button states, slider interactions, Start)
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 5 complete.
Files changed: PreSessionScreen.tsx, ModeButton.tsx
Audit A.2 content preserved: ✅ (title, 3 section labels, Start Session button label)
Audit A.5 scope applied: ✅ (3 slider previews → tabular-nums)
gray-* in touched files: 0 (full Block 10 sweep still pending)
Step 12 behavior: ✅ preserved
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 6? Awaiting ratification.
```

**Commit:**

```bash
git add src/components/PreSessionScreen.tsx src/components/ModeButton.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 5 — PreSession config card restyle

Wraps PreSessionScreen in a config card surface (bg-rd-bg-surface/50,
rounded panel) per Q4. All content preserved per Claude Code audit A.2:
title "Visual Reaction Boxing", three uppercase section labels
(Mode/Workout/Custom Settings), mode and preset buttons, conditional
sliders, instruction line, and "Start Session" button label.

ModeButton restyled to use --rd-* tokens (replaces text-gray-400 at
line 14). The three Custom-slider value previews (lines 103/119/135)
swap font-mono for tabular-nums per audit A.5 — these are the actual
migration targets, not the four displays R72 originally claimed.

Behavior unchanged. Full gray-* → zinc-* sweep across remaining files
is Block 10.

Anchor: R72.5 Q4 + audit A.2 + audit A.5
EOF
)"
```

---

### Block 6 — Running + Rest Top-bar

**Purpose:** Replace the bottom-right floating Stop button with a top-bar pattern (round counter left, Stop right, dead-corner positioned). Apply iOS safe-area padding. Extract `<StopButton>` component to resolve the drift between RestView (extracted constants) and RunningView (inline styling) per audit B.3. Migrate RestView content to safe-area calc() pattern per audit A.7 + R10. Honor RunningView vs RestView layout difference per audit B.2.

**R72.5 anchor:** A3 (in-session top-bar), audit A.7 (RestView padding), audit B.2 (layout diff), audit B.3 (Stop button drift)

**Files touched:**

- `frontend/src/components/TopBar.tsx` (new — shared between RunningView and RestView)
- `frontend/src/components/StopButton.tsx` (new — extracted from inline + RestView constants)
- `frontend/src/components/RunningView.tsx` (replace inline Stop with TopBar; remove inline styling)
- `frontend/src/components/RestView.tsx` (replace both Stop instances with TopBar; migrate content padding to calc())

**Audit-verified context:**

- **A3 (round indicator non-interactive):** Round chip stays `pointer-events-none`. Only Stop is `pointer-events-auto`.
- **A3 (dead-corner constraints):** Stop in top-right 25% × 25%; round chip in top-left 25% × 25%; preserves the pull zone at top-center (TouchZones x:25-75%, y:0-25%).
- **A3 (no full-width backdrop blur):** Apply blur LOCALLY to chips, not the bar. The 48px bar would obscure the 120px pull cue otherwise.
- **A.7 (RestView padding):**
  - Standard branch (line 84): base `p-8` (2rem) — apply calc(2rem + var(--safe-*))
  - Rest=0 flash branch (line 63): currently unpadded — apply var(--safe-*) only
- **B.2 (layout difference):**
  - RunningView: absolute/fixed overlay layout. Top-bar floats above zones and cue.
  - RestView: flow layout (countdown + stats stacked). Top-bar slots above flow content.
- **B.3 (Stop button drift):** RestView at lines 32-42 exports STOP_BUTTON_CLASS + STOP_BUTTON_STYLE. RunningView at lines 90-100 has the same styling INLINE. Block 6 consolidates into one component.

**Acceptance criteria:**

1. `<TopBar>` component renders round counter + Stop in dead corners
2. `<StopButton>` component encapsulates all Stop styling (replaces RestView constants AND RunningView inline)
3. Round chip non-interactive (`pointer-events-none`); chip contents constrained to top-left 25% × 25%
4. Stop chip interactive (`pointer-events-auto`); constrained to top-right 25% × 25%
5. Top-bar container has `padding-top: var(--safe-top)` for iOS standalone mode
6. No full-width backdrop blur on the bar; blur applied LOCALLY to chips
7. RunningView integrates TopBar as overlay (absolute/fixed positioning)
8. RestView integrates TopBar with safe-area content padding migrated to calc() pattern (both branches)
9. Z-stack preserved: zones z-10, top-bar z-20 (with pointer-events-none on container), Stop z-30
10. Stop behavior unchanged: stopPropagation on pointerdown, calls `onStop`, returns to summary (or idle if no results)
11. Native `<button>` element (Enter/Space keyboard work for free per audit B.2)
12. Step 12 behavior preserved end-to-end (RunningView + RestView)

**Execution steps:**

**Step 1 — Read current files (Rule 1):**

```bash
cd frontend
cat src/components/RunningView.tsx
cat src/components/RestView.tsx
```

Confirm:
- RunningView line 90-103: inline Stop with `onPointerDown` stopPropagation
- RunningView line 35: round counter "Round N / M" (no `pointer-events` class — implicit non-interactive)
- RestView lines 32-42: STOP_BUTTON_CLASS, STOP_BUTTON_STYLE exports
- RestView line 63: rest=0 flash branch (no padding)
- RestView line 84: standard branch (`p-8`)
- RestView lines 70-77 + 151-158: two Stop button instances using the constants

**Step 2 — Create `<StopButton>` component:**

`frontend/src/components/StopButton.tsx`:
```tsx
interface StopButtonProps {
  onClick: () => void;
}

export function StopButton({ onClick }: StopButtonProps) {
  return (
    <button
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      className="
        pointer-events-auto
        px-4 py-2
        bg-rd-bg-elevated/80
        backdrop-blur-sm
        text-rd-text-primary text-sm font-medium uppercase tracking-wider
        rounded-lg
        border border-rd-border-subtle
      "
    >
      STOP
    </button>
  );
}
```

**Step 3 — Create `<TopBar>` component:**

**HIGH severity amendment (per Round 2 DeepSeek P0):** The previous `flex justify-between px-4` pattern positions elements at edges but does NOT constrain their width. On 320-375px viewports, text like "Round 3 / 3" can extend beyond the left 25% boundary into the pull zone (TouchZones x:25-75% y:0-25%).

The corrected pattern uses an explicit 3-column grid with `25vw / 50vw / 25vw` widths to FORCE the round chip and Stop button into dead corners regardless of content width:

```tsx
import { StopButton } from './StopButton';

interface TopBarProps {
  currentRound: number;
  totalRounds: number;
  onStop: () => void;
  // `layout` distinguishes layout integration: overlay (RunningView) vs flow (RestView)
  layout: 'overlay' | 'flow';
}

export function TopBar({ currentRound, totalRounds, onStop, layout }: TopBarProps) {
  const positionClasses =
    layout === 'overlay'
      ? 'absolute inset-x-0 top-0 z-20'
      : 'relative z-20';

  return (
    <header
      className={`${positionClasses} pointer-events-none`}
      style={{
        // min-height (NOT fixed height) to avoid border-box conflict with safe-area padding
        // The 48px content row PLUS the safe-area inset is added; padding does not consume the height
        minHeight: 'calc(var(--rd-topbar-height) + var(--safe-top))',
        paddingTop: 'var(--safe-top)',
      }}
    >
      {/* Explicit 3-column grid forces dead-corner constraints */}
      <div className="grid grid-cols-[25vw_50vw_25vw]">
        {/* Left dead corner: round chip */}
        <div className="flex items-start justify-start pl-3 pt-2">
          <div
            className="
              pointer-events-none
              px-3 py-1.5
              bg-rd-bg-elevated/80
              backdrop-blur-sm
              text-rd-text-secondary text-sm font-medium uppercase tracking-wider
              rounded-lg
              border border-rd-border-subtle
              max-w-full truncate
            "
          >
            {/* Compact label for narrow viewports: "R 1/3" if needed */}
            Round {currentRound}/{totalRounds}
          </div>
        </div>

        {/* Center: pull zone passthrough (pointer-events-none + aria-hidden) */}
        <div aria-hidden="true" />

        {/* Right dead corner: Stop button */}
        <div className="flex items-start justify-end pr-3 pt-2">
          <StopButton onClick={onStop} />
        </div>
      </div>
    </header>
  );
}
```

**Critical mechanics:**

- **`grid-cols-[25vw_50vw_25vw]`** forces three viewport-relative columns. The round chip is constrained to the left 25vw; Stop is constrained to the right 25vw; the center 50vw is reserved for the pull zone (which sits beneath the TopBar in the absolute layout).
- **`max-w-full truncate`** on the round chip handles overflow gracefully if "Round 99/99" exceeds 25vw — text truncates with ellipsis rather than expanding.
- **`min-height: calc(var(--rd-topbar-height) + var(--safe-top))`** — uses `min-height`, not fixed `height`. Under border-box sizing, `paddingTop` would consume a fixed `height`; using `min-height` lets the padding ADD to the 48px content row. The total reserved space = 48px + safe-area inset.
- **`pointer-events-none` on the `<header>` container** + **`pointer-events-auto` on the Stop button** (in `StopButton` component, see Step 2) — the round chip and the center column are non-interactive; only Stop captures pointer events.

**Measurable gate (per Round 2 DeepSeek P0):**

Add this test to Block 6 verification:

```js
// In DevTools console during a session:
const roundChip = document.querySelector('header [role="status"], header > div > div > div'); // adjust selector
const roundRect = roundChip.getBoundingClientRect();
console.assert(roundRect.right <= window.innerWidth * 0.25, 'Round chip exceeds left 25vw');

const stopButton = document.querySelector('header button');
const stopRect = stopButton.getBoundingClientRect();
console.assert(stopRect.left >= window.innerWidth * 0.75, 'Stop button extends below right 25vw');
```

Run this at multiple viewport widths (320, 375, 414, 568×320 landscape). All assertions must pass.

**If round chip still exceeds 25vw on narrow viewports:** Use a compact label like `R {currentRound}/{totalRounds}` instead of `Round {currentRound}/{totalRounds}`. The chip's `truncate` will handle it visually, but compact text avoids triggering truncation in normal cases.

**Step 4 — Integrate TopBar into RunningView:**

Remove the existing inline Stop (lines 90-100) and round counter (line 35). Replace with TopBar:

```tsx
// In RunningView.tsx
return (
  <div className="relative min-h-dvh w-full bg-rd-bg-base overflow-hidden">
    <TopBar
      currentRound={currentRound}
      totalRounds={totalRounds}
      onStop={onStop}
      layout="overlay"
    />
    <TouchZones {...zoneProps} />
    {/* Cue rendering, etc. */}
  </div>
);
```

Verify z-stack: zones (z-10) under top-bar (z-20) which has Stop (z-30 implicitly via order, but explicitly per audit B.2).

Actually re-reading audit B.2 — z-stack is: zones z-10, round counter z-20, Stop z-30. Let me update StopButton to include explicit z-30:

```tsx
// In StopButton.tsx
<button
  className="
    pointer-events-auto z-30  // ← add explicit z-30
    ...
  "
>
```

The TopBar container at z-20 with `pointer-events-none` doesn't intercept zone taps. Stop (z-30, `pointer-events-auto`) captures pointer events above all.

**Step 5 — Integrate TopBar into RestView:**

RestView is flow layout (per audit B.2). Both branches (rest=0 flash and standard) get a TopBar at the top.

**HIGH severity amendment (per Round 2 Codex Finding 4):** The previous spec double-applied safe-area top padding — the RestView wrapper had `paddingTop: calc(2rem + var(--safe-top))` AND `<TopBar layout="flow">` also applied `paddingTop: var(--safe-top)`. That compounds the inset.

**Resolution:** In flow layout, the TopBar owns the top safe-area inset (already specified in Step 3). The outer RestView wrapper applies safe-area padding to the OTHER edges only (right, bottom, left). The TopBar's `min-height: calc(48px + var(--safe-top))` reserves the correct space.

```tsx
// In RestView.tsx — standard branch (around line 84, base padding p-8 = 2rem)
<div
  className="min-h-dvh w-full bg-rd-bg-base flex flex-col"
  style={{
    // NOTE: paddingTop is omitted — TopBar owns top safe-area inset (per Codex Finding 4)
    paddingRight: `calc(2rem + var(--safe-right))`,
    paddingBottom: `calc(2rem + var(--safe-bottom))`,
    paddingLeft: `calc(2rem + var(--safe-left))`,
  }}
>
  <TopBar
    currentRound={currentRound}
    totalRounds={totalRounds}
    onStop={onStop}
    layout="flow"
  />
  {/* Existing rest countdown + stats — content sits below the TopBar's reserved space */}
  <div className="pt-8">
    {/* Original rest content */}
  </div>
</div>
```

For the rest=0 flash branch (line 63 area, originally unpadded):

```tsx
// In RestView.tsx — rest=0 flash branch (originally has no padding per audit A.7)
<div
  className="min-h-dvh w-full bg-rd-bg-base flex flex-col justify-center"
  style={{
    // Same pattern: TopBar owns top safe-area, wrapper covers other edges
    paddingRight: `var(--safe-right)`,
    paddingBottom: `var(--safe-bottom)`,
    paddingLeft: `var(--safe-left)`,
  }}
>
  <TopBar
    currentRound={currentRound}
    totalRounds={totalRounds}
    onStop={onStop}
    layout="flow"
  />
  {/* Existing rest=0 flash content */}
</div>
```

The TopBar's `min-height: calc(var(--rd-topbar-height) + var(--safe-top))` correctly reserves both the visual row AND the safe-area inset. Content rendered AFTER the TopBar (sequentially in the flow) sits below this reserved space naturally.

**Step 6 — Remove STOP_BUTTON_CLASS / STOP_BUTTON_STYLE exports:**

Delete lines 32-42 of `RestView.tsx`. The constants are no longer used (StopButton component replaces them).

**Step 7 — Verify gray-* not introduced:**

```bash
cd frontend
git grep -nE '\bgray-[0-9]' src/components/RunningView.tsx src/components/RestView.tsx src/components/TopBar.tsx src/components/StopButton.tsx
```

Must return zero matches.

**Step 8 — Manual test — RunningView:**

```bash
npm run dev
# Start a session
# Verify: TopBar visible at top with "Round 1 / 3" left, "STOP" right
# Verify: pull cue at top-center renders ABOVE TopBar (z-stack correct)
# Verify: tapping the round chip area does NOT trigger a reaction (pointer-events-none)
# Verify: tapping STOP ends the session
# Verify: tapping top-center pull area DURING a pull cue records the correct reaction
```

**Step 9 — Manual test — RestView:**

```bash
# After completing first round in a multi-round session
# Rest view appears with TopBar at top
# Round chip shows "Round 1 / 3" (the round that just completed)
# STOP button works
# Content (countdown timer, etc.) has appropriate safe-area padding
# rest=0 case: trigger via Custom preset with rest=0; verify TopBar still appears
```

**Step 10 — Manual test — Multiple viewports (audit B.2 + Gemini):**

Test on viewport sizes including:
- 375 × 667 (iPhone 8 portrait)
- 414 × 896 (iPhone 11 portrait)
- 568 × 320 (iPhone 8 LANDSCAPE — short height)
- 768 × 1024 (iPad portrait)

For each:
- TopBar elements stay in dead corners
- Pull zone (top-center) is not obscured by TopBar
- Stop button is reachable without thumb stretch

**Verification checklist:**

- [ ] `<TopBar>` and `<StopButton>` components created
- [ ] RunningView uses TopBar (overlay layout) — no inline Stop, no inline round counter
- [ ] RestView (both branches) uses TopBar (flow layout) with safe-area calc() padding
- [ ] STOP_BUTTON_CLASS / STOP_BUTTON_STYLE deleted from RestView
- [ ] z-stack: zones z-10, top-bar z-20, Stop z-30 (verified via DevTools)
- [ ] Pull cue not obscured by TopBar on short viewports
- [ ] Round chip non-interactive (verified via tap test)
- [ ] Stop button stopPropagation preserved
- [ ] Native `<button>` element (Enter/Space work)
- [ ] iOS safe-area padding visible in standalone mode (or simulated)
- [ ] All Step 12 behavior preserved
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 6 complete.
Files changed: TopBar.tsx (new), StopButton.tsx (new), RunningView.tsx, RestView.tsx
Stop button drift resolved: ✅ (single component consumed by both views)
Z-stack verified: zones=10, top-bar=20, Stop=30
Viewport testing: ✅ at narrow landscape (568×320), portrait, tablet
Pull cue obstruction: 0 (no full-width blur per A3 refinement)
Step 12 behavior: ✅ preserved
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 7? Awaiting ratification.
```

**Commit:**

```bash
git add src/components/TopBar.tsx src/components/StopButton.tsx src/components/RunningView.tsx src/components/RestView.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 6 — Running + Rest top-bar pattern

Replaces the bottom-right floating Stop button with a top-bar pattern
(round chip left, Stop chip right) in dead-corner positions to avoid
obscuring the pull cue at top-center (TouchZones x:25-75% y:0-25%).

New <TopBar> component is shared between RunningView (overlay layout)
and RestView (flow layout) per audit B.2 — the layout prop distinguishes
absolute/fixed positioning from in-flow positioning. New <StopButton>
component resolves the drift between RestView's STOP_BUTTON_CLASS/STYLE
constants and RunningView's inline duplication (audit B.3).

Round chip is pointer-events-none to prevent stealing pull-zone taps
(audit A3 + Codex Finding 2). Stop chip is pointer-events-auto and
constrained to top-right dead corner. Backdrop blur is applied locally
to each chip rather than a full-width strip, per audit A3 refinement.

RestView content padding migrates to calc() pattern for safe-area
support: standard branch base p-8 → calc(2rem + var(--safe-*)), rest=0
flash branch unpadded → var(--safe-*) only (audit A.7).

Z-stack preserved: zones z-10, top-bar container z-20 (with pointer-
events-none), Stop button z-30.

Anchor: R72.5 A3 + audit A.7 + audit B.2 + audit B.3
EOF
)"
```

---

### Block 7 — SessionSummary Redesign

**Purpose:** Restyle SessionSummary with the deferred layout decision now resolved. Preserve all content per audit A.3 (7 metrics + optional per-round breakdown + Done button → idle). Apply tokens + color indicators. The layout decision is part of this block's spec — it was deferred from R72.5 to v1 Block 7 with full context.

**R72.5 anchor:** Q5 (layout deferred to v1), audit A.3 (content inventory)

**Files touched:**

- `frontend/src/components/SessionSummary.tsx` (visual restyle + layout)

**Audit-verified current content (A.3):**

- Title: "Session Complete" (line 48) — NOT "Session Summary"
- 2-column grid with 7 metrics (lines 50-79):
  1. Total reactions
  2. Correct
  3. Incorrect
  4. Missed
  5. Accuracy
  6. Average RT (correct only)
  7. Best RT (correct only)
- Optional per-round breakdown block (lines 83-120) — renders when `totalRounds > 1` AND at least one round had activity
- Done button (line 127) — calls `onDismiss` → `dismissSummary` → returns to `idle`

### Layout Decision (resolved during v1 drafting per R72.5 Q5)

The deferred layout decision from R72.5. With Blocks 5 (PreSession config card) and 6 (Running + Rest top-bar) now specified, SessionSummary inherits design vocabulary already established:

**Proposed layout (hierarchical):**

```
                Session Complete                 ← title

           ┌─────────────────────────┐
           │       Accuracy          │           ← HERO metric (largest)
           │         88%             │             with success/warning/danger
           └─────────────────────────┘             color tint based on threshold

          ┌──────────┐  ┌──────────┐
          │  Avg RT  │  │ Best RT  │             ← SECONDARY metrics (medium)
          │  320ms   │  │  245ms   │
          └──────────┘  └──────────┘

       ┌────┐  ┌────┐  ┌────┐  ┌────┐
       │Total│ │Corr│ │Inc │ │Mis │            ← TALLY counts (small)
       │ 12  │ │ 11 │ │  1 │ │  0 │              with color indicators on numbers
       └────┘  └────┘  └────┘  └────┘            (green/amber/red)

       ── Per Round ──                           ← OPTIONAL when totalRounds>1
                                                   AND any round had activity

       Round 1: 4 correct, 1 incorrect, 0 missed
       Round 2: 4 correct, 0 incorrect, 0 missed
       Round 3: 3 correct, 0 incorrect, 0 missed

       ┌─────────────────────────────────┐
       │              Done                │     ← primary button, returns to idle
       └─────────────────────────────────┘
```

**Mobile layout:** Same hierarchy, stacks naturally. The 2-column Avg RT / Best RT becomes single-column on narrowest widths if needed (only if width < 360px).

**Color indicator semantics:**
- Accuracy hero: green (≥80%), amber (60-80%), red (<60%)
- Correct count: `text-rd-accent-success`
- Incorrect count: `text-rd-accent-warning`
- Missed count: `text-rd-accent-danger`
- Total: neutral primary
- Avg RT / Best RT: neutral primary

**Accuracy threshold values (subject to founder confirmation during v1 reviewer cycle):**
- ≥80%: success (green)
- 60-79%: warning (amber)
- <60%: danger (red)

**Acceptance criteria:**

1. Title preserved as "Session Complete" (NOT "Session Summary")
2. All 7 metrics rendered with hierarchy: Accuracy hero, Avg RT / Best RT secondary, Total / Correct / Incorrect / Missed tally
3. Color indicators on tally counts per semantics above
4. Accuracy hero color shifts by threshold (≥80 / 60-79 / <60)
5. Per-round breakdown block preserved (renders when `totalRounds > 1` AND any round had activity)
6. Per-round formatting: one line per round, compact
7. Done button preserved (label "Done", calls `onDismiss`)
8. Done button styled per token system (primary button, prominent)
9. All numerics use `tabular-nums` (verified per audit A.5 — already in code at SessionSummary.tsx:52-112)
10. Behavior unchanged: Done returns to idle (NOT restart session)
11. Step 12 invariants preserved (R63 lock 1 accuracy formula `correct / (correct + incorrect)`)
12. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Read current SessionSummary.tsx:**

```bash
cd frontend
cat src/components/SessionSummary.tsx
```

Note:
- Existing 2-column grid structure
- The 7 metrics and their data sources
- The per-round breakdown block rendering condition
- The Done button onClick handler
- Existing tabular-nums usage

**Critical pre-flight verification (per Round 2 ChatGPT P15):**

```bash
grep -n 'roundBreakdowns' src/components/SessionSummary.tsx
```

Verify the `roundBreakdowns` prop exists and check its shape. If the prop name differs (e.g., `perRoundStats`, `rounds`) or the data structure is different than expected, reconcile BEFORE implementing the new layout. The plan assumes a prop providing per-round counts; the actual name/shape must be verified live.

**Step 2 — Restructure to hierarchical layout (v2 amendments applied):**

**HIGH-relevance amendments from Round 2 DeepSeek:**

1. **Zero-classified state must be neutral, not "0%":** When `correct + incorrect === 0` (all misses or no responses), display `—  No classified responses` neutrally. Do NOT show `0%` in red. The accuracy formula divides by zero in this case — handle it in presentation, not in `computeStats`.
2. **Preserve no-value RT formatting:** Don't blindly render `${stats.averageRT}ms`. When no correct reactions, the existing live code may render `—`. Preserve that.
3. **Make the tally responsive:** Four columns containing "Incorrect" and "Missed" are cramped at 320-375px. Use `grid-cols-2 gap-2 sm:grid-cols-4`.
4. **Per-round rows must wrap predictably:** Use a small grid for `Round N` label + counts, not a single overflow-prone line.
5. **Thresholds ratified (per Round 2 DeepSeek):** Accuracy color bands are LOCKED at v2: `≥80%: success`, `60-79%: warning`, `<60%: danger`. No founder TBD remaining.

Skeleton (Claude Code adapts based on actual code structure):

```tsx
export function SessionSummary({ results, totalRounds, roundBreakdowns, onDismiss }) {
  const stats = computeStats(results);
  // Pre-flight check: are there any classified responses?
  const hasClassified = stats.correct + stats.incorrect > 0;
  const accuracyColor = hasClassified ? getAccuracyColor(stats.accuracy) : 'text-rd-text-muted';
  const showPerRound = totalRounds > 1 && roundBreakdowns.some(r => r.totalReactions > 0);

  return (
    <div className="min-h-dvh w-full bg-rd-bg-base text-rd-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Title */}
        <h1 className="text-xl font-semibold text-center">
          Session Complete
        </h1>

        {/* HERO: Accuracy — neutral if no classified responses */}
        <div className="text-center">
          <div className="text-rd-text-muted text-xs uppercase tracking-wider mb-2">
            Accuracy
          </div>
          {hasClassified ? (
            <div className={`text-5xl font-bold tabular-nums ${accuracyColor}`}>
              {stats.accuracy.toFixed(0)}%
            </div>
          ) : (
            <>
              <div className="text-5xl font-bold text-rd-text-muted">—</div>
              <div className="text-rd-text-muted text-xs mt-1">No classified responses</div>
            </>
          )}
        </div>

        {/* SECONDARY: Avg RT / Best RT — preserve existing no-value formatting */}
        <div className="grid grid-cols-2 gap-3">
          <SecondaryStat
            label="Avg RT"
            value={stats.averageRT != null ? `${stats.averageRT}ms` : '—'}
          />
          <SecondaryStat
            label="Best RT"
            value={stats.bestRT != null ? `${stats.bestRT}ms` : '—'}
          />
        </div>

        {/* TALLY: Total / Correct / Incorrect / Missed — responsive (2x2 mobile, 4-across desktop) */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TallyStat label="Total" value={stats.total} />
          <TallyStat label="Correct" value={stats.correct} colorClass="text-rd-accent-success" />
          <TallyStat label="Incorrect" value={stats.incorrect} colorClass="text-rd-accent-warning" />
          <TallyStat label="Missed" value={stats.missed} colorClass="text-rd-accent-danger" />
        </div>

        {/* PER-ROUND breakdown (optional) */}
        {showPerRound && (
          <PerRoundBreakdown breakdowns={roundBreakdowns} />
        )}

        {/* Done button */}
        <button
          type="button"
          onClick={onDismiss}
          className="
            w-full min-h-11 py-3 px-6
            bg-rd-text-primary text-rd-bg-base
            rounded-[var(--rd-radius-pill)]
            font-medium
            hover:opacity-90 active:opacity-80
            transition-opacity
          "
        >
          Done
        </button>

      </div>
    </div>
  );
}
```

Helper components:

```tsx
function SecondaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-rd-bg-surface/50 rounded-lg p-3 text-center">
      <div className="text-rd-text-muted text-xs uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums text-rd-text-primary">
        {value}
      </div>
    </div>
  );
}

function TallyStat({ label, value, colorClass }: { label: string; value: number; colorClass?: string }) {
  return (
    <div className="text-center">
      <div className="text-rd-text-muted text-[10px] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-base font-semibold tabular-nums ${colorClass ?? 'text-rd-text-primary'}`}>
        {value}
      </div>
    </div>
  );
}

function PerRoundBreakdown({ breakdowns }: { breakdowns: RoundBreakdown[] }) {
  return (
    <div className="bg-rd-bg-surface/50 rounded-lg p-4 flex flex-col gap-3">
      <div className="text-rd-text-muted text-xs uppercase tracking-wider">Per Round</div>
      {breakdowns.map((r, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr] gap-3 text-sm">
          <div className="text-rd-text-secondary font-medium">Round {i + 1}</div>
          <div className="text-rd-text-muted">
            <span className="text-rd-accent-success tabular-nums">{r.correct}</span> correct
            {' · '}
            <span className="text-rd-accent-warning tabular-nums">{r.incorrect}</span> incorrect
            {' · '}
            <span className="text-rd-accent-danger tabular-nums">{r.missed}</span> missed
          </div>
        </div>
      ))}
    </div>
  );
}

// Thresholds RATIFIED at v2 (no founder TBD):
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'text-rd-accent-success';
  if (accuracy >= 60) return 'text-rd-accent-warning';
  return 'text-rd-accent-danger';
}
```

**Per-round logic note:** The rendering condition `totalRounds > 1 AND roundBreakdowns.some(r => r.totalReactions > 0)` matches audit A.3. If the actual prop is named differently (verified in Step 1), adapt the property access while preserving the logic.

**Step 3 — Verify accuracy formula preserved (R63 lock 1):**

Per audit C.4: accuracy = correct / (correct + incorrect) × 100. This formula MUST NOT change. Inspect the computation:

```bash
git grep -nF 'computeStats' src/
```

Locate `computeStats` in `sessionStats.ts:34-42` (per audit C.4). DO NOT modify this file in Block 7 — it's already correct.

**Step 4 — Verify no behavior changes:**

```bash
npm run dev
# Complete a Quick Demo session (1 round)
# Verify Summary shows the new layout
# Verify Done button returns to PreSession on /
# Verify the per-round block does NOT appear (totalRounds=1)
# Complete a 3x3 Standard session (3 rounds)
# Verify Summary shows the per-round block
# Verify all 7 metrics are present and correct
```

**Step 5 — Verify color indicators across accuracy bands:**

```bash
# Trigger a high-accuracy session (≥80%) → Accuracy hero is green
# Trigger a mid-accuracy session (60-79%) → Accuracy hero is amber
# Trigger a low-accuracy session (<60%) → Accuracy hero is red
# (Use Custom preset with short round duration to make this easier to reproduce)
```

**Verification checklist:**

- [ ] Title is "Session Complete"
- [ ] Hierarchical layout: Accuracy hero, Avg/Best RT secondary, 4-count tally
- [ ] Per-round breakdown renders only when applicable
- [ ] Color indicators on tally counts (green/amber/red)
- [ ] Accuracy hero color shifts by threshold
- [ ] Done button preserved (label "Done", returns to idle)
- [ ] tabular-nums on all numerics
- [ ] Accuracy formula unchanged (computeStats in sessionStats.ts not touched)
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 7 complete.
Files changed: SessionSummary.tsx
Layout decision (deferred from R72.5 Q5): hierarchical (hero/secondary/tally)
Accuracy thresholds: ≥80 green, 60-79 amber, <60 red
Audit A.3 content: 7 metrics ✅, per-round block preserved ✅, "Done" button ✅, title "Session Complete" ✅
sessionStats.ts: NOT touched (R63 lock 1 invariant preserved)
Step 12 behavior: ✅ Done returns to idle (not restart)
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to PHASE GATE 2? Awaiting ratification.
```

**Commit:**

```bash
git add src/components/SessionSummary.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 7 — SessionSummary hierarchical layout

Restyles SessionSummary with a hierarchical layout: Accuracy as the
hero metric (large, color-shifted by threshold ≥80/60-79/<60), Avg RT
and Best RT as side-by-side secondary stats, and a 4-column tally row
for Total/Correct/Incorrect/Missed counts (with green/amber/red color
indicators on the counts themselves).

This resolves the deferred layout decision from R72.5 Q5. The decision
was deferred because R72 mistakenly claimed SessionSummary had 4
metrics; audit A.3 revealed 7 metrics plus an optional per-round
breakdown block. The hierarchical layout accommodates all 7 + breakdown
without forcing a uniform grid.

Content preserved per audit A.3:
- Title "Session Complete" (NOT "Session Summary")
- All 7 metrics (Total, Correct, Incorrect, Missed, Accuracy, Avg RT, Best RT)
- Optional per-round breakdown (when totalRounds > 1 AND any round had activity)
- Done button → onDismiss → returns to idle

sessionStats.ts is NOT modified — R63 lock 1 (accuracy = correct /
(correct + incorrect)) is preserved verbatim per audit C.4.

Anchor: R72.5 Q5 (layout deferred to v1) + audit A.3
EOF
)"
```

---

## PHASE GATE 2 — View Migration Complete

**Cumulative state after Blocks 5, 6, 7:**

- PreSession restyled as config card with all content preserved
- ModeButton restyled to use tokens
- Running and Rest views use unified TopBar pattern
- StopButton component consolidates the drift between RestView extracted and RunningView inline
- SessionSummary uses hierarchical layout with color indicators
- All Step 12 behavior preserved

**Gate criteria — ALL must pass before Phase 4 begins:**

1. Quick Demo session: PreSession config card → Start → Running with TopBar → Summary with hierarchical layout → Done returns to PreSession
2. 3x3 Standard session: same flow + Rest between rounds shows TopBar in flow layout + Summary shows per-round breakdown
3. Custom session with short round/rest durations: sliders work, custom values persist
4. Custom session with rest=0: skips rest view, jumps to next round (or summary)
5. Top-bar Stop ends session correctly (returns to PreSession if no results, Summary if any results — R58 invariant)
6. Round chip non-interactive in both Running and Rest (tapping doesn't trigger reaction)
7. Pull cue visible above TopBar (z-stack correct)
8. Color indicators on Summary tally counts visible and correct
9. Accuracy hero color shifts by threshold (verify with intentional misses)
10. iOS safe-area visible in standalone mode or via Safari Web Inspector simulation
11. All Step 12 invariants verified (R44A, R54, R58, R63 locks 1 & 2, R68, R71.5 P2 & P3)
12. Lint, tsc, build pass; zero TEMP DEV LOG markers

**Stop-and-report after gate:**

```
PHASE GATE 2: [✅ PASSED / ❌ FAILED]
Failures: [list any]
Ready to proceed to Phase 4 (Additional routes)? Awaiting ratification.
```

---

## Phase 4 — Additional Routes (2 blocks)

### Block 8 — Settings Page

**Purpose:** Replace the Settings placeholder (from Block 2) with the real Settings page content: Reset preferences (functional) + version display. NO theme toggle, sound, vibration, accessibility (per Q6 lean). Apply reset semantics per DeepSeek P9.

**R72.5 anchor:** Q6, DeepSeek P9 (reset semantics)

**Files touched:**

- `frontend/src/views/SettingsView.tsx` (replace placeholder with real content)
- `frontend/src/hooks/usePreferencesPersistence.ts` (verify resetPreferences action exists; add if not)
- `frontend/src/hooks/useSessionState.ts` (verify reducer handles resetPreferences action; add if not)
- `frontend/vite.config.ts` (add commit SHA injection via `define`)

**Acceptance criteria:**

1. Settings page renders inside AppShell (uses sidebar nav)
2. Reset preferences button performs:
   - `localStorage.removeItem(PREFS_STORAGE_KEY)` (NOT `localStorage.clear()`)
   - Dispatch `{ type: 'resetPreferences' }` to session reducer
   - Cancel pending persistence timers (Effect 2 debounce)
   - Show small success confirmation (non-modal, e.g., inline text)
3. After reset: visual mode = 'visual', preset = 'quick-demo', config = canonical Quick Demo config
4. Reset is UNAVAILABLE mid-session (Settings nav hidden during running/rest per A1)
5. Version display shows `v0.13.0` + commit SHA
6. Commit SHA injected at build time via Vite `define`
7. NO theme toggle, NO sound/vibration toggles, NO accessibility controls, NO future-feature stubs

**Execution steps:**

**Step 1 — Read current files (Rule 1):**

```bash
cd frontend
cat src/views/SettingsView.tsx
cat src/hooks/useSessionState.ts
cat src/hooks/usePreferencesPersistence.ts
cat vite.config.ts
```

Verify whether `resetPreferences` action already exists in the reducer.

**Step 2 — Add commit SHA injection to vite.config.ts:**

```ts
// In vite.config.ts
import { execSync } from 'node:child_process';

const commitSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

export default defineConfig({
  // ... existing config ...
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __APP_VERSION__: JSON.stringify('0.13.0'),
  },
});
```

Add type declarations in `src/vite-env.d.ts` (or wherever Vite types live):

```ts
declare const __COMMIT_SHA__: string;
declare const __APP_VERSION__: string;
```

**Step 3 — Add resetPreferences action to reducer + suppressed-persistence pattern (per Round 2 DeepSeek P0):**

**HIGH severity correction:** The previous spec had reset orchestration scattered across `SettingsView` (removes storage), `App` (dispatches state), and `usePreferencesPersistence` (cancels timers). This is internally contradictory — dispatching `resetPreferences` triggers Effect 1 (immediate save on mode/preset change), which writes the defaults right back to localStorage. The manual test expects the key to remain absent after reset, but the implementation has no suppression mechanism.

**Resolution: one-operation reset owned by `usePreferencesPersistence`.** Add a suppression flag that prevents the next persistence write, then dispatch reset:

In `useSessionState.ts` (add reset action to reducer):

```ts
// Add to action union:
type SessionAction =
  | { type: 'start' }
  | { type: 'stop' }
  // ... existing actions ...
  | { type: 'resetPreferences' };

// Add to reducer:
case 'resetPreferences':
  return buildInitialState();  // re-runs lazy initializer → reads localStorage (which is now empty) → uses defaults
```

In `usePreferencesPersistence.ts`, add suppression flag + `resetPreferences` controller:

```ts
import { useRef, useCallback } from 'react';
import { PREFS_STORAGE_KEY } from '../lib/preferencesStorage';

export function usePreferencesPersistence({ state, dispatch }) {
  const debounceTimerRef = useRef<number | null>(null);
  const suppressNextPersistenceRef = useRef(false);  // NEW per Round 2 DeepSeek P0

  const cancelPending = useCallback(() => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // NEW: single reset controller
  const resetPreferences = useCallback(() => {
    cancelPending();
    suppressNextPersistenceRef.current = true;
    localStorage.removeItem(PREFS_STORAGE_KEY);
    dispatch({ type: 'resetPreferences' });
  }, [cancelPending, dispatch]);

  // Effect 1 (immediate save on mode/preset): check suppression flag
  useEffect(() => {
    if (suppressNextPersistenceRef.current) {
      suppressNextPersistenceRef.current = false;
      return;  // skip this write; next user change persists normally
    }
    savePreferences({ ... });
  }, [state.mode, state.selectedPresetId]);

  // Effect 2 (debounced save on config change): same suppression check
  useEffect(() => {
    if (suppressNextPersistenceRef.current) {
      suppressNextPersistenceRef.current = false;
      return;
    }
    cancelPending();
    debounceTimerRef.current = setTimeout(() => {
      savePreferences({ ... });
    }, 300);
    return () => cancelPending();
  }, [state.config]);

  // Effects 3 & 4 (transition saves) are unchanged — they fire on session-state transitions,
  // not on mode/preset/config changes, so they don't observe the reset event.

  return {
    cancelPending,
    resetPreferences,  // NEW: SettingsView consumes this
  };
}
```

**Why the flag works:**

1. `resetPreferences()` is called from SettingsView
2. Cancel pending Effect 2 debounce (so a queued write doesn't fire during reset)
3. Set `suppressNextPersistenceRef.current = true`
4. Remove the storage key
5. Dispatch `resetPreferences` action → state changes to defaults
6. Effect 1 (mode/preset) fires due to state change → sees flag → consumes flag, returns without saving
7. Effect 2 (config) also fires due to state change → sees flag → consumes flag, returns without saving
8. **localStorage stays empty until the next genuine user edit**
9. A subsequent user-initiated mode/preset/config change persists normally (flag is now false)

This makes "Reset preferences" a single owned operation with predictable semantics.

**Step 4 — Implement SettingsView consuming the controller:**

`frontend/src/views/SettingsView.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';

interface SettingsViewProps {
  onReset: () => void;  // Wired by App to preferencesPersistence.resetPreferences
}

export function SettingsView({ onReset }: SettingsViewProps) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const confirmationTimerRef = useRef<number | null>(null);

  // Clean up the timer on unmount per Round 2 DeepSeek
  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current != null) {
        clearTimeout(confirmationTimerRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    onReset();  // delegates to the single owner (usePreferencesPersistence.resetPreferences)
    setConfirmation('Preferences reset.');
    if (confirmationTimerRef.current != null) {
      clearTimeout(confirmationTimerRef.current);
    }
    confirmationTimerRef.current = window.setTimeout(() => {
      setConfirmation(null);
      confirmationTimerRef.current = null;
    }, 3000);
  };

  return (
    <div className="min-h-dvh bg-rd-bg-base text-rd-text-primary p-6 sm:p-8">
      <div
        className="max-w-md mx-auto flex flex-col gap-8"
        style={{
          // Mobile: reserve space for the fixed hamburger button at top-left (per Round 1 DeepSeek)
          paddingTop: `calc(3rem + var(--safe-top))`,
        }}
      >
        <h1 className="text-2xl font-semibold">Settings</h1>

        {/* Reset preferences */}
        <section>
          <h2 className="text-rd-text-secondary text-sm font-medium mb-2">
            Preferences
          </h2>
          <p className="text-rd-text-muted text-sm mb-3">
            Reset to defaults (Visual mode, Quick Demo preset).
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="
              min-h-11 px-4 py-2
              bg-rd-bg-elevated
              text-rd-text-primary
              rounded-lg
              border border-rd-border-subtle
              hover:bg-rd-bg-surface
              transition-colors
            "
          >
            Reset preferences
          </button>
          {confirmation && (
            <p role="status" className="text-rd-accent-success text-sm mt-2">
              {confirmation}
            </p>
          )}
        </section>

        {/* Version display */}
        <section>
          <h2 className="text-rd-text-secondary text-sm font-medium mb-2">
            About
          </h2>
          <p className="text-rd-text-muted text-sm tabular-nums">
            v{__APP_VERSION__} ({__COMMIT_SHA__})
          </p>
        </section>
      </div>
    </div>
  );
}
```

Note: `paddingTop: calc(3rem + var(--safe-top))` on mobile reserves space for the fixed hamburger button (per Round 1 DeepSeek P2 — "Reserve space for the mobile hamburger"). Desktop layouts don't need this because the sidebar replaces the hamburger.

**Step 5 — Wire SettingsView in App.tsx:**

```tsx
// In App.tsx AppContent:
// (preferencesPersistence is the return value of usePreferencesPersistence hook)
<Route path="/settings">
  <SettingsView onReset={preferencesPersistence.resetPreferences} />
</Route>
```

The reset wiring is now a single function passed from `App` to `SettingsView`. All semantics live inside `usePreferencesPersistence.resetPreferences`.

**Step 6 — Version ownership (per Round 2 DeepSeek):**

The `__APP_VERSION__` define in `vite.config.ts` reads from `package.json`, not a hardcoded string. Block 18 runs `npm version 0.13.0 --no-git-tag-version` to update `package.json` before tagging. In the meantime (Blocks 8-17), `__APP_VERSION__` reflects whatever version is in `package.json` — for early Step 13 execution, that may still be the Step 12 version. That's fine; the version updates once at Block 18.

Update `vite.config.ts` to read from package.json:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  // ... existing config ...
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
```

Sidebar, Settings, and About all read `__APP_VERSION__` — single source of truth (per Execution Decisions Record `APP_VERSION_SOURCE: package.json`).

**Step 7 — Manual test reset flow:**

```bash
npm run dev
# In browser:
# 1. Navigate to PreSession, change mode to Audio, change preset to 3x3 Standard
# 2. Confirm via DevTools that PREFS_STORAGE_KEY in localStorage reflects mode=audio, selectedPresetId=3x3-standard
# 3. Navigate to Settings
# 4. Click "Reset preferences"
# 5. Verify: success confirmation appears
# 6. Verify: PREFS_STORAGE_KEY removed from localStorage
# 7. Navigate back to PreSession
# 8. Verify: mode is now Visual, preset is now Quick Demo, config is canonical Quick Demo
# 9. Verify: after reset, persistence resumes (changing mode triggers new write)
```

**Step 8 — Verify Settings unavailable during session:**

```bash
# Start a session
# Try to navigate to /settings via URL bar
# Verify: session surface continues to render (per A1 precedence)
# Stop session
# Verify: navigation to /settings now works
```

**Step 9 — Verify version display:**

```bash
# Build a production bundle
npm run build
# Check that __COMMIT_SHA__ was injected:
grep -r '__COMMIT_SHA__' dist/  # Must return zero (it's replaced at build time)
# Open the built version display in browser; verify a real commit SHA appears
```

**Verification checklist:**

- [ ] Vite config injects `__COMMIT_SHA__` and `__APP_VERSION__`
- [ ] `resetPreferences` action exists in reducer (added or verified)
- [ ] `cancelPending` available from `usePreferencesPersistence`
- [ ] SettingsView calls `localStorage.removeItem` (NOT `localStorage.clear`)
- [ ] SettingsView dispatches reset + cancels pending timers via onReset
- [ ] Success confirmation appears and auto-clears after 3s
- [ ] After reset, defaults restored (mode=visual, preset=quick-demo)
- [ ] Settings nav unavailable during session (per A1)
- [ ] Version + commit SHA displayed
- [ ] No theme/sound/vibration/a11y controls rendered
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 8 complete.
Files changed: SettingsView.tsx, useSessionState.ts (reducer action), usePreferencesPersistence.ts (cancelPending), App.tsx (wiring), vite.config.ts (define), vite-env.d.ts (types)
Reset semantics: ✅ localStorage.removeItem + dispatch + cancelPending
Version display: ✅ v__APP_VERSION__ + __COMMIT_SHA__ (build-time injected)
Exclusion list honored: no theme/sound/vibration/a11y controls
Verification: lint ✅, tsc ✅, build ✅, reset flow manual test ✅
Ready to proceed to Block 9? Awaiting ratification.
```

**Commit:**

```bash
git add src/views/SettingsView.tsx src/hooks/useSessionState.ts src/hooks/usePreferencesPersistence.ts src/App.tsx src/vite-env.d.ts vite.config.ts
git commit -m "$(cat <<'EOF'
Step 13 Block 8 — Settings page (Reset + version display)

Replaces the Block 2 placeholder with the real Settings page. Two
sections: Reset preferences (functional) and version display.

Reset semantics per DeepSeek P9:
- localStorage.removeItem(PREFS_STORAGE_KEY) — not localStorage.clear()
- dispatch({ type: 'resetPreferences' }) — restores canonical Quick Demo
- cancelPending() — cancels Effect 2 debounce timer
- Inline success confirmation, auto-clears after 3s

Version display reads __APP_VERSION__ + __COMMIT_SHA__ injected via Vite
define at build time. Falls back to 'dev' if git rev-parse fails.

Settings nav remains unavailable during running/rest per A1 precedence
(the route is rendered behind the session surface, never reached during
an active session).

Per Q6: no theme toggle, no sound/vibration toggles, no accessibility
controls, no future-feature stubs.

Anchor: R72.5 Q6 + DeepSeek P9
EOF
)"
```

---

### Block 9 — About Page

**Purpose:** Replace the About placeholder (from Block 2) with real content: brief description + how-to + version + repo link. NO founder bio. NO marketing copy. Lean per Q7.

**R72.5 anchor:** Q7

**Files touched:**

- `frontend/src/views/AboutView.tsx` (replace placeholder)

**Acceptance criteria:**

1. Brief description (1-2 sentences explaining what the tool does)
2. How-to section (2-3 sentences covering modes, presets, controls including edge taps + arrow keys)
3. Version + commit SHA (consistent with Settings page display)
4. Repo link to GitHub
5. NO founder bio
6. NO brand story / marketing copy

**Execution steps:**

**Step 1 — Implement AboutView:**

`frontend/src/views/AboutView.tsx`:
```tsx
export function AboutView() {
  return (
    <div className="min-h-dvh bg-rd-bg-base text-rd-text-primary p-6 sm:p-8">
      <div
        className="max-w-md mx-auto flex flex-col gap-6"
        style={{
          // Mobile: reserve space for the fixed hamburger button at top-left (per Round 1 DeepSeek)
          paddingTop: `calc(3rem + var(--safe-top))`,
        }}
      >
        <h1 className="text-2xl font-semibold">About</h1>

        <section>
          <p className="text-rd-text-secondary">
            Reaction Defense Training is a tool for training visual reaction
            time in boxing defense. The URL is the product — no accounts, no
            history, no engagement loops.
          </p>
        </section>

        <section>
          <h2 className="text-rd-text-secondary text-sm font-medium mb-2">
            How it works
          </h2>
          <ul className="text-rd-text-muted text-sm flex flex-col gap-2">
            <li>
              <strong className="text-rd-text-secondary">Modes:</strong> Visual
              (cues appear at screen edges), Audio (cues are spoken), Combined
              (both).
            </li>
            <li>
              <strong className="text-rd-text-secondary">Presets:</strong> Quick
              Demo for a fast sample, 3×3 Standard for a structured workout, or
              Custom to set your own round duration / rest / number of rounds.
            </li>
            <li>
              <strong className="text-rd-text-secondary">Controls:</strong> Tap
              the matching edge of the screen (left / right / top / bottom). On
              desktop, use arrow keys.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-rd-text-secondary text-sm font-medium mb-2">
            Source
          </h2>
          <a
            href="https://github.com/ColtWarren/visual-reaction-boxing-application"
            target="_blank"
            rel="noopener noreferrer"
            className="
              text-rd-text-primary underline hover:no-underline
              focus-visible:outline focus-visible:outline-2
              focus-visible:outline-offset-2
              focus-visible:outline-rd-text-primary
              rounded
            "
          >
            github.com/ColtWarren/visual-reaction-boxing-application
          </a>
          <p className="text-rd-text-muted text-sm mt-2 tabular-nums">
            v{__APP_VERSION__} ({__COMMIT_SHA__})
          </p>
        </section>
      </div>
    </div>
  );
}
```

**Notes:**
- `paddingTop: calc(3rem + var(--safe-top))` reserves space for the fixed hamburger on mobile (per Round 1 DeepSeek P2)
- `focus-visible:outline` on the repo link provides a visible keyboard focus state (per Round 2 DeepSeek)
- Version + commit SHA match Settings page (single source per `APP_VERSION_SOURCE: package.json`)

**Step 2 — Manual verification:**

```bash
npm run dev
# Navigate to /about
# Verify description, how-to, source link, version
# Click the repo link → opens GitHub in new tab
# Verify version + commit SHA matches Settings page
```

**Verification checklist:**

- [ ] Description present (1-2 sentences)
- [ ] How-to section explains modes, presets, controls
- [ ] Controls description includes edge taps AND arrow keys
- [ ] Repo link present and opens in new tab
- [ ] Version + commit SHA match Settings page display
- [ ] No founder bio
- [ ] No marketing copy
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 9 complete.
Files changed: AboutView.tsx
Content scope per Q7: ✅ description + how-to + version + repo (no founder bio)
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 10? Awaiting ratification.
```

**Commit:**

```bash
git add src/views/AboutView.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 9 — About page

Replaces the Block 2 placeholder with the real About page. Lean per Q7:
brief description, how-to (modes / presets / controls including edge
taps and arrow keys), version + commit SHA, and a link to the GitHub
repo. No founder bio, no marketing copy.

The how-to language explicitly mentions arrow keys for desktop users
(Q7 amendment from ChatGPT P7) — this is the primary support-question
reduction goal: users who don't realize they can use keyboard.

Anchor: R72.5 Q7
EOF
)"
```

---

## Phase 5 — Cleanups (2 blocks)

### Block 10 — Palette Migration (gray-* → zinc-*)

**Purpose:** Mechanical sweep across `frontend/src/` to migrate all remaining `gray-*` Tailwind classes to `zinc-*` equivalents. Verified scope per audit A.4: 3 files containing 7 occurrences total. Bulk commit with diff review.

**R72.5 anchor:** R8 (palette migration scope corrected per audit A.4)

**Files touched (audit-verified):**

- `frontend/src/components/PreSessionScreen.tsx` (×5 — may already be reduced by Block 5)
- `frontend/src/components/ModeButton.tsx` (×1 — already replaced in Block 5 with token)
- `frontend/src/components/RunningView.tsx` (×1 — line 67, audio-mode placeholder)

**Note:** Blocks 5 and 6 may have already addressed some of these. Block 10 catches anything that wasn't migrated during the view migration blocks.

**Acceptance criteria:**

1. Zero `gray-*` matches in `frontend/src/` after Block 10
2. All replaced classes use equivalent `zinc-*` shade (`gray-400` → `zinc-400`, `gray-800` → `zinc-800`, etc.)
3. Visual appearance unchanged (zinc and gray are visually similar; this is for consistency, not visual change)
4. No behavior changes
5. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Verify pre-state:**

```bash
cd frontend
git grep -nE '\bgray-[0-9]' src/
```

Capture the current set of matches. If Blocks 5 and 6 already addressed some, the list will be shorter than audit A.4's 7. That's fine.

**Step 2 — Run the mechanical sed (command hardening per Round 2 DeepSeek):**

The previous `git grep -lE ... | xargs sed ...` pipeline can behave poorly when prior blocks have already removed every match. Use a guarded loop:

```bash
cd frontend

# Collect files (or empty if no matches)
files=$(git grep -lE '\bgray-[0-9]' src/ || true)

if [ -n "$files" ]; then
  while IFS= read -r file; do
    # macOS sed syntax (Step 12 lesson — Mac requires '' after -i)
    sed -i '' 's/gray-\([0-9]\)/zinc-\1/g' "$file"
  done <<< "$files"
  echo "Migrated:"
  echo "$files"
else
  echo "No gray-* matches found — likely already migrated by Blocks 5/6."
fi
```

If running on Linux (CI environment), adjust to:
```bash
sed -i 's/gray-\([0-9]\)/zinc-\1/g' "$file"
```

**Step 3 — Verify post-state:**

```bash
cd frontend
git grep -nE '\bgray-[0-9]' src/
```

Must return ZERO matches.

```bash
git diff --stat
```

Review the diff. Should show only `gray-*` → `zinc-*` substitutions, no other changes.

**Step 4 — Visual smoke test:**

```bash
npm run dev
# Open every screen:
# - PreSession (config card from Block 5)
# - Running (top-bar from Block 6)
# - Rest (top-bar from Block 6)
# - Summary (hierarchical from Block 7)
# - Settings (from Block 8)
# - About (from Block 9)
# Verify visual consistency — no glaring differences from pre-Block-10 state
```

**Step 5 — Build verification:**

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

**Verification checklist:**

- [ ] Pre-state list of `gray-*` matches captured
- [ ] Sed run cleanly (no errors)
- [ ] Post-state: zero `gray-*` matches in `src/`
- [ ] Diff shows only substitutions (no accidental other changes)
- [ ] Visual smoke test: all screens render correctly
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 10 complete.
Files changed: [list from git diff --stat]
gray-* matches before: [N]
gray-* matches after: 0
Visual smoke: ✅ all screens unchanged
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 11? Awaiting ratification.
```

**Commit:**

```bash
# Stage only the verified migrated files (NOT git add -A, per Round 2 DeepSeek)
# The $files variable from Step 2 holds the migrated paths
if [ -n "$files" ]; then
  echo "$files" | xargs git add
fi

git commit -m "$(cat <<'EOF'
Step 13 Block 10 — palette migration (gray-* → zinc-*)

Mechanical sed sweep across frontend/src/. Per Claude Code audit A.4
at HEAD 2c4e5bf, the gray-* scope was 3 files (PreSessionScreen ×5,
ModeButton ×1, RunningView ×1). After Blocks 5 and 6 absorbed some
of these during view migration, this block catches the remainder.

Verification: `git grep -nE '\bgray-[0-9]' src/` returns zero matches.

zinc and gray are visually near-identical in Tailwind — this is a
consistency migration, not a visual change. The product now uses a
single palette family throughout.

Anchor: R72.5 R8 + audit A.4
EOF
)"
```

---

### Block 11 — useInputHandler Shim Removal

**Purpose:** Delete the `useInputHandler.ts` shim file (verified safe by audit A.6 — zero live importers). Clean up stale comment references in `useReactionInput.ts` and `types/reaction.ts`.

**R72.5 anchor:** R9 (shim removal timing per ChatGPT P16)

**Files touched:**

- `frontend/src/hooks/useInputHandler.ts` (DELETE)
- `frontend/src/hooks/useReactionInput.ts` (comment cleanup at lines 4, 5, 13)
- `frontend/src/types/reaction.ts` (comment cleanup at line 7)

**Audit-verified safety (A.6):**

- File contents: 6 lines (5 comment + 1 re-export)
- `git grep -F useInputHandler` finds only the file itself + 4 comment references (no live imports)
- App.tsx already uses `useReactionInput` directly

**Acceptance criteria:**

1. `useInputHandler.ts` deleted via `git rm`
2. Comments referencing `useInputHandler` in `useReactionInput.ts:4,5,13` removed or updated
3. Comment in `types/reaction.ts:7` removed or updated
4. `git grep -F useInputHandler frontend/` returns zero matches after Block 11
5. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Verify zero live importers (re-verification, expanded scope per Round 2 DeepSeek):**

```bash
cd frontend
# Expand grep scope to ALL of frontend/, not just src/
# Catches tests, config, generated declarations, docs
git grep -nF 'useInputHandler' -- frontend/ 2>/dev/null || git grep -nF 'useInputHandler'
```

Expected matches (per audit A.6, should match):
- `src/hooks/useInputHandler.ts:` (the file itself)
- `src/hooks/useReactionInput.ts:4`
- `src/hooks/useReactionInput.ts:5`
- `src/hooks/useReactionInput.ts:13`
- `src/types/reaction.ts:7`

If ANY OTHER MATCH appears (e.g., an actual `import` statement, a test file reference), STOP. Block 11 cannot proceed safely until those imports are migrated. Report and consult founder.

**Step 2 — Delete the shim file:**

```bash
git rm src/hooks/useInputHandler.ts
```

**Step 3 — Read and update comment references:**

For each of the comment references found in Step 1, read the surrounding context and either:
- Remove the comment if it's purely historical ("kept for backward compat")
- Update the comment if it provides useful info ("originally called useInputHandler; renamed to useReactionInput in Step X for clarity")

Example update to `useReactionInput.ts` (Claude Code reads actual current state per Rule 1):

```ts
// Lines 4-5 (before)
// This hook was previously named useInputHandler. The shim at
// hooks/useInputHandler.ts re-exports this as useInputHandler for
// any callers that haven't been migrated yet.

// Lines 4-5 (after)
// This hook handles both keyboard and touch reaction input through a
// single shared classifier with one R54 lock (see classifyDefenseInput).
```

Apply similar cleanup to line 13 in `useReactionInput.ts` and line 7 in `types/reaction.ts`.

**Step 4 — Verify zero matches AND file gone:**

```bash
cd frontend
# Symbol search across all of frontend/
git grep -nF 'useInputHandler' -- frontend/ 2>/dev/null || git grep -nF 'useInputHandler'

# File-existence check
test ! -e frontend/src/hooks/useInputHandler.ts && echo "✅ File deleted" || echo "❌ File still exists"
```

The grep must return zero matches. The file-existence check must report `✅`.

**Step 5 — Build verification:**

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

If any of these fail, restore the deleted file (`git restore --staged --worktree src/hooks/useInputHandler.ts`) and investigate.

**Verification checklist:**

- [ ] Pre-deletion: zero live importers verified
- [ ] `useInputHandler.ts` deleted
- [ ] Comment references in `useReactionInput.ts` cleaned up
- [ ] Comment reference in `types/reaction.ts` cleaned up
- [ ] Post-cleanup: `git grep -F 'useInputHandler' src/` returns zero matches
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 11 complete.
Files changed: useInputHandler.ts (deleted), useReactionInput.ts (comment cleanup), types/reaction.ts (comment cleanup)
useInputHandler references after Block 11: 0
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to PHASE GATE 3? Awaiting ratification.
```

**Commit:**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Step 13 Block 11 — useInputHandler shim removal

Deletes hooks/useInputHandler.ts, a 6-line re-export shim that existed
to bridge a rename between earlier steps. Per Claude Code audit A.6 at
HEAD 2c4e5bf, the shim had zero live importers (only comment references
in useReactionInput.ts and types/reaction.ts).

Also cleans up the stale comment references at useReactionInput.ts:4,5,13
and types/reaction.ts:7 (Codex Finding 8).

After this block, `git grep -F 'useInputHandler' src/` returns zero
matches. The hook is consistently named useReactionInput throughout.

Anchor: R72.5 R9 (ChatGPT P16) + audit A.6 + Codex Finding 8
EOF
)"
```

---

## PHASE GATE 3 — Visual Identity Complete

**Cumulative state after Blocks 0-11:**

- Visual identity migration complete across all views
- Codebase consistent: zero `gray-*`, zero `useInputHandler` references
- App shell with desktop sidebar + mobile drawer
- Settings + About routes with real content
- Reset preferences fully owned by `usePreferencesPersistence.resetPreferences` with suppression flag
- All Step 12 behavior preserved
- Tokens consumed throughout

**Gate criteria — ALL must pass before Phase 6 (PWA) begins:**

1. Every screen (PreSession / Running / Rest / Summary / Settings / About) renders cleanly on desktop ≥ 768px AND mobile < 768px
2. Sidebar visible on desktop, hamburger + drawer on mobile
3. Drawer interactions: open, close (route tap / backdrop / Escape), focus management
4. **Reset preferences — true deletion semantics (per Round 2 DeepSeek P0 amendment):**
   - Only `PREFS_STORAGE_KEY` is removed; unrelated origin storage remains untouched (NOT `localStorage.clear()`)
   - After reset, the key remains ABSENT in localStorage (suppression flag prevented immediate rewrite)
   - The first subsequent user preference change recreates the key with the new value
   - In-memory state reflects canonical defaults (Visual mode, Quick Demo preset)
5. Settings and About use identical version and commit SHA values (single source per `APP_VERSION_SOURCE: package.json`)
6. Mobile headings (Settings, About) remain clear of the hamburger button (3rem + safe-area-top inset)
7. Full session flows: Quick Demo (1 round, no rest, no per-round block), 3x3 Standard (3 rounds, rest between, per-round block in Summary), Custom (configurable, including rest=0 flash)
8. All Step 12 invariants: R44A, R54, R58, R63 locks 1 & 2, R68, R71.5 P2 & P3
9. Lint, tsc, build pass
10. `git grep -F 'gray-' src/` returns zero
11. `git grep -F 'useInputHandler' src/` returns zero
12. `git grep -F 'TEMP DEV LOG' src/` returns zero
13. `git grep -F 'STOP_BUTTON_CLASS' src/` returns zero (consolidated into StopButton component)

**Stop-and-report after gate:**

```
PHASE GATE 3: [✅ PASSED / ❌ FAILED]
Failures: [list any]
Ready to proceed to Phase 6 (PWA infrastructure)? Awaiting ratification.
```

---

## Phase 6 — PWA Infrastructure (4 blocks)

### Block 12 — Manifest + Icons

**Purpose:** Add web app manifest and the icon set required for installation across Chromium, iOS, and other platforms. Founder generates the "RD" white-bold-on-black icon set; this block wires it up.

**HIGH severity amendment (per Round 2 DeepSeek P0):** All paths in the manifest must use the `DEPLOY_BASE` from the Execution Decisions Record. Hardcoding `/` works for root deployments but breaks subpath deployments (e.g., GitHub Pages at `/<repo-name>/`).

**R72.5 anchor:** A4 (PWA infrastructure), DeepSeek P8 (manifest contract)

**Files touched:**

- `frontend/public/manifest.webmanifest` (new)
- `frontend/public/icons/` (new directory with 5 PNGs — see icon set below)
- `frontend/index.html` (link to manifest + apple-touch-icon)

**Icon set (UPDATED per Round 2 DeepSeek — 5 icons not 4):**

- `icon-192.png` (192×192, standard, `purpose: any`)
- `icon-512.png` (512×512, standard, `purpose: any`)
- `icon-maskable-192.png` (192×192, maskable variant)
- `icon-maskable-512.png` (512×512, maskable variant) — **NEW per Round 2 DeepSeek**
- `apple-touch-icon.png` (180×180, iOS home screen)

**Acceptance criteria:**

1. `manifest.webmanifest` contains the simplified manifest per DeepSeek P8
2. All paths in manifest use `${DEPLOY_BASE}` (Vite resolves at build time; for `/` deploys these are unchanged, for subpath deploys they prefix correctly)
3. Icon set generated and placed in `public/icons/` (5 PNGs above)
4. `index.html` links to manifest and apple-touch-icon
5. `theme_color` and `background_color` are `#09090b` (zinc-950, matches `--rd-bg-base`)
6. **Application panel verification (per Round 2 DeepSeek — Lighthouse PWA category is deprecated):**
   - DevTools → Application → Manifest shows no errors
   - 192px and 512px install icons load correctly
   - Maskable icon preview keeps essential artwork within the safe area
   - `beforeinstallprompt` fires on a supported Chromium environment
   - Installation succeeds from a production-origin build
7. Build succeeds; manifest is served from `${DEPLOY_BASE}manifest.webmanifest`

**Execution steps:**

**Step 1 — Generate icons (5 PNGs):**

Founder provides a 1024×1024 source PNG with "RD" centered in white bold sans-serif on `#09090b` background. Then generate the required sizes:

```bash
cd frontend
mkdir -p public/icons

# Option A: Use ImageMagick (if `convert` is installed):
if command -v convert >/dev/null 2>&1; then
  # Standard sizes
  convert public/icons/source.png -resize 192x192 public/icons/icon-192.png
  convert public/icons/source.png -resize 512x512 public/icons/icon-512.png
  convert public/icons/source.png -resize 180x180 public/icons/apple-touch-icon.png

  # Maskable (with safe-area padding for adaptive icon mask)
  convert public/icons/source.png -resize 154x154 -background '#09090b' \
    -gravity center -extent 192x192 public/icons/icon-maskable-192.png
  convert public/icons/source.png -resize 410x410 -background '#09090b' \
    -gravity center -extent 512x512 public/icons/icon-maskable-512.png
else
  echo "ImageMagick (convert) not available."
  echo "Founder must provide icons manually:"
  echo "  - icon-192.png (192x192)"
  echo "  - icon-512.png (512x512)"
  echo "  - icon-maskable-192.png (192x192, with safe-area padding)"
  echo "  - icon-maskable-512.png (512x512, with safe-area padding)"
  echo "  - apple-touch-icon.png (180x180)"
  echo "Recommended generator: https://maskable.app (for maskable variants)"
fi
```

**Step 2 — Create manifest.webmanifest with DEPLOY_BASE parameterization:**

The manifest itself is a static JSON file. Vite serves files from `public/` at the build-configured base path. For `DEPLOY_BASE = /`, the paths below work as-is. For subpath deploys (e.g., `DEPLOY_BASE = /visual-reaction-boxing-application/`), the paths must be prefixed.

**Approach 1 (preferred — separate manifest files per deploy):**

If `DEPLOY_BASE = /` (recorded in EDR):

`frontend/public/manifest.webmanifest`:
```json
{
  "id": "/",
  "name": "Reaction Defense Training",
  "short_name": "Reaction Defense",
  "description": "Visual reaction time training for boxing defense.",
  "start_url": "/",
  "scope": "/",
  "display_override": ["fullscreen"],
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#09090b",
  "background_color": "#09090b",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

If `DEPLOY_BASE = /<subpath>/` (e.g., GitHub Pages), all `src`, `id`, `start_url`, `scope` values must be prefixed with `<subpath>/`:

```json
{
  "id": "/visual-reaction-boxing-application/",
  "start_url": "/visual-reaction-boxing-application/",
  "scope": "/visual-reaction-boxing-application/",
  "icons": [
    { "src": "/visual-reaction-boxing-application/icons/icon-192.png", ... }
    // etc
  ]
  // ... rest unchanged
}
```

**Approach 2 (alternative — generate manifest from template):**

If managing two manifests is cumbersome, write a small `scripts/build-manifest.mjs` that reads a template + injects `DEPLOY_BASE` at build time:

```js
// scripts/build-manifest.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const DEPLOY_BASE = process.env.DEPLOY_BASE || '/';
const template = JSON.parse(readFileSync('./manifest.template.json', 'utf-8'));

function prefix(path) {
  if (path.startsWith('/')) {
    return DEPLOY_BASE.replace(/\/$/, '') + path;
  }
  return path;
}

template.id = DEPLOY_BASE;
template.start_url = DEPLOY_BASE;
template.scope = DEPLOY_BASE;
template.icons = template.icons.map(icon => ({ ...icon, src: prefix(icon.src) }));

writeFileSync('./public/manifest.webmanifest', JSON.stringify(template, null, 2));
```

Choose Approach 1 (simpler) unless `DEPLOY_BASE` changes frequently.

**Step 3 — Update index.html:**

```html
<!-- In frontend/index.html, inside <head>: -->
<!-- Note: paths are Vite-base-relative; Vite resolves them via the `base` config -->
<link rel="manifest" href="manifest.webmanifest" />
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />
<meta name="theme-color" content="#09090b" />
```

Vite's `base` config (set in vite.config.ts to match `DEPLOY_BASE`) ensures these relative paths resolve correctly in production.

**Step 4 — Build and verify:**

```bash
cd frontend
npm run build
ls -la dist/manifest.webmanifest dist/icons/
# All four icon files + manifest must be present in dist/
```

**Step 5 — Manifest validation in browser (per Round 2 DeepSeek — Application panel, not Lighthouse PWA):**

```bash
npm run preview  # Serves the production build locally
# Open browser to localhost preview URL
# Open DevTools → Application → Manifest:
#   - Verify: identity (name, short_name, description)
#   - Verify: presentation (theme/background colors)
#   - Verify: icons (all 5 visible, maskable variants flagged correctly)
#   - Verify: no errors or warnings reported
# Open DevTools → Application → Service Workers:
#   - SW not yet registered (Block 13)
# beforeinstallprompt should fire on supported Chromium environment
```

**Note (per Round 2 DeepSeek):** Chrome has deprecated Lighthouse's PWA testing category. The Application panel is the current source of truth for manifest and SW validation. Lighthouse can still surface specific installability issues (e.g., missing icons), but the "PWA score" category is gone.

**Verification checklist:**

- [ ] All 4 icon files exist and load via DevTools
- [ ] Manifest validates without errors
- [ ] `theme_color` and `background_color` match `#09090b`
- [ ] `display_override: ["fullscreen"]` with `display: "standalone"` fallback
- [ ] `orientation: "any"`
- [ ] `apple-touch-icon` link in index.html
- [ ] Chrome DevTools → Application → Manifest reports zero errors (canonical check; Lighthouse PWA category was deprecated)
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 12 complete.
Files added: manifest.webmanifest, 4 icons, index.html links
Manifest validation: ✅ (no DevTools errors)
Application panel → Manifest section: [no errors]
Ready to proceed to Block 13? Awaiting ratification.
```

**Commit:**

```bash
git add public/manifest.webmanifest public/icons/ index.html
git commit -m "$(cat <<'EOF'
Step 13 Block 12 — manifest + icons

Adds the web app manifest and icon set required for PWA installation.
Manifest follows the simplified contract per DeepSeek P8: display_override
["fullscreen"] with display "standalone" as graceful fallback, orientation
"any", theme/background colors matching --rd-bg-base (#09090b).

Icon set:
- icon-192.png, icon-512.png (standard, "any" purpose)
- icon-maskable-192.png (with safe-area padding for Android adaptive icons)
- apple-touch-icon.png (180x180 for iOS home screen)

The "RD" mark is white bold sans-serif on black — a deliberate placeholder
per pre-locked decision 14. Custom branding can replace this later without
schema/structural changes.

Anchor: R72.5 A4 + DeepSeek P8
EOF
)"
```

---

### Block 13 — Service Worker Precache + Offline

**Purpose:** Install vite-plugin-pwa, configure Workbox precache strategy (NOT stale-while-revalidate per audit-corrected A4), navigation fallback for client-side routes, and verify the app works offline after first install.

**R72.5 anchor:** A4 (revised per DeepSeek P6 — precache + nav fallback, no SWR on Vite assets)

**Files touched:**

- `frontend/package.json` (add vite-plugin-pwa)
- `frontend/vite.config.ts` (add VitePWA plugin)
- `frontend/src/main.tsx` (register SW if vite-plugin-pwa doesn't auto-register)

**Acceptance criteria:**

1. `vite-plugin-pwa` installed
2. Vite plugin configured with Workbox precache (not SWR)
3. Navigation fallback to precached `index.html` (handles `/settings`, `/about` deep loads when offline)
4. `registerType: 'prompt'` (NOT `autoUpdate`)
5. NO runtime caching for Vite-generated assets (precache handles them with revision tracking)
6. First offline reload works: app loads from precache after going offline
7. Direct loads of `/settings` and `/about` work offline (nav fallback)
8. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Install vite-plugin-pwa:**

```bash
cd frontend
npm install -D vite-plugin-pwa workbox-window
```

**Step 2 — Update vite.config.ts (with DEPLOY_BASE parameterization and explicit registration ownership):**

**HIGH severity amendments:**
- Per Round 2 DeepSeek P0: `navigateFallback` must use `DEPLOY_BASE`, not hardcoded `/index.html`.
- Per Round 2 Codex Finding 6: One owner for SW registration. v2 sets `injectRegister: null` and creates `usePWAUpdate` in Block 13 (the hook owns registration). Block 14 adds the UI behavior on top.

```ts
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const commitSha = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

// DEPLOY_BASE from Execution Decisions Record (defaults to /)
const DEPLOY_BASE = process.env.DEPLOY_BASE || '/';

export default defineConfig({
  base: DEPLOY_BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // injectRegister: null per Round 2 Codex Finding 6 — usePWAUpdate hook owns registration
      // The plugin does NOT inject auto-registration; the hook calls registerSW directly
      injectRegister: null,
      strategies: 'generateSW',
      workbox: {
        // Precache all Vite-generated assets (content-hashed)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Navigation fallback parameterized for DEPLOY_BASE (per Round 2 DeepSeek P0)
        navigateFallback: `${DEPLOY_BASE}index.html`,
        navigateFallbackDenylist: [],
        // Explicit: do NOT add runtime caching for Vite-built assets
        runtimeCaching: [],
      },
      manifest: false,  // We use our own manifest.webmanifest in public/
      devOptions: {
        enabled: false,  // Don't enable SW in dev — only in production builds
      },
    }),
  ],
  define: {
    __COMMIT_SHA__: JSON.stringify(commitSha),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
```

**Step 3 — Create usePWAUpdate hook (Block 13 owns this; Block 14 adds UI):**

Per Round 2 DeepSeek + Codex Finding 6, the hook is created in Block 13 to avoid Block 14 churn. Block 14 only adds the UI toast component and wires it up.

`frontend/src/hooks/usePWAUpdate.ts`:
```ts
import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import type { SessionStatus } from './useSessionState';  // CORRECTED IMPORT per Round 2 Codex Finding 11

interface UsePWAUpdateOptions {
  sessionStatus: SessionStatus;
}

export function usePWAUpdate({ sessionStatus }: UsePWAUpdateOptions) {
  const [updateReady, setUpdateReady] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // Register SW once on mount
  useEffect(() => {
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setUpdateReady(true);
      },
      onOfflineReady() {
        // Intentionally silent — no UI for "offline ready"
        // Block 14 may add visual feedback if needed
      },
    });
  }, []);

  // Show toast only when not in a session (handled by Block 14 UI)
  useEffect(() => {
    if (!updateReady) return;
    const isSessionActive =
      sessionStatus === 'running' || sessionStatus === 'rest';
    if (!isSessionActive) {
      setToastVisible(true);
    } else {
      setToastVisible(false);
    }
  }, [updateReady, sessionStatus]);

  const acceptUpdate = async () => {
    if (updateSWRef.current) {
      await updateSWRef.current(true);  // true = reload after activate
    }
  };

  const dismissUpdate = () => {
    setToastVisible(false);
    // updateReady stays true; toast will reappear next time session ends
  };

  return {
    toastVisible,
    acceptUpdate,
    dismissUpdate,
  };
}
```

**Note (per Round 2 Codex Finding 11):** `SessionStatus` imports from `'./useSessionState'`, NOT `'../types/session'`. The type lives in `useSessionState.ts:7` (per audit).

**Step 4 — Wire the hook in App.tsx (Block 13 minimal wiring):**

```tsx
// In App.tsx AppContent
import { usePWAUpdate } from './hooks/usePWAUpdate';

function AppContent() {
  // ... existing session hooks ...
  const { toastVisible, acceptUpdate, dismissUpdate } = usePWAUpdate({
    sessionStatus: session.status,
  });

  // In Block 13, just consume the hook — UI for the toast arrives in Block 14
  // For Block 13 verification, log changes:
  useEffect(() => {
    if (toastVisible) {
      console.log('SW update detected and ready to apply'); // TEMP DEV LOG — remove in Block 14
    }
  }, [toastVisible]);

  // ... rest of return ...
}
```

The `console.log` is temporary instrumentation that gets removed in Block 14 (when the toast UI is added). It's marked with `// TEMP DEV LOG` per Plan Principle 5.

**Step 4 — Add TypeScript types:**

In `src/vite-env.d.ts` (or wherever existing Vite types live):

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

**Step 5 — Build and verify:**

```bash
cd frontend
npm run build
ls -la dist/
# Verify SW file exists: dist/sw.js or dist/workbox-XXXX.js
# Verify manifest.webmanifest still present
# Verify icons still present
```

**Step 6 — Manual test offline:**

```bash
npm run preview  # Serves production build
# In browser:
# 1. Open the preview URL
# 2. Open DevTools → Application → Service Workers
# 3. Verify SW is registered, activated
# 4. Application → Cache Storage → verify precache contains all Vite assets
# 5. Network tab → check "Offline"
# 6. Reload page → app must load from precache (no network request)
# 7. Navigate to /settings → must work (nav fallback serves index.html)
# 8. Navigate to /about → must work
# 9. Uncheck "Offline" → app should resume normal operation
```

**Step 7 — Verify dev mode unaffected:**

```bash
npm run dev
# Open DevTools → Application → Service Workers
# Verify: NO SW registered in dev (devOptions.enabled: false)
# Reason: SW caching in dev causes confusion during iteration
```

**Verification checklist:**

- [ ] vite-plugin-pwa installed (pinned version in package.json)
- [ ] Vite config uses `registerType: 'prompt'` and precache strategy
- [ ] `navigateFallback: '/index.html'` set
- [ ] `runtimeCaching: []` explicitly empty
- [ ] Dev mode does NOT register SW
- [ ] Production build registers SW
- [ ] Offline reload works
- [ ] Offline deep-link load of `/settings`, `/about` works
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 13 complete.
Files changed: package.json, package-lock.json, vite.config.ts, src/main.tsx (registration), vite-env.d.ts (types)
SW registration: ✅ (production only, prompt mode)
Precache strategy: ✅ (Vite content-hashed assets, no runtime SWR)
Offline reload: ✅
Offline deep-link load: ✅ (nav fallback)
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 14? Awaiting ratification.
```

**Commit:**

```bash
git add package.json package-lock.json vite.config.ts src/main.tsx src/vite-env.d.ts
git commit -m "$(cat <<'EOF'
Step 13 Block 13 — service worker precache + offline

Installs vite-plugin-pwa and configures Workbox with precache strategy
per audit-corrected A4 (originally R72 said stale-while-revalidate, which
is redundant for Vite's content-hashed assets — DeepSeek P6 caught this).

Configuration:
- registerType: 'prompt' (NOT autoUpdate; Block 14 handles toast lifecycle)
- precache all Vite-built JS/CSS/HTML/icons via globPatterns
- navigateFallback: '/index.html' so direct loads of /settings, /about
  resolve to the precached app shell even when offline
- runtimeCaching: [] (explicit; no SWR overlay on precached assets)
- manifest: false (we use our own from Block 12)
- devOptions.enabled: false (avoid SW caching during dev iteration)

After this block, the app is installable and works offline after first
visit. Update prompt UI arrives in Block 14.

Anchor: R72.5 A4 + DeepSeek P6 (precache, not SWR)
EOF
)"
```

---

### Block 14 — Update Prompt Lifecycle

**Purpose:** Add the UI toast layer on top of the `usePWAUpdate` hook that Block 13 already created. Block 14 creates `UpdateToast`, mounts it in App, and removes Block 13's TEMP DEV LOG instrumentation. Critical behavior (already enforced by the hook): toast suppressed during running/rest, surfaced at idle/summary. Never `skipWaiting` mid-session.

**R72.5 anchor:** A4 update flow

**Per Round 2 amendments:**
- The hook itself is in Block 13 (per Codex Finding 6 + DeepSeek — single ownership for SW registration)
- Toast a11y semantics — interactive buttons not nested inside `role="status"`; use `<section aria-label>` + inner `role="status"` paragraph
- Toast 44px hit targets — `min-h-11` on Update and Dismiss buttons
- Toast width — constrained on narrow viewports via `w-[calc(100vw-2rem)] max-w-sm flex-wrap`
- Update simulation — deterministic via `registration.update()` not "after a moment"

**Files touched:**

- `frontend/src/components/UpdateToast.tsx` (new)
- `frontend/src/App.tsx` (replace Block 13's TEMP DEV LOG with UpdateToast mount)

**Acceptance criteria:**

1. `UpdateToast` component renders Update + Dismiss buttons inside a `<section aria-label="Application update">` wrapper; the status announcement is on a child `<p role="status" aria-live="polite">`
2. Both buttons have `min-h-11` (≥44px hit target)
3. Toast width is constrained: `w-[calc(100vw-2rem)] max-w-sm flex-wrap`
4. Toast respects `--safe-bottom` and `--safe-left`/`--safe-right`
5. When SW update fires `onNeedRefresh` during `idle` or `summary` → toast visible
6. When `onNeedRefresh` fires during `running` or `rest` → toast suppressed; pending state stored in hook (Block 13 contract); appears at next idle/summary transition
7. User taps "Update" → `acceptUpdate()` triggers `updateSW(true)` → page reloads into new build
8. User dismisses → `dismissUpdate()` hides toast; `updateReady` stays true so toast reappears at next session-end
9. Block 13's TEMP DEV LOG (`console.log('SW update detected...')`) is removed from App.tsx
10. `git grep -nF "registerSW" frontend/src/main.tsx` → zero matches (registration is owned by the hook per Block 13)
11. `git grep -nF "TEMP DEV LOG" src/` returns zero matches in Block 14's scope (App.tsx is clean)
12. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Create UpdateToast component:**

`frontend/src/components/UpdateToast.tsx`:
```tsx
interface UpdateToastProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export function UpdateToast({ visible, onAccept, onDismiss }: UpdateToastProps) {
  if (!visible) return null;

  return (
    <section
      aria-label="Application update"
      className="
        fixed bottom-4 left-1/2 -translate-x-1/2 z-50
        flex flex-wrap items-center gap-3
        w-[calc(100vw-2rem)] max-w-sm
        px-4 py-3
        bg-rd-bg-elevated
        text-rd-text-primary text-sm
        rounded-lg
        border border-rd-border-default
        shadow-lg
      "
      style={{
        bottom: 'calc(1rem + var(--safe-bottom))',
        paddingLeft: 'calc(1rem + var(--safe-left))',
        paddingRight: 'calc(1rem + var(--safe-right))',
      }}
    >
      <p role="status" aria-live="polite" className="flex-1 min-w-0">
        A new version is available.
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="
          min-h-11 px-3
          bg-rd-text-primary text-rd-bg-base
          rounded-md text-sm font-medium
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        "
      >
        Update
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss update notification"
        className="
          min-h-11 min-w-11 px-3
          text-rd-text-muted hover:text-rd-text-primary
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        "
      >
        Dismiss
      </button>
    </section>
  );
}
```

**Per Round 2 DeepSeek — a11y semantics:** The interactive buttons are NOT nested inside `role="status"`. The status announcement lives on the inner `<p>`. The outer `<section aria-label="Application update">` provides the landmark; assistive tech announces the inner status paragraph but doesn't conflate it with the action buttons.

**Per Round 2 DeepSeek — 44px targets:** Both buttons use `min-h-11` (44px). The Dismiss button also uses `min-w-11` so it remains tappable even if the label changes.

**Per Round 2 DeepSeek — width constraint:** `w-[calc(100vw-2rem)] max-w-sm flex-wrap` prevents the toast from overflowing narrow viewports; `flex-wrap` allows buttons to wrap to a second row on very narrow widths.

**Step 2 — Replace Block 13's TEMP DEV LOG with UpdateToast mount:**

In `App.tsx` (the AppContent function — hook is already there from Block 13):

```tsx
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { UpdateToast } from './components/UpdateToast';

function AppContent() {
  // ... existing session/route hooks ...
  const { toastVisible, acceptUpdate, dismissUpdate } = usePWAUpdate({
    sessionStatus: session.status,
  });

  // REMOVE the TEMP DEV LOG useEffect from Block 13:
  // useEffect(() => {
  //   if (toastVisible) {
  //     console.log('SW update detected and ready to apply');
  //   }
  // }, [toastVisible]);

  // ... existing return content ...

  return (
    <>
      {/* Existing session/route rendering */}
      <UpdateToast
        visible={toastVisible}
        onAccept={acceptUpdate}
        onDismiss={dismissUpdate}
      />
    </>
  );
}
```

**Step 3 — Verify TEMP DEV LOG is gone:**

```bash
cd frontend
git grep -nF "TEMP DEV LOG" src/ || echo "OK: no TEMP DEV LOG remaining"
git grep -nF "SW update detected" src/ || echo "OK: dev log removed"
```

**Step 4 — Verify main.tsx has no stale registerSW (per Round 2 ChatGPT P17):**

```bash
git grep -nF "registerSW" src/main.tsx
# Expected: zero matches. Registration is owned by usePWAUpdate (Block 13).
```

If any matches remain, remove them — the hook owns registration.

**Step 5 — Manual test update flow (DETERMINISTIC per Round 2 DeepSeek):**

This requires a production build (SW only registers in production).

```bash
cd frontend
npm run build && npm run preview
# In browser, visit preview URL
# Open DevTools → Application → Service Workers
# Verify SW activated
```

**Per Round 2 DeepSeek — deterministic update timing:**

Workbox/browser update detection can take ~60 seconds for service worker file changes. To avoid flaky "wait a moment" tests, use **one** of these deterministic methods:

**Method A — Force update via DevTools:** Application → Service Workers → check "Update on reload" → reload page. The new SW is detected immediately.

**Method B — Call registration.update() directly:** In DevTools console:
```js
navigator.serviceWorker.getRegistration().then(r => r.update());
```

**Method C — Wait the full window:** Make a source change, rebuild, wait >60 seconds, then reload.

Method A is the most reliable for repeated testing.

**Test sequence:**
1. App is loaded at idle. Verify no toast.
2. Make a trivial source change (e.g., change a comment in App.tsx) and `npm run build` again.
3. Use Method A (DevTools "Update on reload" + reload).
4. SW detects new bundle → `onNeedRefresh` fires.
5. Since session is idle: toast appears immediately.
6. Verify toast shows "A new version is available." with Update and Dismiss buttons.

**Test mid-session suppression:**
1. Start a session (any mode/preset).
2. With session in `running` state, repeat Steps 2-4 above.
3. Verify toast does NOT appear during running/rest.
4. Stop session → session goes to summary → toast appears.

**Step 6 — Verify dismiss behavior:**

```
1. With toast visible, click Dismiss.
2. Toast disappears.
3. Start and end a new session.
4. At summary transition: toast reappears (because updateReady is still true).
```

This confirms: dismiss is session-local; the update remains pending.

**Step 7 — Verify accept reloads:**

```
1. With toast visible, click Update.
2. Page reloads.
3. After reload, verify the new bundle is active (commit SHA in Settings reflects the new build).
4. Old SW is replaced by new SW (DevTools → Application → Service Workers shows new version).
```

**Step 8 — Verify a11y semantics:**

In DevTools → Accessibility tab:
- Outer `<section>` has accessible name "Application update"
- Inner `<p>` has role status and aria-live polite
- Update button has accessible name "Update"
- Dismiss button has accessible name "Dismiss update notification"
- Buttons are NOT children of role="status" (the paragraph is)

Keyboard test:
- Tab order: Update → Dismiss (focus-visible outline appears on both)
- Enter on Update triggers accept; Enter on Dismiss triggers dismiss
- Escape does NOT dismiss (toast is non-modal; Escape isn't expected to close it)

**Verification checklist:**

- [ ] `UpdateToast` component created with section/status structure
- [ ] Update button has `min-h-11`
- [ ] Dismiss button has `min-h-11` and `min-w-11`
- [ ] Toast width constrained: `w-[calc(100vw-2rem)] max-w-sm flex-wrap`
- [ ] Safe-area padding applied (bottom, left, right)
- [ ] Block 13's TEMP DEV LOG removed from App.tsx
- [ ] `main.tsx` has no `registerSW` calls (Block 13 hook owns it)
- [ ] Toast suppressed during running/rest (verified via mid-session test)
- [ ] Toast appears at idle/summary (verified via idle test)
- [ ] Accept reloads into new build
- [ ] Dismiss hides toast but keeps update pending
- [ ] A11y semantics correct (interactive buttons NOT inside role="status")
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 14 complete.
Files added: UpdateToast.tsx
Files changed: App.tsx (UpdateToast mount, TEMP DEV LOG removed)
Toast behavior: ✅ suppressed during running/rest, appears at idle/summary
A11y semantics: ✅ section/role split per Round 2 DeepSeek
44px targets: ✅ both buttons
Width constraint: ✅ narrow viewport tested
Accept flow: ✅ reloads into new build
Dismiss flow: ✅ hides toast, update stays pending
TEMP DEV LOG: ✅ removed
main.tsx registerSW: ✅ zero matches (hook owns registration)
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 15? Awaiting ratification.
```

**Commit:**

```bash
git add src/components/UpdateToast.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 14 — update prompt UI lifecycle

Adds the UpdateToast component on top of the usePWAUpdate hook (created
in Block 13). The toast surfaces at idle or summary when a new bundle
is detected, and stays suppressed during running/rest sessions. This
honors the Tool Principle: never interrupt a training session with an
update prompt.

Per Round 2 reviewer amendments:
- A11y semantics: interactive buttons are NOT nested inside role="status".
  The outer <section aria-label="Application update"> provides the
  landmark; the inner <p role="status" aria-live="polite"> carries the
  announcement; buttons are siblings.
- 44px hit targets: Update and Dismiss both use min-h-11; Dismiss also
  uses min-w-11.
- Width constraint: w-[calc(100vw-2rem)] max-w-sm flex-wrap prevents
  overflow on narrow viewports.

The invariant this code controls: the application never explicitly
requests SW activation or page reload during an active training
session. (We do NOT claim the OS or browser will never re-activate
a waiting worker — that's outside our control. We only control when
we call updateSW(true).)

Anchor: R72.5 A4 + Round 2 DeepSeek (a11y, 44px, width) + Codex Finding 6
(hook ownership in Block 13)
EOF
)"
```

---

### Block 15 — Install Affordance

**Purpose:** Implement the sidebar Install affordance per Q9. Three states: Chromium with `beforeinstallprompt` (Install app), iOS/iPadOS with no native prompt (How to install + lightweight tooltip), already installed (item hidden).

**R72.5 anchor:** Q9, R3 (iOS install discoverability)

**Per Round 2 amendments:**
- `useInstallPrompt` is mounted ONCE in `AppShell`; the model is passed to both desktop sidebar and mobile drawer presentations (Round 2 DeepSeek P0 — prevents duplicate `beforeinstallprompt` listeners)
- iPadOS detection: `MacIntel + maxTouchPoints > 1` (Round 2 DeepSeek — modern iPads use desktop-style UA)
- Fullscreen display-mode detection: manifest prefers fullscreen, so check both `standalone` AND `fullscreen` for installed state
- `deferredPrompt` cleared after EVERY prompt attempt (accept or dismiss); old event never reused
- IosInstallTooltip: Escape close + outside-click cleanup + focus return to trigger button
- Declared iOS standalone TS extension instead of `any` cast
- InstallButton: `min-h-11` for 44px touch target
- Installed-state inference: only on real signals (`appinstalled` event OR display-mode match), NOT just because the user tapped Accept

**Files touched:**

- `frontend/src/hooks/useInstallPrompt.ts` (new)
- `frontend/src/components/InstallButton.tsx` (new — receives installPrompt model as prop)
- `frontend/src/components/IosInstallTooltip.tsx` (new — Escape + outside-click + focus return)
- `frontend/src/components/AppShell.tsx` (modify — call useInstallPrompt; thread model to both sidebar contexts)
- `frontend/src/components/Sidebar.tsx` (modify — accept installPrompt prop; render InstallButton with the prop)
- `frontend/src/components/MobileDrawer.tsx` (modify — accept installPrompt prop; forward to SidebarContent)
- `frontend/src/types/global.d.ts` (new — declare `navigator.standalone` extension to avoid `as any`)

**Acceptance criteria:**

1. `useInstallPrompt` is called exactly ONCE per page load (in AppShell); zero duplicate `beforeinstallprompt` listeners on the window
2. Hook returns `{ platform, triggerInstall, deferredPrompt }`; model is threaded through AppShell → DesktopSidebar AND AppShell → MobileDrawer → SidebarContent
3. Chromium + `beforeinstallprompt` available: "Install app" item visible in both desktop sidebar AND mobile drawer; tapping either invokes native prompt
4. iOS (iPhone/iPod) OR iPadOS (MacIntel + maxTouchPoints>1): "How to install" item visible; tooltip explains Share → Add to Home Screen
5. Installed state detected via `display-mode: standalone` OR `display-mode: fullscreen` OR `navigator.standalone === true` OR `appinstalled` event: item hidden in BOTH sidebar contexts
6. Unsupported browsers: item hidden in both contexts
7. Tooltip is NOT a modal; dismisses on outside tap, Escape key, or trigger button re-click
8. When tooltip closes, focus returns to the trigger button
9. `deferredPrompt` is cleared after every `prompt.prompt()` call (accept or dismiss); never reused
10. Item uses sidebar token styling (consistent with other nav items); `min-h-11` hit target
11. Feature detection (window event) happens before platform heuristics (UA sniffing)
12. No `as any` casts for `navigator.standalone`; declared via `types/global.d.ts`
13. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Declare iOS standalone TS extension (avoid `as any`):**

`frontend/src/types/global.d.ts`:
```ts
// iOS Safari extends Navigator with a non-standard `standalone` property
// indicating whether the page was launched from the Home Screen.
// This is not in the TS DOM lib, so we declare it here.
interface Navigator {
  readonly standalone?: boolean;
}
```

**Step 2 — Create useInstallPrompt hook:**

`frontend/src/hooks/useInstallPrompt.ts`:
```ts
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

export type InstallPlatform = 'chromium' | 'ios' | 'installed' | 'unsupported';

export interface InstallPromptModel {
  platform: InstallPlatform;
  triggerInstall: () => Promise<void>;
}

// Helper: detect installed state across all paths
// - standalone display-mode (covers most installed PWAs)
// - fullscreen display-mode (our manifest prefers fullscreen)
// - navigator.standalone (iOS-specific signal)
function isInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    navigator.standalone === true
  );
}

// Helper: detect iOS including modern iPadOS (which uses MacIntel UA)
function isIOSPlatform(): boolean {
  const isClassicIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream;
  // Per Round 2 DeepSeek: modern iPadOS uses MacIntel + maxTouchPoints
  const isModernIPadOS =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isClassicIOS || isModernIPadOS;
}

export function useInstallPrompt(): InstallPromptModel {
  const [platform, setPlatform] = useState<InstallPlatform>('unsupported');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Installed state takes precedence (most reliable signal)
    if (isInstalled()) {
      setPlatform('installed');
      return;
    }

    // Feature detection: beforeinstallprompt event (Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform('chromium');
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // appinstalled event (real signal — not just user tap)
    const handleAppInstalled = () => {
      setPlatform('installed');
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Platform heuristic AFTER feature detection
    if (isIOSPlatform()) {
      setPlatform((current) => (current === 'unsupported' ? 'ios' : current));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<void> => {
    if (!deferredPrompt) return;

    // Per Round 2 DeepSeek: clear the captured event BEFORE calling prompt,
    // because the event can only be used once. Don't retain stale references.
    const prompt = deferredPrompt;
    setDeferredPrompt(null);

    await prompt.prompt();
    await prompt.userChoice;
    // Note: we do NOT setPlatform('installed') here just because outcome is 'accepted'.
    // The appinstalled event (or display-mode change on subsequent reload) is the
    // real signal. Per Round 2 DeepSeek: "Hide install affordance only after a
    // real installed-state signal, not merely because the user accepted the prompt."
  };

  return { platform, triggerInstall };
}
```

**Step 3 — Create IosInstallTooltip with Escape + focus return:**

`frontend/src/components/IosInstallTooltip.tsx`:
```tsx
import { useEffect, useRef } from 'react';

interface IosInstallTooltipProps {
  visible: boolean;
  onDismiss: () => void;
  anchorRect: DOMRect | null;
  returnFocusTo: HTMLButtonElement | null;
}

export function IosInstallTooltip({ visible, onDismiss, anchorRect, returnFocusTo }: IosInstallTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const wasVisibleRef = useRef(false);

  // Dismiss on outside tap (deferred one tick to avoid same-click close)
  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    };
  }, [visible, onDismiss]);

  // Dismiss on Escape (Round 2 DeepSeek)
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [visible, onDismiss]);

  // Focus return: when tooltip closes after having been open, return focus to trigger
  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      return;
    }
    if (wasVisibleRef.current && returnFocusTo) {
      returnFocusTo.focus();
      wasVisibleRef.current = false;
    }
  }, [visible, returnFocusTo]);

  if (!visible || !anchorRect) return null;

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="
        fixed z-50
        max-w-xs
        bg-rd-bg-elevated text-rd-text-primary text-sm
        rounded-lg
        border border-rd-border-default
        shadow-lg p-3
      "
      style={{
        top: anchorRect.bottom + 8,
        left: anchorRect.left,
      }}
    >
      <p className="mb-2">On iOS:</p>
      <ol className="text-rd-text-secondary text-xs space-y-1 list-decimal pl-4">
        <li>Tap the Share button in Safari (the square with the up-arrow)</li>
        <li>Scroll and tap <strong>Add to Home Screen</strong></li>
        <li>Tap <strong>Add</strong></li>
      </ol>
    </div>
  );
}
```

**Step 4 — Create InstallButton (receives model as prop; no longer calls hook):**

`frontend/src/components/InstallButton.tsx`:
```tsx
import { useRef, useState } from 'react';
import type { InstallPromptModel } from '../hooks/useInstallPrompt';
import { IosInstallTooltip } from './IosInstallTooltip';

interface InstallButtonProps {
  installPrompt: InstallPromptModel;
}

export function InstallButton({ installPrompt }: InstallButtonProps) {
  const { platform, triggerInstall } = installPrompt;
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  if (platform === 'installed' || platform === 'unsupported') {
    return null;
  }

  const handleClick = () => {
    if (platform === 'chromium') {
      void triggerInstall();
    } else if (platform === 'ios') {
      if (buttonRef.current) {
        setAnchorRect(buttonRef.current.getBoundingClientRect());
      }
      setTooltipVisible((v) => !v);
    }
  };

  const label = platform === 'chromium' ? 'Install app' : 'How to install';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        className="
          block w-full text-left
          min-h-11 px-3 py-2 rounded-lg text-sm font-medium
          text-rd-text-secondary
          hover:bg-rd-bg-surface hover:text-rd-text-primary
          transition-colors
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        "
      >
        {label}
      </button>
      <IosInstallTooltip
        visible={tooltipVisible}
        onDismiss={() => setTooltipVisible(false)}
        anchorRect={anchorRect}
        returnFocusTo={buttonRef.current}
      />
    </>
  );
}
```

**Per Round 2 DeepSeek — 44px hit target:** `min-h-11` is on the button. The button is also the focus return target (`returnFocusTo` prop on tooltip).

**Step 5 — Lift useInstallPrompt to AppShell (the load-bearing change):**

In `AppShell.tsx`:
```tsx
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function AppShell({ children }: AppShellProps) {
  // Call useInstallPrompt ONCE here — both sidebar contexts share the model.
  // Per Round 2 DeepSeek P0: prevents duplicate beforeinstallprompt listeners.
  const installPrompt = useInstallPrompt();

  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar installPrompt={installPrompt} />
      <MobileDrawer installPrompt={installPrompt} />
      <main className="flex-1 min-w-0 min-h-dvh overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

In `Sidebar.tsx` (and the SidebarContent shared component):
```tsx
import type { InstallPromptModel } from '../hooks/useInstallPrompt';

interface SidebarProps {
  installPrompt: InstallPromptModel;
  // ... existing props ...
}

export function Sidebar({ installPrompt, ...rest }: SidebarProps) {
  return (
    <aside ...>
      {/* ... existing nav ... */}
      <NavSeparator />
      <InstallButton installPrompt={installPrompt} />
    </aside>
  );
}
```

In `MobileDrawer.tsx`:
```tsx
interface MobileDrawerProps {
  installPrompt: InstallPromptModel;
  // ... existing props ...
}

export function MobileDrawer({ installPrompt, ...rest }: MobileDrawerProps) {
  return (
    <div ... drawer container ...>
      <SidebarContent installPrompt={installPrompt} />
    </div>
  );
}
```

Single mount point; single set of listeners; both UI contexts share the model.

**Step 6 — Verify single-listener invariant:**

```bash
cd frontend
git grep -nF "useInstallPrompt" src/
```

Expected: exactly ONE call to `useInstallPrompt()` (in `AppShell.tsx`). All other references are imports of the type or the hook for prop typing.

In DevTools console after page load:
```js
// Verify only one beforeinstallprompt listener registered
// (use Chrome's "Event Listeners" inspector on window)
```

Expected: one `beforeinstallprompt` listener and one `appinstalled` listener on `window`.

**Step 7 — Manual test Chromium:**

```
1. Visit the production preview URL on Chrome desktop or Edge
2. After SW registers and the page is interacted with, beforeinstallprompt fires
3. Both desktop sidebar AND mobile drawer (open the hamburger) show "Install app"
4. Click "Install app" on desktop → native install dialog appears
5. Accept → app installs to OS
6. After install, the appinstalled event fires → "Install app" disappears from BOTH contexts
7. Reject the prompt → "Install app" stays visible (can retry; deferredPrompt is captured fresh on next eligible visit)
```

**Step 8 — Manual test iOS (real iPhone preferred):**

```
1. Visit production URL on iOS Safari
2. Both desktop sidebar AND mobile drawer show "How to install"
3. Tap "How to install" → tooltip appears below the button with 3-step instructions
4. Press Escape (with external keyboard) → tooltip dismisses; focus returns to "How to install" button
5. Tap outside tooltip → tooltip dismisses; focus returns to button
6. Tap "How to install" again → tooltip reopens
7. Actually install via Share → Add to Home Screen
8. Launch installed app from Home Screen → app loads in standalone/fullscreen mode
9. Both sidebar contexts hide the install affordance (because isInstalled() now returns true)
```

**Step 9 — Manual test iPadOS (modern iPad with desktop UA):**

```
1. Visit production URL on iPadOS Safari
2. Verify platform detected as 'ios' (because MacIntel + maxTouchPoints > 1)
3. "How to install" item appears (NOT "Install app" — iPadOS has no beforeinstallprompt)
4. Tooltip behavior matches iPhone test above
```

**Step 10 — Manual test already-installed:**

```
1. Launch the installed PWA from the OS (not via browser URL)
2. The display-mode is now standalone or fullscreen
3. Both desktop sidebar AND mobile drawer should NOT show any install affordance
```

**Verification checklist:**

- [ ] `useInstallPrompt` hook handles iPadOS detection
- [ ] Hook handles fullscreen display-mode in installed-state check
- [ ] Hook clears `deferredPrompt` after every prompt attempt
- [ ] `navigator.standalone` declared in types/global.d.ts (no `as any`)
- [ ] `useInstallPrompt` is called exactly ONCE (in AppShell)
- [ ] Model threaded through to both desktop sidebar AND mobile drawer
- [ ] InstallButton has `min-h-11`
- [ ] IosInstallTooltip dismisses on Escape
- [ ] IosInstallTooltip dismisses on outside tap
- [ ] Focus returns to trigger button after tooltip close
- [ ] Install affordance hidden only on real signal (appinstalled OR display-mode)
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 15 complete.
Files added: useInstallPrompt.ts, InstallButton.tsx, IosInstallTooltip.tsx, types/global.d.ts
Files changed: AppShell.tsx (lift hook), Sidebar.tsx (accept prop), MobileDrawer.tsx (forward prop)
Hook mount: ✅ ONCE in AppShell (zero duplicate listeners)
iPadOS detection: ✅ MacIntel + maxTouchPoints>1
Fullscreen mode: ✅ included in installed-state check
Tooltip Escape close: ✅
Tooltip focus return: ✅
44px target: ✅ min-h-11 on InstallButton
TS strictness: ✅ no `as any` for navigator.standalone
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to PHASE GATE 4? Awaiting ratification.
```

**Commit:**

```bash
git add src/hooks/useInstallPrompt.ts src/components/InstallButton.tsx src/components/IosInstallTooltip.tsx src/types/global.d.ts src/components/AppShell.tsx src/components/Sidebar.tsx src/components/MobileDrawer.tsx
git commit -m "$(cat <<'EOF'
Step 13 Block 15 — install affordance

Implements the sidebar Install affordance per Q9 with three platform
states and the architectural amendment from Round 2 DeepSeek P0:
useInstallPrompt is mounted ONCE in AppShell, with the model passed to
both the desktop sidebar and the mobile drawer. This prevents the
duplicate beforeinstallprompt listener bug that would have occurred if
each sidebar context called the hook independently.

Per Round 2 reviewer amendments:
- iPadOS detection added: MacIntel + maxTouchPoints>1 (modern iPads use
  a desktop-style UA string and would otherwise fall through to
  'unsupported')
- Fullscreen display-mode included in installed-state check (our
  manifest prefers fullscreen, so the standalone-only check would have
  missed installed state)
- deferredPrompt cleared after every prompt attempt; old event never
  reused
- Installed-state inference only on real signals (appinstalled event or
  display-mode match) — NOT just because user tapped Accept
- IosInstallTooltip closes on Escape and outside tap; focus returns to
  the trigger button on close
- InstallButton uses min-h-11 (44px touch target)
- navigator.standalone declared in types/global.d.ts (no `as any` cast)

Feature detection (beforeinstallprompt event) happens before platform
heuristics (UA sniffing). Install affordance is intentionally subtle —
sidebar item, no toast, no banner. The product is the URL; installation
is optional.

Anchor: R72.5 Q9 + R3 + Round 2 DeepSeek P0 (lifted hook) + iPadOS detection
EOF
)"
```

---

## PHASE GATE 4 — PWA Infrastructure Complete

**Cumulative state after Blocks 12, 13, 14, 15:**

- Web app manifest + 5-icon set in production builds (192, 512, maskable-192, maskable-512, apple-touch-180)
- Service worker registered with Workbox precache + DEPLOY_BASE-aware nav fallback
- Update prompt lifecycle owned by `usePWAUpdate` hook (single registration; session-aware deferral)
- Install affordance via single `useInstallPrompt` mount in AppShell (Chromium prompt + iOS/iPadOS tooltip + installed/unsupported hidden)

**Per Round 2 DeepSeek — environment matrix:**

Verification must distinguish environments:

| Symbol | Environment | Use |
|---|---|---|
| DEV | `npm run dev` | Iteration only — SW disabled, no install events |
| PREVIEW | `npm run preview` | Local production-mode smoke test — SW + manifest active |
| PROD | Deployed HTTPS origin (per EDR `PRODUCTION_URL`) | Real install, real update propagation |
| DEVICE | Real iOS/Android installed app | Final PWA cert — safe areas, fullscreen, native install dialog |

PREVIEW does not reproduce host rewrites, subpaths, or production headers. Use PROD for any DEPLOY_BASE-conditional check.

---

### Gate criteria — split by platform per Round 2 DeepSeek

**All rows must pass before Phase 7 begins. Use the EDR-recorded `ROUTING_MODE` and `DEPLOY_BASE` to select which branches apply.**

#### Row 1 — Manifest + icons (all platforms, PROD)

1.1. Production build serves a valid `manifest.webmanifest` at `<DEPLOY_BASE>manifest.webmanifest`
1.2. All 5 icons load: `<DEPLOY_BASE>icons/icon-192.png`, `<DEPLOY_BASE>icons/icon-512.png`, `<DEPLOY_BASE>icons/icon-maskable-192.png`, `<DEPLOY_BASE>icons/icon-maskable-512.png`, `<DEPLOY_BASE>icons/apple-touch-icon-180.png`
1.3. Chrome DevTools → Application → Manifest reports zero errors and zero warnings (deprecation: Lighthouse PWA category is NOT used per Round 2 DeepSeek — Application panel is the canonical check)
1.4. Maskable 192 and 512 previews keep essential artwork inside the safe zone

#### Row 2 — Service worker + precache (all platforms, PROD)

2.1. SW registers on first PROD visit (DevTools → Application → Service Workers shows activated worker)
2.2. SW does NOT register in DEV (devOptions.enabled is false)
2.3. Precache populated with all Vite content-hashed assets (Application → Cache Storage)
2.4. `runtimeCaching` is empty (no SWR overlay on precached content — per audit-corrected A4)

#### Row 3 — Offline behavior (all platforms; routing-mode branched)

**Universal:**
3.1. First visit online → app loads
3.2. Toggle Offline in DevTools → reload → app loads from precache

**If `ROUTING_MODE: path`:**
3.3. Offline → navigate directly to `<DEPLOY_BASE>settings` → loads via nav fallback to index.html
3.4. Offline → navigate directly to `<DEPLOY_BASE>about` → loads via nav fallback

**If `ROUTING_MODE: hash`:**
3.3. Offline → navigate directly to `<DEPLOY_BASE>#/settings` → loads
3.4. Offline → navigate directly to `<DEPLOY_BASE>#/about` → loads
3.5. Note: hash routing does NOT require Workbox nav fallback (the URL hash never hits the server)

3.6. Restore online → app continues to work; no zombie SW state

#### Row 4 — Update lifecycle in all four session states (PROD, per Round 2 DeepSeek)

Use the deterministic update method from Block 14 Step 5 (DevTools "Update on reload", or `registration.update()`).

4.1. **Idle state** — update detected → toast appears immediately
4.2. **Running state** — update detected mid-session → toast SUPPRESSED; updateReady stays true
4.3. **Rest state (between rounds)** — update detected → toast SUPPRESSED
4.4. **Summary state** — toast appears when session reaches summary (whether arrived via natural completion or Stop)
4.5. Accept toast → page reloads → new commit SHA visible in Settings; old SW replaced
4.6. Dismiss toast → toast hidden; updateReady stays true; toast reappears at next session-end transition

#### Row 5 — Install affordance — Chromium desktop + Android (PROD, DEVICE)

5.1. After SW registers and user interacts with page, `beforeinstallprompt` event captured
5.2. Both desktop sidebar AND mobile drawer (open the hamburger on narrow viewport) show "Install app"
5.3. Tapping either invokes the native install dialog
5.4. Accept → app installs to OS; `appinstalled` event fires
5.5. After install: "Install app" hidden in BOTH sidebar contexts (single source of truth via lifted hook)
5.6. Launch installed app from OS → display-mode resolves to `fullscreen` (manifest preference) or `standalone` (fallback) → install affordance still hidden (per `isInstalled()` checks both)
5.7. Reject the native dialog → "Install app" stays visible; `deferredPrompt` was consumed (per Round 2 DeepSeek — clear after every attempt); on next eligible visit, a fresh event may be captured

#### Row 6 — Install affordance — iOS Safari + iPadOS (PROD, DEVICE)

6.1. iPhone Safari: "How to install" item visible in both sidebar contexts (no native prompt — feature detection falls through to platform heuristic)
6.2. **iPadOS** (modern iPad with desktop UA): also shows "How to install" — detection works via `MacIntel + maxTouchPoints > 1` per Round 2 DeepSeek
6.3. Tap "How to install" → tooltip appears below the trigger button
6.4. Tooltip is NOT a modal; dismisses on:
   - Outside tap (deferred one tick from open so opening click doesn't immediately close)
   - Escape key (per Round 2 DeepSeek)
   - Re-tap of trigger button
6.5. On tooltip close: focus returns to the trigger button (per Round 2 DeepSeek)
6.6. Real iOS install via Share → Add to Home Screen → launch from home screen → install affordance hidden (because `navigator.standalone === true` OR display-mode matches)

#### Row 7 — Firefox + other non-Chromium non-Safari (PROD)

7.1. Core session flow works
7.2. Offline behavior works (SW registers and precaches)
7.3. Install affordance is hidden (platform === 'unsupported') — no broken UI
7.4. No console errors related to PWA APIs

#### Row 8 — Mixed-version shell prevention (PROD, per Round 2 DeepSeek)

8.1. Install or load the PWA → close ALL tabs → reopen the URL → app loads with a single coherent version (no stale shell from old SW serving new precache assets, or vice versa)
8.2. Verify by inspecting the commit SHA in Settings: it matches `<DEPLOY_BASE>` HEAD, not an intermediate state

#### Row 9 — DEPLOY_BASE verification (per Round 2 DeepSeek P0)

**If `DEPLOY_BASE: /` (root deployment):**
9.1. All paths resolve at origin root: `/`, `/manifest.webmanifest`, `/icons/*`, `/settings`, `/about`

**If `DEPLOY_BASE: /<subpath>/` (e.g., GitHub Pages):**
9.2. `<subpath>/manifest.webmanifest` loads (NOT root-relative `/manifest.webmanifest`)
9.3. All 5 icons load from `<subpath>/icons/*` (NOT root-relative `/icons/*`)
9.4. Apple touch icon loads from `<subpath>/icons/apple-touch-icon-180.png`
9.5. Manifest fields `id`, `start_url`, `scope` all reflect `<subpath>/` (NOT `/`)
9.6. Workbox navigation fallback resolves `<subpath>/settings` → `<subpath>/index.html` (NOT `/index.html`)
9.7. PROD smoke test: all routes (`<subpath>/`, `<subpath>/settings`, `<subpath>/about`) load and refresh correctly

#### Row 10 — Continuity with Phase Gate 3

10.1. Step 12 invariants (R44A, R54, R58, R63 lock 1 & 2, R68, R71.5 P2 & P3) all still pass
10.2. Block 17 Sections 1-2 invariant tests pass unchanged
10.3. Step 13 view behavior intact (Sidebar, MobileDrawer, RunningView, RestView, SessionSummary, Settings, About all render and function as in Phase Gate 3)

#### Row 11 — Build hygiene

11.1. Lint passes
11.2. `npx tsc --noEmit -p tsconfig.app.json` passes
11.3. `npm run build` produces a working PROD bundle
11.4. No console errors at idle, during session, or on route navigation

---

**Stop-and-report after gate:**

```
PHASE GATE 4: [✅ PASSED / ❌ FAILED]
Environments tested: [DEV ✅ / PREVIEW ✅ / PROD ✅ / DEVICE: <list>]
Per-row status:
  Row 1 (manifest+icons): [✅/❌]
  Row 2 (SW + precache): [✅/❌]
  Row 3 (offline, routing=<path|hash>): [✅/❌]
  Row 4 (update, all 4 states): [✅/❌]
  Row 5 (Chromium install): [✅/❌]
  Row 6 (iOS/iPadOS install): [✅/❌ — note DEVICE used if applicable]
  Row 7 (Firefox): [✅/❌]
  Row 8 (mixed-version shell): [✅/❌]
  Row 9 (DEPLOY_BASE=<root|subpath>): [✅/❌]
  Row 10 (continuity with Phase Gate 3): [✅/❌]
  Row 11 (build hygiene): [✅/❌]
Failures: [list any with diagnosis]
DEVICE testing notes: [iOS/Android model + browser used]
Ready to proceed to Phase 7 (Polish + final verification)? Awaiting ratification.
```

---

## Phase 7 — Polish + Final Verification (3 blocks)

### Block 16 — Visual Consistency + Token Usage Audit

**Purpose:** Final visual sweep. Verify all components consume `--rd-*` tokens consistently. Catch any leftover Step 12 styling that wasn't migrated. Apply defect-only fixes per the objective scope rule below.

**Note:** Per R72.5, the original Block 16 polish items (tabular-nums migration, RestView padding, Stop button consolidation) were absorbed by Blocks 5, 6 — so this block becomes a consistency sweep rather than implementing specific polish items.

**Scope rule (per DeepSeek Round 2 — objective defect-only):**

Block 16 is bounded to defect fixes against the established design system. Subjective polish requires a new amendment.

**Allowed in Block 16:**
- Token inconsistencies (zinc-* where a semantic token exists; hardcoded hex colors)
- Layout overflow / clipping
- Spacing deviations from established component patterns (e.g., one card uses gap-4 where its sibling cards use gap-3)
- Missing focus-visible states on interactive elements
- Viewport defects (truncation, line-wrap collisions) observable at the 6 viewport sizes from Block 17 Section 4

**Forbidden in Block 16 without a new amendment:**
- New components, animations, transitions, or routes
- New metrics or interaction models
- Typography hierarchy redesigns
- Color palette extensions
- Layout architecture changes

If something subjective surfaces ("this card feels off"), document it as a future-polish candidate in Block 18 commit notes — do NOT change it in Block 16.

**Required documentation:** Before/after screenshots for each visual correction. Expected change set is small (typically 2-5 files, mechanical fixes).

**R72.5 anchor:** Section 7 Block 16 (scope corrected per audit; objective rule added per DeepSeek Round 2)

**Files touched:** Whatever surfaces during the audit. Likely small adjustments to 2-5 files.

**Acceptance criteria:**

1. `git grep -nE '\b(bg|text|border)-zinc-' src/` — verify all instances are intentional (not accidentally hardcoded when a token would be more semantic)
2. `git grep -nF 'font-mono' src/` — should be minimal/zero (only intentional uses)
3. Typography hierarchy consistent across views (h1, h2, body, muted)
4. Spacing rhythm consistent (gap-3 / gap-4 / gap-6 used predictably)
5. Color usage consistent (text-rd-text-primary for primary, text-rd-text-secondary for secondary, text-rd-text-muted for muted)
6. Border radii consistent (rounded-lg for buttons, rounded-[var(--rd-radius-card)] for cards)
7. No visual regressions from Phase Gate 3
8. Lint, tsc, build pass

**Execution steps:**

**Step 1 — Run token audit greps:**

```bash
cd frontend
echo "=== zinc-* usage ===" && git grep -nE '\b(bg|text|border)-zinc-' src/
echo "=== rd-* token usage ===" && git grep -nE '\b(bg|text|border)-rd-' src/
echo "=== font-mono remaining ===" && git grep -nF 'font-mono' src/
echo "=== inline hex colors ===" && git grep -nE '#[0-9a-fA-F]{3,8}' src/
```

Review each. For each `zinc-N`, ask: should this be a semantic token? Example: a one-off `bg-zinc-900/30` in an overlay might be fine as-is. But `text-zinc-400` in a label should probably be `text-rd-text-secondary`.

**Step 2 — Defect-only consistency check (objective scope per amendment):**

```bash
# Read every restyled file and check ONLY for defects against the
# established design system:
# - Inconsistent spacing within a component family (e.g., one card uses
#   gap-4 while sibling cards use gap-3)
# - Hardcoded colors that should be tokens (defect: not "could be nicer")
# - Stray font-mono uses (defect: tabular-nums was scoped per audit A.5)
# - Layout overflow / clipping at the 6 Block 17 viewport sizes
# - Missing focus-visible on any interactive element
```

For each defect found, fix it in Block 16. For each subjective ("would look nicer") observation, document it for future polish (do NOT change in Block 16). Block 16 is a defect closure pass, not a polish round.

**Step 3 — Visual regression check:**

```bash
npm run dev
# Take screenshots of every screen at desktop and mobile widths:
# - PreSession (config card)
# - Running (with cue)
# - Rest (standard branch + rest=0 flash branch)
# - Summary (1 round version + multi-round version)
# - Settings
# - About
# - Mobile drawer (open + closed)
# Compare against Phase Gate 3 screenshots (if captured)
# Any visual differences should be intentional and explainable
```

**Step 4 — Apply consistency fixes:**

For each issue caught in Steps 1-3 that's worth fixing in Block 16:
- Update the file
- Verify diff is minimal
- Confirm visual change is intentional

**Step 5 — Verify token usage didn't break anything:**

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

**Verification checklist:**

- [ ] Token audit greps run and reviewed
- [ ] `font-mono` removed where unintentional
- [ ] Inline hex colors removed (or documented as intentional)
- [ ] Typography hierarchy consistent
- [ ] Spacing rhythm consistent
- [ ] No visual regressions
- [ ] Lint, tsc, build pass

**Stop-and-report:**

```
Block 16 complete.
Files changed: [list of small tweaks]
Token audit: [N zinc-* instances reviewed, M kept intentionally, K migrated to tokens]
font-mono after: [count]
Visual regressions: 0
Verification: lint ✅, tsc ✅, build ✅
Ready to proceed to Block 17? Awaiting ratification.
```

**Commit:**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Step 13 Block 16 — visual consistency + token usage audit

Post-PWA visual sweep. Reviewed token usage across all views, tightened
typography/spacing inconsistencies that emerged after seeing the full
system. Specific changes:

[Auto-generated list of files + brief notes from execution]

The original R72 Block 16 polish list (tabular-nums migration, RestView
padding, Stop button consolidation) was absorbed by Blocks 5 and 6 per
audit findings — so this block became a consistency audit rather than
a polish-execution block.

Anchor: R72.5 Section 7 Block 16
EOF
)"
```

---

### Block 17 — Full Manual Test Matrix

**Purpose:** Execute the comprehensive manual test matrix before final commit. Covers Step 12 invariants (with audit-verified file:line references), new Step 13 tests (using corrected methodology from R72.5 Section 6), PWA scenarios, and viewport testing.

**R72.5 anchor:** Section 6 (test methodology corrections), R5 (invariants with file:line refs)

**Files touched:** None (test execution only). Discovered defects fixed in dedicated commits within this block.

**Acceptance criteria:**

All test sections below execute and PASS. Any FAIL is investigated; the regression is fixed (in a dedicated commit) before proceeding to Block 18.

**Test sections:**

#### Section 1 — Step 11/12 Invariants (audit-verified locations)

For each invariant, both code-presence verification AND behavioral test:

**R44A (cleanup on transitions):**
- Code: `useStimulusEngine.ts:186-196` cleanup runs on session stop, round transition, unmount
- Behavior: Stop session mid-cue → no orphaned timers (DevTools Performance → Timeline shows no zombie setTimeout)

**R54 (shared lock):**
- Code: `useReactionInput.ts:75,124-125` single `hasClassifiedCurrentCueRef`
- Behavior: Mash all 4 keyboard arrows simultaneously → exactly 1 reaction recorded

**R58 (Stop valid in running/rest):**
- Code: TopBar Stop in both RunningView and RestView, both call `onStop`
- Behavior: Stop during running → returns to summary if results, idle if none. Stop during rest → same.

**R63 lock 1 (accuracy formula):**
- Code: `sessionStats.ts:34-42` `accuracy = correct / (correct + incorrect) * 100`
- Behavior: Session with 3 correct + 1 incorrect + 2 missed → Accuracy = 75% (NOT 50%)

**R63 lock 2 (TTS failure suppresses miss):**
- Code: `useMissDetector.ts:153-156` checks `audioStartedAtMs == null`
- Behavior: In Audio mode, simulate TTS failure (block speechSynthesis in DevTools) → cue does NOT count as miss

**R68 (rounds + rest semantics):**
- Code: `useSessionState.ts:121-147`
- Behavior: 3-round session: 3 rounds + 2 rests + summary. Counter advances correctly. Last round goes straight to summary.

**R71.5 P2 (lazy useReducer):**
- Code: `useSessionState.ts:198-200` three-arg lazy form
- Behavior: First load reads localStorage exactly once; subsequent renders don't re-read

**R71.5 P3 (Effect 4):**
- Code: usePreferencesPersistence Effect 4
- Behavior: Complete a session without changing mode/preset → savePreferences is called on running → summary transition (verified via Storage.prototype.setItem spy)

#### Section 2 — Step 13 New Tests (using corrected methodology)

**Test 8 — Multi-touch suppression (corrected per DeepSeek P10 + Round 2 DeepSeek deterministic methodology):**

Per Round 2 DeepSeek: React DevTools state inspection is fragile and dependent on build mode + DevTools internals. Use temporary controlled instrumentation at the submission boundary instead.

**Method A — DEV-only test hook (preferred, deterministic):**

Temporarily add at the reaction submission boundary in `useReactionInput.ts`:

```ts
// TEMP DEV LOG — Block 17 Test 8 only; removed in Block 18
if (import.meta.env.DEV && (window as unknown as { __RD_TEST_HOOK__?: Function }).__RD_TEST_HOOK__) {
  (window as unknown as { __RD_TEST_HOOK__: Function }).__RD_TEST_HOOK__({
    type: 'reaction-submitted',
    stimulusId,
    defense,
  });
}
```

Then in DevTools console BEFORE the multi-touch test:

```js
const calls = [];
window.__RD_TEST_HOOK__ = (evt) => calls.push(evt);
```

Execute test:
1. Start session, advance to second cue
2. Three-finger simultaneous tap on three different zones
3. After cue advances or session ends, inspect:
   ```js
   console.log('Submissions for the multi-touch cue:', calls.length);
   // Expected: 1 (only one reaction registered)
   ```

**Method B — Outcome-based (fallback, no instrumentation):**

Configure a Custom session with 1 cue, 1 round. Perform multi-touch on the single cue. After the session ends, verify the summary shows total = 1.

Method A is more deterministic; use it as primary. Method B confirms the result if instrumentation can't be added.

**Cleanup:** The `__RD_TEST_HOOK__` instrumentation is marked `// TEMP DEV LOG` and gets removed in Block 18 along with all other dev-only artifacts. The `import.meta.env.DEV` guard ensures it's stripped from production builds anyway.

**Test 17 — Storage failure handling (corrected per DeepSeek P10):**

```js
// In DevTools console, BEFORE triggering save:
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function () {
  throw new DOMException('Quota exceeded', 'QuotaExceededError');
};

// In the app: change mode (Visual → Audio) to trigger save
// Verify: console shows caught error / warning
// Verify: in-memory state still reflects the change (UI shows Audio active)

// Restore:
Storage.prototype.setItem = originalSetItem;
```

**Test 19 — Session-end persistence (corrected per DeepSeek P10 + Round 2 DeepSeek isolation):**

Per Round 2 DeepSeek: To isolate Effect 4 (running → summary persistence), the spy must clear AFTER entering running. Otherwise startup or route-render saves can produce a false positive. Also, the live key constant must replace the placeholder.

```js
// In DevTools console, BEFORE starting session:
const originalSetItem = Storage.prototype.setItem;
let setItemCalls = [];
Storage.prototype.setItem = function(key, value) {
  setItemCalls.push({ key, value, time: Date.now() });
  return originalSetItem.call(this, key, value);
};

// Import the live key — DO NOT use the placeholder 'PREFS_STORAGE_KEY_VALUE'.
// In Vite dev mode, the key is exported from preferencesStorage.ts:
//   import { PREFS_STORAGE_KEY } from '/src/lib/preferencesStorage';
// At execution time, replace the literal below with the exported constant value
// from preferencesStorage.ts (audit-verified location: preferencesStorage.ts:18).
const PREFS_KEY = '<replace-with-live-PREFS_STORAGE_KEY-value>';

// Step 1: Start session (do NOT change mode/preset before starting)
// Step 2: Wait until session is in `running` state
// Step 3: CLEAR setItemCalls now — this isolates the test to Effect 4 only:
setItemCalls = [];

// Step 4: Complete the session (let it run to summary, OR Stop early)
// Step 5: After session reaches summary, inspect:
const sessionEndCalls = setItemCalls.filter(c => c.key === PREFS_KEY);
console.log('Session-end persistence calls:', sessionEndCalls);
// Verify: at least one call occurred at the running → summary transition

// Restore:
Storage.prototype.setItem = originalSetItem;
```

This isolates Effect 4 from any startup/route saves. The clear-after-running step is the key correction.

**Test 20 — Zero-classified-response summary (per Round 2 DeepSeek Block 7):**

```
1. Start a session (any mode/preset)
2. Do NOT react to any cue — let every cue time out as a miss
3. Wait for session to end (run all rounds out)
4. Verify summary shows: Accuracy "—  No classified responses"
5. Verify summary does NOT show "0%" in red
6. Tally still shows: Correct 0, Incorrect 0, Missed N
7. Done button returns to PreSession
```

**Test 21 — Accuracy boundaries (per Round 2 DeepSeek Block 7):**

Run sessions designed to hit each boundary:

| Scenario | Correct | Incorrect | Expected Accuracy | Expected Color |
|---|---|---|---|---|
| 100% | 5 | 0 | 100% | success (green) |
| Exactly 80% | 4 | 1 | 80% | success (green) — boundary inclusive |
| Exactly 60% | 3 | 2 | 60% | warning (amber) — boundary inclusive |
| Just below 60% | 3 | 3 (= 50%) | 50% | danger (red) |
| 59% (test the boundary) | 16 correct, 11 incorrect (~59.3%) | ~59% | danger (red) |

Verify the color thresholds match the EDR ratification: `≥80% success / 60-79% warning / <60% danger`.

**Test 22 — Reset preferences semantics (per Round 2 DeepSeek Block 8):**

```js
// In DevTools console:
const PREFS_KEY = '<replace-with-live-PREFS_STORAGE_KEY-value>';

// Step 1: Verify the key exists in localStorage
localStorage.getItem(PREFS_KEY) !== null;  // → true

// Step 2: Add an unrelated key to verify reset doesn't nuke origin storage
localStorage.setItem('unrelated-test-key', 'survives-reset');

// Step 3: Navigate to /settings, scroll to Reset preferences, click Reset
// Confirm the inline confirmation

// Step 4: Verify PREFS_KEY is removed (TRUE deletion semantics per EDR):
localStorage.getItem(PREFS_KEY);  // → null (NOT a default JSON value)

// Step 5: Verify unrelated key survived:
localStorage.getItem('unrelated-test-key');  // → 'survives-reset'

// Step 6: Verify suppression flag worked — wait a few seconds, verify
// the key is STILL null (i.e., the reducer-driven default rewrite was suppressed)
localStorage.getItem(PREFS_KEY);  // → still null

// Step 7: Change a preference (e.g., toggle mode Visual → Audio)
// Verify the key is RECREATED with new state:
localStorage.getItem(PREFS_KEY);  // → JSON string with mode: 'Audio'

// Cleanup:
localStorage.removeItem('unrelated-test-key');
```

**Test 23 — Closed mobile drawer keyboard isolation (per Round 1 DeepSeek):**

```
1. Open the app on a narrow viewport (e.g., 375px)
2. Drawer is closed by default (hamburger visible)
3. Focus the address bar, then Tab into the page
4. Press Tab repeatedly through ALL focusable elements
5. Verify: Tab never lands on a NavItem inside the closed drawer
6. Verify in DevTools: the closed drawer container has aria-hidden="true",
   the inert attribute, AND pointer-events-none
```

**Test 24 — Hash-routing offline deep link (conditional — only if ROUTING_MODE=hash):**

If the EDR has `ROUTING_MODE: hash`:

```
1. With production build, visit /#/settings ONLINE → loads
2. Disable network → reload → /#/settings still loads (precache + nav fallback)
3. Visit /#/about offline → loads
```

If `ROUTING_MODE: path`, this test is replaced with path-routing variants (`/settings`, `/about`).

**Test 25 — Dismissed install prompt can be re-captured:**

```
1. On Chromium, wait for beforeinstallprompt → "Install app" appears
2. Click Install app → native dialog appears
3. Click "Cancel" or otherwise dismiss the dialog
4. Verify "Install app" stays visible (deferredPrompt was consumed but user can wait for a fresh event)
5. After some app interaction OR a reload, beforeinstallprompt may re-fire
6. Verify Install app is again invokable (fresh deferredPrompt captured)
```

**Test 26 — Fullscreen mode hides install affordance:**

```
1. Install the PWA on Chromium (display_override prefers fullscreen)
2. Launch from OS — app opens in fullscreen mode
3. Verify in DevTools: window.matchMedia('(display-mode: fullscreen)').matches → true
4. Verify: install affordance is HIDDEN in both desktop sidebar and mobile drawer
   (because isInstalled() returns true via fullscreen check, not just standalone)
```

**Test 27 — Subpath vs root deployment (conditional on DEPLOY_BASE):**

If `DEPLOY_BASE: /` (root deployment):
- Smoke test the production URL — all routes/assets load

If `DEPLOY_BASE: /<subpath>/` (e.g., GitHub Pages):
- Smoke test that all icons load at `<subpath>/icons/...`
- Verify manifest.webmanifest is served at `<subpath>/manifest.webmanifest`
- Verify SW navigation fallback resolves `<subpath>/settings` to `<subpath>/index.html`

This test is the empirical proof that DEPLOY_BASE parameterization works.

#### Section 3 — PWA Test Matrix

**Offline behavior:**
- First visit online → app loads
- Toggle to offline → reload → app loads from precache
- Offline → navigate to `/settings` directly via URL → loads (nav fallback)
- Offline → navigate to `/about` directly → loads
- Restore online → app continues to work

**Update behavior:**
- Online during running → make a new build → update detected, toast suppressed
- Stop session → toast appears
- Accept toast → reload → new build active (commit SHA changed)
- Dismiss toast (don't accept) → no reload, update stays pending
- Start new session → toast hides
- End session → toast reappears (still pending)

**Install behavior:**
- Chromium desktop: beforeinstallprompt fires after SW registration → "Install app" item appears in sidebar
- Click "Install app" → native dialog → accept → app installs
- After install: "Install app" hidden in sidebar
- Launch installed app from OS: sidebar shows no install affordance (already installed)
- iOS Safari: "How to install" appears
- Tap "How to install" → tooltip with Share → Add to Home Screen
- Tap outside tooltip → dismisses

#### Section 4 — Viewport Testing

Test each major view at:
- 375 × 667 (iPhone 8)
- 414 × 896 (iPhone 11)
- 568 × 320 (iPhone 8 LANDSCAPE — short height)
- 768 × 1024 (iPad portrait)
- 1280 × 800 (laptop)
- 1920 × 1080 (desktop)

For each:
- TopBar elements stay in dead corners (don't extend into pull zone x:25-75%)
- Stop button reachable without thumb stretch
- Sidebar visible only at ≥ 768px
- Drawer opens correctly on < 768px
- All text readable; no overflow

**Explicit dead-corner test (per Round 2 DeepSeek P0 + ChatGPT P18):**

For each viewport, during a `running` or `rest` session, run this measurement in DevTools console:

```js
// Round indicator chip (top-left dead corner)
const chip = document.querySelector('[data-testid="top-bar-round-chip"]');
// Stop button (top-right dead corner)
const stop = document.querySelector('[data-testid="top-bar-stop"]');

const chipRect = chip.getBoundingClientRect();
const stopRect = stop.getBoundingClientRect();

console.log({
  viewport: { w: window.innerWidth, h: window.innerHeight },
  chip: {
    rect: chipRect,
    withinLeft25: chipRect.right <= window.innerWidth * 0.25,
    withinTop25: chipRect.bottom <= window.innerHeight * 0.25,
  },
  stop: {
    rect: stopRect,
    withinRight25: stopRect.left >= window.innerWidth * 0.75,
    withinTop25: stopRect.bottom <= window.innerHeight * 0.25,
  },
});
```

**Expected:** All four `within*25` values are `true`. If any is `false` at any viewport, that's a regression of the dead-corner constraint (per Block 6 grid implementation `grid-cols-[25vw_50vw_25vw]`).

This explicit geometric test is the empirical proof that Block 6's dead-corner constraints actually hold — not just visual approximation.

**Implementation note:** Block 6 must add `data-testid="top-bar-round-chip"` and `data-testid="top-bar-stop"` attributes for this test to work. If not present, the test can use other unique selectors but `data-testid` is preferred for test stability.

**Cross-browser realism (per Round 2 DeepSeek):**

For PWA certification (install, fullscreen, safe-areas, touch-zone reachability), Chrome mobile and Safari iOS must be tested on **real devices**, not just DevTools emulation. DevTools emulation is sufficient for layout checks; final PWA cert needs:
- Real Android device with Chrome → install + launch from home screen
- Real iOS device with Safari → Share → Add to Home Screen → launch from home screen
- Verify safe-area handling in both portrait and landscape
- Verify display-mode (fullscreen vs standalone) matches manifest preferences

#### Section 5 — Reduced Motion + A11y Spot Checks

- DevTools → Emulate CSS `prefers-reduced-motion: reduce` → drawer opens/closes instantly
- Tab through sidebar nav with keyboard → focus visible, order logical
- Open drawer with hamburger, Tab through items, Escape closes, focus returns to hamburger
- Stop button on Running keyboard-accessible (Tab to it, Enter activates)

#### Section 6 — Cross-browser Spot Checks

Test the full session flow on:
- Chrome (desktop + mobile)
- Safari (desktop + iOS)
- Firefox (desktop)
- Edge (desktop)

For each:
- Session completes end-to-end
- TouchZones respond
- Reactions register
- Summary displays
- Done returns to PreSession

**Test execution log:**

Claude Code maintains a test execution log during this block. Format:

```
[Section 1.R44A] code ✅, behavior ✅
[Section 1.R54] code ✅, behavior ✅ (4-finger mash → 1 reaction)
[Section 1.R58] code ✅, behavior ✅
... etc
[Section 4.iPhone 8 LANDSCAPE] TopBar position ✅, Stop reachable ✅, pull zone unobstructed ✅
... etc
```

Any ❌ triggers an in-block fix commit, then re-test.

**Verification checklist:**

- [ ] All Section 1 invariants verified (code + behavior)
- [ ] All Section 2 Step 13 tests pass (using corrected methodology)
- [ ] All Section 3 PWA tests pass (offline, update, install)
- [ ] All Section 4 viewport sizes tested
- [ ] Reduced motion + a11y spot checks pass
- [ ] Cross-browser session flow works on 4 browsers minimum
- [ ] Any fixes applied during this block are committed and re-tested

**Stop-and-report:**

```
Block 17 complete.
Test execution log: [link or inline]
Section 1 (invariants): N/N passing
Section 2 (Step 13 tests): N/N passing
Section 3 (PWA matrix): N/N passing
Section 4 (viewports): N viewports tested, M screens × N viewports = K combinations
Section 5 (a11y + motion): all spot checks pass
Section 6 (cross-browser): tested on Chrome, Safari, Firefox, Edge
Fixes applied during testing: [list, or "none"]
Ready to proceed to Block 18 (final commit)? Awaiting ratification.
```

**Commits (if fixes needed):**

For each fix:
```bash
git commit -m "$(cat <<'EOF'
Step 13 Block 17 fix — [brief description]

Discovered during manual test matrix. [Description of issue + root cause].

Anchor: R72.5 [section/risk] + Block 17 test section [N.X]
EOF
)"
```

---

### Block 18 — Final Commit + Cleanup

**Purpose:** Final pre-merge cleanup and the commit that wraps Step 13. Removes TEMP DEV LOG markers, DEV-only instrumentation, lingering debug code. Bumps package version. Verifies all gates one last time. Splits "prepare final branch" from "merge/push/tag" so founder explicitly approves release.

**R72.5 anchor:** Plan principle 5 (TEMP DEV LOG cleanup), Section 7 Block 18

**Per Round 2 DeepSeek release ordering:** Version is bumped FIRST (so the build embeds the new version everywhere it appears: Sidebar, Settings, About, manifest, git tag). After rebase, verification is stale and MUST rerun. Pre-tag check verifies the tag doesn't already exist. Founder approval is required between prepare-final-branch and merge/push/tag.

**Files touched:** `package.json`, `package-lock.json` (version bump), whatever needs final cleanup (usually small).

**Acceptance criteria:**

1. `package.json` version is `0.13.0` (matches the planned release tag)
2. `git grep -nF 'TEMP DEV LOG' frontend/src/` returns zero matches
3. `git grep -nF 'console.log' frontend/src/` is reviewed; **prefer zero production matches** (any remaining must be justified)
4. No DEV-only instrumentation lingering (search for `import.meta.env.DEV` — remove anything added during testing that's not load-bearing)
5. Final lint, tsc, build all pass (after rebase if applicable)
6. PHASE GATE 5 (final) passes
7. Pre-tag check passes (`git rev-parse v0.13.0` FAILS, confirming the tag doesn't exist yet)
8. Founder explicitly approves the prepare-to-release boundary before merge/push/tag

**Execution steps — Part A (Prepare final branch):**

**Step 1 — Bump package version (FIRST per Round 2 DeepSeek):**

```bash
cd frontend
npm version 0.13.0 --no-git-tag-version
# Updates package.json + package-lock.json version field
# --no-git-tag-version: don't auto-tag (we'll tag manually in Part B after merge)
```

Verify the embedded version reflects this everywhere (Sidebar, Settings, About all use `__APP_VERSION__` from `vite.config` which reads `package.json` per EDR `APP_VERSION_SOURCE`):

```bash
git diff package.json package-lock.json
# Verify version: 0.12.0 → 0.13.0
```

**Step 2 — TEMP DEV LOG sweep:**

```bash
git grep -nF 'TEMP DEV LOG' src/
```

Must return zero. If any exist, remove them and the code they tag.

**Step 3 — console.log audit (prefer zero per Round 2 DeepSeek):**

```bash
git grep -nF 'console.log' src/
git grep -nF 'console.warn' src/
git grep -nF 'console.error' src/
```

**Round 2 DeepSeek guidance:** Prefer zero production console.log calls. The original Block 13 plan included a `console.log('App ready to work offline')` in the SW handler — per Round 2, this is unnecessary and was already removed when Block 13 chose intentional silence. If any console.log remains, each one needs an explicit justification:
- Real error handling (errors users/developers genuinely need to see): keep, but use `console.error` or `console.warn`
- Dev-time debugging: remove
- Status announcements (e.g., "ready offline"): remove — UI surfaces these, not the console

**Step 4 — DEV-only block audit:**

```bash
git grep -nF 'import.meta.env.DEV' src/
```

For each match:
- Block 17 Test 8 instrumentation (`__RD_TEST_HOOK__`): REMOVE — the test is complete
- Any other instrumentation added during testing: REMOVE unless load-bearing

**Step 5 — Pre-rebase verification:**

```bash
cd frontend
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

All must pass.

**Step 6 — Rebase on latest main (if main moved during Step 13 development):**

```bash
cd /Users/coltwarren/projects/visual-reaction-boxing-application
git fetch origin
git log origin/main..HEAD  # commits we have ahead
git log HEAD..origin/main  # commits main has that we don't

# If main has moved:
git rebase origin/main step-13-visual-identity
# Resolve any conflicts
```

**Step 7 — POST-REBASE re-verification (per Round 2 DeepSeek — verification is now stale):**

After ANY rebase or merge, the previous verification is stale. RERUN:

```bash
cd frontend
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

Plus the critical smoke tests:
- Quick Demo session end-to-end (verify no regression from rebase)
- Reset preferences flow
- Offline reload (production preview)
- Update toast (production preview, deterministic method from Block 14 Step 5)

If any of these fails, fix and re-run BEFORE proceeding to release.

**Step 8 — Run PHASE GATE 5 (final):**

```
[Execute the PHASE GATE 5 manual checklist below]
```

All criteria must pass.

**Step 9 — Stop-and-report at the prepare-to-release boundary:**

```
Block 18 Part A complete (final branch prepared).
Version bumped to 0.13.0.
TEMP DEV LOG markers: 0
console.log remaining: [N — each justified]
DEV-only instrumentation removed.
Rebase: [up-to-date / rebased on origin/main]
Post-rebase verification: lint ✅, tsc ✅, build ✅
Post-rebase smoke tests: Quick Demo ✅, Reset ✅, Offline ✅, Update ✅
PHASE GATE 5: ✅ PASSED
─── FOUNDER APPROVAL REQUIRED before merge/push/tag ───
Approve to proceed to Part B (release)? Awaiting ratification.
```

**[FOUNDER EXPLICITLY APPROVES BEFORE PART B EXECUTES]**

**Execution steps — Part B (Release):**

This part executes ONLY after founder approval at the end of Part A.

**Step 10 — Merge to main:**

Choose one strategy:

- **Fast-forward (if branch is rebased on latest main):**
  ```bash
  git checkout main
  git merge --ff-only step-13-visual-identity
  ```

- **Merge commit (preserves branch history):**
  ```bash
  git checkout main
  git merge --no-ff step-13-visual-identity -m "Merge Step 13 — Visual Identity + Modern UI Shell"
  ```

- **Squash merge (single commit on main):**
  ```bash
  git checkout main
  git merge --squash step-13-visual-identity
  git commit -m "$(cat <<'EOF'
  [Final squash commit message — see template below]
  EOF
  )"
  ```

Founder chooses merge strategy at the approval point in Step 9.

**Step 11 — Push to origin/main:**

```bash
git push origin main
```

**Step 12 — Verify origin/main equals local HEAD:**

```bash
git fetch origin
git log -1 origin/main --format='%H'
git log -1 main --format='%H'
# Both must be the same SHA
```

If different (push failed silently, force-push prevented, etc.): STOP and resolve before tagging.

**Step 13 — Pre-tag check (per Round 2 DeepSeek):**

```bash
git rev-parse v0.13.0 2>/dev/null
# Expected: command FAILS (returns non-zero) — tag doesn't exist yet
# If it succeeds, that tag already exists → STOP and investigate
```

If `git rev-parse v0.13.0` succeeds, the tag already exists. Do NOT overwrite — investigate where the existing tag came from and resolve before proceeding.

**Step 14 — Tag the release:**

```bash
git tag -a v0.13.0 -m "Step 13 — Visual Identity + Modern UI Shell"
git push origin v0.13.0
```

**Step 15 — Verify tagged commit equals deployed commit:**

```bash
git rev-parse v0.13.0
# Should match the HEAD of origin/main from Step 12
```

If a production deployment is configured (per EDR `PRODUCTION_URL`):
- Wait for production to deploy from the new main
- Verify production serves the new bundle (commit SHA in Settings reflects HEAD)
- Verify production's served commit matches the v0.13.0 tag

**Final commit message template** (if doing a single squash merge):

```
Step 13 — Visual Identity + Modern UI Shell

Replaces the placeholder minimalist UI with the actual product design.
Adds PWA installability with offline support and session-aware update
prompts. Preserves all Step 12 invariants and behaviors.

Major changes:
- App shell with desktop sidebar (240px) and mobile drawer (280px)
- Wouter client-side routing for /settings and /about
- Hierarchical SessionSummary layout (7 metrics + per-round breakdown)
- Top-bar Stop pattern in Running and Rest views (dead-corner geometry
  enforced via grid-cols-[25vw_50vw_25vw])
- PWA: manifest + Workbox precache + nav fallback + update toast + install
  affordance (single useInstallPrompt mount in AppShell)
- Reset preferences with true deletion semantics (suppressNextPersistenceRef
  prevents reducer-driven default rewrite)
- Brief About page with description + how-to + repo link
- All gray-* migrated to zinc-* (palette consistency)
- useInputHandler shim removed
- Semantic --rd-* token namespace established
- Execution Decisions Record propagated to all PWA blocks (manifest, icons,
  nav fallback all consume DEPLOY_BASE)

Step 12 invariants preserved:
- R44A (cleanup on transitions)
- R54 (shared input lock)
- R58 (Stop valid in running and rest)
- R63 lock 1 (accuracy formula) + lock 2 (TTS failure does not record miss)
- R68 (rounds + rest semantics)
- R71.5 P2 (lazy useReducer) + P3 (Effect 4 session-end save)

Anchor 1: Step 13 adds no new reaction-training or scoring behavior.
  Navigation, presentation, PWA installation, offline operation, and
  update behavior are Step 13 shell/infrastructure behavior and were
  explicitly in scope (anchor reworded per Round 1 DeepSeek).
Anchor 2: PWA infrastructure ships. Stance-aware mapping is Step 14.
Anchor 3: Tool Principle preserved — no accounts, no engagement loops.

Reviewer board: ChatGPT, DeepSeek, Codex (Gemini contributions
non-substantive and flagged for re-prompt cycle).
Audit basis: Claude Code repo audit at HEAD 2c4e5bf.
Design predecessor: R72.5 (1154 lines).
Execution plan: v2 (~5500+ lines, 20 blocks across 7 phases) after two
reviewer rounds.
```

**Verification checklist:**

Part A:
- [ ] Package version bumped to 0.13.0
- [ ] Zero TEMP DEV LOG markers
- [ ] console.log audited; only justified matches remain (prefer zero)
- [ ] No lingering DEV-only instrumentation
- [ ] Pre-rebase verification passes
- [ ] Branch rebased on latest main (if main moved)
- [ ] Post-rebase verification reran and passes
- [ ] Post-rebase smoke tests pass
- [ ] PHASE GATE 5 passes
- [ ] Founder explicitly approves the prepare-to-release boundary

Part B:
- [ ] Merge to main completed (strategy: [chosen at approval point])
- [ ] Push to origin/main succeeded
- [ ] origin/main equals local HEAD (verified)
- [ ] Pre-tag check passes (`git rev-parse v0.13.0` failed BEFORE tagging)
- [ ] v0.13.0 tag created and pushed
- [ ] Tagged commit equals deployed commit (verified if production exists)

**Stop-and-report (after Part B):**

```
Block 18 complete. Step 13 SHIPPED.
Version: 0.13.0
Final commit SHA: [SHA]
Merge strategy: [strategy chosen at Step 9 approval]
Tag: v0.13.0
TEMP DEV LOG markers: 0
console.log remaining in production: [N — each justified]
Step 12 invariants: all preserved
PHASE GATE 5 (final): ✅ PASSED
Production deployment: [SHA verified equals tag OR "no production deployment configured"]
```

**Commit:** Per merge strategy chosen in Step 9 (after founder approval).

---

## PHASE GATE 5 (FINAL) — Step 13 Shipped

**Gate criteria — ALL must pass before Step 13 is declared complete:**

1. Branch merged to `origin/main`
2. `v0.13.0` tag pushed
3. Production deployment verified (deploy hook fires or manual deploy succeeds)
4. Production URL serves the new build (verify commit SHA in Settings matches the merged commit)
5. Production PWA installable
6. Step 12 baseline behaviors preserved on production
7. No open critical defects from Block 17 testing
8. R72.5 + audit findings + v1 plan + amendment log archived
9. Step 14 planning queued (stance-aware mapping)

**Final state confirmation:**

```
✅ Step 13 — Visual Identity + Modern UI Shell — SHIPPED
   Repo: github.com/ColtWarren/visual-reaction-boxing-application
   Merged: [SHA] on origin/main
   Tag: v0.13.0
   Production: [URL] (verified)
   Anti-scope honored: [list any scope creep that was successfully resisted during execution]
   Next: Step 14 — stance-aware mapping (Anchor 3)
```

---

## Amendment Log

This section is APPENDED to during execution. Each amendment captures:
- Block where it was discovered
- Brief description
- Root cause
- Files changed
- Reviewer/source attribution

This log enables retrospective auditing and informs future steps' planning.

### Amendment template

```
### Amendment vN — [date]
**Discovered in:** Block N during [step]
**Description:** [What changed and why]
**Root cause:** [Why R72.5 / v1 plan didn't catch this]
**Files changed:** [list]
**Source:** [Block discovery / late reviewer catch / new finding]
**Impact:** [Did this change the block sequence? Cause a re-run of a phase gate? Etc.]
```

### Pre-execution amendments

The v2 plan integrates amendments from two reviewer board cycles. This log lists every amendment by source, severity, and block. **Pre-execution** means these were applied during the v1 → v2 transition, before any block executes. Execution-time amendments (discovered during Claude Code block runs) will be appended below using the template.

**Severity counts:**

| Severity | Round 1 (Phase 0-2 partial) | Round 2 (full v1) | Total |
|---|---|---|---|
| HIGH (P0 — execution-blocker) | 3 | 6 | 9 |
| MEDIUM (significant) | 11 | 24 | 35 |
| LOW (precision / quality) | 5 | 8 | 13 |
| **Total** | **19** | **38** | **57** |
| Cross-cutting additions | — | — | 2 (EDR section, Anchor 1 rewording) |

**Reviewer source distribution:**

| Source | Round 1 | Round 2 | Notes |
|---|---|---|---|
| ChatGPT | P1–P13 | P14–P18 | P-numbered precision amendments; UX-focused; tables and structured rationale |
| DeepSeek | Cross-cutting + 3 P0 | 4 P0 + ~13 significant | Web citations (vite-pwa-org, MDN, Chrome dev); technical depth in PWA blocks |
| Codex | 8 findings (file:line) | 15 findings (file:line) | Repo CLI access; PE-1 path flagged 3 times (resolved: Codex runs on different machine — `/Documents/` vs Claude's `/projects/`) |
| Gemini | 0 — non-substantive | 0 — hallucinated context | Flagged for re-prompt cycle (Round 2 Gemini referenced nonexistent "Step 11 refactor race conditions" and "late-May design round"; mislabeled Block 12 as touch input when it's manifest+icons) |

---

#### HIGH severity (P0 / execution-blockers) — 9 total

| # | Block | Round | Description | Source |
|---|---|---|---|---|
| H1 | Block 2 | R1 | Active-session early returns must render inside `<main>` wrapper; original example dropped the wrapper, breaking fullscreen layout and absolute touch zones | DeepSeek R1 + Codex Finding 2 (R2) |
| H2 | Block 2 | R1 | Hash router placement: `App` wraps `<Router>` but also calls `useLocation()` — split into `App` (provider) + `AppContent` (consumer) so hooks live under provider | DeepSeek R1 + Codex Finding 3 (R2) |
| H3 | Block 4 | R1 | Closed mobile drawer must have `inert` + `aria-hidden="true"` + `pointer-events-none` so Tab and assistive tech don't reach hidden nav items | DeepSeek R1 |
| H4 | Block 6 | R2 | Dead-corner constraint not actually enforced — `flex justify-between px-4` doesn't bound width; long round text can extend into pull zone on 320–375px viewports. Replaced with explicit `grid-cols-[25vw_50vw_25vw]` + `getBoundingClientRect()` gate in Phase Gate 4 Row 8 / Block 17 Section 4 | DeepSeek R2 P0 (P18 ChatGPT confirmed) |
| H5 | Block 6 | R2 | RestView wrapper applied `paddingTop: calc(2rem + var(--safe-top))` AND `TopBar layout="flow"` also applied `paddingTop: var(--safe-top)` — safe-area inset compounded. Fix: one owner (RestView OR TopBar), not both | Codex Finding 4 (R2) |
| H6 | Block 8 | R2 | Reset flow internally contradictory: dispatching defaults triggers immediate-persistence effects that re-write the storage key, while the manual test expects the key to stay absent. Fix: orchestration moved INTO `usePreferencesPersistence` with `suppressNextPersistenceRef` flag; `resetPreferences()` is the single callable contract | DeepSeek R2 P0 |
| H7 | All PWA blocks | R2 | Block 0a allows GitHub Pages and subpath deployments, but Blocks 12/13 hardcoded root-relative paths (`"/", "/icons/", "/index.html"`) — fails under `<subpath>/` deployment. Fix: Block 0a outputs `ROUTING_MODE` + `DEPLOY_BASE` in the Execution Decisions Record; every PWA path is parameterized; Phase Gate 4 Row 9 verifies both root and subpath branches | DeepSeek R2 P0 (cross-cutting) |
| H8 | Block 15 | R2 | `InstallButton` mounted in both desktop sidebar AND mobile drawer — if each called `useInstallPrompt()`, two `beforeinstallprompt` listeners would compete for the same event. Fix: hook lifted ONCE to `AppShell`; model threaded as prop to both sidebar presentations | DeepSeek R2 P0 |
| H9 | Block 13/14 | R2 | SW registration ownership ambiguous: Block 13 said `injectRegister: 'auto'` and added manual `registerSW`; Block 14 created a hook that also called `registerSW`. Fix: Block 13 sets `injectRegister: null` and creates `usePWAUpdate` (single owner); Block 14 only adds the UI toast | Codex Finding 6 (R2) + DeepSeek R2 |

---

#### MEDIUM severity (significant) — 35 total

By block:

**Block 0a** (R1): curl `-I` → GET to capture body; grep `<div id="root">` for SPA shell; explicit no-deployment fallback documented (Source: ChatGPT P2 + DeepSeek R1)

**Block 0b** (R1): Cue token names corrected — `--color-cue-red` / `--color-cue-blue` (not `-jab` / `-cross`); count corrected to 12 tokens (not 14); `getComputedStyle` verification deferred to Block 2 where it has runtime context (Source: Codex Finding 1 R1 + DeepSeek R1)

**Block 1** (R1): Field names verified against repo — `selectedPresetId` (not `presetId`); `PREFS_STORAGE_KEY` (not `STORAGE_KEY`) (Source: Codex Finding 2 R1)

**Block 2** (R1): `setLocation` → `navigate` with `replace`; unknown-route fallback specified (Source: DeepSeek R1 + ChatGPT P5)

**Block 3** (R1): Wouter `<Link>` no longer wraps an `<a>` (current API change); `__APP_VERSION__` constant injected via vite.config; `shrink-0` + `min-w-0` on Sidebar layout to prevent collapse (Source: DeepSeek R1 + ChatGPT P6)

**Block 4** (R1): Drawer rendered as `<div>` not `<aside>` (avoid nested landmark inside `<main>`); `safe-area-inset-left` padding; hamburger `type="button"` (Source: DeepSeek R1 + ChatGPT P8)

**Block 5** (R2): `ModeButton` `py-2` reduces touch target below 44px → `min-h-11 py-2`; gray-* scope restricted to PreSession + ModeButton (full sweep in Block 10) (Source: DeepSeek R2 + ChatGPT P14)

**Block 6** (R2): Explicit grid layout `grid-cols-[25vw_50vw_25vw]`; `min-height` not fixed `h-[]` (border-box safe-area pitfall); measurable gate via `getBoundingClientRect()` (Source: DeepSeek R2)

**Block 7** (R2): Zero-classified-response state ("— No classified responses" not red 0%); responsive tally `grid-cols-2 sm:grid-cols-4`; per-round breakdown grid for narrow viewports; accuracy thresholds RATIFIED in v2 (no founder TBD); `roundBreakdowns` prop pre-flight check; Done button `min-h-11` (Source: DeepSeek R2 + ChatGPT P15)

**Block 8** (R2): Version ownership single-sourced from `package.json` via vite.config `__APP_VERSION__` (consumed by Sidebar, Settings, About, git tag); reset as single callable contract on the persistence hook (Source: DeepSeek R2)

**Block 9** (R2): Mobile hamburger inset prevents heading overlap; focus-visible outline on external repo link; `__APP_VERSION__` shared with Settings (Source: DeepSeek R2)

**Block 10** (R2): Guarded `while IFS= read -r` loop instead of `xargs sed` (xargs misbehaves when grep returns zero lines); stage only verified files (no `git add -A`) (Source: DeepSeek R2)

**Block 11** (R2): Pre-delete `git grep` scope expanded from `src/` to all of `frontend/`; post-delete file-existence check `test ! -e` (Source: DeepSeek R2)

**Block 12** (R2): Application panel verification replaces deprecated Lighthouse PWA audit category (Chrome dev guidance); 5th icon added (`icon-maskable-512.png`); DEPLOY_BASE parameterization for manifest fields and icon paths (Source: DeepSeek R2 + ChatGPT P16)

**Block 13** (R2): `injectRegister: null` (single ownership); `navigateFallback` uses DEPLOY_BASE; `usePWAUpdate` hook creation moved to Block 13 (avoids Block 14 churn); `SessionStatus` imported from `./useSessionState` not `../types/session` (Source: DeepSeek R2 + Codex Findings 6, 11 R2)

**Block 14** (R2): Toast a11y semantics — outer `<section aria-label="Application update">` + inner `<p role="status" aria-live="polite">` + sibling buttons (interactive buttons NOT inside status role); `min-h-11` on Update and Dismiss buttons; width constraint `w-[calc(100vw-2rem)] max-w-sm flex-wrap`; deterministic update timing via DevTools "Update on reload" / `registration.update()` / 60s wait (replacing "after a moment"); main.tsx registerSW removal verified post-refactor; commit message overstatement narrowed (Source: DeepSeek R2 + ChatGPT P17)

**Block 15** (R2): iPadOS detection `MacIntel + maxTouchPoints > 1`; fullscreen `display-mode` included in `isInstalled()` check (manifest prefers fullscreen); `deferredPrompt` cleared after EVERY prompt attempt (accept or dismiss); IosInstallTooltip Escape close + outside-click + focus return via `returnFocusTo` prop; `min-h-11` on InstallButton; `navigator.standalone` declared in `types/global.d.ts` (avoid `as any`); installed-state inference only on real signals (appinstalled OR display-mode), NOT on user-accept (Source: DeepSeek R2)

**Block 17** (R2): DEV-only `__RD_TEST_HOOK__` for Test 8 (replacing fragile React DevTools inspection); Test 19 clears `setItemCalls` AFTER entering running to isolate Effect 4; placeholder `'PREFS_STORAGE_KEY_VALUE'` marked for live-key replacement at execution; 8 new test cases added (Test 20: zero-classified summary; Test 21: accuracy boundaries 100/80/60/59; Test 22: reset semantics with suppression flag + unrelated-key survival; Test 23: closed-drawer Tab isolation; Test 24: hash-routing offline conditional; Test 25: dismissed install re-capture; Test 26: fullscreen hides install; Test 27: subpath vs root deployment); Section 4 explicit dead-corner test via `getBoundingClientRect()` with `data-testid` hooks; cross-browser realism (real devices required for PWA cert) (Source: DeepSeek R2 + ChatGPT P18)

**Block 18** (R2): Release ordering restructured into Part A (Prepare) + Part B (Release) with explicit founder approval boundary; Step 1: `npm version 0.13.0 --no-git-tag-version` FIRST; post-rebase verification rerun (stale); pre-tag check `git rev-parse v0.13.0` MUST FAIL; tagged commit equals deployed commit verification; "prefer zero console.log" guidance; commit message updated to v2 framing with both reviewer rounds noted (Source: DeepSeek R2)

**Phase Gate 3** (R2): "localStorage clear" wording replaced with true-deletion semantics; verifies suppression flag prevented immediate rewrite; verifies unrelated origin storage survived (Source: DeepSeek R2)

**Phase Gate 4** (R2): Restructured into 11 platform-and-concern rows; DEV/PREVIEW/PROD/DEVICE environment matrix; routing-mode and DEPLOY_BASE branches; update lifecycle tested in all 4 session states; mixed-version shell prevention (close all tabs, reopen) (Source: DeepSeek R2)

---

#### LOW severity (precision / quality) — 13 total

- Block 0a: Tier-specific verification commands tightened (R1 ChatGPT P1)
- Block 0b: Explicit `--theme` block boundary documented (R1 DeepSeek)
- Block 3: NavItem `aria-current="page"` for active route (R1 ChatGPT P6)
- Block 3: NavSeparator `role="separator"` (R1 ChatGPT P7)
- Block 4: Drawer enter/exit transition uses `prefers-reduced-motion` (R1 ChatGPT P9)
- Phase Gate 1: Hash routing branch in test scenarios; build check; closed-drawer Tab test; `navigate replace` test; `<main>` wrapper preservation explicit (R1 DeepSeek)
- Block 13: Manifest fields enumerated explicitly (R2 ChatGPT)
- Block 13: `devOptions.enabled: false` rationale documented (R2 DeepSeek)
- Block 14: TEMP DEV LOG `console.log` from Block 13 explicitly removed in Block 14 Step 3 (R2 ChatGPT P17)
- Block 17: `data-testid` attributes specified for dead-corner test hooks (R2 DeepSeek)
- Block 18: Three merge strategies documented (fast-forward / merge / squash) with founder choice (R2 partial — was in v1; reorganized into Part B in R2)
- Block 18: Commit message template updated to reference both reviewer rounds (R2)
- Various: prose tightening, typo fixes, anchor citations updated (R1 + R2)

---

#### Cross-cutting additions (NEW in v2) — 2

**C1: Execution Decisions Record (EDR)** — NEW section at top of document, immediately after the header. Records `ROUTING_MODE`, `DEPLOY_BASE`, `PRODUCTION_URL`, `APP_VERSION_SOURCE`, `PWA_REGISTRATION_OWNER`, `ACCURACY_COLOR_THRESHOLDS`, `RESET_SEMANTICS`. Block 0a resolves the unfilled values; all later blocks consume from EDR rather than re-stating assumptions. (Source: DeepSeek R2 — proposed as cross-cutting amendment)

**C2: Anchor 1 reworded** — Original: "Step 13 is Visual Identity + Modern UI Shell. No new behavior." Rewording: "Step 13 is Visual Identity + Modern UI Shell + PWA infrastructure. No new reaction-training/scoring behavior; shell/navigation/installation/offline/update behavior IS in scope." Necessary because reviewers correctly flagged that shell/PWA additions ARE new behavior — just not training-domain behavior. (Source: DeepSeek R1 cross-cutting)

---

#### Notes on Gemini contributions (flagged for re-prompt)

**Round 1:** Returned no substantive findings.

**Round 2:** Returned hallucinated context. Specifically referenced:
- "the race conditions experienced during the Step 11 refactor" — no such event in our history
- "the visual regressions observed in the late-May design round" — no such round (we were in late June at Step 13)
- "Block 12 is high-risk due to potential for `passive` event listener warnings" — **Block 12 is the manifest + icons block, not touch input**

Both rounds concluded with "Ratification Status: validated for technical accuracy. Ready for the requested initiation of Phase 0" + "Would you like to proceed with the initiation of Block 0a?" — agreeable framing that doesn't engage with the document content.

Gemini will receive a re-prompt for a real review (founder confirmed). The re-prompt will include structured framing (specific catches to verify, specific tests to spot-check) so non-engagement can't be camouflaged by generic approval.

---

### Execution-time amendment template

When Claude Code discovers an amendment during block execution, append below this line using:

```
### Amendment vN — [date]
**Discovered in:** Block N during [step]
**Description:** [What changed and why]
**Root cause:** [Why R72.5 / v1 plan / v2 plan didn't catch this]
**Files changed:** [list]
**Source:** [Block discovery / late reviewer catch / new finding]
**Impact:** [Did this change the block sequence? Cause a re-run of a phase gate? Etc.]
```

(No execution-time amendments yet — block execution has not started.)

---

## Post-Amendment Provenance Note (v2)

This v2 document supersedes the v1 plan (4756 lines) after two reviewer board cycles:

**Round 1** — Phase 0-2 only review (partial v1 draft, 1494 lines):
- DeepSeek — substantive (Block 2 `<main>` wrapper P0, hash router placement P0, closed drawer interactivity P0, Anchor 1 rewording cross-cutting, Wouter Link API, drawer safe areas, nested asides)
- ChatGPT — P1-P13 precision amendments
- Codex — 8 findings with file:line references (stale cue token names, preferences field mismatch, PE-1 path)
- Gemini — non-substantive (no findings)

**Round 2** — Full v1 plan review (4756 lines):
- DeepSeek — 4 P0 blockers + 9 significant amendments + Execution Decisions Record concept (Block 6 dead-corner geometry, Block 8 reset semantics, PWA base-path propagation, Block 15 duplicate listeners)
- ChatGPT — P14-P18 precision amendments
- Codex — 15 findings (PE-1 path confirmed third time, SessionStatus import location, double safe-area padding, Block 13/14 SW registration ambiguity)
- Gemini — non-substantive with hallucinated context (mislabeled Block 12, referenced nonexistent "Step 11 refactor" and "late-May design round")

The v2 plan integrates all substantive catches from both rounds. Gemini is flagged for re-prompting on next review cycle.

---

## v2 Reviewer Cover Letter (for v2 plan re-review, if requested)

**To reviewers:**

This is the v2 execution plan for Step 13 (Visual Identity + Modern UI Shell). It integrates all substantive catches from two prior reviewer board cycles (Round 1 on Phase 0-2 partial, Round 2 on full v1). Specifically applied:

- 4 P0 blockers from DeepSeek Round 2 (dead-corner geometry, reset semantics, PWA base-path propagation, install listener duplication)
- Block 2 `<main>` wrapper preservation + hash router App/AppContent split (Round 1 DeepSeek/Codex convergent)
- Block 4 closed-drawer keyboard interactivity hardening (Round 1 DeepSeek)
- Block 7 SessionSummary edge states (zero-classified, responsive tally, threshold ratification)
- Block 8 reset orchestration via suppressNextPersistenceRef in usePreferencesPersistence
- Block 13/14 SW registration ownership (Block 13 sets injectRegister:null and creates usePWAUpdate; Block 14 adds UI)
- Block 15 useInstallPrompt lifted to AppShell; iPadOS + fullscreen detection
- Block 17 test methodology (DEV-only __RD_TEST_HOOK__; many added test cases)
- Block 18 release ordering (version FIRST, then verify, then merge/push/tag)
- Anchor 1 rewording (shell/PWA behavior explicitly in scope)
- Execution Decisions Record (NEW section, cross-cutting, top of document)

**Review focus for v2 cycle:**

1. **Completeness of amendment application** — Are the 4 P0 fixes correctly integrated? Spot-check Blocks 6, 8, 12, 13, 15.
2. **Cross-cutting consistency** — Does the Execution Decisions Record propagate correctly to consuming blocks?
3. **New material in Blocks 14-18** — These received the heaviest revision; verify the amendments don't introduce new defects.
4. **Pre-execution readiness** — Anything remaining that would block Claude Code execution?

**Out of review scope:**

- Re-litigating Round 1/Round 2 catches that are already integrated.
- R72.5 design decisions.
- Code golf — focus on executable correctness, not pattern preference.

**Output format requested:**

For each new finding:
- Block reference
- Severity (HIGH / MEDIUM / LOW)
- Description
- Suggested correction

If no new findings, an explicit "approved for execution" is acceptable.

---

## v2 Plan Document Status

**Status:** v2 complete execution plan (20 blocks across 7 phases, 5 phase gates, amendment log staged).

**Predecessor:** v1 (4756 lines) + Round 1 reviewer board (Phase 0-2 amendments) + Round 2 reviewer board (full v1 amendments).

**Reviewer integration:** All HIGH severity catches from both rounds applied. Significant amendments applied. LOW severity catches applied where they reduce execution ambiguity.

**Total expected execution time:** 6-8 weeks at evening cadence + weekend testing days (per R72.5 estimation; unchanged from v1).

**Lines:** ~5500+ (vs v1 at 4756; growth from EDR section, expanded test matrix, hardened reset semantics, base-path propagation, listener model)

**Next steps:**

1. **Founder ratification** of v2 plan (all amendments applied as agreed)
2. **Optional:** v2 reviewer cycle if you want sign-off on amendment correctness
3. **Pre-publication grep audit** on v2 (Step 12 lesson — verify no stale references)
4. **Claude Code execution kickoff** — Block 0a starts

**Anchor confirmations (v2):**

- **Anchor 1:** Step 13 is Visual Identity + Modern UI Shell + PWA infrastructure. No new reaction-training/scoring behavior; shell/navigation/installation/offline/update behavior IS in scope (reworded per DeepSeek Round 1 cross-cutting). ✅
- **Anchor 2:** PWA infrastructure ships. Stance-aware mapping is Step 14. ✅
- **Anchor 3:** Tool Principle preserved. No accounts, no engagement loops. ✅
- **Anchor 4:** Audit-verified accuracy. All audit findings + both reviewer rounds threaded into block specs. ✅
