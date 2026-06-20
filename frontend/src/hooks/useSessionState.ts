import { useReducer, useCallback } from 'react';
import type { ReactionResult } from '../types/reaction';
import type { SessionConfig } from '../types/round';
import { DEFAULT_SESSION_CONFIG } from '../lib/sessionConfig';

// Session lifecycle states — expanded status union
export type SessionStatus = 'idle' | 'running' | 'rest' | 'summary';

export type CueMode = 'visual' | 'audio' | 'combined';

interface SessionStateValue {
  status: SessionStatus;
  mode: CueMode;
  results: ReactionResult[];
  config: SessionConfig;
  currentRoundIndex: number;        // 0-based; valid when status is 'running' or 'rest'
  phaseStartedAtMs: number | null;  // performance.now() timestamp; null when idle/summary
}

const DEFAULT_MODE: CueMode = 'visual';

const INITIAL_STATE: SessionStateValue = {
  status: 'idle',
  mode: DEFAULT_MODE,
  results: [],
  config: DEFAULT_SESSION_CONFIG,
  currentRoundIndex: 0,
  phaseStartedAtMs: null,
};

// Action names clarify system-driven semantics for timer expirations
type SessionAction =
  | { type: 'setMode'; mode: CueMode }
  | { type: 'setConfig'; config: Partial<SessionConfig> }
  | { type: 'start' }
  | { type: 'roundTimerExpired' }
  | { type: 'restTimerExpired' }
  | { type: 'stop' }
  | { type: 'dismissSummary' }
  | { type: 'recordReaction'; result: ReactionResult };

/**
 * Pure reducer for session state transitions.
 *
 * State machine graph:
 *   idle -> running -> rest -> running (next) -> rest -> ... -> summary
 *
 *   stop: valid from running, rest; rejected from idle, summary
 *   dismissSummary: summary -> idle
 *
 * Strict Mode safe; pure; no timers; no side effects.
 */
function sessionReducer(
  state: SessionStateValue,
  action: SessionAction,
): SessionStateValue {
  switch (action.type) {
    case 'setMode':
      // Mode only changes in idle (defensive invariant)
      return state.status === 'idle'
        ? { ...state, mode: action.mode }
        : state;

    case 'setConfig':
      // Config locked at session start; only mutable in idle
      return state.status === 'idle'
        ? { ...state, config: { ...state.config, ...action.config } }
        : state;

    case 'start':
      return {
        ...state,
        status: 'running',
        results: [],
        currentRoundIndex: 0,
        phaseStartedAtMs: performance.now(),
      };

    case 'roundTimerExpired':
      // Dispatched by useRoundTimer when round phase duration elapses
      if (state.status !== 'running') return state;
      // R63 lock 5: rounds = 1 OR final round → summary (skip rest)
      if (state.currentRoundIndex >= state.config.totalRounds - 1) {
        return {
          ...state,
          status: 'summary',
          phaseStartedAtMs: null,
        };
      }
      // Multi-round case with remaining rounds: enter rest
      return {
        ...state,
        status: 'rest',
        phaseStartedAtMs: performance.now(),
      };

    case 'restTimerExpired':
      // Dispatched by useRoundTimer when rest phase elapses (or flash duration for rest=0)
      if (state.status !== 'rest') return state;
      return {
        ...state,
        status: 'running',
        currentRoundIndex: state.currentRoundIndex + 1,
        phaseStartedAtMs: performance.now(),
      };

    case 'stop':
      // R58 Refinement B EXPANDED: valid from running or rest
      if (state.status === 'idle' || state.status === 'summary') return state;
      // Zero-input rule preserved
      return {
        ...state,
        status: state.results.length > 0 ? 'summary' : 'idle',
        phaseStartedAtMs: null,
      };

    case 'dismissSummary':
      return {
        ...state,
        status: 'idle',
        phaseStartedAtMs: null,
      };

    case 'recordReaction':
      // Append only when running (not during rest, idle, or summary)
      return state.status === 'running'
        ? { ...state, results: [...state.results, action.result] }
        : state;
  }
}

export interface SessionState {
  status: SessionStatus;
  mode: CueMode;
  results: ReactionResult[];
  config: SessionConfig;
  currentRoundIndex: number;
  phaseStartedAtMs: number | null;
  setMode: (mode: CueMode) => void;
  setConfig: (config: Partial<SessionConfig>) => void;
  startSession: () => void;
  stopSession: () => void;
  dismissSummary: () => void;
  recordReaction: (result: ReactionResult) => void;
  /** Dispatches `roundTimerExpired`; called by useRoundTimer when round phase elapses. */
  completeRound: () => void;
  /** Dispatches `restTimerExpired`; called by useRoundTimer when rest phase elapses. */
  completeRest: () => void;
}

export function useSessionState(): SessionState {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE);

  const setMode = useCallback((mode: CueMode) => dispatch({ type: 'setMode', mode }), []);
  const setConfig = useCallback((config: Partial<SessionConfig>) => dispatch({ type: 'setConfig', config }), []);
  const startSession = useCallback(() => dispatch({ type: 'start' }), []);
  const stopSession = useCallback(() => dispatch({ type: 'stop' }), []);
  const dismissSummary = useCallback(() => dispatch({ type: 'dismissSummary' }), []);
  const recordReaction = useCallback((result: ReactionResult) => dispatch({ type: 'recordReaction', result }), []);
  const completeRound = useCallback(() => dispatch({ type: 'roundTimerExpired' }), []);
  const completeRest = useCallback(() => dispatch({ type: 'restTimerExpired' }), []);

  return {
    status: state.status,
    mode: state.mode,
    results: state.results,
    config: state.config,
    currentRoundIndex: state.currentRoundIndex,
    phaseStartedAtMs: state.phaseStartedAtMs,
    setMode,
    setConfig,
    startSession,
    stopSession,
    dismissSummary,
    recordReaction,
    completeRound,
    completeRest,
  };
}
