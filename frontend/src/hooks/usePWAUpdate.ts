import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import type { SessionStatus } from './useSessionState';

/**
 * Background poll for "has a newer build shipped?" — 1 hour.
 *
 * A precached PWA has no reason to ever hit the network again, so without a
 * poll an athlete can stay on a months-old build indefinitely: nothing breaks,
 * nothing prompts.
 */
const UPDATE_POLL_MS = 60 * 60 * 1000;

/**
 * Floor between two checks, whichever trigger asks. Backgrounding and
 * foregrounding the app repeatedly (normal between rounds) must not turn into
 * a burst of requests.
 */
const MIN_CHECK_GAP_MS = 5 * 60 * 1000;

export interface PWAUpdateState {
  /**
   * True once a new service worker has precached and is waiting to activate —
   * AND the session is not mid-flight (see gating below). Block 14 renders the
   * refresh prompt from this.
   */
  needRefresh: boolean;
  /** Activates the waiting worker and reloads to the new build. */
  updateServiceWorker: () => void;
}

/**
 * Single owner of the service-worker registration (Block 13).
 *
 * vite.config sets `injectRegister: null`, so nothing auto-registers a SW — this
 * hook calls `registerSW` exactly once on mount and is the ONLY place that does.
 * `registerType: 'prompt'` means an available update never activates on its own;
 * `onNeedRefresh` fires and we surface it via `needRefresh`.
 *
 * SessionStatus gates the prompt: a pending update discovered while the athlete
 * is in a live round ('running') or between-round 'rest' is held back — reloading
 * then would discard in-progress reaction results. The update resurfaces the
 * moment the session returns to 'idle' or 'summary'.
 *
 * Step 14.0 (Block D) adds polling + visibility-driven update checks. That
 * changes DISCOVERY ONLY — how soon a waiting worker is noticed. It does not
 * change activation: `registerType: 'prompt'` still holds, a found update still
 * lands on `onNeedRefresh`, and nothing swaps the running app until the user
 * accepts. The session gate below is untouched.
 */
export function usePWAUpdate(status: SessionStatus): PWAUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  );

  useEffect(() => {
    // Per-invocation, closure-scoped rather than refs. Each effect run owns the
    // timers and listener it created, so a torn-down run can never clear the
    // survivor's — which matters because onRegisteredSW is asynchronous (see
    // `disposed` below).
    let disposed = false;
    let pollId: number | undefined;
    let onVisibilityChange: (() => void) | undefined;

    // Runs once (StrictMode double-invoke is harmless: registerSW is idempotent
    // and the second closure simply replaces the ref with an equivalent updater).
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      // onOfflineReady intentionally unhandled here — Block 14 owns user-facing
      // "ready to work offline" messaging.
      onRegisteredSW(swScriptUrl, registration) {
        // This callback resolves off `wb.register()`, well after the effect body
        // returned, so the effect may already have been cleaned up (StrictMode
        // remount, or a real unmount). Installing a timer now would outlive the
        // cleanup that was supposed to remove it.
        if (disposed) return;

        // The installed signature is `ServiceWorkerRegistration | undefined` —
        // it fires even when no registration object is available, and an
        // unguarded registration.update() would throw inside this callback,
        // where nothing catches it.
        if (!registration) return;

        // Seeded to NOW, not 0. workbox-window classifies an update as
        // "external" only once 60s have passed since registration
        // (`performance.now() > registrationTime + 60000`), and the prompt path
        // keys off that flag. Starting at 0 would let a visibilitychange
        // seconds after load fire a check inside that window, where the
        // resulting update is classified differently than an ordinary later
        // one. Seeding to registration time puts the earliest possible check at
        // registration + MIN_CHECK_GAP_MS, comfortably clear of it.
        let lastCheckAt = Date.now();
        let checking = false;

        const checkForUpdate = async () => {
          if (checking) return;
          if (Date.now() - lastCheckAt < MIN_CHECK_GAP_MS) return;
          // An install already underway will announce itself through
          // onNeedRefresh; asking again would only race it.
          if (registration.installing) return;
          // Offline is a NORMAL state for this app — working without signal is
          // the entire point of the precache. Skip silently: a console warning
          // here would fire on every poll and every app-foreground for an
          // athlete training in a basement gym, which is noise, not a signal.
          if (!navigator.onLine) return;

          // Stamped BEFORE the await: a slow check must still consume its slot,
          // or the next trigger sails through the gap gate while this one runs.
          lastCheckAt = Date.now();
          checking = true;
          try {
            // Probe the SW script past every cache layer first. A stale cached
            // 200 would make registration.update() a no-op, and a captive
            // portal or dead network would make it pointless — only spend an
            // update() when the real script is genuinely reachable.
            const res = await fetch(swScriptUrl, {
              cache: 'no-store',
              headers: { 'cache-control': 'no-cache' },
            });
            if (res.ok) await registration.update();
          } catch {
            // Network failure, a blocked request, or update() rejecting. There
            // is nothing to recover here and the next trigger simply tries
            // again — but this must not throw out of a timer callback or an
            // event listener, where it would surface as an unhandled rejection.
          } finally {
            checking = false;
          }
        };

        pollId = window.setInterval(() => {
          void checkForUpdate();
        }, UPDATE_POLL_MS);

        // Foregrounding is the moment a check is most useful and least
        // intrusive: the athlete is between things rather than mid-round.
        onVisibilityChange = () => {
          if (document.visibilityState === 'visible') void checkForUpdate();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
      },
    });

    return () => {
      // Set first: a still-pending onRegisteredSW must not install a timer or a
      // listener after this point, since nothing would be left to remove them.
      disposed = true;
      if (pollId !== undefined) window.clearInterval(pollId);
      if (onVisibilityChange) {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    void updateSWRef.current?.(true);
  }, []);

  // Hold the prompt back during an active session; expose it otherwise.
  const sessionActive = status === 'running' || status === 'rest';

  return {
    needRefresh: needRefresh && !sessionActive,
    updateServiceWorker,
  };
}
