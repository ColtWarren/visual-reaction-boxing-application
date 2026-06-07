/**
 * useAudioCueRenderer — Step 10 audio renderer hook.
 *
 * Subscribes to the current stimulus. When active and a new stimulus arrives
 * (keyed by stimulus.id), calls speechSynthesis.speak() with the attack's
 * voice line. Reports back timing via onAudioRequested (at speak() call) and
 * onAudioStarted (at utterance.onstart). Reports failure via onAudioFailed
 * (utterance.onerror OR watchdog timeout).
 *
 * Critical patterns:
 *
 *   1. R44A useLayoutEffect mirror for stimulus (same as Step 9 onReactionRef)
 *      — ensures the latest stimulus is readable from async callbacks.
 *
 *   2. Stale-callback guard (R61 Q1 Codex catch) — every async callback
 *      (onstart, onerror, watchdog) checks latestStimulusIdRef.current !== token
 *      before mutating state. Pattern is R54 id-keyed lock analog applied to
 *      audio API async callbacks. Without this, a canceled utterance's onstart
 *      could write timing to the wrong (already-replaced) stimulus.
 *
 *   3. Watchdog timer (R61 Q1 Codex catch) — if onstart doesn't fire within
 *      AUDIO_WATCHDOG_MS, the cue is marked failed and advances. Without this,
 *      the audio-input gate (App.tsx) deadlocks input forever if speech is
 *      blocked, interrupted, or never fires (platform policy, focus loss).
 *
 *   4. cancel() before each speak() (R60 Q6 lock) — prevents queue buildup.
 *      cancel() is idempotent; safe to call when no utterance is queued.
 *
 *   5. Cleanup on active=false (R58 Refinement B family) — cleanup runs when
 *      active toggles, stimulus.id changes, or component unmounts. Calls
 *      cancel() to halt in-flight audio. Stops audio bleeding across mode
 *      transitions or session stops.
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ActiveStimulus } from '../types/stimulus';
import { getVoiceLine } from '../lib';  // R62 Q3: module-level import, stable reference

/**
 * V1 watchdog threshold. If `utterance.onstart` does not fire within this
 * window after `speak()` is invoked, the cue is marked failed and input
 * remains gated until the natural display window expires.
 *
 * Tune only after device testing (per R62 Q4). Android Chrome and iOS Safari
 * have known higher TTS startup latency than desktop Chrome; 1500ms is
 * empirically safe for V1 without first-utterance special-casing.
 *
 * Future per-cue tuning (multi-word attacks like "lead uppercut" may need
 * longer windows) is a Theme 1 difficulty progression concern, not Step 10.
 */
export const AUDIO_WATCHDOG_MS = 1500;

interface UseAudioCueRendererProps {
  active: boolean;
  stimulus: ActiveStimulus | null;
  onAudioRequested: (stimulusId: number, requestedAtMs: number) => void;
  onAudioStarted: (stimulusId: number, startedAtMs: number) => void;
  onAudioFailed: (stimulusId: number) => void;
}

export function useAudioCueRenderer({
  active,
  stimulus,
  onAudioRequested,
  onAudioStarted,
  onAudioFailed,
}: UseAudioCueRendererProps): void {
  // R44A mirror — stimulus ref readable from async callbacks
  const stimulusRef = useRef(stimulus);
  useLayoutEffect(() => {
    stimulusRef.current = stimulus;
  }, [stimulus]);

  // Latest-stimulus-id ref for stale-callback guards (R54 analog for audio)
  const latestStimulusIdRef = useRef<number | null>(null);

  // Latest callbacks (R44A mirror pattern, prevents stale closures)
  const onAudioRequestedRef = useRef(onAudioRequested);
  const onAudioStartedRef = useRef(onAudioStarted);
  const onAudioFailedRef = useRef(onAudioFailed);
  useLayoutEffect(() => {
    onAudioRequestedRef.current = onAudioRequested;
    onAudioStartedRef.current = onAudioStarted;
    onAudioFailedRef.current = onAudioFailed;
  }, [onAudioRequested, onAudioStarted, onAudioFailed]);

  useEffect(() => {
    if (!active || !stimulus) {
      // Inactive or no cue: ensure no audio playing, clear tracking
      window.speechSynthesis.cancel();
      latestStimulusIdRef.current = null;
      return;
    }

    const token = stimulus.id;
    latestStimulusIdRef.current = token;

    // Cancel any pending speech before starting new one (R60 Q6 lock)
    window.speechSynthesis.cancel();

    const text = getVoiceLine(stimulus.voiceLineKey);
    if (!text) {
      // Voice line missing — treat as failure
      onAudioFailedRef.current(token);
      return;
    }

    const requestedAt = performance.now();
    onAudioRequestedRef.current(token, requestedAt);

    const utterance = new SpeechSynthesisUtterance(text);

    // Watchdog: if onstart doesn't fire within threshold, mark failed (Codex catch)
    const watchdogId = window.setTimeout(() => {
      if (latestStimulusIdRef.current !== token) return; // stale watchdog
      onAudioFailedRef.current(token);
    }, AUDIO_WATCHDOG_MS);

    // Stale-callback guard on every async callback (R54 analog)
    utterance.onstart = () => {
      if (latestStimulusIdRef.current !== token) return;
      window.clearTimeout(watchdogId);
      onAudioStartedRef.current(token, performance.now());
    };

    utterance.onerror = () => {
      if (latestStimulusIdRef.current !== token) return;
      window.clearTimeout(watchdogId);
      onAudioFailedRef.current(token);
    };

    window.speechSynthesis.speak(utterance);

    // Cleanup: runs on unmount, active toggle to false, or stimulus.id change
    return () => {
      window.clearTimeout(watchdogId);
      latestStimulusIdRef.current = null;
      window.speechSynthesis.cancel();
    };
    // Intentional deps: re-run ONLY when active toggles or a NEW stimulus
    // arrives (stimulus.id changes). Depending on the full `stimulus` object
    // would re-fire on every audio-timing write-back — recordAudioStarted/
    // recordAudioRequested replace the stimulus object via functional setState,
    // so a full-object dep would loop cancel()/speak() → onstart → write-back →
    // re-run, an infinite re-speak loop. getVoiceLine is module-level (R62 Q3),
    // so it is not a dependency either.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stimulus?.id]);
}
