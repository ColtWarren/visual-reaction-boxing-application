import { useEffect, useRef, useState } from 'react';
import { getRandomCardinalCue } from '../lib/cueDictionary';
import type { ActiveStimulus } from '../types/stimulus';

const DISPLAY_WINDOW_MS = 800;
const ISI_MIN_MS = 2000;
const ISI_MAX_MS = 5000;

// Public return shape (object form for forward compatibility — Step 8 wraps the
// cue in ActiveStimulus with per-occurrence id + appearedAtMs).
export interface StimulusEngineState {
  stimulus: ActiveStimulus | null;
}

/**
 * Stimulus cycling engine. Modality-agnostic (per v3 doc principle).
 *
 * Cycles whenever `active` is true (typically: session is running).
 * Consumers gate the stimulus by mode at their use site — engine doesn't
 * know about visual/audio/combined modes.
 *
 * When `active` becomes false:
 * - Pending timeouts cancelled
 * - Current stimulus cleared to null
 * - Effect cleanup uses `cancelled` flag + clearTimeout for race-safety
 *
 * The active boolean is true when:
 *   session.status === 'running'
 * (This is the input that App.tsx computes and passes in.)
 *
 * Each emitted stimulus carries:
 * - id: monotonic counter, NEVER reset across sessions within an app mount.
 *   Only a page refresh resets it to 0. (R53 I1.)
 * - cue: the static dictionary entry (color/position/action).
 * - appearedAtMs: performance.now() captured at state-set, AFTER the
 *   cancelled guard. Step 9 will use this for reaction-time math
 *   (inputAtMs - appearedAtMs).
 */
export function useStimulusEngine(active: boolean): StimulusEngineState {
  const [currentStimulus, setCurrentStimulus] = useState<ActiveStimulus | null>(null);
  const timeoutIdRef = useRef<number | null>(null);
  // Mount-level monotonic counter. NEVER reset per session (R53 I1) — ids
  // continue across Stop/Start within the same app mount; only a page
  // refresh resets it to 0.
  const nextStimulusIdRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      // Inactive: clear any pending timeout, ensure stimulus is null
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      // Clearing timer-driven stimulus state on deactivation; not derived state.
      // The R50C return-gate handles consumer correctness; this clears
      // internal state for cleanliness and Strict Mode determinism.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentStimulus(null);
      return;
    }

    // Active: kick off cycling
    // The cancelled flag protects against stale callbacks firing after cleanup.
    // This is the standard React pattern for effect cleanup with async work.
    let cancelled = false;

    const scheduleNext = (): void => {
      // Random ISI before next stimulus (2-5 seconds)
      const isi = ISI_MIN_MS + Math.random() * (ISI_MAX_MS - ISI_MIN_MS);
      timeoutIdRef.current = window.setTimeout(() => {
        if (cancelled) return;
        // Show stimulus — capture id + timestamp at state-set, AFTER the
        // cancelled guard. The guard-before-increment prevents a Strict Mode
        // discarded mount from advancing the id counter or capturing a stale
        // timestamp. (R53 I1, I6.)
        setCurrentStimulus({
          id: nextStimulusIdRef.current++,
          cue: getRandomCardinalCue(),
          appearedAtMs: performance.now(),
        });
        // After display window, clear and schedule next.
        // LOAD-BEARING: this is normal mid-cycle stimulus disappearance.
        timeoutIdRef.current = window.setTimeout(() => {
          if (cancelled) return;
          setCurrentStimulus(null);
          scheduleNext();
        }, DISPLAY_WINDOW_MS);
      }, isi);
    };

    scheduleNext();

    // Cleanup: cancel pending timeouts and clear stimulus
    return () => {
      cancelled = true;
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      // Clearing timer-driven stimulus state on cleanup; not derived state.
      // The R50C return-gate handles consumer correctness; this clears
      // internal state for cleanliness and Strict Mode determinism.
      setCurrentStimulus(null);
    };
  }, [active]);

  // Belt-and-suspenders (R50C): return derived null when inactive.
  // Even if cleanup hasn't run yet (passive effect timing), an inactive
  // engine never exposes a stale stimulus to consumers. This is the
  // engine-side half of the idle-stale-cue fix; App.tsx's isSessionRunning
  // gate is the consumer-side half. Both ends closed.
  return { stimulus: active ? currentStimulus : null };
}
