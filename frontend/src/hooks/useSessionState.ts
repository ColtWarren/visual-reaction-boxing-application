import { useCallback, useReducer } from 'react';

// Session lifecycle states
export type SessionStatus = 'idle' | 'running';

// Cue modality modes
export type CueMode = 'visual' | 'audio' | 'combined';

// Internal state shape
interface SessionStateValue {
  status: SessionStatus;
  mode: CueMode;
}

// Discriminated union of all possible session state actions
type SessionAction =
  | { type: 'setMode'; mode: CueMode }
  | { type: 'start' }
  | { type: 'stop' };

// Default mode on app mount (R48 + R49 locked: no persistence)
const DEFAULT_MODE: CueMode = 'visual';

const INITIAL_STATE: SessionStateValue = {
  status: 'idle',
  mode: DEFAULT_MODE,
};

/**
 * Pure reducer for session state transitions.
 * - setMode: only valid in 'idle' state (defensive invariant)
 * - start: idle → running
 * - stop: running → idle (mode PERSISTS per R48 unanimous decision)
 *
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
      return { ...state, status: 'running' };
    case 'stop':
      // Mode persists across stops (R48 unanimous reviewer decision).
      // Mode only resets to DEFAULT_MODE on app remount (initial state).
      return { ...state, status: 'idle' };
  }
}

// Hook return shape (public API)
export interface SessionState {
  status: SessionStatus;
  mode: CueMode;
  setMode: (mode: CueMode) => void;
  startSession: () => void;
  stopSession: () => void;
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

  return {
    status: state.status,
    mode: state.mode,
    setMode,
    startSession,
    stopSession,
  };
}
