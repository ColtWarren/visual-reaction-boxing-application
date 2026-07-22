# Step 13 — Visual Identity + Modern UI Shell — COMPLETION RECORD

**Status:** SHIPPED
**Version:** 0.13.0
**Tag:** v0.13.0
**Production:** https://reactiondefense.com (Cloudflare Pages, auto-deploy from `main`)

---

## What shipped

Replaced the placeholder minimalist UI with the product design, and added PWA
installability with offline support and update prompts. All Step 12 behavioral
invariants preserved.

- App shell: desktop sidebar (240px) + mobile drawer, Wouter path routing
  (`/settings`, `/about`)
- Hierarchical SessionSummary (accuracy, avg/best RT, per-round breakdown)
- Top-bar Stop pattern in Running and Rest, dead-corner geometry enforced via
  `grid-cols-[25vw_50vw_25vw]`
- PWA: manifest + Workbox precache + navigation fallback + update toast +
  install affordance
- Reset preferences with true-deletion semantics (two-flag suppression prevents
  reducer-driven default rewrite)
- About page; semantic `--rd-*` design token namespace established
- `__COMMIT_SHA__` build discriminator (survives Cloudflare build container)

## Execution

20 blocks across 7 phases. Planning and ratification in Claude (chat); execution
in Claude Code (terminal). Sequence per block: recon → ratify → edit → build →
browser/device verify → commit → push, with an explicit approval gate at each
transition.

Governing document: `step-13-v2.1.1-execution-plan.md` (this directory) —
6,220 lines, 93 amendments across 4 reviewer rounds.

Reviewer board: ChatGPT, DeepSeek, Codex. Gemini contributions were
non-substantive in later rounds and flagged advisory-only. DeepSeek cleared
v2.1.1 for execution with no further reviewer round required.

## Block 17 — regression testing

Block 17 is the project's **sole regression net**. No automated test suite
exists (zero `*.test.*` / `*.spec.*` under `src`, no `test` script). All
invariants are enforced by manual verification and code review only.

**Result: zero defects found.** No fix commits were required; HEAD remained at
`f6e53a4` throughout testing.

### Section 1 — Step 11/12 invariants (8/8 pass)

| Invariant | Verification |
|---|---|
| R44A cleanup on transitions | Stop mid-cue → clean return, no orphaned timers |
| R54 shared classify lock | 4 simultaneous arrow keys → exactly 1 reaction |
| R58 Stop in running + rest | Confirmed in both states |
| R63 lock 1 accuracy formula | 3 correct / 1 incorrect / 2 missed → 75% (not 50%) |
| R63 lock 2 TTS-fail ≠ miss | TTS blocked → 0 missed; TTS live, same non-reaction → 13 missed |
| R68 rounds + rest semantics | 3 rounds + 2 rests, final round → summary directly |
| R71.5 P2 lazy useReducer | Prefs read once on mount |
| R71.5 P3 session-end save | `setItem` spy: 0 baseline → write fired at running→summary |

Code-presence verified against the live repo for all 8 (`[MATCH]`), with three
cosmetic line-number drifts logged (plan line refs stale; code correct).

### Section 2 — Step 13 tests

| Test | Result |
|---|---|
| 8 — multi-touch suppression | PASS (Method B; Method A blocked on remote-debug setup) |
| 19 — session-end persistence | PASS (satisfied by the R71.5 P3 spy run) |
| 20 — zero-classified summary | PASS (observed repeatedly) |
| 21 — accuracy boundaries | PASS — 100% green, **80% green**, **60% amber**, 50% red |
| 22 — reset true deletion | PASS (key → null; unrelated key survived) |
| 23 — post-cycle drawer isolation | PASS (`inert` re-applied after open/close) |
| 27 — root deployment smoke | PASS (satisfied by usage) |
| 28 — first-paint drawer isolation | PASS (`inert` + `aria-hidden` + `pointer-events-none` at first paint) |
| 29 — two-flag write count | PASS — 0 writes during reset, 1 on next user edit |
| 25 / 26 — install re-capture, fullscreen | Optional; not run |

Test 21's boundary rows are the load-bearing ones: 80% rendering green (not
amber) and 60% rendering amber (not red) confirm both thresholds are `>=`,
ruling out the classic off-by-one.

Test 29's `0 → 1` sequence confirms both suppression refs are consumed on reset
and released afterward — the racey single-flag failure mode would have produced
exactly 1 write during reset.

### Section 3 — PWA

Offline, update lifecycle, and install affordance verified across the Block 16
deploy. Mixed-version shell (Gate 4 Row 8) passed on that deploy. Update toast
captured naturally in Safari on a stale client (`ca66c72` → accept → `f6e53a4`),
confirming update-lifecycle parity in WebKit as well as Chromium.

### Section 4 — Viewports + H4 dead-corner geometry

`getBoundingClientRect()` measurement of the round chip and Stop button against
the 25vw corner constraint, in both running and rest states:

| Viewport | Top-25% budget | Result |
|---|---|---|
| 1286 × 916 | 229px | PASS |
| 856 × 916 | 229px | PASS |
| 517 × 300 | **75px** | PASS |

All four constraints (`chipWithinLeft25`, `chipWithinTop25`, `stopWithinRight25`,
`stopWithinTop25`) true at every measurement. Coverage is by dimension range
rather than the plan's eight named device presets; the 75px reading bounds the
constraint from below, so intermediate sizes interpolate safely.

### Sections 5 & 6 — a11y and cross-browser

Keyboard navigation, Escape-closes-drawer with focus return to the hamburger,
and `prefers-reduced-motion` instant transitions all verified.

Browser coverage: Chrome desktop + Android (Samsung Galaxy S23) full; Safari
desktop full; Firefox desktop verified (including the Block 15a negative check —
install button correctly absent). Edge not installed — not separately tested;
Chromium-equivalent, covered by Chrome.

## Known limitations

1. **iOS is UNVERIFIED by design.** No Apple hardware available. The `'ios'`
   platform branch, "How to install" label, `IosInstallTooltip`,
   `navigator.standalone`, Share → Add to Home Screen, and the iPadOS
   `MacIntel + maxTouchPoints > 1` heuristic have never been exercised on a real
   device. Logged as UNVERIFIED — never as passing. Unblock: an iPhone
   post-launch. This is the same carve-out as Phase Gate 4 Row 6.
2. **No automated test suite.** Block 17's manual matrix is the only regression
   protection. Any future refactor must re-run it or introduce automation.
3. **Open drawer does not trap focus.** With the drawer open, Tab cycles through
   its items and the background page. Not specified in Step 13 scope; logged as
   a future a11y pass candidate, not a defect.

## Deferred (logged, not fixed)

- Emerald pulse-dot semantic mismatch (pixel-identical to `--rd-accent-success`
  but semantically "activity," not "correct feedback") — palette work
- SessionSummary tile padding density (`p-3` vs `p-4`) — plausibly deliberate
- RestView stacked-text stats vs SessionSummary's carded presentation —
  harmonizing would be a layout redesign
- PreSession `<h1>` reads "Visual Reaction Boxing" vs "Reaction Defense"
  elsewhere — copy drift
- `authToken` JWT in localStorage, origin unknown — security hygiene
- `npm audit`: 3 vulnerabilities in the build-time dependency tree (not shipped)

## Tooling findings

Measurement artifacts discovered during execution. Each is a case where a green
result came from a check that wasn't measuring what it claimed.

1. `npx tsc --noEmit` (bare) is a **no-op** against the solution-style root
   config. Real standalone check: `-p tsconfig.app.json`. The real gate is
   `npm run build` (`tsc -b && vite build`).
2. Vite's `✓ built in Xms` covers the **bundling phase only** — it excludes
   `tsc -b`. A sub-200ms figure means the tsbuildinfo cache was hit.
3. `grep '"url":"'` on the minified `dist/sw.js` false-negatives; Workbox emits
   **unquoted** keys (`url:"..."`).
4. `registerRoute` count conflates the navigation fallback with caching
   strategies. A count of 1 is correct, not a failure.
5. `__APP_VERSION__` was pinned at `0.0.0` for the entire step and **could not
   discriminate builds**. `__COMMIT_SHA__` was the only live discriminator.
   Resolved by this release: version is now `0.13.0`.
6. Manifest icon paths are root-level (`/icon-192.png`), not
   `<DEPLOY_BASE>icons/...` as the plan stated. Correct as built; plan drifted.
7. Chrome console noise (`DEFAULT root logger`, message-port errors) originates
   from **browser extensions**, not application code. Absent in incognito and in
   Firefox. Run production console checks with extensions off.
8. The Block 15a install-button bug — a real user-facing defect caught by the
   gate. `'onbeforeinstallprompt' in window` was a feature-detect used as a
   browser-detect; it reads `false` on Android Chrome even when the event later
   fires, latching `platform` to `'unsupported'` at mount.
9. **No automated test suite exists** (see Known limitations).
10. macOS `git grep -E` silently drops `\b` word boundaries, returning
    false-negative empty results. Use `git grep -nP`. This invalidated the
    plan's canonical greps in Blocks 16 and 17.
11. DevTools overrides contaminate PWA testing. A forced-offline checkbox
    produced an apparent Gate 4 Row 8 failure that was purely a test artifact.

## Archive limitations

This directory contains the v2.1.1 execution plan, which embeds the outcomes of
all 93 amendments across 4 reviewer rounds. The following predecessor artifacts
exist only in prior chat sessions and could not be recovered to the repository:

- R72.5 design document (1,154 lines) — the design predecessor to this plan
- The Claude Code repository audit at HEAD `2c4e5bf` — the plan's audit basis
- The v1 execution plan
- The raw amendment log (individual reviewer rounds)

Recorded as a known gap rather than presented as complete.

## Provenance

- Repository: `github.com/ColtWarren/visual-reaction-boxing-application`
  (monorepo; Vite app in `/frontend`)
- Stack: Vite 8, React 19, TypeScript, Tailwind v4, Wouter, vite-plugin-pwa +
  Workbox
- Deployment: Cloudflare Pages, auto-deploy from `main`. Root directory must be
  set to `frontend` — the most common deployment failure point.
- Preceding commit: `f6e53a4` (Block 16 — visual consistency + token audit)
- Test hardware: Samsung Galaxy S23 (Android/Chromium); macOS for
  Chrome / Safari / Firefox desktop. No Apple mobile hardware.

## Next

**Step 14 — stance-aware mapping** (Anchor 3). Step 13 deliberately added no new
reaction-training mechanics; navigation, presentation, PWA installation, offline
operation, and update behavior were its entire scope. Stance-aware cue mapping is
the first mechanic change since Step 12 and is queued as the next step.
