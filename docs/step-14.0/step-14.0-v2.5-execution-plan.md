# Step 14.0 — Boot Failure Visibility

**Execution plan v2.5 — RATIFIED FOR EXECUTION**

Branch: `dev` @ `3ceed21`
Baseline: `main` @ `66a23e8` (v0.14.0)
Preview origin: `https://dev.visual-reaction-boxing-application.pages.dev` (verified 200)
Target release: **v0.14.1**

### Changes from v2.4 (board round 7 — documentation only)

**Zero architectural blockers, zero code blockers.** All three reviewers ratified the Block B code. Every finding was a stale statement left behind by earlier rounds. No implementation changed.

1. **"A 404 is a pass" corrected** — the most important fix. The v2.4 code and tests treat 404 as a *failure*; the design note still said pass. A maintainer reading only the note could have "fixed" the code back to the unsafe rule.
2. **Obsolete deferred item removed** — §3 still said an origin-reachability probe was "only needed if something destructive is automatic." The user-initiated reset already uses one.
3. **Limitation count corrected** (four → six); **stale round count** in the closing status corrected.
4. **Contradictory CSP wording fixed** — "closed pending confirmation" replaced with "recorded, confirmation pending." Two reviewers probed and found no CSP; a third could not reach the preview host.
5. **CSP directive family made exact** — CSP3 governs `<script>` elements via `script-src-elem` and `style=""`/`cssText` via `style-src-attr`, both falling back to `script-src`/`style-src`/`default-src`.
6. **Marker-contract test made explicit** in Block C (was only implied by failure point 4a).
7. **New limitation 6** — the probe proves a recognizable shell is retrievable, not that every chunk of the current deployment will download.

### Changes from v2.3 (board round 6 — micro-delta, no architectural change)

Round 6 found no architectural issues. Both reviewers ratified `retireIfMounted()`, the intentional terminal `resetting` state, and the SW-can't-intercept-the-probe analysis. Three narrow code fixes and one recon closure.

1. **P0 — `probeOrigin()` accepted any HTTP response as proof of reachability.** A captive portal, TLS-interception box, or auth gateway returns a readable `200`, so destruction would proceed and the navigation would land on the portal — offline installation gone, by the exact mechanism the probe exists to prevent. Fixed: `mode: 'same-origin'`, `redirect: 'error'`, `res.ok`, same-origin final URL, `text/html` content type, **and two app-shell body markers**. A 404 is now a **failure**, not a pass — per E14 a missing route is rewritten to `index.html` with `200`, so a 404 means the environment no longer matches the assumption the probe rests on.
2. **P1 — `diagnostics()` mutated after return.** Three sub-bugs: the timer was never cleared, so `partial` flipped true 3 s after a *successful* collection; late-settling jobs could mutate the returned object; and a rejected collector left `partial: false` while reporting empty data. Fixed with `done`/`expired` guards, timer clearing, and returning a serialized snapshot.
3. **CSP — reviewer finding recorded, independent confirmation pending.** Two reviewers probed all three live origins (Aug 8–9): no `Content-Security-Policy` or `Content-Security-Policy-Report-Only` on any, and no `_headers` on `origin/dev`. A third could not reach the preview host to reproduce. **Colt confirms in Block A.**
4. **CSP verification strengthened** (Codex) — `script-src` and `style-src` are separate directives, and row 10c only proved the *script* runs. On a normal boot `panel()` never executes, so its inline styles were never exercised. The row now requires a rendered panel.
5. Comment added marking the terminal `resetting` state intentional, so a future reader doesn't "fix" it.

### Changes from v2.2 (board round 5 — all findings in Block B's inline code)

Round 5 ratified the architecture, scope, §3.1, Block D strategy, and Block A approach. Every finding was in Block B — the section v2.2 flagged as deserving final scrutiny. Two were defects introduced in v2.2 itself.

1. **P0 — reset was not actually offline-safe.** `offline` was evaluated once at panel render; the second click then destroyed with no further check. Fixed: re-check `navigator.onLine` **and** run an uncached same-origin reachability probe immediately before any destruction. The origin-reachability probe moves out of Deferred §3 into the user-initiated reset path.
2. **P0 — `MutationObserver` could miss the mount it exists to detect.** Module scripts run *before* `DOMContentLoaded`, so the DCL fallback attached the observer after the only mutation had already happened — leaving the panel over a working app. Fixed: `startObs()` retires immediately if the root is already filled.
3. **P1 — the 15 s reset timeout was not final.** A later resolution still navigated. Fixed with an `abandoned` flag the success path checks.
4. **P1 — diagnostics could hang.** `getRegistrations()` / `caches.keys()` are promises that may never settle. Fixed with a 3 s cap returning partial data.
5. **New CSP recon gate.** An enforcing `script-src` without a nonce or hash blocks inline scripts outright, silently disabling the entire guard. Not previously checked.
6. **`speechSynthesis.getVoices()` added to diagnostics** (DeepSeek) — would answer the offline-audio question (E23) if it ever surfaces on another device.
7. Two documentation fixes: Block D drops the word "full"; the recon prose quoted panel copy that does not exist.

### Changes from v2.1 (pre-write recon — measured, not reviewed)

Three probes run against the live repo before writing Block B. Two open recon items are now closed findings, and one changed the design.

1. **Entry-script detection no longer uses `id`.** Vite **drops arbitrary attributes** on the entry tag — measured, `grep -c 'rd-app-entry' dist/index.html` → 0. Detection changes to `type="module"` + same-origin. Had this gone unmeasured, Block B would have shipped a fast path that could never fire, with tests passing because they'd mock an element carrying an `id` the build removes.
2. **E25 added** — inline `<head>` scripts survive verbatim and are emitted **before** Vite's injected entry script. This is what makes the capture-phase listener work; previously an inference, now measured.
3. **Recon items 1 and 2 closed** (attribute preservation; query-param routing safety). Item 3 closed by Q3 recon — the app never writes to Cache Storage.
4. **Payload cost recorded** — the guard adds ~4–6 kB uncompressed to every load and enters the precache manifest.

### Changes from v2.0 (board round 4)
Round 4 ratified the scope reduction unanimously. All three reviewers agreed nothing load-bearing was dropped. Remaining items are implementation hardening — no architectural change.

1. **Reset control hidden while offline** (Codex) — v2.0 offered a destructive action in the exact state where it must not be used.
2. **Non-destructive diagnostic capture added** (Codex) — v2.0's reset destroyed the evidence §4 says to preserve.
3. **30-second poll cutoff → state-based retirement** (Codex) — a 31-second mount would strand the panel over a working app.
4. **Panel attaches safely when `document.body` is absent** (Codex) — the watchdog is head-anchored.
5. **Non-navigating timeout for a hung reset** (Codex) — no blind reload.
6. **Controls disabled during reset; confirmation added** (Codex).
7. **Renamed "Reset app data" → "Clear cached app files"** (Codex) — it clears caches and registrations, not all app data.
8. **Marker comments added to Block B** (ChatGPT) — Block C referenced markers Block B never added.
9. **Block D check clock initialized at registration** (Codex); full Vite PWA no-cache header pattern (ChatGPT).
10. **E22 narrowed to custom-domain behavior** (ChatGPT empirical probe, pending independent confirmation).
11. **Offline reframed as a primary usage mode**, not an edge case.

---

## 1. Scope and rationale

**Goal: turn an unexplained white screen into a visible failure with a button.** Cause-agnostic — it holds whether the trigger is a stale worker, a broken deploy, an evicted cache, or something never considered.

**Why not more.** The Aug 1 cause was never identified. v1.3 §2 was retitled "Working causal hypothesis" after two reviewers corrected the original explanation. One occurrence, one long-used dev profile; incognito on the same machine and deploy never reproduced it. Production is healthy for fresh visitors (E15). Automatic recovery produced a defect in three consecutive rounds — offline destruction (r2), an unregister race leaving a *permanent* blank screen (r3), and offering destructive reset to offline users (r4).

**Non-goals:** diagnosing the Aug 1 incident · automatic destruction of any cache or registration · changing the update model · changing deploy routing.

### Offline is a primary usage mode, not an edge case

Reaction Defense is used in metal-frame gyms (near-Faraday enclosures), basements, garages, and on aircraft. **Offline capability is a product property, not a fallback.**

**Verified this session (S23, airplane mode, installed PWA + browser):** a complete training session runs with zero network — visual cues, input, timing, scoring, preferences, **and audio**.

| Subsystem | Offline | Basis |
|---|---|---|
| Visual cues | ✅ | Precached JS/CSS/HTML |
| Input handling | ✅ | Local |
| Timing / scoring | ✅ | `performance.now()`, in-memory |
| Preferences | ✅ | localStorage |
| Session stats | ✅ | In-memory, no backend |
| Audio cues | ✅ verified on S23 | Web Speech API; default voice is local on this device |

**Audio caveat (recon, this session):** `useAudioCueRenderer.ts` pins no voice — no `getVoices`, `voiceURI`, or `.lang`; rate/pitch/volume are platform defaults. A device whose default resolves to a *network* voice could fail offline. **This degrades safely:** three failure paths (`utterance.onerror`, a 1500 ms watchdog if `onstart` never fires, missing voice line) all route to `onAudioFailed`, so a failed cue is marked failed rather than silently polluting reaction data. Not addressed here. Logged for Step 14.1: after N consecutive audio failures, tell the user audio is unavailable on this device.

**Consequence for this plan:** destroying caches is destroying the offline installation. That is why the reset control is hidden offline and never automatic.

### First-upgrade limitation

**A user wedged on a pre-guard shell cannot be helped by anything in this step.** The inline code lives in `index.html`; someone stuck on the `66a23e8` shell does not have it. This hardens *future* deploys. It is **not** a rescue for anyone currently wedged — that population still needs "clear site data."

v1.0–1.3 claimed *"a returning user never sees a white screen."* Overclaimed across three versions. Must appear in the completion record and release notes.

---

## 2. Evidence retained

| # | Finding | Evidence |
|---|---|---|
| E1 | `registerType: 'prompt'`, `injectRegister: null`, `runtimeCaching: []` | `vite.config.ts` |
| E7 | Prompt held back while `status === 'running' \|\| 'rest'` | `usePWAUpdate.ts` |
| E9 | **No `onRegisteredSW` handler** — no update check after registration | `usePWAUpdate.ts` |
| E10 | `_redirects` = `/*    /index.html   200` | file read |
| E12 | Missing hashed asset → `200` + `text/html` | curl prod |
| E13 | Poisoned response: `cache-control: public, max-age=14400` | curl prod |
| E14 | Missing non-asset route → `200` + `text/html`, `max-age=0, must-revalidate` | curl prod |
| E15 | **Real deployed asset → `200` + `application/javascript`** — production healthy | curl prod |
| E16 | Entry tag: `<script type="module" crossorigin src="...">` | `dist/index.html:12` |
| E19 | Source `index.html` 18 lines; `<div id="root">` L14; module tag L15 | confirmed |
| E20 | Preview branch alias resolves `200` | curl |
| E22 | `max-age=14400` on `.js`, `max-age=0` on routes — same rewrite, same body | probes A/B/C |
| **E23** | **Audio is Web Speech API, no voice pinned; three failure paths to `onAudioFailed`; 1500 ms watchdog** | `useAudioCueRenderer.ts` |
| **E24** | **S23 airplane mode: installed PWA and browser both run full sessions incl. audio** | device test |
| **E25** | **Inline `<head>` scripts survive verbatim (not minified/hoisted) and are emitted BEFORE Vite's injected entry script** — dist lines 12–17 vs 18 | build probe 0b |
| **E26** | **Vite drops arbitrary attributes on the entry tag.** `id="rd-app-entry"` added to source → absent from dist. `type` survives, `crossorigin` added, `src` rewritten | build probe 0 |
| **E27** | **App never writes Cache Storage.** `caches.open\|put\|match\|add` → no hits. Exactly one storage key anywhere: `reaction-defense.preferences.v1` (localStorage). No IndexedDB, no sessionStorage | symbol sweep |

**E22 narrowed (ChatGPT round 4).** ChatGPT reports probing all three origins on Aug 5: custom domain returned `max-age=14400, must-revalidate`; both `pages.dev` origins returned `max-age=0, must-revalidate`. If accurate, the four-hour TTL is **custom-domain-specific**, not a platform default. **Confirm independently in Block A** — this is a reviewer claim about live infrastructure, exactly the class of claim the workflow requires verifying.

**§3.1 settled across four rounds:** `navigateFallbackDenylist` is a no-op here. Module scripts fetch with `mode === 'cors'`; Workbox's `NavigationRoute` rejects non-navigate requests before evaluating any denylist. The prior handoff's recommended fix does not apply. **Do not relitigate.**

---

## 3. Deferred (not rejected)

Revisit **only if the failure recurs**, ideally with a captured diagnosis:

- **Automatic destructive recovery** — three rounds, three defects; needs a confirmed cause
- **Deterministic fault injection** (v1.3 Block 0B) — elaborate reproduction of something reachable via "clear site data"
- **Nested `/assets/404.html` routing** (v1.3 Block 4) — changes every deep link's routing boundary

**If it recurs:** use Block B's diagnostic capture *before* clearing anything. That evidence is what this plan has lacked from the start.

---

## 4. Blocks

---

### Block A — Cloudflare cache investigation

**No code changes.** Investigation only.

1. Probe the same missing `.js` path against: production custom domain · production `pages.dev` · `dev` preview alias. **Independently confirm or refute ChatGPT's E22 finding.**
2. Record per origin: `Cache-Control`, `CF-Cache-Status`, `Age`, `Content-Type`, `ETag`, body identity.
3. If the custom domain differs, inspect the zone for: Browser Cache TTL (and whether "Respect Existing Headers") · Cache Rules · legacy Page Rules · any extension or path rule touching `/assets/*`.

**Do not apply a change in this step.** Round 4 was unanimous: Cloudflare warns custom Pages caching can preserve stale responses, and a path-level rule cannot distinguish a valid immutable hash from a missing hash rewritten to HTML — it could improve one path while degrading caching for every valid bundle. If a project-specific rule is found to be the source, revising it is a separate, separately-ratified change.

**Gate:** findings recorded.

---

### Block B — Inline boot failure panel

**File:** `frontend/index.html` (18 lines, E19)

**Nothing is deleted without an explicit user action, and never while offline.**

**No source change to the entry tag.** Per E26, Vite emits a freshly-constructed entry script and discards arbitrary attributes, so an `id` marker is not available. Detection matches on what is *verified* to survive: `type="module"` (E26) and same-origin.

Per E25, an inline script authored in the source `<head>` is emitted **before** the injected entry script, so the capture-phase listener is installed at parse time — before the deferred module is fetched. That ordering is what makes the fast path possible.

Inline `<script>` in `<head>`, above the module tag, wrapped in the markers Block C extracts:

```html
<!-- RD_BOOT_GUARD_START -->
<script>
  (function () {
    var WATCHDOG_MS = 10000;
    var RESET_UI_TIMEOUT_MS = 15000;
    var DIAG_TIMEOUT_MS = 3000;
    var PROBE_TIMEOUT_MS = 5000;
    var shown = false, settled = false, resetting = false;
    var trigger = null;

    function rootEl() { return document.getElementById('root'); }
    function rootFilled() {
      var r = rootEl();
      return !!(r && r.firstChild);
    }

    function diagnostics() {
      var d = {
        at: new Date().toISOString(),
        url: location.href,
        ua: navigator.userAgent,
        online: navigator.onLine,
        trigger: trigger,
        controller: null,
        registrations: [],
        caches: [],
        voices: null,
        partial: false
      };
      var jobs = [];
      var done = false, expired = false;
      function write(fn) { if (!expired && !done) { try { fn(); } catch (_) {} } }
      function partial() { write(function () { d.partial = true; }); }

      try {
        if (window.speechSynthesis && speechSynthesis.getVoices) {
          // E23: answers the offline-audio question if it ever surfaces.
          d.voices = speechSynthesis.getVoices().map(function (v) {
            return { name: v.name, lang: v.lang, local: v.localService, def: v.default };
          });
        }
      } catch (_) {}
      try {
        if (navigator.serviceWorker) {
          d.controller = navigator.serviceWorker.controller
            ? navigator.serviceWorker.controller.scriptURL : null;
          jobs.push(
            navigator.serviceWorker.getRegistrations().then(function (rs) {
              write(function () {
                d.registrations = rs.map(function (r) {
                  return {
                    scope: r.scope,
                    active: r.active ? r.active.scriptURL : null,
                    waiting: r.waiting ? r.waiting.scriptURL : null,
                    installing: r.installing ? r.installing.scriptURL : null
                  };
                });
              });
            }).catch(partial)   // a failed collector means INCOMPLETE data
          );
        }
        if (window.caches && caches.keys) {
          jobs.push(caches.keys()
            .then(function (ks) { write(function () { d.caches = ks; }); })
            .catch(partial));
        }
      } catch (_) { d.partial = true; }

      // getRegistrations() and caches.keys() can fail to settle in pathological
      // storage states. Cap collection rather than hang. Round 6 P1: the timer
      // must be CLEARED on success (else partial flipped true 3 s after a clean
      // collection), late jobs must not mutate the returned object, and the
      // result is returned as a snapshot so nothing can change it afterward.
      var diagTimer = null;
      var capped = new Promise(function (resolve) {
        diagTimer = window.setTimeout(function () {
          if (done) return;
          expired = true;
          d.partial = true;
          resolve('timeout');
        }, DIAG_TIMEOUT_MS);
      });
      function snapshot() {
        done = true;
        if (diagTimer !== null) window.clearTimeout(diagTimer);
        try { return JSON.parse(JSON.stringify(d)); } catch (_) { return d; }
      }
      return Promise.race([
        Promise.all(jobs).then(function () { return 'complete'; },
                               function () { return 'complete'; }),
        capped
      ]).then(snapshot, snapshot);
    }

    function probeOrigin() {
      // Proves a healthy Reaction Defense shell is retrievable from the network
      // RIGHT NOW — not merely that something answered. A captive portal, auth
      // gateway or TLS-interception box returns a readable 200 (round 6 P0).
      //
      // Non-navigation fetch: Workbox NavigationRoute only matches mode
      // 'navigate' (§3.1), runtimeCaching is [] (E1), and the ?t= param is not
      // in Workbox's default ignore list, so this genuinely hits the network.
      // Deliberately NOT an /assets/ path — that is the URL class the SPA
      // rewrite poisons (E12).
      var url = '/__rd-reset-probe__?t=' + Date.now().toString(36);
      var timed = new Promise(function (_, reject) {
        window.setTimeout(function () { reject(new Error('probe-timeout')); },
          PROBE_TIMEOUT_MS);
      });
      var req = fetch(url, {
        mode: 'same-origin',
        redirect: 'error',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'cache-control': 'no-cache' }
      }).then(function (res) {
        // 404 is a FAILURE, not a pass: per E14 a missing route is rewritten to
        // index.html with 200, so a 404 means the environment no longer matches
        // the assumption this probe rests on.
        if (!res || !res.ok) throw new Error('probe-status');
        if (new URL(res.url || url, location.href).origin !== location.origin) {
          throw new Error('probe-origin');
        }
        var ct = (res.headers && res.headers.get)
          ? (res.headers.get('content-type') || '') : '';
        if (ct.indexOf('text/html') === -1) throw new Error('probe-type');
        return res.text();
      }).then(function (body) {
        // Stable app-shell markers, NOT guard-specific ones — an older
        // pre-guard shell is still a healthy origin (round 6).
        // KEEP IN SYNC WITH index.html: if either string changes, reset
        // fails closed and becomes unusable until this is updated.
        if (body.indexOf('<title>Reaction Defense Training</title>') === -1 ||
            body.indexOf('id="root"') === -1) {
          throw new Error('probe-marker');
        }
        return true;
      });
      return Promise.race([req, timed]);
    }

    function panel() {
      if (shown || settled || resetting || rootFilled()) return;
      shown = true;

      try {
        var offline = navigator.onLine === false;
        var parent = document.body || document.documentElement;
        if (!parent) { shown = false; return; }

        var host = document.createElement('div');
        host.id = 'rd-boot-failure';
        host.setAttribute('role', 'alert');
        host.style.cssText =
          'position:fixed;inset:0;z-index:2147483647;display:flex;' +
          'align-items:center;justify-content:center;padding:1.5rem;' +
          'background:#09090b;color:#fafafa;overflow:auto;' +
          'font-family:system-ui,-apple-system,sans-serif;text-align:center';

        host.innerHTML =
          '<div style="max-width:24rem;width:100%">' +
          '<h1 style="font-size:1.125rem;margin:0 0 .75rem">' +
          'Reaction Defense could not start</h1>' +
          '<p style="font-size:.875rem;line-height:1.5;margin:0 0 1.25rem;opacity:.8">' +
          (offline
            ? 'You appear to be offline. Reconnect and try again.'
            : 'Something went wrong loading the app.') +
          '</p>' +
          '<button id="rd-retry" style="min-height:44px;padding:0 1.25rem;' +
          'border:0;border-radius:9999px;background:#dc2626;color:#fff;' +
          'font-size:.875rem;cursor:pointer">Try again</button>' +
          (offline ? '' :
            '<p style="margin:1.25rem 0 0"><button id="rd-reset" ' +
            'style="min-height:44px;padding:0 1rem;background:none;border:0;' +
            'color:#a1a1aa;font-size:.8125rem;text-decoration:underline;' +
            'cursor:pointer">Clear cached app files</button></p>') +
          '<p id="rd-note" style="font-size:.75rem;margin:.5rem 0 0;opacity:.55">' +
          (offline
            ? 'Do not clear cached files until you reconnect — the app needs a connection to download again.'
            : 'Removes downloaded app files. Requires a connection to re-download.') +
          '</p>' +
          '<p style="margin:1rem 0 0"><button id="rd-diag" ' +
          'style="min-height:44px;padding:0 1rem;background:none;border:0;' +
          'color:#71717a;font-size:.75rem;text-decoration:underline;' +
          'cursor:pointer">Copy diagnostic details</button></p>' +
          '<textarea id="rd-diag-out" readonly style="display:none;width:100%;' +
          'height:9rem;margin-top:.5rem;font-size:.7rem;background:#18181b;' +
          'color:#d4d4d8;border:1px solid #3f3f46;border-radius:.375rem;' +
          'padding:.5rem"></textarea>' +
          '</div>';

        parent.appendChild(host);

        var note = document.getElementById('rd-note');
        var retry = document.getElementById('rd-retry');
        var reset = document.getElementById('rd-reset');
        var diagBtn = document.getElementById('rd-diag');
        var diagOut = document.getElementById('rd-diag-out');

        retry.onclick = function () { location.reload(); };

        diagBtn.onclick = function () {
          diagnostics().then(function (d) {
            var text = JSON.stringify(d, null, 2);
            diagOut.style.display = 'block';
            diagOut.value = text;
            diagOut.select();
            try {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                  diagBtn.textContent = 'Copied';
                }, function () {});
              }
            } catch (_) {}
          });
        };

        if (reset) {
          var beginReset = function () {
            resetting = true;
            note.textContent = 'Clearing cached files…';

            var finished = false, abandoned = false;
            var uiTimer = window.setTimeout(function () {
              if (finished) return;
              abandoned = true;   // P1 r5: a later resolution must NOT navigate
              // INTENTIONAL: `resetting` stays true from here on, so
              // retireIfMounted() can never remove this panel. Destructive work
              // has already begun and cache/SW state is indeterminate; dropping
              // the user into a half-cleared app would be worse. Terminal by
              // design — do not "fix" this. (round 6, ratified)
              note.textContent =
                'Automatic reset did not finish. Close this tab and clear site data in browser settings.';
              retry.disabled = false;
            }, RESET_UI_TIMEOUT_MS);

            var jobs = [];
            if (navigator.serviceWorker) {
              jobs.push(
                navigator.serviceWorker.getRegistrations().then(function (rs) {
                  return Promise.all(rs.map(function (r) { return r.unregister(); }));
                })
              );
            }
            if (window.caches && caches.keys) {
              jobs.push(
                caches.keys().then(function (ks) {
                  return Promise.all(ks.map(function (k) { return caches.delete(k); }));
                })
              );
            }

            // Await unregistration before navigating. A reload issued while
            // unregister() is pending can be intercepted by the stale worker.
            // Promise.all([]) resolves immediately where the APIs are absent —
            // correct: nothing to clear, so navigate.
            Promise.all(jobs).then(function () {
              finished = true;
              window.clearTimeout(uiTimer);
              if (abandoned) return;
              location.replace('/?rd-reset=' + Date.now().toString(36));
            }, function () {
              finished = true;
              window.clearTimeout(uiTimer);
              if (abandoned) return;
              note.textContent =
                'Reset failed. Clear site data in your browser settings.';
              retry.disabled = false;
            });
          };

          var rearm = function (msg) {
            note.textContent = msg;
            reset.disabled = false;
            retry.disabled = false;
            reset.dataset.confirmed = '';
            reset.textContent = 'Clear cached app files';
          };

          reset.onclick = function () {
            if (reset.dataset.confirmed !== '1') {
              reset.dataset.confirmed = '1';
              reset.textContent = 'Tap again to confirm';
              note.textContent =
                'This deletes downloaded app files. You will need a connection to use the app again.';
              return;
            }

            // P0 r5: `offline` was computed once at render. Connectivity can
            // change afterward, and navigator.onLine === true does NOT prove the
            // origin is reachable. unregister() and caches.delete() succeed fine
            // without internet — only the navigation fails, by which point the
            // offline installation is already destroyed. Re-check, then PROVE
            // reachability, before any destruction.
            if (navigator.onLine === false) {
              rearm('You are offline. Reconnect before clearing cached files.');
              return;
            }

            reset.disabled = true;
            retry.disabled = true;
            note.textContent = 'Checking connection…';

            probeOrigin().then(beginReset, function () {
              rearm('Cannot reach the server. Your cached files were NOT deleted — ' +
                    'reconnect and try again.');
            });
          };
        }
      } catch (_) {
        shown = false;   // never let the last line of defense throw silently
      }
    }

    function isAppEntry(t) {
      // E26: Vite drops arbitrary attributes, so no id marker is available.
      // type="module" is verified to survive; same-origin excludes third-party
      // scripts. The app emits exactly one module script.
      if (!t || t.tagName !== 'SCRIPT' || t.type !== 'module' || !t.src) return false;
      try {
        return new URL(t.src, location.href).origin === location.origin;
      } catch (_) { return false; }
    }

    window.addEventListener('error', function (e) {
      if (isAppEntry(e.target)) {
        trigger = 'entry-script-error';
        diagnostics().then(function (d) {
          if (window.console) console.error('[rd-boot] failure', d);
        });
        panel();
      }
    }, true);

    window.setTimeout(function () {
      if (rootFilled()) { settled = true; return; }
      trigger = trigger || 'watchdog';
      diagnostics().then(function (d) {
        if (window.console) console.error('[rd-boot] failure', d);
      });
      panel();
    }, WATCHDOG_MS);

    // Retire the panel if the app mounts late. Runs until settled — no cutoff.
    if (window.MutationObserver) {
      var retireIfMounted = function () {
        if (resetting || !rootFilled()) return false;
        settled = true;
        var host = document.getElementById('rd-boot-failure');
        if (host && host.parentNode) host.parentNode.removeChild(host);
        return true;
      };
      var obs = new MutationObserver(function () {
        if (retireIfMounted()) obs.disconnect();
      });
      var startObs = function () {
        var r = rootEl();
        if (!r) return false;
        // P0 r5: module scripts run BEFORE DOMContentLoaded, so by the time the
        // DCL fallback fires the mount mutation may already have happened. An
        // observer attached then would never fire, stranding the panel over a
        // working app. Check current state on attach, not just future mutations.
        if (retireIfMounted()) { obs.disconnect(); return true; }
        obs.observe(r, { childList: true });
        return true;
      };
      if (!startObs()) {
        document.addEventListener('DOMContentLoaded', startObs);
      }
    }
  })();
</script>
<!-- RD_BOOT_GUARD_END -->
```

**Design notes**
- **Offline hides the reset control entirely** (Codex r4). Offline is a primary usage mode (§1); the destructive action is exactly wrong there, and it's the button a user in a dead-signal gym would reach for. Copy explicitly warns against clearing until reconnected.
- **Diagnostic capture** (Codex r4) — resolves the contradiction where §3 says preserve evidence while the panel's secondary action destroys it. Also `console.error`s on every trigger, so evidence exists even if the user clicks nothing.
- **`MutationObserver`, no cutoff** (Codex r4) — v2.0's 30 s poll would strand the panel over an app that mounted at 31 s. Runs until settled.
- **`parent = document.body || document.documentElement`** (Codex r4) — head-anchored watchdog must not assume the body exists.
- **`try/catch` around the whole panel** — this is the last line of defense; an exception in it returns the user to a white screen.
- **Reset: confirm → re-check online → prove reachability → disable → await → navigate.** Round 5 P0: the render-time `offline` value was stale by the time the button was clicked, and `navigator.onLine === true` never proved the origin was reachable. `probeOrigin()` now gates every destruction with an uncached, same-origin, **non-navigation** fetch — Workbox's `NavigationRoute` can't intercept it (§3.1) and `runtimeCaching` is `[]` (E1), so it genuinely exercises the network. A 404 is a **failure**, not a pass: per E14 a healthy missing non-asset route is rewritten to the app shell with `200`, so a 404 means the environment no longer matches the assumption the probe rests on. The probe additionally requires a same-origin final URL after `redirect: 'error'`, `text/html`, and two app-shell body markers — a captive portal returns a readable `200` but cannot produce those.
- **Timeout is final** (round 5 P1). The `abandoned` flag makes a late resolution refuse to navigate, so a user who has moved on after the 15 s message is never yanked mid-action.
- **Diagnostics capped at 3 s** (round 5 P1) with `partial: true` recorded, since `getRegistrations()` and `caches.keys()` can fail to settle in pathological storage states.
- **`MutationObserver` retires on attach, not only on mutation** (round 5 P0). Module scripts run before `DOMContentLoaded`, so the DCL fallback could attach after the only mutation had already occurred — leaving the panel over a working app.
- **`WATCHDOG_MS = 10000`**, head-anchored. Nothing destructive follows, so a late panel costs little and this also covers a stalled module graph where `DOMContentLoaded` never fires. Verify under Slow 4G + 6× CPU throttle on the S23.
- **No `sessionStorage`.** No loop to guard, so no storage dependency and no storage-denied edge case.
- **Syntax is ES5-compatible**; requires `Promise`, Service Worker, Cache Storage — APIs the PWA already requires. `MutationObserver` is feature-detected.

**Recon — all three items CLOSED before writing:**
1. **Attribute preservation → `id` is dropped** (E26). Detection changed accordingly. Had this not been measured, the fast path would have been dead code with green tests.
2. **`?rd-reset=` is safe.** Nothing in `src/` reads the query string (no `location.search`, `URLSearchParams`, or `useSearch`); Wouter uses the implicit router with no `base` and matches on pathname, so `/?rd-reset=…` still matches `<Route path="/">`. `location.replace` with the cache-busting param stands.
3. **No user data in Cache Storage** (E27). Cache Storage holds only the 11 precached build assets, written solely by the Workbox SW. The panel's copy — "Removes downloaded app files. Requires a connection to re-download." — is accurate; no user data is lost, since the sole storage key is in localStorage and untouched.

**Recon — item 4 RECORDED, confirmation in Block A:**
4. **CSP.** ChatGPT probed all three live origins on Aug 9: **no `Content-Security-Policy` or `Content-Security-Policy-Report-Only` on any**. The inline guard is therefore unblocked today. **Confirm independently in Block A** — a reviewer claim about live infrastructure. Note the directive families are **separate**: if CSP is ever added, inspect `script-src-elem` / `script-src` / `default-src` for the inline guard, and `style-src-attr` / `style-src` / `default-src` for the panel's `style=""` attributes and `cssText`. CSP3 governs inline `<script>` elements and inline style attributes under different directives, so allowing one does not allow the other. A restrictive style policy would likely require moving panel styling into an allowed `<style>` block rather than dozens of inline attributes. Also check `_headers` — currently absent (E11), but that is where a CSP would land.

**Payload cost.** The guard adds roughly 4–6 kB uncompressed to every page load and enters the precache manifest (a 6-line probe grew `dist/index.html` 0.79 → 1.05 kB). Acceptable at this size; if the guard grows substantially past this, re-evaluate — it is insurance against a once-observed failure, paid on every load.

**Documented limitations (completion record):**
1. **First-upgrade limitation** — cannot help a user on a pre-guard shell. §1.
2. **Reset clears all caches and registrations for the origin**, not only Workbox precaches. The origin is dedicated to Reaction Defense, so this is intentional — state it explicitly.
3. **Post-boot dynamic-import failures out of scope** — root has children, panel does not fire.
4. **`navigator.onLine` is a hint, not proof of reachability** — so it is **not** relied on alone. v2.2's claim that a false "online" would "fail harmlessly" was **wrong** (round 5 P0): `unregister()` and `caches.delete()` succeed without internet; only the navigation fails, by which point the offline installation is gone. `navigator.onLine` now gates only *rendering* the control and choosing copy; every destruction is gated by an actual reachability probe.
5. **`location.replace('/…')` assumes root deployment.** If `DEPLOY_BASE` ever becomes a subpath, this hardcoded `/` is wrong and must move to the same constant `vite.config.ts` uses.
6. **The probe proves a shell is retrievable, not that recovery will succeed.** `probeOrigin()` confirms a recognizable Reaction Defense shell can be fetched from the network right now. It does not prove every JS/CSS chunk of the current deployment will subsequently download. That is the correct scope: the invariant being protected is *"don't destroy the offline installation merely because `navigator.onLine` claims connectivity,"* not *"guarantee every broken deployment can auto-recover."*

**Gate:** `npm run build`, raw stdout. Confirm the guard and both marker comments reach `dist/index.html`, and that the guard sits **above** the injected entry script (E25 says it will; verify, don't assume).

---

### Block C — Vitest coverage for the panel

**File:** `frontend/src/lib/bootPanel.test.ts` (new)

**Execute the real inline source.** Read `frontend/index.html`, extract between `RD_BOOT_GUARD_START` / `RD_BOOT_GUARD_END`, run in jsdom with mocked `navigator.serviceWorker`, `navigator.onLine`, `caches`, `location`, clipboard, and timers. **Fail loudly if either marker is missing** (ChatGPT r4).

Cases:
- same-origin `type="module"` script error → panel appears
- **cross-origin module script error → panel does NOT appear**
- **same-origin non-module (classic) script error → panel does NOT appear**
- script error with no `src` (inline) → panel does **not** appear
- malformed `src` (URL constructor throws) → caught, panel does **not** appear
- root filled before watchdog → no panel, settled
- root empty at watchdog → panel appears
- **late mount well past 30 s → panel still removed**
- **offline → reset control absent; no SW or cache API called**
- online → reset present
- reset requires confirmation → first click does not destroy
- **online at render → offline before confirm → nothing deleted, control re-arms**
- **`navigator.onLine === true` but reachability probe rejects → nothing deleted**
- **probe returns captive-portal HTML (200, wrong markers) → nothing deleted**
- **probe returns 404 → nothing deleted** (a 404 means the environment changed; E14)
- **probe redirected off-origin → nothing deleted** (`redirect: 'error'`)
- **probe returns non-HTML content-type → nothing deleted**
- **probe times out → nothing deleted**
- **probe returns real shell (title + `id="root"`) → reset proceeds**
- reset awaits unregister, then navigates
- reset with rejecting unregister → failure text, **no navigation**
- reset with never-settling unregister → UI timeout text, **no navigation**
- **resolves AFTER the 15 s timeout → still no navigation** (abandoned flag)
- **probe shell-marker contract** — read source `frontend/index.html` and assert it still contains **both** `<title>Reaction Defense Training</title>` and `id="root"`. Fails loudly if either drifts, since a harmless future title change would otherwise silently disable reset (failure point 4a)
- **diagnostics with never-settling `caches.keys()` → returns at 3 s with `partial: true`**
- **all jobs resolve before 3 s → `partial` still false AFTER advancing past 3 s** (timer cleared)
- **timed-out job resolves later → returned snapshot does not change**
- **collector rejects → `partial === true`**
- **late mount after an abandoned reset → panel is NOT retired** (terminal state)
- **root already filled when `startObs()` runs → panel retired immediately** (no mutation needed)
- double reset click → one operation
- **`document.body` absent at watchdog** → attaches to `documentElement`, does not throw
- no Service Worker / Cache Storage support → does not throw, navigates
- diagnostics collected on both trigger paths
- panel idempotent (error + watchdog → one panel)

**Gate:** `npm run build` + `npm test`, raw stdout. New file — stage by name, `git status --short --untracked-files=all`.

---

### Block D — Accelerated update discovery

**File:** `frontend/src/hooks/usePWAUpdate.ts`

Per E9 there is no update check after registration. This *accelerates* discovery for long-lived sessions; browsers already check during normal lifecycle events, so it is not the only mechanism.

- `onRegisteredSW(swUrl, registration)`
- Fetch `swUrl` with the Vite PWA request shape: the `cache: 'no-store'` fetch option **plus** `cache: 'no-store'` and `cache-control: 'no-cache'` request headers (round 5: v2.2 said "full pattern" while specifying only part of it); call `registration.update()` only on `200`
- Hourly interval **plus** `visibilitychange` → visible
- **`MIN_CHECK_GAP_MS = 5 * 60 * 1000`**, applied to *all* manual triggers
- **Initialize `lastCheckAt` at registration** (Codex r4) — otherwise a visibility event seconds later lands inside workbox-window's ~1-minute external-update heuristic window
- Set `lastCheckAt` **before** starting async work; in-flight flag
- Skip while `registration.installing` or `!navigator.onLine`; no repeated warnings while offline
- `try/catch` on both fetch and `update()`
- Interval id and visibility listener both cleared in `useEffect` cleanup

**Unchanged:** `registerType: 'prompt'`, `onNeedRefresh`, session gate, `updateServiceWorker`.

**Gate:** `npm run build` + `npm test`. Browser: SW registers, no console errors, toast still gated during a live round.

---

### Block E — Docs and release

- Matrix rows: *entry fails → panel appears, nothing deleted* · *reset → unregister completes → navigate → app boots* · *offline launch → offline copy, reset absent, offline app still works* · *offline full session (visual + audio) passes*
- `docs/step-14.0/STEP_14_0_COMPLETION.md` — Block A findings, all six Block B limitations, §3 deferrals with recurrence-capture instructions, the offline-capability verification (E24), the audio caveat (E23) flagged for 14.1, and the scope-reduction rationale including that four review rounds refined a fix nobody had questioned the need for
- Bump to `0.14.1`; verify in Settings / About / Sidebar
- Update handoff: strike the `navigateFallbackDenylist` recommendation; record §3.1 as settled

---

## 5. Verification

| # | Check | Method | Expected |
|---|---|---|---|
| 1 | Block A findings recorded | 3 origins + zone inspection | E22 confirmed or refuted |
| 2 | Build clean | `npm run build`, raw stdout | exit 0 |
| 3 | Tests pass | `npm test`, raw stdout | 19 existing + new, green |
| 4 | Guard + markers in output, ordering correct | inspect `dist/index.html` | both markers present, guard **above** injected entry script |
| 5 | Normal boot unaffected | preview origin | no panel, no console noise |
| 6 | **Panel on simulated failure** | DevTools block entry script | panel appears, **nothing deleted** |
| 7 | Try again works | click | reload |
| 8 | Reset: confirm → clear → navigate | click twice, online | app boots on fresh URL |
| 9 | Reset failure surfaces | mock rejecting unregister | failure text, no navigation |
| 10 | **Offline panel has no reset control** | airplane mode + blocked entry | **reset absent; nothing deleted** |
| 10a | **Online at render, offline at click** | block entry, then airplane mode, click reset twice | **nothing deleted; control re-arms** |
| 10b | **LAN-without-internet reset attempt** | connect to a network with no route out | **probe fails; nothing deleted** |
| 10c | **CSP permits guard AND panel styles** | block entry under deployed CSP so the panel actually renders | guard runs, panel renders as full-screen styled overlay, **no `script-src` or `style-src` violation** |
| 11 | **Offline launch unaffected** | installed PWA, airplane mode | full session runs, visual + audio |
| 12 | Diagnostics capture | click Copy | JSON with controller, registrations, caches |
| 13 | Slow boot no false panel | Slow 4G + 6× CPU throttle | no panel, or retired on mount |
| 14 | Very late mount | mount at ~40 s | panel removed |
| 15 | Session gate intact | round running + update available | toast held until idle/summary |
| 16 | S23 physical device | Galaxy S23 Chromium, preview | boots, panel dormant |
| 17 | iOS | — | **UNVERIFIED by design** |

**Rows 10 and 11 matter most.** They prove the fix cannot damage the offline installation — the failure mode found in three consecutive review rounds.

---

## 6. Failure points

1. **False panel on slow boot** — 10 s watchdog + MutationObserver retirement; rows 13, 14
2. **Detection matches the wrong script** — any same-origin `type="module"` script failing triggers the panel. The app emits exactly one (E26), so this is precise today; a future second module script would widen it. Block C tests the negative cases
3. **`?rd-reset=` breaks routing** — recon confirms; fallback `location.replace('/')`
4. **Panel itself throws** — `try/catch`, minimal deps, tested in Block C
4a. **Probe markers drift from `index.html`** — `probeOrigin()` matches on `<title>Reaction Defense Training</title>` and `id="root"`. If either string changes, the probe fails closed and **reset becomes permanently unusable**. Fail-closed is the safe direction, but it is silent. Block C's presence test should assert both markers still exist in `index.html`.
5. **Reset leaves a half-cleaned state** — non-navigating timeout directs to browser settings
6. **First-upgrade limitation** — documented, not fixed
7. **Cause still unknown** — accepted; §3 records what to capture on recurrence
8. **New file unstaged** — `git status --short --untracked-files=all`

---

## 7. Commits

Colt runs all git writes. Single-quoted heredoc, backticks natural, **no `Co-Authored-By`**, stage by name.

- A: *(no commit — findings folded into E docs)*
- B: `Step 14.0 Block B — inline boot failure panel in index.html`
- C: `Step 14.0 Block C — vitest execution coverage for the boot panel`
- D: `Step 14.0 Block D — accelerated service-worker update discovery`
- E: `Step 14.0 Block E — docs + release 0.14.1 (boot failure visibility)`

Merge `dev` → `main` via `--no-ff` PR. **No squash** — per-block SHAs are cited in completion records.

---

## 8. Status

Round 4 ratified the scope reduction unanimously; all three reviewers confirmed nothing load-bearing was dropped. The ten required revisions from that round are applied above.

**Recommendation: ratify and execute.** Round 7 returned **zero architectural blockers and zero code blockers** from all three reviewers; every finding was stale documentation, now corrected. Rounds 5 and 6 each found real defects, but only in code introduced by the preceding round — the fixes are now small, localised, and covered by Block C's test list. Further paper review would refine a plan whose remaining risk lives in execution, not design.
