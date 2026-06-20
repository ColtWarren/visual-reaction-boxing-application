import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SessionStatus } from './useSessionState';
import type { SessionConfig } from '../types/round';
import { ROUND_START_FLASH_MS } from '../lib/sessionConfig';

interface UseRoundTimerProps {
  status: SessionStatus;
  phaseStartedAtMs: number | null;
  config: SessionConfig;
  onCompleteRound: () => void;
  onCompleteRest: () => void;
}

interface RoundTimerState {
  /**
   * Time remaining (ms) in current phase.
   * 0 when status is idle/summary.
   * For status === 'running', counts down from roundDurationMs.
   * For status === 'rest', counts down from restDurationMs (or ROUND_START_FLASH_MS if restDurationMs === 0).
   */
  remainingMs: number;
}

/**
 * Timestamp-based round/rest timer.
 *
 * Source of truth: phaseStartedAtMs + computed duration.
 * Wake mechanism: requestAnimationFrame tick for display updates.
 * Completion: one-shot per phase, guarded by ref reset on phaseStartedAtMs change.
 *
 * Background tab behavior: rAF throttles; when tab becomes active again,
 * the next tick computes elapsed from performance.now() and fires
 * completion immediately if duration has expired. No drift.
 */
export function useRoundTimer({
  status,
  phaseStartedAtMs,
  config,
  onCompleteRound,
  onCompleteRest,
}: UseRoundTimerProps): RoundTimerState {
  // R44A: mirror latest callbacks
  const onCompleteRoundRef = useRef(onCompleteRound);
  const onCompleteRestRef = useRef(onCompleteRest);
  useLayoutEffect(() => {
    onCompleteRoundRef.current = onCompleteRound;
    onCompleteRestRef.current = onCompleteRest;
  }, [onCompleteRound, onCompleteRest]);

  // One-shot completion guard; reset on phase change
  const hasCompletedRef = useRef(false);
  useLayoutEffect(() => {
    hasCompletedRef.current = false;
  }, [phaseStartedAtMs, status]);

  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    // No setState reset here: the inactive value is derived at return time
    // (matches the engine R50C belt-and-suspenders idiom, useStimulusEngine.ts:182-183).
    // This keeps setState calls confined to the rAF callback, satisfying
    // react-hooks/set-state-in-effect.
    if (status !== 'running' && status !== 'rest') {
      return;
    }
    if (phaseStartedAtMs == null) {
      return;
    }

    // Compute phase duration based on status
    // Rest = 0 case: use ROUND_START_FLASH_MS for 1-second flash
    let phaseDurationMs: number;
    if (status === 'running') {
      phaseDurationMs = config.roundDurationMs;
    } else {
      phaseDurationMs = config.restDurationMs > 0
        ? config.restDurationMs
        : ROUND_START_FLASH_MS;
    }

    const targetEndAtMs = phaseStartedAtMs + phaseDurationMs;
    let rafId = 0;

    function tick() {
      const remaining = Math.max(0, targetEndAtMs - performance.now());
      setRemainingMs(remaining);

      if (remaining <= 0) {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          if (status === 'running') {
            onCompleteRoundRef.current();
          } else {
            onCompleteRestRef.current();
          }
        }
        return;  // Don't schedule another rAF after completion
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [status, phaseStartedAtMs, config.roundDurationMs, config.restDurationMs]);

  // Derived inactive value (R50C-style belt-and-suspenders): when no phase is
  // active, expose 0 regardless of the last counted value. Avoids a synchronous
  // setState reset in the effect body.
  const isActivePhase =
    (status === 'running' || status === 'rest') && phaseStartedAtMs != null;
  return { remainingMs: isActivePhase ? remainingMs : 0 };
}
