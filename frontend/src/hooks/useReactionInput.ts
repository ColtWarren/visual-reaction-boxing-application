/**
 * useReactionInput — unified reaction input across keyboard and touch (Step 12).
 *
 * The consumer-facing input hook (Lock 2). The keyboard implementation was
 * moved here verbatim in Step 12 (mechanical move, R71.5 P4) — same guard
 * order, same refs, same R44A/R54/R58 invariants — and
 * the classification core is factored into one internal function so a second
 * modality can share it. Touch/pointer input calls that same core through the
 * returned `submitDefenseInput` callback; keyboard input calls it from the
 * once-attached window keydown listener. ONE classifier, ONE R54 lock, ONE
 * source of truth across modalities.
 *
 * Keyboard semantics (unchanged since Step 6):
 *   Step 6: listens for arrow keys, classifies presses 'correct'/'incorrect'
 *           against the current stimulus. Step 8 (R54): per-cue lock keyed on
 *           stimulus.id. Step 9: reactionTimeMs = inputAtMs - appearedAtMs.
 *           Step 10: stimulus.defense is the single source of truth across
 *           visual/audio/combined; the hook stays mode-agnostic (audio-mode
 *           input gating lives at the App.tsx stimulusForInput integration
 *           point, NOT here).
 *
 * Arrow keys and touch zones map to a stance-neutral input DIRECTION; the shared
 * classifier resolves that direction to a defense family for the active stance
 * (Theme 4, Design B — southpaw mirrors the slip pair). Single engine owner:
 * this hook receives currentStimulus as an argument; it never instantiates the
 * engine.
 *
 * Stale-closure handling (R44A race fix): the keydown listener attaches once on
 * mount (empty dep array). currentStimulus, onReaction, currentRoundIndex, and
 * stance are mirrored into refs via useLayoutEffect so the stable listener reads
 * the latest values at input time without re-attaching. useLayoutEffect (not
 * useEffect) updates the refs synchronously during commit, before the browser
 * can dispatch a queued keydown against stale refs.
 *
 * Per-stimulus input locking (R54 id-keyed, R58 Refinement A): once a valid
 * input classifies the current stimulus, hasClassifiedCurrentCueRef seals and
 * further inputs for the same stimulus.id are ignored. The seal is set BEFORE
 * onReaction fires, so a second input arriving during the synchronous reducer
 * dispatch cannot produce a duplicate record. The lock resets when stimulus.id
 * changes, inside the mirror useLayoutEffect.
 */

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { ARROW_KEY_TO_DIRECTION, resolveDefenseFromInputDirection } from '../lib';
import type { DefenseArrowKey } from '../lib';
import type { ActiveStimulus } from '../types/stimulus';
import type { InputDirection, Stance } from '../types/stance';
import type { ReactionClassification, HitReaction } from '../types/reaction';

export interface ReactionInputController {
  /**
   * Component-scoped input entry point (touch/pointer). Captures the input's
   * response DIRECTION (Theme 4, Design B) and the performance.now() timestamp
   * taken at the input moment, then runs the shared classifier — which resolves
   * the direction to a defense family for the active stance. Stable identity
   * across renders (R71 Amendment 11) so consumers can pass it to memoized
   * children.
   */
  submitDefenseInput: (direction: InputDirection, inputAtMs: number) => void;
}

export function useReactionInput(
  currentStimulus: ActiveStimulus | null,
  currentRoundIndex: number,
  onReaction: (result: HitReaction) => void,
  stance: Stance,
): ReactionInputController {
  // Mirror currentStimulus into a ref so the keydown listener (attached once)
  // always reads the latest stimulus value at input time. (Decision 8, Option b.)
  const currentStimulusRef = useRef<ActiveStimulus | null>(currentStimulus);

  // Tracks the id of the last stimulus whose lock state we've synchronized.
  // R55 catch 1: init to null (NOT currentStimulus?.id) so the first non-null
  // stimulus trips the reset (its id !== null) and its first occurrence can
  // classify.
  const lastStimulusIdRef = useRef<number | null>(null);

  // Per-stimulus input lock (Decision 4 v3 R43A, refined Step 8 R54): boolean
  // flag that resets when stimulus.id changes (NOT on every prop change).
  // R55 catch 2: name kept from Step 6; only the reset CONDITION is id-keyed.
  const hasClassifiedCurrentCueRef = useRef(false);

  // The mirror effect updates currentStimulusRef on every prop change, but
  // resets the classification lock ONLY when stimulus.id changes. Bundling both
  // keeps their lifecycle coordinated. useLayoutEffect (R44A race fix): runs
  // synchronously during commit, before the browser can dispatch a keydown that
  // would otherwise read stale refs (previous stimulus + stale lock).
  useLayoutEffect(() => {
    currentStimulusRef.current = currentStimulus;
    const nextStimulusId = currentStimulus?.id ?? null;
    if (nextStimulusId !== lastStimulusIdRef.current) {
      lastStimulusIdRef.current = nextStimulusId;
      hasClassifiedCurrentCueRef.current = false;
    }
  }, [currentStimulus]);

  // Mirror onReaction so the once-attached listener can invoke the latest
  // callback without re-attaching. useLayoutEffect matches the R44A pattern:
  // the ref must be current before any input can fire against the new render.
  const onReactionRef = useRef(onReaction);
  useLayoutEffect(() => {
    onReactionRef.current = onReaction;
  }, [onReaction]);

  // Mirror currentRoundIndex so the once-attached listener reads the latest
  // value without re-attaching (otherwise it would see the initial index
  // forever). Each HitReaction carries round metadata (Step 11).
  const currentRoundIndexRef = useRef(currentRoundIndex);
  useLayoutEffect(() => {
    currentRoundIndexRef.current = currentRoundIndex;
  }, [currentRoundIndex]);

  // Mirror the active stance so the once-attached listener resolves an input
  // direction to a family against the LATEST stance without re-attaching
  // (R44A pattern, load-bearing). stance is idle-locked upstream (setStance is
  // idle-only), so it never changes mid-session — but the classifier must still
  // read currentStanceRef.current, never the closure `stance`, to stay
  // stale-closure-safe like every other input the classifier depends on.
  const currentStanceRef = useRef(stance);
  useLayoutEffect(() => {
    currentStanceRef.current = stance;
  }, [stance]);

  // Shared classification core — modality-agnostic. Both the keyboard listener
  // and the touch-facing submitDefenseInput call this. Reads only refs, so its
  // identity is stable (empty deps); it is also returned AS submitDefenseInput.
  //
  // The `direction` argument is the input's response direction (Theme 4,
  // Design B); `inputAtMs` is the performance.now() captured at the input
  // moment by the caller (keyboard: right after the repeat guard; touch: first
  // statement of the pointer handler, per Lock 3). Direction is resolved to a
  // defense family for the active stance (via currentStanceRef) inside here, so
  // both modalities share ONE resolve site and the stance stays a ref read.
  const classifyDefenseInput = useCallback(
    (direction: InputDirection, inputAtMs: number): void => {
      // Read the latest stimulus via ref; ignore inputs during dark canvas.
      const stimulus = currentStimulusRef.current;
      if (stimulus === null) return;

      // R54 per-stimulus lock; R58 Refinement A: seal BEFORE the callback so a
      // rapid second input during the synchronous reducer dispatch cannot
      // produce a duplicate ReactionResult.
      if (hasClassifiedCurrentCueRef.current) return;
      hasClassifiedCurrentCueRef.current = true;

      // Resolve the input direction to a defense family for the CURRENT stance
      // (idle-locked, read via ref). Under southpaw the slip pair mirrors, so
      // the same physical direction maps to the opposite slip family (Design B).
      const family = resolveDefenseFromInputDirection(
        direction,
        currentStanceRef.current,
      );

      // stimulus.defense is the single source of truth (Q3 lock). Both
      // timestamps come from performance.now() on the same monotonic clock.
      const classification: ReactionClassification =
        stimulus.defense === family ? 'correct' : 'incorrect';
      const reaction: HitReaction = {
        result: 'hit',
        stimulusId: stimulus.id,
        classification,
        reactionTimeMs: inputAtMs - stimulus.appearedAtMs,
        roundIndex: currentRoundIndexRef.current,
      };
      onReactionRef.current?.(reaction);
    },
    [],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Step 1: filter to arrow keys; the lookup is undefined for any other key.
      // Arrow keys map to a stance-neutral input DIRECTION (Design B); the
      // classifier resolves direction -> family for the active stance.
      const direction: InputDirection | undefined =
        ARROW_KEY_TO_DIRECTION[event.key as DefenseArrowKey];
      if (direction === undefined) return;

      // Step 2: prevent browser default (arrow-key scrolling) for MAPPED keys
      // only, so non-arrow keys retain normal behavior. (R42 unanimous v2.)
      event.preventDefault();

      // Step 3: ignore held-key repeats — press semantics, not hold. (R42A v2.)
      if (event.repeat) return;

      // Steps 4-6 run inside the shared classifier. performance.now() is
      // captured here (right after the repeat guard) as the keyboard input
      // moment, then handed to the classifier.
      classifyDefenseInput(direction, performance.now());
    }

    window.addEventListener('keydown', handleKeyDown);
    // Cleanup removes the same reference, so Strict Mode remounts don't leak
    // duplicate listeners.
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [classifyDefenseInput]); // classifyDefenseInput is stable; attaches once

  // submitDefenseInput IS the shared classifier, exposed for component-scoped
  // touch handlers. Same stable identity, same R54 lock, same source of truth.
  return { submitDefenseInput: classifyDefenseInput };
}
