# Step 14.0 — Inline Boot Failure Guard: Completion Record

**Status: SHIPPED at `v0.14.1`.** 5 blocks (A–E; Block A produced no commit). A
resilience step, not a mechanic step — no gameplay behaviour changed. Governing
plan: `docs/step-14.0/step-14.0-v2.5-execution-plan.md` (archived alongside this
record).

---

## What shipped

An inline guard in `index.html` that converts a white screen into a visible
failure panel with **Try again** / **Clear cached app files** / **Copy
diagnostic details**. It is cause-agnostic: it reacts to "the app did not
mount", not to any particular root cause. Nothing is deleted without an
explicit user action, and the reset control is not rendered at all while
offline.

Plus 34 new tests executing the real shipped guard (19 → 53 total), and service
worker update discovery via hourly poll + `visibilitychange`.

## Block / commit trail

- `3ceed21` — **(pre)** chore: `CLAUDE.md` project instructions + Claude Code permissions.
- `acb3caa` — **Block B**: inline boot failure panel in `index.html`.
- `f53aace` — **Block C**: vitest coverage for the inline boot guard (19 → 53 tests).
- `1df5da2` — **Block D**: accelerated service-worker update discovery.
- (this commit) — **Block E**: docs + release `0.14.1`.
- **Block A produced no commit** — investigation only (Cloudflare/CSP measurement, below).

## Block A — Cloudflare findings (record, not a recommendation)

Measured, all three origins:

| Origin | `Cache-Control` |
|---|---|
| `reactiondefense.com` | `max-age=14400, must-revalidate` |
| `visual-reaction-boxing-application.pages.dev` | `max-age=0, must-revalidate` |
| `dev.visual-reaction-boxing-application.pages.dev` | `max-age=0, must-revalidate` |

**Cause:** the zone's Browser Cache TTL is 4 hours (Caching Level: Standard),
and Cloudflare decides cacheability by URL **extension**, not by the response's
content type. So a request for a missing `/assets/*.js` gets the full 4h TTL
even though the SPA rewrite returns HTML, while an extensionless route on the
same origin gets `max-age=0`. Same origin, same rewrite, same body, different
TTL. Confirmed by comparing `/assets/__missing__.js` against
`/__rd-reset-probe__` on `reactiondefense.com`.

That 4h TTL is what gave the poisoned response its lifespan in the Aug 1
incident.

### The lever, and why it was not pulled

Setting Browser Cache TTL to 0 / "Respect Existing Headers" would make
Cloudflare honour Pages' own `max-age=0, must-revalidate`, collapsing the
re-poisoning window. It was deliberately **not** changed:

- **Largely redundant now.** The 4h TTL only mattered because nothing broke the
  loop. The guard breaks it: panel → Try again or reset → fresh `index.html` →
  new hash. The poisoned URL is never requested again, so its remaining TTL is
  moot.
- **The cost is certain and the benefit is not.** Every valid hashed bundle
  would lose its 4h browser cache and revalidate on repeat visits — a measurable
  slowdown for every user on every return, to shorten the life of a response
  that only occurs in a failure mode now made visible and recoverable.
- Cloudflare advises against custom caching on Pages in most cases; it can
  preserve stale assets and interfere with redirects.

Revisit only if the failure recurs **with a captured diagnosis pointing at TTL
specifically**, or if the guard proves insufficient.

### CSP

None on any of the three origins, no `_headers` file, no CSP anywhere in the
repo. The inline guard is unblocked. If a CSP is ever added,
`script-src-elem`/`script-src`/`default-src` govern the guard and
`style-src-attr`/`style-src`/`default-src` govern its inline style attributes —
allowing one does not allow the other.

## Block B — known limitations

All six are load-bearing.

1. **First-upgrade limitation.** A user already wedged on a pre-guard shell
   cannot be helped by anything here; the inline code ships in `index.html`,
   which they do not have. This hardens **future deploys only**. v1.0–1.3 of the
   plan claimed "a returning user never sees a white screen" — that was
   overclaimed across three versions.
2. **Reset clears ALL caches and registrations for the origin**, not only
   Workbox precaches. The origin is dedicated to Reaction Defense, so this is
   intentional.
3. **Post-boot dynamic `import()` failures are out of scope** — the root has
   children by then, so the panel does not fire.
4. **`navigator.onLine` is a hint, not proof of reachability.** It gates only
   whether the destructive control is RENDERED and which copy shows. Every
   destruction is gated by an actual reachability probe.
5. **`location.replace('/...')` assumes root deployment.** If `DEPLOY_BASE` ever
   becomes a subpath this hardcoded `'/'` is wrong.
6. **The probe proves a recognisable shell is retrievable**, not that every
   chunk of the current deployment will download. That is the correct scope: the
   invariant is "don't destroy the offline installation merely because
   `navigator.onLine` says connected."

**Payload cost:** the guard adds ~15.6 kB uncompressed to `index.html` and to
the precache manifest (809 B → 16,423 B; 313.68 → 328.95 KiB, entry count
unchanged). ~5 kB gzipped, on every load.

**Probe marker contract:** `probeOrigin()` matches
`<title>Reaction Defense Training</title>` and `id="root"`. If either string
changes, reset fails closed and becomes silently unusable. A Block C test
asserts both still exist.

## Block C — test notes

- Tests read `index.html`, extract the guard between its
  `RD_BOOT_GUARD_START`/`END` markers, and eval that source verbatim in a
  throwaway JSDOM realm — a hand-copied guard could drift while tests stayed
  green.
- **Fresh JSDOM per test:** the guard installs a capture-phase `error` listener,
  a watchdog and a `MutationObserver` with no removal handles, so a shared
  window would stack listeners across the file.
- **Mutation-verified before landing:** 7 mutants killed (dropped diagnostics
  `clearTimeout`, dropped retire-on-attach, dropped abandoned guard, dropped
  off-origin probe check, dropped marker check, dropped `type="module"` test,
  snapshot-by-reference). That pass also caught an over-claim in the snapshot
  test, which was strengthened.
- `jsdom` pinned `^29` (jsdom 30 needs Node `^22.22.2`; this repo runs 20.20.2).
  `@types/jsdom` `^28` (jsdom 29 ships no types; no `@types/jsdom@29` exists).
- `index.html` loaded via Vite's `?raw`, not `node:fs` — `tsconfig.app.json`
  compiles `src/` with `types:["vite/client"]` and no `"node"`.
- **Not asserted, deliberately:** "offline → no SW or cache API called" is
  FALSE. `diagnostics()` reads `getRegistrations()` and `caches.keys()` on every
  panel render. The asserted invariant is: offline performs **no unregister, no
  `caches.delete`, no probe fetch**, and renders **no reset control**.
- **Other limits:** synthetic error dispatch is not a real subresource load
  failure; `redirect:'error'` is real-fetch semantics jsdom lacks;
  `location.reload`/`replace` assert the call, not a navigation; the clipboard
  branch is uncovered.

## Block D — notes

- **Discovery only — activation is unchanged.** `registerType:'prompt'`,
  `onNeedRefresh`, `updateServiceWorker` and the running/rest session gate are
  byte-identical (111 insertions, zero deletions).
- `App.tsx` holds a second gate the hook cannot see: `updateDismissed` local
  state. Real toast visibility is
  `needRefresh && !sessionActive && !updateDismissed`. This improves the odds a
  waiting worker is **discovered**, not the odds a user acts on it.
- `lastCheckAt` seeded to registration time because `workbox-window` classifies
  an update as external only past `registrationTime + 60000`.
- A `disposed` flag is required because `onRegisteredSW` resolves off
  `wb.register().then()` and can fire **after** effect cleanup — without it a
  StrictMode remount would leak an interval and a listener per cycle.
- Not reachable today (`devOptions.enabled` is false), reachable the moment dev
  SW is enabled for debugging.
- **NOT verified by execution: no tests.** `src/hooks/` has ten hook files and
  zero tests; adding a hook-testing stack was out of scope. The 1-hour poll in
  particular has never been observed firing.

## Regression matrix

Following the Step 13 Block 17 convention (matrix lives inside the completion
record, one table per section).

### Section 1 — Block verification (production preview build, Chrome incognito)

| Scenario | Result |
|---|---|
| Normal boot unaffected | PASS — no panel, console clean |
| Entry blocked | PASS — panel appears; SW registration and Cache Storage **INTACT** |
| Diagnostics payload | PASS — `partial:false`, all fields populated, trigger `entry-script-error` |
| Offline panel | PASS — reset control absent, warning copy, nothing deleted |
| Reset online | PASS — confirm → probe → clear → navigate to cache-busted root; storage 0 B afterwards |
| Slow 4G cold load | PASS — 9.54 s load, DOMContentLoaded 1.18 s → no false panel |
| Block D on `dev` preview alias | PASS — registration healthy, session gate holds, visibility handler does not throw |
| iOS | UNVERIFIED by design — no Apple hardware |

### Section 2 — Release regression rows

| Scenario | Result | Notes |
|---|---|---|
| Deploy → revisit as returning user → graceful update, never blank | PENDING | Requires a `main` deploy; not exercisable from a preview build. Run at release. |
| Entry script fails → panel appears, nothing deleted | PASS | Section 1, rows 2–3. |
| Reset → unregister completes → navigate → app boots | PASS | Section 1, row 5. |
| Offline launch → offline copy, reset control ABSENT, offline app works | PARTIAL | Panel half PASS (Section 1, row 4). "Offline app works" not separately re-run this step. |
| Offline full session (visual + audio) completes | PENDING | Not run this step. |
| S23 physical device: app boots, panel dormant | PENDING | Not run this step. |
| iOS | UNVERIFIED by design | No Apple hardware. Never marked passing. |

Rows marked PENDING were **not executed** — they are release gates, not results.

## Deferred — revisit only if the failure recurs

- Automatic destructive recovery (three review rounds, three defects).
- Deterministic stale-shell fault injection.
- Nested `/assets/404.html` routing (removing the SPA catch-all).
- Cloudflare Browser Cache TTL change (see Block A above).

**IF IT RECURS:** capture the failed URL, request initiator, response source
(SW/memory/disk/network), controlling worker, and cache contents **before
clearing anything**. Use the panel's **Copy diagnostic details**. That evidence
is what this whole step lacked — the Aug 1 cause was never identified.

## Rejected with proof

- **`navigateFallbackDenylist` for `/assets/`** — a **NO-OP** against this bug.
  The entry is a module script; the HTML module-fetch algorithm creates its
  request with mode `'cors'`, and Workbox's `NavigationRoute` rejects every
  request whose mode is not `'navigate'` **before** evaluating its denylist. The
  prior handoff called this "the highest-value fix"; it was materially wrong.
  Ratified across four review rounds.
- **`autoUpdate` + `skipWaiting`/`clientsClaim`** — would destroy the
  running/rest session gate; a reload mid-round discards in-progress reaction
  results.
- **`_routes.json`** — a Pages Functions mechanism; this project has none.
- **`_redirects` status rewrite (`/assets/* /404.html 404`)** — Cloudflare Pages
  documents "Rewrites (other status codes)" as unsupported.

## Process note

Seven reviewer-board rounds. Three defects were caught that would have shipped:
destruction of a working offline installation; an unregister race that would
have produced a **permanent** blank screen; and a captive-portal hole in the
reachability probe. Two of the three were introduced by the fix itself.

The plan grew from a config change to a nine-block epic across rounds 1–3, all
resting on a cause that was never identified. Asking whether it was necessary at
all cut it to four blocks and eliminated every then-blocking defect at once,
because all of them were consequences of automatic destruction.

One measurement beat all reasoning: every reviewer accepted an
`id="rd-app-entry"` marker design; a build probe showed Vite drops arbitrary
attributes from the entry tag.
