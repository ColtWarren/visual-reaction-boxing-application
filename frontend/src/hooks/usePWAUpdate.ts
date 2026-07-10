import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import type { SessionStatus } from './useSessionState';

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
 */
export function usePWAUpdate(status: SessionStatus): PWAUpdateState {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(
    null,
  );

  useEffect(() => {
    // Runs once (StrictMode double-invoke is harmless: registerSW is idempotent
    // and the second closure simply replaces the ref with an equivalent updater).
    updateSWRef.current = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      // onOfflineReady intentionally unhandled here — Block 14 owns user-facing
      // "ready to work offline" messaging.
    });
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
