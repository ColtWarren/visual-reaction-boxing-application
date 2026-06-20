import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ActiveStimulus } from '../types/stimulus';
import type { ReactionResult, MissReaction } from '../types/reaction';
import type { CueMode } from './useSessionState';

interface UseMissDetectorProps {
  /** True when status === 'running' AND a stimulus is currently active. */
  active: boolean;
  stimulus: ActiveStimulus | null;
  mode: CueMode;
  currentRoundIndex: number;
  results: ReactionResult[];
  onMiss: (miss: MissReaction) => void;
}

/**
 * Miss detection for unanswered cues. Step 11 P0 hook.
 *
 * Architecture:
 *
 *   1. Snapshot cache (Map by stimulus.id): preserves stimulus data even
 *      after engine clears the current stimulus to null. Read at timeout
 *      fire time to access audioStartedAtMs without depending on current
 *      stimulus state.
 *
 *   2. Timeout registry (Map by stimulus.id): timeouts survive React
 *      useEffect cleanup. Engine clearing the stimulus does NOT cancel
 *      pending miss timeouts. Timeouts only clear on session inactive,
 *      component unmount, or natural fire.
 *
 *   3. R44A pattern: 6 ref mirrors for onMiss, mode, active,
 *      currentRoundIndex, plus the two Maps.
 *
 *   4. R54-analog: respondedStimulusIdsRef Set prevents duplicate misses
 *      (rebuilt from results array on every change).
 *
 * Audio-failure rule (R63 lock 2):
 *   - Visual/combined mode: emit miss for every stimulus expiry
 *   - Pure audio mode: emit miss ONLY if audioStartedAtMs in snapshot
 */
export function useMissDetector({
  active,
  stimulus,
  mode,
  currentRoundIndex,
  results,
  onMiss,
}: UseMissDetectorProps): void {
  // R44A: mirror callback
  const onMissRef = useRef(onMiss);
  useLayoutEffect(() => { onMissRef.current = onMiss; }, [onMiss]);

  // R44A: mirror mode
  const modeRef = useRef(mode);
  useLayoutEffect(() => { modeRef.current = mode; }, [mode]);

  // R44A: mirror active
  const activeRef = useRef(active);
  useLayoutEffect(() => { activeRef.current = active; }, [active]);

  // R44A: mirror round index
  const currentRoundIndexRef = useRef(currentRoundIndex);
  useLayoutEffect(() => { currentRoundIndexRef.current = currentRoundIndex; }, [currentRoundIndex]);

  // Snapshot cache by stimulus.id
  const stimulusSnapshotsRef = useRef<Map<number, ActiveStimulus>>(new Map());
  useLayoutEffect(() => {
    if (stimulus) {
      stimulusSnapshotsRef.current.set(stimulus.id, stimulus);
    }
  }, [stimulus]);

  // Track latest seen stimulus id (separate from current stimulus state)
  const latestSeenStimulusIdRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (stimulus) {
      latestSeenStimulusIdRef.current = stimulus.id;
    }
    // Intentional: track the latest id, re-running only when the id changes
    // (not on every audio-timing write that replaces the stimulus object).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stimulus?.id]);

  // R54-analog: track responded stimulus ids
  const respondedStimulusIdsRef = useRef<Set<number>>(new Set());
  useLayoutEffect(() => {
    const next = new Set<number>();
    for (const r of results) {
      if (r.result === 'hit' || r.result === 'miss') {
        next.add(r.stimulusId);
      }
    }
    respondedStimulusIdsRef.current = next;
  }, [results]);

  // Timeout registry — load-bearing for surviving useEffect cleanup
  const scheduledTimeoutsRef = useRef<Map<number, number>>(new Map());

  /**
   * Schedule miss timeout for new stimulus.
   *
   * CRITICAL: NO per-stimulus cleanup return. The timeout intentionally
   * survives engine-driven stimulus null states. Cleanup is handled by
   * the separate effects below (active=false, unmount).
   *
   * Dependency array choice: [active, stimulus?.id, stimulus?.expiresAtMs]
   *   - active: re-run when session activity changes
   *   - stimulus?.id: re-run when a NEW stimulus appears (the meaningful change)
   *   - stimulus?.expiresAtMs: re-run if expiry time changes (future Theme 1)
   *
   * NOT [active, stimulus]: object identity changes on every audio timing
   * field update (recordAudioRequested, recordAudioStarted spread new object).
   * Depending on stimulus identity would cause two extra effect re-runs per
   * stimulus, each cancelling and rescheduling the miss timeout.
   */
  useEffect(() => {
    if (!active || !stimulus) {
      return;
    }
    const stimulusId = stimulus.id;

    // Prevent double-scheduling for the same stimulus id (StrictMode safe)
    if (scheduledTimeoutsRef.current.has(stimulusId)) {
      return;
    }

    const delayMs = Math.max(0, stimulus.expiresAtMs - performance.now());

    const timeoutId = window.setTimeout(() => {
      // Clean up registry entry on fire
      scheduledTimeoutsRef.current.delete(stimulusId);

      // Read latest refs at fire time
      const latestSeenId = latestSeenStimulusIdRef.current;
      const latestMode = modeRef.current;
      const latestActive = activeRef.current;
      const cachedStimulus = stimulusSnapshotsRef.current.get(stimulusId);

      // Stale check: newer stimulus appeared
      if (latestSeenId !== stimulusId) {
        // Also prune snapshot for stale stimulus
        stimulusSnapshotsRef.current.delete(stimulusId);
        return;
      }
      // Active check
      if (!latestActive) {
        return;
      }
      // Duplicate check (R54-analog)
      if (respondedStimulusIdsRef.current.has(stimulusId)) {
        return;
      }
      // Audio-failure rule (R63 lock 2)
      if (latestMode === 'audio' && cachedStimulus?.audioStartedAtMs == null) {
        return;  // System failure, not user miss
      }

      // Emit miss
      const miss: MissReaction = {
        result: 'miss',
        stimulusId,
        roundIndex: currentRoundIndexRef.current,
      };
      respondedStimulusIdsRef.current.add(stimulusId);
      onMissRef.current(miss);
    }, delayMs);

    scheduledTimeoutsRef.current.set(stimulusId, timeoutId);
    // Intentional dep array (see JSDoc above): re-run on id/expiresAtMs change,
    // NOT on full `stimulus` identity — depending on the object would reschedule
    // the miss timeout on every audio-timing write-back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stimulus?.id, stimulus?.expiresAtMs]);

  // Clear all pending timeouts and snapshot Map when session becomes inactive
  useEffect(() => {
    if (active) return;
    for (const timeoutId of scheduledTimeoutsRef.current.values()) {
      window.clearTimeout(timeoutId);
    }
    scheduledTimeoutsRef.current.clear();
    stimulusSnapshotsRef.current.clear();
  }, [active]);

  // Clear all on unmount
  useEffect(() => {
    // Capture the stable Map references at effect setup. Both refs are
    // allocated once via useRef(new Map()) and never reassigned (only their
    // contents mutate), so these locals are identical to .current at unmount.
    // Captured here to satisfy react-hooks (avoid reading ref.current in the
    // cleanup closure) without changing behavior.
    const scheduledTimeouts = scheduledTimeoutsRef.current;
    const stimulusSnapshots = stimulusSnapshotsRef.current;
    return () => {
      for (const timeoutId of scheduledTimeouts.values()) {
        window.clearTimeout(timeoutId);
      }
      scheduledTimeouts.clear();
      stimulusSnapshots.clear();
    };
  }, []);
}
