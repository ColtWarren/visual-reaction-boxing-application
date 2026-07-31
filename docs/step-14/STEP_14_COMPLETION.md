# Step 14 — Stance-Aware Cue Mapping: Completion Record

**Status: SHIPPED at `v0.14.0`.** 6 blocks. First mechanic change since Step 12. Governing plan: `docs/step-14/step-14-v2.1-execution-plan.md` (archived alongside this record).

---

## What shipped

An orthodox/southpaw stance toggle. Under **Design B**, a southpaw's horizontal cue pair mirrors left↔right **together with** the response, so cue position and movement direction stay spatially congruent for both stances; color stays bound to the defense family (red = slip-lead always); cover/pull (vertical) do not mirror. The user chooses stance in PreSession; it persists, drives the cue render + keyboard + touch classification, and is shown as context on the session summary.

Scoring is untouched — RQI has no stance term, and Design B keeps the task congruent, so no per-stance normalization.

## Block / commit trail

- (pre) `d09f75e` — `npm audit fix`: vite 8.0.10→8.1.5, postcss 8.5.12→8.5.23 (12→8 advisories; 8 workbox-chain build-time vulns deferred, `--force` declined as it downgrades vite-plugin-pwa).
- `1c089fe` — **Block 1**: stance foundation. `Stance`/`InputDirection` types; `resolveDefenseVisual` / `resolveDefenseFromInputDirection` over derived read-only maps; **vitest stood up (project's first automated tests)**.
- `829037f` — **Block 2**: stance as a persisted/hydrated/settable preference. Additive on preferences v1 (tolerate-missing, backfill orthodox, reject present-invalid); threaded through the four `savePreferences` effects + `lastSavedRef` guard.
- `24c40e9` — **Block 3** (highest risk): wired stance to cue + keyboard + touch. `currentStanceRef` stale-closure guard; `TouchZones` reduced to pure geometry; Design B live end-to-end.
- `5dbf6f5` — **Block 4**: stance toggle in PreSession (ModeButton pattern). First user-facing change.
- `80c7369` — **Block 5**: stance shown as context metadata on the session summary (not through `computeStats`).
- (this commit) — **Block 6**: docs + release `0.14.0`.

## Key decisions

- **Design B over Design A** — decided after a sports-science/neuroscience reviewer round. A (freeze cue, flip response only) injects a stance-specific stimulus-response incompatibility (Simon-effect family) that biases southpaw scores; the cost does not reliably attenuate with practice. A is deferred to a possible future opt-in "cognitive interference" mode, separately scored.
- **B1 (direction-based classifier) + `InputDirection` unification** over B2 — keyboard and touch resolve through one stance-aware function, so the mirror lives in one place and the modalities can't drift.
- **S2 (no `activeSessionConfig` snapshot)** — deviation from the ratified plan. Stance is idle-only by reducer guard (`setStance` no-ops outside `idle`), so it can't change mid-session; the split-brain guard is the shared `currentStanceRef`, not a snapshot. Reviewer board validated this and specified the trigger conditions for revisiting it (below).
- **Home: PreSession, not Settings** — deviation from the ratified plan. `setStance` is idle-only; PreSession is the idle config surface; Settings is reachable during `summary` where the setter would no-op (a dead-control trap). An IA reviewer round confirmed PreSession is correct under the current constraint.
- **Summary is display-only** — stance is surfaced now; per-session persistence rides with future IndexedDB session history (there is no persisted session record yet).
- **Attack→defense dictionary stays stance-agnostic** — deliberate MVP simplification; opponent-stance/matchup modeling deferred.
- **Audio was already stance-neutral** (punch-name callouts, no left/right) — no correctness work needed; a terminology-polish pass is deferred to Step 14.1 (must respect the R61 short-callout lock).

## Deferred / forward markers

- **Per-session stance persistence** → Phase 1.5 IndexedDB session history. The summary already displays stance; wiring it into a durable record comes with the store.
- **Hybrid IA** (Settings owns defaults; PreSession shows the effective value with per-session override where legitimate; `activeSessionConfig` snapshot at session start) — adopt when intensity/difficulty tiers and discipline/strike-pattern (MMA/kickboxing) features land. Reviewer triggers to evolve the idle-only lock: Settings gains real everyday controls; users need to prep the next session from summary; session history/templates arrive; or the Start flow becomes a settings dashboard. Guard against the single preferences object becoming defaults + draft + active-session config at once.
- **Radiogroup a11y pass** across Mode + Workout + Stance together (Stance currently reuses the existing bare-`<button>` ModeButton convention — keyboard-operable, focus-visible, but no `role="radiogroup"`/`aria-checked`). Do all three together, not stance alone.
- **Opponent-stance / matchup dictionary** → later step.

## Testing

- **First automated tests introduced** (vitest, DOM-free): 19 total — 12 resolver cases (both stances × all families + color-invariance, vertical-non-mirror, horizontal-mirror, and the round-trip `resolveDefenseFromInputDirection(family.direction, stance) === family`) + 7 preference-normalization cases (legacy backfill, explicit orthodox/southpaw, present-invalid reject, unknown-extra ignored, round-trip). Green throughout.
- **Live (dev) verification**: southpaw cue mirrors (slip-lead red renders right; orthodox left); southpaw right-input resolves to slip-lead correct end-to-end; toggle persists across reload; summary label matches stance run.
- **Deferred to the Block 17 release regression matrix**: the full per-family × both-modality sweep and **Samsung Galaxy S23 touch** verification. `npm run build` (`tsc -b && vite build`) remained the real type/compile gate each block.
- **iOS: UNVERIFIED by design** (no Apple hardware) — carried forward, never marked passing.

## Housekeeping resolved this step

- **`authToken` non-issue closed.** The app writes exactly two localStorage keys, both the preferences key; no code writes `authToken` anywhere (source grep) and it does not appear in a clean incognito production origin. It was a browser-extension content-script artifact, not app-originated. Not a security issue; closed.
- **`npm audit` bump** landed pre-Block-1 (`d09f75e`): vite/postcss/fast-uri advisories cleared (12→8); the 8 residual are build-time-only workbox-chain vulns (leaf: brace-expansion ReDoS, CVE-2025-5889), deferred until vite-plugin-pwa bumps workbox upstream — `--force` rejected because it downgrades vite-plugin-pwa 1.3.0→1.2.0.

## Notes

- Recon basis for the plan was the `ece1586` source tree (byte-identical to deployed `d09f75e`; differ only in `package-lock.json`).
- The governing plan (v2.1) went through two reviewer-board rounds before execution; both cleared it. Design B and the IA question each had their own board round.
- Every block followed: recon → ratify → edit → `npm run build` + `npm test` → browser/device verify → commit → push, with independent confirmation of each `origin/main` advance.
