# Step 14 — Stance-Aware Cue Mapping: Execution Plan v2.1 (governing)

Final plan. Two reviewer-board rounds folded in; both cleared it for execution with no further round. **Source recon basis: the `ece1586` tree, byte-identical to deployed `d09f75e` (differing only in `package-lock.json`).** All paths verified against that tree.

---

## Change log (v2 → v2.1) — precision fixes from board round 2

1. **Stale-stance closure guard (Block 3, critical).** `useReactionInput` attaches its keydown listener once at mount and mirrors live values into refs via `useLayoutEffect`. Stance must follow the same pattern — a `currentStanceRef`, read inside the handler — or the listener reads mount-time stance forever.
2. **Active stance survives into `summary`.** The reducer must carry the `activeSessionStance` snapshot through the `summary` status (clear only on next `start`/dismiss), or the summary loses the stance it displays.
3. **Correct state names.** No pause/resume exists; statuses are `idle | running | rest | summary`. Verification wording corrected to the `running → rest → running` inter-round transition.
4. **Validator strictness.** `isValidPreferences` rejects on bad *core* fields and **ignores unknown extra fields**. Invalid-stance uses strict-envelope (matches how every existing field is treated).
5. **Resolver invariant made precise.** Each family carries both a `position` (render) and a `direction` (input) as distinct stance-sensitive fields; the invariant is stated against `direction`, not `position`.
6. **Vitest is an explicit infra subtask** (dep + config + `test` script), not just a test file.
7. **Verification additions:** southpaw touch-edge test, stance-change-during-session isolation, single-response touch, restart semantics, deeply-readonly derived maps.
8. **Path confirmations:** `Sidebar`/`SidebarContent` in `components/`; `SettingsView`/`AboutView` in `views/`; `package.json` at `0.13.0` → `0.14.0`.

---

## 0. Decided context

- **Design B** (ratified): southpaw mirrors the horizontal cue pair *and* the response together; color stays bound to the defense family; cover/pull do not mirror. Design A deferred to a future opt-in interference mode.
- **Attack→defense dictionary stays stance-agnostic** — deliberate MVP simplification; opponent-stance/matchup modeling deferred.
- **Audio/terminology deferred to Step 14.1** — recon proved the voice lines are already stance-neutral punch names; the proposed rewording conflicts with the R61 short-callout lock.
- **Scoring untouched** — RQI (`docs/MODE_SPECS.md`) has no stance term; Design B keeps the task congruent, so no per-stance normalization.

---

## 1. Verified blast radius

**Mechanic (source of truth + three consumers):**
- `frontend/src/lib/defenseVisualMap.ts` — becomes the resolver layer (§2.1).
- `frontend/src/components/Cue.tsx` — renders `position`/`color` from props; RunningView must pass **stance-resolved** position.
- `frontend/src/components/RunningView.tsx` (~48, 55–56) — reads the map, feeds `Cue`, renders `TouchZones`.
- `frontend/src/hooks/useReactionInput.ts` (~146) — **keyboard** consumer; ref-mirror pattern applies (§2.3).
- `frontend/src/components/TouchZones.tsx` (18–23) — **touch** consumer; zones become direction-based.

**Persistence & state:**
- `frontend/src/types/preferences.ts` + `frontend/src/lib/preferencesStorage.ts` — add `stance`.
- `frontend/src/hooks/usePreferencesPersistence.ts` — thread stance through the write lifecycle (§2.4).
- `frontend/src/hooks/useSessionState.ts` — carry stance; snapshot `activeSessionStance` at start; preserve through `summary`.

**UI:**
- `frontend/src/views/SettingsView.tsx` — stance toggle (matches this file's existing mode/preset/reset controls).
- `frontend/src/components/PreSessionScreen.tsx` — current-stance indicator + quick switch.
- `frontend/src/views/AboutView.tsx` — lead/rear explanation.

**Session context:**
- `frontend/src/lib/sessionStats.ts` / `SessionSummary` display — stance passed as **metadata**, not through `computeStats()`.

**Version surface (no code edit):** `components/Sidebar.tsx`, `SettingsView`, and `AboutView` render the version string automatically; the `0.14.0` bump propagates without touching them.

**Not touched (verified):** scoring, the attack dictionary, the voice lines.

---

## 2. Architecture

### 2.1 Resolvers over derived read-only maps

Keep the orthodox literal as the single source of truth. Model each family with **two distinct stance-sensitive spatial fields** plus its stance-invariant identity/color:

```
DefenseVisual = { color, position }          // render
family → direction: InputDirection           // input
```

**Derive** the southpaw variant once at module load by mirroring **only `position` and `direction`** for the slip pair (spread-preserving color and family identity); cover/pull pass through. Freeze the derived maps (deeply read-only) so consumers can't mutate them.

Public API (consumers never index raw maps):
- `resolveDefenseVisual(family, stance) → { color, position }`
- `resolveDefenseFromInputDirection(direction, stance) → DefenseFamily`

**Precise invariant** (what the tests assert): for every `family` and `stance`, the family's derived `direction` D satisfies `resolveDefenseFromInputDirection(D, stance) === family`, and the family's `position` is spatially congruent with D (left/right/up/down ↔ left/right/top/bottom). `resolveDefenseVisual` returns a `position`, not a direction, so the round-trip is stated against `direction`, not against `resolveDefenseVisual`'s output.

### 2.2 `InputDirection` unification

`InputDirection = 'left' | 'right' | 'up' | 'down'`. Both modalities funnel through the one resolver:
- **Keyboard:** `ARROW_KEY_TO_DIRECTION` (`ArrowLeft→'left'`, …) → `resolveDefenseFromInputDirection(dir, stance)`.
- **Touch:** left edge→`'left'`, right→`'right'`, top→`'up'`, bottom→`'down'` → same resolver.

The stance mirror exists in exactly one place; keyboard and touch cannot drift.

### 2.3 Stance state model + the stale-closure guard

- **`savedStance`** — persisted preference.
- **`upcomingSessionStance`** — what the next session will use (PreSession reflects/edits).
- **`activeSessionStance`** — snapshotted from upcoming **at session start**, held constant for the session, **preserved through `summary`**, cleared on next `start`/dismiss.

**Core invariant:** for every trial, the stance that renders the cue is exactly the stance that interprets the response. All three consumers read `activeSessionStance`.

**Stale-closure guard (critical):** `useReactionInput` attaches its keydown listener once at mount and mirrors props into refs via `useLayoutEffect` (`currentStimulus`, `onReaction`, `currentRoundIndex`). Stance must follow the identical pattern — mirror `activeSessionStance` into a `currentStanceRef` via `useLayoutEffect`, and read `currentStanceRef.current` when resolving direction→family inside the handler. A plain prop/closure would freeze stance at mount-time.

### 2.4 Preferences: additive on v1, normalize ≠ validate, strict envelope

- Add `stance: Stance` to `PersistedPreferencesV1`, **staying version 1**.
- `isValidPreferences` currently checks version/mode/preset/config and **ignores unknown extra fields**. Add a stance check consistent with that: reject a *present-but-invalid* stance (bad core field → whole payload rejected, matching how every existing field is treated — **strict envelope**); **tolerate a missing** stance.
- `loadPreferences` **backfills `'orthodox'`** when stance is absent — normalization lives here (next to the existing preset→config re-normalization), not in the boolean validator.
- Rule: *missing = legacy → backfill; invalid = corrupt → reject to defaults (whole envelope).*
- Update the stale `types/preferences.ts` comment to: breaking changes (removing/retyping fields) require a new version + migration; additive optional fields with sensible defaults may be added within the current version.
- **Lifecycle:** add `state.stance` to Effect 1's dependency array, extend `lastSavedRef` to `{ preset, mode, stance }` and its comparison guard, and add `stance: state.stance` to all four `savePreferences` payloads (Effects 1–4).

---

## 3. Blocks

Each block: recon → ratify → edit → `npm run build` → verify → commit gate. Raw stdout on build/type-check; reject summaries.

**Block 1 — Foundation + resolvers + test infra.**
Add `Stance` and `InputDirection` types and the `direction` field per family. Build the resolver layer in `defenseVisualMap.ts` (§2.1: orthodox literal unchanged; southpaw derived; deeply read-only; `ARROW_KEY_TO_DIRECTION`). Rewrite the stale Design-A comments to Design B. **Stand up vitest** (dev-dependency, config, `test` npm script) and add the resolver test file (§4). *Accept:* every orthodox family resolves to the same color/position/key as today (behavioral); southpaw matches the Appendix table; resolver invariant holds; `npm run build` + `npm test` green.

**Block 2 — Preferences + persistence threading + tests.**
Implement §2.4 across `types/preferences.ts`, `preferencesStorage.ts`, `usePreferencesPersistence.ts`. Add the normalization tests (§4). *Accept:* a legacy payload (no `stance`) loads without reset and reads `orthodox`, preserving mode/preset/config; a present-but-invalid stance falls back to defaults (whole envelope); an unknown extra field is ignored; **a stance-only change persists** (proves the lifecycle threading); southpaw survives reload; build + tests green.

**Block 3 — Wire the three consumers (highest risk).**
Snapshot `activeSessionStance` at session start (`useSessionState`), preserved through `summary`. Thread it to: `Cue` position (via `resolveDefenseVisual` in `RunningView`), keyboard (`useReactionInput` → direction → resolver, **behind `currentStanceRef`** per §2.3), and touch (`TouchZones` zones → direction → resolver). *Accept:* both stances × four families × both modalities produce correct hit/miss; orthodox identical to Step 13; cue-render stance == input-interpret stance every trial; one touch → exactly one response (no synthetic double-submit).

**Block 4 — Toggle UI.**
Stance toggle in `views/SettingsView.tsx` (segmented/radio semantics; selection legible without color; keyboard-operable; "Orthodox"/"Southpaw" labels). PreSession indicator + quick-switch in `components/PreSessionScreen.tsx` that **writes the saved preference** ("Default stance"; no one-session override). About copy in `views/AboutView.tsx`: lead/rear are relative to the selected stance. *Accept:* toggle persists; PreSession reflects saved stance; About agrees with the mechanic.

**Block 5 — Session context.**
Pass the preserved `activeSessionStance` to the `SessionSummary` display as session metadata (never re-read the current preference; not through `computeStats()`). Document the stance-agnostic dictionary and deferred durable persistence as MVP simplifications, with a `TODO` at the field marking it for future IndexedDB history. *Accept:* summary reports the stance the session actually ran under.

**Block 6 — Docs + release.**
Update `ROADMAP.md` (Phase 1.5 stance item), canonical naming ("Stance-aware cue mapping"), any `MODE_SPECS` notes. Commit message references the Design B decision and the sports-science review round. `npm version 0.14.0`. *Accept:* `v0.14.0 (<sha>)` renders in Settings/About/Sidebar; deploy verified on-device.

---

## 4. Automated test module (project's first — Block 1 stands up vitest)

Table-driven, pure functions only, no DOM.

**Resolver cases** (color/position/direction + inverse round-trip):

| Stance | Family | Position | Direction/Key | Color |
|---|---|---|---|---|
| orthodox | slip-lead | left | left / ArrowLeft | red |
| orthodox | slip-rear | right | right / ArrowRight | blue |
| southpaw | slip-lead | right | right / ArrowRight | red |
| southpaw | slip-rear | left | left / ArrowLeft | blue |
| both | cover | bottom-center | down / ArrowDown | yellow |
| both | pull | top-center | up / ArrowUp | green |

Invariants: color never changes with stance; vertical position/direction never mirror; horizontal position **and** direction both mirror; for every family/stance, `resolveDefenseFromInputDirection(family.direction, stance) === family`.

**Preference cases:** legacy (no stance) → backfills orthodox, preserves mode/preset/config; explicit orthodox; explicit southpaw; present-but-invalid stance → whole-envelope reject to defaults; unknown extra field → ignored (payload still valid); write→read round-trip returns the same object.

---

## 5. Verification (manual matrix + tests)

The Block 17 manual matrix remains the browser/device net; vitest guards the pure mechanic. After Block 3, re-run matrix Section 1 invariants and accuracy boundaries **for both stances AND both input modalities**, and add:

- **Mapping integrity:** color stance-invariant; horizontal mirrors, vertical doesn't; cue-render stance == input-interpret stance; unsupported keys still ignored. **Southpaw touch-edge:** left edge → slip-rear, right edge → slip-lead.
- **Session integrity:** changing stance in Settings during a live `running`/`rest` session does not alter that session; stance persists across `running → rest → running`; **restart** uses the documented stance (fresh snapshot from saved default on a new `start`); summary reports the stance used; return-to-PreSession shows saved stance.
- **Persistence integrity:** legacy prefs backfill orthodox without wiping mode/preset/config; southpaw survives reload + PWA relaunch; corrupt stance degrades to defaults (whole envelope).
- **Input integrity:** one touch → one response (no synthetic mouse/click double-submit).
- **UI/a11y:** toggle by mouse/touch/keyboard; selection legible without color; labels not truncated on small screens.

**iOS remains UNVERIFIED by design** — logged, never marked passing.

---

## 6. Deferred / risks

- **Audio/terminology → Step 14.1** (already stance-neutral; polish only; respect R61 short-callout lock).
- **Opponent-stance / matchup dictionary → later step.**
- **Durable per-session stance → Phase 1.5** IndexedDB history; the metadata field is placed now.
- **Mid-session stance change** neutralized by the `activeSessionStance` lock (§2.3).
- **iOS unverified** — carried forward.

---

## Appendix — ground truth

- **Orthodox (source of truth):** slip-lead {red, left, dir left, ArrowLeft}; slip-rear {blue, right, dir right, ArrowRight}; cover {yellow, bottom-center, dir down, ArrowDown}; pull {green, top-center, dir up, ArrowUp}.
- **Southpaw (derived):** slip-lead {red, **right, dir right, ArrowRight**}; slip-rear {blue, **left, dir left, ArrowLeft**}; cover/pull unchanged.
- **TouchZones current (`TouchZones.tsx:18–23`):** left→slip-lead, right→slip-rear, top→pull, bottom→cover. Becomes direction-based, resolved by stance.
- **useReactionInput:** listener attached once at mount; `currentStimulus`/`onReaction`/`currentRoundIndex` mirrored into refs via `useLayoutEffect` — stance joins this pattern.
- **SessionStatus:** `'idle' | 'running' | 'rest' | 'summary'` (no pause/resume).
- **Preferences envelope (v1):** `{ version:1, mode, selectedPresetId, config }` at `reaction-defense.preferences.v1`; validator rejects bad core fields, ignores unknown extras. Add `stance`, stay v1, backfill orthodox, strict-envelope on invalid.
- **Persistence dedup:** `usePreferencesPersistence.ts:38` `lastSavedRef` tracks `{ preset, mode }` — extend to include `stance`; add to Effect 1 deps + all four payloads.
- **RQI:** `0.40·accuracy + 0.25·speed_pct + 0.15·consistency + 0.10·inhibition + 0.10·fatigue`; no stance term.
- **Voice lines:** punch names only; no left/right; already stance-neutral (Step 14.1 defers polish).
