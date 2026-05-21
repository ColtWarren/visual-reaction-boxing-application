import { useEffect, useRef, useState } from 'react';
import { getRandomCardinalCue, type CueDictionaryEntry } from '../lib/cueDictionary';

const DISPLAY_WINDOW_MS = 800;
const ISI_MIN_MS = 2000;
const ISI_MAX_MS = 5000;

// Public return shape (object form for forward compatibility — Step 8 will add appearedAtMs)
export interface StimulusEngineState {
  cue: CueDictionaryEntry | null;
}

/**
 * Cue cycling engine. Modality-agnostic (per v3 doc principle).
 *
 * Cycles whenever `active` is true (typically: session is running).
 * Consumers gate the cue by mode at their use site — engine doesn't
 * know about visual/audio/combined modes.
 *
 * When `active` becomes false:
 * - Pending timeouts cancelled
 * - Current cue cleared to null
 * - Effect cleanup uses `cancelled` flag + clearTimeout for race-safety
 *
 * The active boolean is true when:
 *   session.status === 'running'
 * (This is the input that App.tsx computes and passes in.)
 */
export function useStimulusEngine(active: boolean): StimulusEngineState {
  const [currentCue, setCurrentCue] = useState<CueDictionaryEntry | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      // Inactive: clear any pending timeout, ensure cue is null
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      // Clearing timer-driven cue state on deactivation; not derived state.
      // The R50C return-gate (line ~83) handles consumer correctness; this
      // clears internal state for cleanliness and Strict Mode determinism.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentCue(null);
      return;
    }

    // Active: kick off cycling
    // The cancelled flag protects against stale callbacks firing after cleanup.
    // This is the standard React pattern for effect cleanup with async work.
    let cancelled = false;

    const scheduleNext = (): void => {
      // Random ISI before next cue (2-5 seconds)
      const isi = ISI_MIN_MS + Math.random() * (ISI_MAX_MS - ISI_MIN_MS);
      timeoutIdRef.current = window.setTimeout(() => {
        if (cancelled) return;
        // Show cue
        setCurrentCue(getRandomCardinalCue());
        // After display window, clear and schedule next
        timeoutIdRef.current = window.setTimeout(() => {
          if (cancelled) return;
          setCurrentCue(null);
          scheduleNext();
        }, DISPLAY_WINDOW_MS);
      }, isi);
    };

    scheduleNext();

    // Cleanup: cancel pending timeouts and clear cue
    return () => {
      cancelled = true;
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      // Clearing timer-driven cue state on cleanup; not derived state.
      // The R50C return-gate (line ~83) handles consumer correctness; this
      // clears internal state for cleanliness and Strict Mode determinism.
      setCurrentCue(null);
    };
  }, [active]);

  // Belt-and-suspenders (R50C): return derived null when inactive.
  // Even if cleanup hasn't run yet (passive effect timing), an inactive
  // engine never exposes a stale cue to consumers. This is the engine-side
  // half of the idle-stale-cue fix; App.tsx's isSessionRunning gate is the
  // consumer-side half. Both ends closed.
  return { cue: active ? currentCue : null };
}
