import { useCallback, useReducer } from 'react';

import type { ReactionResult } from '../types/reaction';

// Session lifecycle states
export type SessionStatus = 'idle' | 'running' | 'summary';

// Cue modality modes
export type CueMode = 'visual' | 'audio' | 'combined';

// Internal state shape
interface SessionStateValue {
  status: SessionStatus;
  mode: CueMode;
  results: ReactionResult[];
}

// Discriminated union of all possible session state actions
type SessionAction =
  | { type: 'setMode'; mode: CueMode }
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'dismissSummary' }
  | { type: 'recordReaction'; result: ReactionResult };

// Default mode on app mount (R48 + R49 locked: no persistence)
const DEFAULT_MODE: CueMode = 'visual';

const INITIAL_STATE: SessionStateValue = {
  status: 'idle',
  mode: DEFAULT_MODE,
  results: [],
};

/**
 * Pure reducer for session state transitions.
 * - setMode: only valid in 'idle' state (defensive invariant; naturally
 *   blocks during 'summary' since summary !== 'idle')
 * - start: idle → running; clears results
 * - stop: running → 'summary' if any results else 'idle' (R57 zero-input
 *   rule; R58 Refinement B guards non-running stops)
 * - dismissSummary: summary → idle (results left dormant until next start)
 * - recordReaction: append result only when running
 *
 * Mode PERSISTS across all transitions per R48 unanimous decision.
 * Strict Mode safe (pure function; no side effects).
 */
function sessionReducer(
  state: SessionStateValue,
  action: SessionAction,
): SessionStateValue {
  switch (action.type) {
    case 'setMode':
      // Defensive: ignore mode changes while running.
      // UI prevents this (mode buttons hidden during running view),
      // but reducer enforces the invariant regardless of caller correctness.
      return state.status === 'idle'
        ? { ...state, mode: action.mode }
        : state;
    case 'start':
      // Clears results — the only mutation point besides recordReaction's append.
      return { ...state, status: 'running', results: [] };
    case 'stop':
      // R58 Refinement B: guard against stop from non-running, which would
      // otherwise re-open summary from idle or re-route summary → idle.
      if (state.status !== 'running') return state;
      // R57 zero-input rule: results.length > 0 → 'summary'; else → 'idle'.
      // Mode persists (R48 unanimous); only resets to DEFAULT_MODE on remount.
      return {
        ...state,
        status: state.results.length > 0 ? 'summary' : 'idle',
      };
    case 'dismissSummary':
      // Results left dormant until next 'start' replaces them.
      return { ...state, status: 'idle' };
    case 'recordReaction':
      // Append only when running; late dispatches silently dropped.
      return state.status === 'running'
        ? { ...state, results: [...state.results, action.result] }
        : state;
  }
}

// Hook return shape (public API)
export interface SessionState {
  status: SessionStatus;
  mode: CueMode;
  results: ReactionResult[];
  setMode: (mode: CueMode) => void;
  startSession: () => void;
  stopSession: () => void;
  dismissSummary: () => void;
  recordReaction: (result: ReactionResult) => void;
}

/**
 * Custom hook owning session lifecycle state.
 *
 * Uses useReducer for pure state transitions (Strict Mode safe).
 * Action dispatchers wrapped in useCallback for referential stability.
 *
 * Mode persistence semantics:
 * - Mode preserved across session stop/start within same app mount
 * - Mode resets to DEFAULT_MODE ('visual') only on app remount/refresh
 * - No localStorage persistence
 */
export function useSessionState(): SessionState {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE);

  const setMode = useCallback(
    (mode: CueMode) => dispatch({ type: 'setMode', mode }),
    [],
  );

  const startSession = useCallback(() => dispatch({ type: 'start' }), []);

  const stopSession = useCallback(() => dispatch({ type: 'stop' }), []);

  const dismissSummary = useCallback(
    () => dispatch({ type: 'dismissSummary' }),
    [],
  );

  const recordReaction = useCallback(
    (result: ReactionResult) => dispatch({ type: 'recordReaction', result }),
    [],
  );

  return {
    status: state.status,
    mode: state.mode,
    results: state.results,
    setMode,
    startSession,
    stopSession,
    dismissSummary,
    recordReaction,
  };
}
