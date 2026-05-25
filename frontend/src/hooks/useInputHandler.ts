/**
 * useInputHandler — captures keyboard input and classifies against current stimulus.
 *
 * Step 6 (original): listens for arrow keys, classifies presses as 'correct'
 *                   or 'incorrect' based on whether the arrow direction matches
 *                   the currently-visible cue's color (and thus position).
 *                   Presses during dark canvas (no cue visible) are silently
 *                   ignored. Per-cue input locking: only the FIRST valid keypress
 *                   per cue counts; subsequent presses are ignored.
 * Step 8 (current): receives ActiveStimulus | null instead of the bare cue
 *                   dictionary entry. Lock reset is now keyed on stimulus.id
 *                   (R54 unanimous) rather than prop-reference change — robust
 *                   against same-object repeats from the engine's static
 *                   dictionary. ActiveStimulus carries id + appearedAtMs;
 *                   appearedAtMs is received but NOT used here yet.
 * Step 9+: timing measurement will compute reaction time by subtracting
 *          stimulus.appearedAtMs (already carried by ActiveStimulus) from
 *          the inputAtMs already captured here.
 *
 * Important: arrow keys map to cue position/color, NOT defensive movement
 * direction. For example, the red cue appears at the LEFT edge of the canvas
 * (defending a left hook would actually involve rolling RIGHT in real boxing),
 * but the player presses ArrowLeft because that matches the cue's visual
 * location. The coaching layer (Phase 2+) will teach the body-movement
 * association separately. (R42A v2 precision.)
 *
 * Single engine owner constraint (inherited from Step 5.6):
 *   This hook receives currentStimulus as an argument; it does NOT call
 *   useStimulusEngine() internally. App.tsx is the sole owner of the engine
 *   instance. Future hooks (Step 9 timing) should follow the same pattern:
 *   receive state as argument, do not instantiate engines.
 *
 * Stale-closure handling (Decision 8, R42 unanimous Option (b), v4 R44A race fix):
 *   The keydown listener is attached once on mount with an empty dep array.
 *   currentStimulus changes every 2-5s as the engine cycles. To read the latest
 *   stimulus from inside the listener, we mirror currentStimulus into a ref.
 *   This keeps the listener stable (no re-attachment churn) while always
 *   reading the most recent stimulus value at keypress time. The mirror update
 *   uses useLayoutEffect (not useEffect) so the ref is updated synchronously
 *   during commit phase, before the browser can process queued events.
 *   This eliminates the race where a keydown event could fire between
 *   paint and passive-effect execution, reading stale refs.
 *
 * Event object return shape (Decision 4, v2 R42A + R42C):
 *   Returns InputResult | null, NOT a bare classification string. This solves
 *   (a) React state equality bailout — repeated identical classifications
 *   would not re-trigger consumer effects if state were a primitive; the
 *   object reference + inputAtMs timestamp guarantee distinguishability —
 *   and (b) gives Step 9 the timestamp it needs for reaction-time measurement
 *   without further state-shape evolution.
 *
 * Per-stimulus input locking (Decision 4 v3 R43A → Step 8 R54 id-keyed):
 *   Once a valid keypress classifies the current stimulus, a boolean flag is
 *   set in hasClassifiedCurrentCueRef. Further keypresses for the same
 *   stimulus are ignored. When stimulus.id changes (engine cycles to next
 *   occurrence, including same-color repeats which now carry distinct ids, or
 *   to null), the lock is reset to false inside the mirror useLayoutEffect.
 *   The id-keyed reset (Step 8 R54) refines Step 6's prop-reference reset:
 *   the lock now keys on a deterministic per-occurrence value, independent
 *   of cue object identity. (R55 catch 2: lock ref name kept from Step 6 to
 *   minimize sweep risk on a working safety mechanism; only its reset
 *   condition changed.)
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { V1CardinalColor } from '../lib/cueDictionary';
import type { ActiveStimulus } from '../types/stimulus';

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
 * Step 9+ will use inputAtMs minus stimulus.appearedAtMs to compute reaction
 * time (both timestamps come from performance.now() — Step 8 engine captures
 * appearedAtMs on the same monotonic clock as this hook's inputAtMs).
 */
export type InputResult = {
  classification: InputClassification;
  inputAtMs: number;
};

/**
 * Returns an object with the most recent input result, or null if no valid
 * keypress has occurred yet. Object shape (vs bare value) is forward-
 * compatible with Step 9+ adding fields without breaking call sites.
 *
 * Usage:
 *   const { stimulus } = useStimulusEngine(active);
 *   const { lastInput } = useInputHandler(stimulus);
 *   // lastInput is InputResult | null
 *   // lastInput?.classification — 'correct' or 'incorrect'
 *   // lastInput?.inputAtMs — performance.now() value at keypress
 */
export function useInputHandler(currentStimulus: ActiveStimulus | null): {
  lastInput: InputResult | null;
} {
  const [lastInput, setLastInput] = useState<InputResult | null>(null);

  // Mirror currentStimulus into a ref so the keydown listener (attached once)
  // always reads the latest stimulus value at keypress time. (Decision 8, Option b.)
  const currentStimulusRef = useRef<ActiveStimulus | null>(currentStimulus);

  // Tracks the id of the last stimulus whose lock state we've synchronized.
  // R55 catch 1: init to null (NOT currentStimulus?.id) — the ref means "the
  // last stimulus id I've reset for". Initializing from the incoming stimulus
  // would skip the first reset if the hook ever mounted with a stimulus
  // already present (first occurrence wouldn't classify). Initializing to
  // null guarantees the first non-null stimulus trips the reset
  // (its id !== null).
  const lastStimulusIdRef = useRef<number | null>(null);

  // Per-stimulus input locking (Decision 4 v3 R43A, refined Step 8 R54):
  // boolean flag that resets when stimulus.id changes (NOT on every prop
  // change). This id-keyed approach is self-contained and independent of
  // object allocation — same-color repeats now carry distinct ids per
  // occurrence, so the lock correctly opens for each new stimulus regardless
  // of cue object identity.
  //
  // R55 catch 2: name kept from Step 6 (no rename) to minimize sweep risk
  // on a working safety mechanism. Only the reset CONDITION changes
  // (id-keyed inside the mirror effect below).
  const hasClassifiedCurrentCueRef = useRef(false);

  // The mirror effect updates currentStimulusRef on every prop change, but
  // resets the classification lock ONLY when stimulus.id changes. Bundling
  // both in a single effect keeps their lifecycle coordinated.
  //
  // useLayoutEffect (v4 R44A race fix): runs SYNCHRONOUSLY during React's
  // commit phase, BEFORE the browser paints. This is critical because the
  // window-level keydown listener (attached below) can fire as soon as the
  // browser processes events — which can happen between paint and a passive
  // useEffect's execution. If we used useEffect here, there would be a small
  // window where a keydown event could fire AFTER React commits the new
  // currentStimulus prop but BEFORE this effect mirrors that prop into refs.
  // The listener would then read stale refs (previous stimulus + stale lock).
  // useLayoutEffect closes that race by running before the browser can
  // process the keydown event.
  //
  // Trade-off: useLayoutEffect blocks paint until it returns, which is
  // generally discouraged for expensive work. This effect does at most three
  // ref assignments — trivially fast — so the blocking cost is negligible.
  // For input-timing infrastructure (which Step 9 builds on), correctness
  // of synchronization wins over the microscopic paint-blocking cost.
  useLayoutEffect(() => {
    currentStimulusRef.current = currentStimulus;
    const nextStimulusId = currentStimulus?.id ?? null;
    if (nextStimulusId !== lastStimulusIdRef.current) {
      lastStimulusIdRef.current = nextStimulusId;
      hasClassifiedCurrentCueRef.current = false;
    }
  }, [currentStimulus]);

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

      // Step 4: Read the latest stimulus via ref (avoids stale closure).
      // Silently ignore presses during dark canvas (stimulus === null) per
      // founder decision. Drill into stimulus.cue for the classification data.
      const stimulus = currentStimulusRef.current;
      if (stimulus === null) return;
      const cue = stimulus.cue;

      // Step 5: Per-stimulus input locking. If we've already classified the
      // current stimulus, ignore the press. The lock resets when stimulus.id
      // changes (handled by the mirror effect above). This correctly handles
      // same-color cue repeats because Step 8's ActiveStimulus carries a
      // fresh id per occurrence, independent of cue object identity.
      if (hasClassifiedCurrentCueRef.current) return;
      hasClassifiedCurrentCueRef.current = true;

      // Step 6: Classify and set event-object state. The object's identity
      // changes on every classification (new object literal + new timestamp),
      // so consumer effects watching lastInput fire reliably even for
      // consecutive identical classifications. (Decision 4 v2 R42A.)
      // appearedAtMs from the stimulus is NOT used here — Step 9 will compute
      // reactionTimeMs = inputAtMs - stimulus.appearedAtMs at the consumer.
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
  }, []); // listener attached once per mount; stimulus + lock read via refs

  return { lastInput };
}
