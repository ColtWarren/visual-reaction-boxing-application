/**
 * useStimulusEngine — React hook that drives cue appearance/disappearance.
 *
 * Step 5.6 (current): cues appear for CUE_DISPLAY_MS, disappear for
 *                     a randomized ISI (2-5s), repeating indefinitely.
 *                     First commit where the app exhibits real
 *                     reaction-training UX.
 * Step 6+: input handler will read cue value to detect reaction times.
 *          IMPORTANT: input/timing hooks should receive cue as an argument,
 *          NOT call useStimulusEngine() internally — that would create a
 *          second engine instance running concurrently. Only the owning
 *          component (App.tsx today) calls this hook.
 * Step 7+: timing measurement will extend the active stimulus state with
 *          an appearance timestamp (refined v2 per R39A — current code
 *          does NOT yet expose a timestamp; that's a Step 7 addition).
 * Step 10+: level progression may tune CUE_DISPLAY_MS and ISI bounds.
 *
 * Lifecycle:
 *   mount → wait ISI → show cue → wait CUE_DISPLAY_MS → hide cue → wait ISI → ...
 *
 * The first cue appears AFTER the initial ISI (no special-casing). This
 * mimics real reaction training: you sit down, wait, stimuli begin.
 * The 2-5s of dark canvas on page load IS INTENTIONAL UX, not a missing
 * loading state (R39B + R39C confirmed for V1 boxing-training context).
 *
 * Known v1 limitations (NOT bugs — see "What This Step Does NOT Include"):
 *   - Background tab throttling: browsers reduce setTimeout resolution in
 *     inactive tabs, causing apparent pause or timing drift on tab return.
 *     Visibility API integration deferred to Step 6+ when input handling
 *     is wired (R39A + R39B + R39C consensus).
 */

import { useEffect, useState } from 'react';
import { getRandomCardinalCue, type CueDictionaryEntry } from '../lib/cueDictionary';

// Timing constants. Documented values (Step 5.6 v1):
//   CUE_DISPLAY_MS — typical reaction-training display window. Long enough
//                    to perceive and react; short enough to require attention.
//                    800ms is a forgiving V1 baseline appropriate for the
//                    "Inside Fighter" mode introductory level. Future levels
//                    may tighten this (Step 10+).
//   ISI_MIN_MS / ISI_MAX_MS — inter-stimulus interval range. Below 2s feels
//                              rapid-fire; above 5s causes disengagement.
//
// TODO (Step 5.7+ or Step 10+): Replace Math.random with injectable seeded
// RNG for level progression and test reproducibility. Both the cue selection
// (in getRandomCardinalCue) AND the ISI calculation here will eventually
// share that RNG.
const CUE_DISPLAY_MS = 800;
const ISI_MIN_MS = 2000;
const ISI_MAX_MS = 5000;

/**
 * Returns an object with the currently-visible cue (or null when no cue
 * is showing). Object shape (vs bare value) is forward-compatible with
 * Step 6+ adding fields like `pause`, `restart`, `isPaused` without
 * breaking call sites (R39C).
 *
 * Consumers conditionally render:
 *   const { cue } = useStimulusEngine();
 *   {cue && <Cue color={cue.color} position={cue.position} />}
 */
export function useStimulusEngine(): { cue: CueDictionaryEntry | null } {
  const [cue, setCue] = useState<CueDictionaryEntry | null>(null);

  useEffect(() => {
    // Nullable timeoutId for defensive programming (R39A polish).
    // The recursive scheduler always assigns synchronously before any
    // cleanup can run, but `null` initial state makes intent explicit
    // and avoids any "used before assigned" theoretical concern.
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // `cancelled` is a closure variable. Safe here because useEffect
    // runs only once (empty dep array). If this effect ever gains
    // dependencies and re-runs, move `cancelled` to a useRef to avoid
    // staleness across runs (R39B note for future maintainability).
    let cancelled = false;

    function scheduleNextCue() {
      const isi = Math.random() * (ISI_MAX_MS - ISI_MIN_MS) + ISI_MIN_MS;
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setCue(getRandomCardinalCue());
        // Show cue for CUE_DISPLAY_MS, then hide and schedule next.
        timeoutId = setTimeout(() => {
          if (cancelled) return;
          setCue(null);
          scheduleNextCue();
        }, CUE_DISPLAY_MS);
      }, isi);
    }

    scheduleNextCue();

    // Cleanup: handle both pending and post-cleanup callbacks.
    //   clearTimeout — cancels pending callbacks that haven't fired yet.
    //   cancelled flag — guards against state updates by callbacks that
    //                    fire after cleanup (e.g., callback was already
    //                    queued in the event loop when cleanup ran, or
    //                    the component unmounts mid-callback execution
    //                    before React processes the setCue update).
    // Both are needed: clearTimeout alone misses post-cleanup callbacks;
    // cancelled alone leaks scheduler load. React 19 Strict Mode
    // double-mounts in development, making correct cleanup non-optional.
    // (Refined v2 per R39A — original wording overstated this as
    // "in-flight" interruption; JS callbacks aren't interrupted mid-run.)
    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return { cue };
}
