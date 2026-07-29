import { useReducer, useCallback } from 'react';
import type { ReactionResult } from '../types/reaction';
import type { SessionConfig } from '../types/round';
import type { PresetId } from '../types/preferences';
import type { Stance } from '../types/stance';
import { PRESET_TO_CONFIG } from '../lib/sessionConfig';
import { loadPreferences } from '../lib/preferencesStorage';

// Session lifecycle states — expanded status union
export type SessionStatus = 'idle' | 'running' | 'rest' | 'summary';

export type CueMode = 'visual' | 'audio' | 'combined';

interface SessionStateValue {
  status: SessionStatus;
  mode: CueMode;
  selectedPresetId: PresetId;       // Step 12 (Lock 5); independent of mode
  stance: Stance;                   // Theme 4; persisted + hydrated; idle-only edits
  results: ReactionResult[];
  config: SessionConfig;
  currentRoundIndex: number;        // 0-based; valid when status is 'running' or 'rest'
  phaseStartedAtMs: number | null;  // performance.now() timestamp; null when idle/summary
}

const DEFAULT_MODE: CueMode = 'visual';

/**
 * Pure first-launch state constructor (Quick Demo on-ramp per Lock 7). No
 * storage access, so the reducer's `resetPreferences` case can use it and stay
 * pure (StrictMode double-invocation safe). buildInitialState layers persisted
 * preferences on top of this base at mount.
 */
function createDefaultSessionState(): SessionStateValue {
  return {
    status: 'idle',
    mode: DEFAULT_MODE,
    selectedPresetId: 'quick-demo',
    stance: 'orthodox',
    results: [],
    config: PRESET_TO_CONFIG['quick-demo'],
    currentRoundIndex: 0,
    phaseStartedAtMs: null,
  };
}

/**
 * Lazy reducer initializer (runs ONCE on mount, R71.5 P2). Hydrates from
 * persisted preferences when present; otherwise falls back to first-launch
 * defaults. Config is already preset-normalized by loadPreferences (Lock 5).
 * Storage-aware — used ONLY at mount, never inside the reducer.
 */
function buildInitialState(): SessionStateValue {
  const base = createDefaultSessionState();
  const persisted = loadPreferences();
  if (persisted) {
    return {
      ...base,
      mode: persisted.mode,
      selectedPresetId: persisted.selectedPresetId,
      stance: persisted.stance,
      config: persisted.config,
    };
  }
  return base;
}

// Action names clarify system-driven semantics for timer expirations
type SessionAction =
  | { type: 'setMode'; mode: CueMode }
  | { type: 'setStance'; stance: Stance }
  | { type: 'selectPreset'; presetId: PresetId }
  | { type: 'setConfig'; config: Partial<SessionConfig> }
  | { type: 'start' }
  | { type: 'roundTimerExpired' }
  | { type: 'restTimerExpired' }
  | { type: 'stop' }
  | { type: 'dismissSummary' }
  | { type: 'recordReaction'; result: ReactionResult }
  | { type: 'resetPreferences' };

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

    case 'setStance':
      // Stance only changes in idle (mirrors setMode). Independent of mode and
      // preset; the locked active-session stance snapshot is a later block.
      return state.status === 'idle'
        ? { ...state, stance: action.stance }
        : state;

    case 'selectPreset':
      // Preset selection only in idle. Mode is independent (Lock 5): selecting
      // a preset never changes mode. Non-Custom presets atomically overwrite
      // config with canonical values; Custom keeps the current config.
      if (state.status !== 'idle') return state;
      return action.presetId === 'custom'
        ? { ...state, selectedPresetId: 'custom' }
        : {
            ...state,
            selectedPresetId: action.presetId,
            config: PRESET_TO_CONFIG[action.presetId],
          };

    case 'setConfig':
      // Config locked at session start; only mutable in idle. Editing config
      // auto-switches the preset to Custom (Lock 5). Mode is independent.
      return state.status === 'idle'
        ? {
            ...state,
            selectedPresetId: 'custom',
            config: { ...state.config, ...action.config },
          }
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

    case 'resetPreferences':
      // Restore canonical first-launch defaults. PURE — no localStorage read
      // here; usePreferencesPersistence owns the storage removal and the
      // write-suppression around this dispatch.
      return createDefaultSessionState();
  }
}

export interface SessionState {
  status: SessionStatus;
  mode: CueMode;
  selectedPresetId: PresetId;
  stance: Stance;
  results: ReactionResult[];
  config: SessionConfig;
  currentRoundIndex: number;
  phaseStartedAtMs: number | null;
  setMode: (mode: CueMode) => void;
  setStance: (stance: Stance) => void;
  selectPreset: (presetId: PresetId) => void;
  setConfig: (config: Partial<SessionConfig>) => void;
  startSession: () => void;
  stopSession: () => void;
  dismissSummary: () => void;
  recordReaction: (result: ReactionResult) => void;
  /** Dispatches `roundTimerExpired`; called by useRoundTimer when round phase elapses. */
  completeRound: () => void;
  /** Dispatches `restTimerExpired`; called by useRoundTimer when rest phase elapses. */
  completeRest: () => void;
  /**
   * Focused reset action (Block 8): dispatches `resetPreferences` to restore
   * canonical defaults. Exposed instead of raw dispatch so usePreferencesPersistence
   * can trigger a reset without seeing the reducer internals.
   */
  resetPreferences: () => void;
}

export function useSessionState(): SessionState {
  // Lazy three-argument form (R71.5 P2): buildInitialState runs ONCE on mount,
  // so loadPreferences (localStorage read) does not run on every render.
  const [state, dispatch] = useReducer(sessionReducer, null, () =>
    buildInitialState(),
  );

  const setMode = useCallback((mode: CueMode) => dispatch({ type: 'setMode', mode }), []);
  const setStance = useCallback((stance: Stance) => dispatch({ type: 'setStance', stance }), []);
  const selectPreset = useCallback((presetId: PresetId) => dispatch({ type: 'selectPreset', presetId }), []);
  const setConfig = useCallback((config: Partial<SessionConfig>) => dispatch({ type: 'setConfig', config }), []);
  const startSession = useCallback(() => dispatch({ type: 'start' }), []);
  const stopSession = useCallback(() => dispatch({ type: 'stop' }), []);
  const dismissSummary = useCallback(() => dispatch({ type: 'dismissSummary' }), []);
  const recordReaction = useCallback((result: ReactionResult) => dispatch({ type: 'recordReaction', result }), []);
  const completeRound = useCallback(() => dispatch({ type: 'roundTimerExpired' }), []);
  const completeRest = useCallback(() => dispatch({ type: 'restTimerExpired' }), []);
  const resetPreferences = useCallback(() => dispatch({ type: 'resetPreferences' }), []);

  return {
    status: state.status,
    mode: state.mode,
    selectedPresetId: state.selectedPresetId,
    stance: state.stance,
    results: state.results,
    config: state.config,
    currentRoundIndex: state.currentRoundIndex,
    phaseStartedAtMs: state.phaseStartedAtMs,
    setMode,
    setStance,
    selectPreset,
    setConfig,
    startSession,
    stopSession,
    dismissSummary,
    recordReaction,
    completeRound,
    completeRest,
    resetPreferences,
  };
}
