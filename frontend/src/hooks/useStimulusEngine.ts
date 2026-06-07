import { useCallback, useEffect, useRef, useState } from 'react';
import { ATTACK_DICTIONARY } from '../lib';
import type { AttackDictionaryEntry } from '../types/attack';
import type { ActiveStimulus } from '../types/stimulus';

const DISPLAY_WINDOW_MS = 800;
const ISI_MIN_MS = 2000;
const ISI_MAX_MS = 5000;

/**
 * Pick a random attack from the dictionary. Stance-agnostic (Step 10):
 * the dictionary stores attacks; visual + audio rendering derive downstream
 * from defense family and voice line key respectively.
 */
function pickRandomAttack(): AttackDictionaryEntry {
  const index = Math.floor(Math.random() * ATTACK_DICTIONARY.length);
  return ATTACK_DICTIONARY[index];
}

// Public return shape (object form for forward compatibility — Step 8 wraps the
// cue in ActiveStimulus with per-occurrence id + appearedAtMs).
//
// Step 10: the engine OWNS audio timing fields (Path A, R62 unanimous). The
// audio renderer reports timing back via these setters; the engine is the
// single source of truth (no sidecar timing map, no duplicate in session
// state). Each setter guards by stimulus id so a stale callback from a
// cancelled utterance cannot write to an already-replaced stimulus.
export interface StimulusEngineState {
  stimulus: ActiveStimulus | null;
  recordAudioRequested: (stimulusId: number, requestedAtMs: number) => void;
  recordAudioStarted: (stimulusId: number, startedAtMs: number) => void;
  recordAudioFailed: (stimulusId: number) => void;
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
 * - attack/defense/voiceLineKey: the attack-centric dictionary fields (Step 10).
 *   Visual rendering derives color/position from defense via DEFENSE_VISUAL_MAP;
 *   audio rendering looks up text from VOICE_LINES_EN[voiceLineKey].
 * - appearedAtMs: performance.now() captured at state-set, AFTER the
 *   cancelled guard. Used for reaction-time math (inputAtMs - appearedAtMs)
 *   in visual/combined modes.
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
        const attack = pickRandomAttack();
        const stimulus: ActiveStimulus = {
          id: nextStimulusIdRef.current++,
          attack: attack.attack,
          defense: attack.defense,
          voiceLineKey: attack.voiceLineKey,
          appearedAtMs: performance.now(),
          // audioRequestedAtMs and audioStartedAtMs are populated by audio renderer
        };
        setCurrentStimulus(stimulus);
        // After display window, clear and schedule next.
        // LOAD-BEARING: this is normal mid-cycle stimulus disappearance.
        // TODO (Theme 1 difficulty progression): make display window per-cue
        // configurable. Currently DISPLAY_WINDOW_MS is a global constant. When
        // difficulty presets and roster filtering land, replace with per-stimulus
        // windowMs (optional field on ActiveStimulus, defaults to global). Keep
        // the clear scheduled from the active stimulus occurrence so input lock/
        // reset semantics remain tied to stimulus.id. Audio mode may also need
        // longer windows for multi-word attacks ("lead uppercut").
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

  // Audio timing setters (Step 10, Path A). The audio renderer invokes these
  // via callbacks; each uses a functional state update guarded by stimulus id
  // so a stale callback from a cancelled utterance writes to the wrong
  // (already-replaced) stimulus, or no stimulus at all. The id guard is the
  // R54 id-keyed lock applied to async audio-API callbacks.
  const recordAudioRequested = useCallback(
    (stimulusId: number, requestedAtMs: number) => {
      setCurrentStimulus((prev) =>
        prev?.id === stimulusId
          ? { ...prev, audioRequestedAtMs: requestedAtMs }
          : prev,
      );
    },
    [],
  );

  const recordAudioStarted = useCallback(
    (stimulusId: number, startedAtMs: number) => {
      setCurrentStimulus((prev) =>
        prev?.id === stimulusId
          ? { ...prev, audioStartedAtMs: startedAtMs }
          : prev,
      );
    },
    [],
  );

  const recordAudioFailed = useCallback((stimulusId: number) => {
    // For Step 10: log failure but do not mutate stimulus. Pure audio mode
    // input remains gated; the cue advances on natural display-window expiry.
    // Step 11+ may add an explicit failure state if user feedback warrants.
    if (import.meta.env.DEV) {
      console.warn('[audio] cue failed', stimulusId);
    }
  }, []);

  // Belt-and-suspenders (R50C): return derived null when inactive.
  // Even if cleanup hasn't run yet (passive effect timing), an inactive
  // engine never exposes a stale stimulus to consumers. This is the
  // engine-side half of the idle-stale-cue fix; App.tsx's isSessionRunning
  // gate is the consumer-side half. Both ends closed.
  return {
    stimulus: active ? currentStimulus : null,
    recordAudioRequested,
    recordAudioStarted,
    recordAudioFailed,
  };
}
