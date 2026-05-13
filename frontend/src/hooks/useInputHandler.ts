/**
 * useInputHandler — captures keyboard input and classifies against current cue.
 *
 * Step 6 (current): listens for arrow keys, classifies presses as 'correct'
 *                   or 'incorrect' based on whether the arrow direction matches
 *                   the currently-visible cue's color (and thus position).
 *                   Presses during dark canvas (no cue visible) are silently
 *                   ignored. Per-cue input locking: only the FIRST valid keypress
 *                   per cue counts; subsequent presses for the same cue are
 *                   ignored. First commit where the human-machine loop closes.
 * Step 7+: timing measurement will compute reaction time by subtracting
 *          cue's appearedAtMs (which Step 7 must add to the stimulus engine,
 *          using performance.now() to match this hook's clock source) from
 *          the inputAtMs already captured here.
 * Step 9+: score tracking will aggregate classifications into round summaries.
 *
 * Important: arrow keys map to cue position/color, NOT defensive movement
 * direction. For example, the red cue appears at the LEFT edge of the canvas
 * (defending a left hook would actually involve rolling RIGHT in real boxing),
 * but the player presses ArrowLeft because that matches the cue's visual
 * location. The coaching layer (Phase 2+) will teach the body-movement
 * association separately. (R42A v2 precision.)
 *
 * Single engine owner constraint (inherited from Step 5.6):
 *   This hook receives currentCue as an argument; it does NOT call
 *   useStimulusEngine() internally. App.tsx is the sole owner of the engine
 *   instance. Future hooks (Step 7's timing measurement) should follow the
 *   same pattern: receive state as argument, do not instantiate engines.
 *
 * Stale-closure handling (Decision 8, R42 unanimous Option (b), v4 R44A race fix):
 *   The keydown listener is attached once on mount with an empty dep array.
 *   currentCue changes every 2-5s as the engine cycles. To read the latest
 *   cue from inside the listener, we mirror currentCue into a ref. This
 *   keeps the listener stable (no re-attachment churn) while always reading
 *   the most recent cue value at keypress time. The mirror update uses
 *   useLayoutEffect (not useEffect) so the ref is updated synchronously
 *   during commit phase, before the browser can process queued events.
 *   This eliminates the race where a keydown event could fire between
 *   paint and passive-effect execution, reading stale refs.
 *
 * Event object return shape (Decision 4, v2 R42A + R42C):
 *   Returns InputResult | null, NOT a bare classification string. This solves
 *   (a) React state equality bailout — repeated identical classifications
 *   would not re-trigger consumer effects if state were a primitive; the
 *   object reference + inputAtMs timestamp guarantee distinguishability —
 *   and (b) gives Step 7 the timestamp it needs for reaction-time measurement
 *   without further state-shape evolution.
 *
 * Per-cue input locking (Decision 4, v3 R43A correctness fix):
 *   Once a valid keypress classifies the current cue, a boolean flag is set
 *   in hasClassifiedCurrentCueRef. Further keypresses for the same cue are
 *   ignored. When currentCue changes (engine cycles to next cue, including
 *   same-color repeats, or to null), the lock is reset to false by the
 *   [currentCue] effect. This boolean approach (v3) replaces v2's reference-
 *   equality approach, which was broken because getRandomCardinalCue()
 *   returns static CUE_DICTIONARY entries — same color = same object
 *   reference across cycles, which would incorrectly block valid first
 *   presses for repeated-color cues. (R43A high-severity catch v3.)
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CueDictionaryEntry, V1CardinalColor } from '../lib/cueDictionary';

/**
 * Maps arrow key event.key values to their expected V1 cardinal cue colors.
 * Defined at module scope (no re-creation per render). The mapping is
 * spatially intuitive: arrow direction matches cue POSITION on the canvas
 * (NOT defensive body movement — see hook JSDoc for the distinction).
 *
 *   ArrowLeft  → red    (left edge cue — defend a left hook)
 *   ArrowRight → blue   (right edge cue — defend a right hook)
 *   ArrowUp    → green  (top center cue — block a straight punch)
 *   ArrowDown  → yellow (bottom center cue — body defense)
 */
const ARROW_KEY_TO_EXPECTED_COLOR = {
  ArrowLeft: 'red',
  ArrowRight: 'blue',
  ArrowUp: 'green',
  ArrowDown: 'yellow',
} as const satisfies Record<string, V1CardinalColor>;

/**
 * Classification of a single classified input. Always paired with a timestamp
 * in InputResult to avoid React state equality bailout for consecutive
 * identical classifications.
 */
export type InputClassification = 'correct' | 'incorrect';

/**
 * Event-object result of a single classified keypress. Contains the
 * classification AND the timestamp at which the keypress was processed.
 * Step 7+ will use inputAtMs minus cue.appearedAtMs to compute reaction time
 * (the cue's appearedAtMs MUST also come from performance.now() to keep
 * the two timestamps on the same monotonic clock).
 */
export type InputResult = {
  classification: InputClassification;
  inputAtMs: number;
};

/**
 * Returns an object with the most recent input result, or null if no valid
 * keypress has occurred yet. Object shape (vs bare value) is forward-
 * compatible with Step 7+ adding fields without breaking call sites.
 *
 * Usage:
 *   const { cue } = useStimulusEngine();
 *   const { lastInput } = useInputHandler(cue);
 *   // lastInput is InputResult | null
 *   // lastInput?.classification — 'correct' or 'incorrect'
 *   // lastInput?.inputAtMs — performance.now() value at keypress
 */
export function useInputHandler(currentCue: CueDictionaryEntry | null): {
  lastInput: InputResult | null;
} {
  const [lastInput, setLastInput] = useState<InputResult | null>(null);

  // Mirror currentCue into a ref so the keydown listener (attached once)
  // always reads the latest cue value at keypress time. (Decision 8, Option b.)
  const currentCueRef = useRef(currentCue);

  // Per-cue input locking (Decision 4 v3 R43A): boolean flag that resets on
  // every currentCue prop change, including same-color cue repeats. This
  // boolean approach correctly handles static CUE_DICTIONARY entries; v2's
  // reference-equality approach (lockedCueRef === cue) was broken because
  // getRandomCardinalCue() returns the same object reference for same-color
  // repeats, which would incorrectly block valid first presses for the new
  // cue cycle.
  const hasClassifiedCurrentCueRef = useRef(false);

  // Both refs update on every currentCue change. Bundling them in a single
  // effect keeps their lifecycle coordinated — there's no scenario where the
  // cue is updated but the lock isn't reset (or vice versa).
  //
  // useLayoutEffect (v4 R44A race fix): runs SYNCHRONOUSLY during React's
  // commit phase, BEFORE the browser paints. This is critical because the
  // window-level keydown listener (attached below) can fire as soon as the
  // browser processes events — which can happen between paint and a passive
  // useEffect's execution. If we used useEffect here, there would be a small
  // window where a keydown event could fire AFTER React commits the new
  // currentCue prop but BEFORE this effect mirrors that prop into refs.
  // The listener would then read stale refs (previous cue + stale lock state).
  // useLayoutEffect closes that race by running before the browser can
  // process the keydown event.
  //
  // Trade-off: useLayoutEffect blocks paint until it returns, which is
  // generally discouraged for expensive work. This effect does two ref
  // assignments — trivially fast — so the blocking cost is negligible.
  // For input-timing infrastructure (which Step 7 will build on), correctness
  // of synchronization wins over the microscopic paint-blocking cost.
  useLayoutEffect(() => {
    currentCueRef.current = currentCue;
    hasClassifiedCurrentCueRef.current = false;
  }, [currentCue]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Step 1: Filter to arrow keys only. Non-arrow keys (Space, Enter,
      // letter keys, etc.) are silently ignored. The lookup returns undefined
      // for any key not in ARROW_KEY_TO_EXPECTED_COLOR.
      const expectedColor =
        ARROW_KEY_TO_EXPECTED_COLOR[event.key as keyof typeof ARROW_KEY_TO_EXPECTED_COLOR];
      if (expectedColor === undefined) return;

      // Step 2: Prevent browser default (page scrolling on arrow keys).
      // Only called for MAPPED arrow keys, not all keys — non-arrow keys
      // retain normal browser behavior. (R42 unanimous v2.)
      event.preventDefault();

      // Step 3: Ignore held-key repeats. Holding an arrow key fires repeated
      // keydown events at the OS keyboard-repeat rate (30+/sec). We want
      // press semantics, not hold semantics. (R42A v2.)
      if (event.repeat) return;

      // Step 4: Read the latest cue via ref (avoids stale closure).
      // Silently ignore presses during dark canvas (cue === null) per
      // founder decision.
      const cue = currentCueRef.current;
      if (cue === null) return;

      // Step 5: Per-cue input locking. If we've already classified the
      // current cue, ignore the press. The lock will reset to false when
      // currentCue changes (handled by the effect above). This correctly
      // handles same-color cue repeats (v3 R43A fix replaces v2's broken
      // reference-equality check).
      if (hasClassifiedCurrentCueRef.current) return;
      hasClassifiedCurrentCueRef.current = true;

      // Step 6: Classify and set event-object state. The object's identity
      // changes on every classification (new object literal + new timestamp),
      // so consumer effects watching lastInput fire reliably even for
      // consecutive identical classifications. (Decision 4 v2 R42A.)
      setLastInput({
        classification: cue.color === expectedColor ? 'correct' : 'incorrect',
        inputAtMs: performance.now(),
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    // Cleanup removes the same function reference, ensuring Strict Mode
    // remounts don't leak duplicate listeners.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // listener attached once per mount; cue + lock read via refs

  return { lastInput };
}
