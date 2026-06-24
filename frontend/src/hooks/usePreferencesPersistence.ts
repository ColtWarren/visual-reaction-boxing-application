/**
 * Step 12 (Lock 4): preferences persistence lifecycle.
 *
 * Observes session state and writes preferences to localStorage on the right
 * moments — never on every render, never on every slider tick, never during an
 * active round. Four effects cover the trigger matrix:
 *
 *   1. Immediate save on preset/mode change while idle or in summary.
 *   2. Debounced (300ms) save on Custom slider edits while idle.
 *   3. Flush the pending debounce when a session starts.
 *   4. Explicit save on session end (running/rest -> summary/idle), even when
 *      preset/mode are unchanged (R71.5 P3 — Effect 1's guard would skip it).
 *
 * All writes go through savePreferences, which degrades silently on failure.
 */

import { useEffect, useRef } from 'react';
import type {
  CueMode,
  SessionState,
  SessionStatus,
} from './useSessionState';
import type { PresetId } from '../types/preferences';
import { savePreferences, PREFS_VERSION } from '../lib/preferencesStorage';

export function usePreferencesPersistence(state: SessionState): void {
  const lastSavedRef = useRef<{ preset: PresetId; mode: CueMode } | null>(null);
  const lastStatusRef = useRef<SessionStatus | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect 1: immediate save on idle/summary preset or mode changes.
  // config is read but intentionally NOT a dependency — slider-driven config
  // edits are handled by the debounced Effect 2; including it here would fire
  // an undebounced save on every drag tick.
  useEffect(() => {
    if (state.status !== 'idle' && state.status !== 'summary') return;
    if (
      lastSavedRef.current?.preset === state.selectedPresetId &&
      lastSavedRef.current?.mode === state.mode
    ) {
      return;
    }
    savePreferences({
      version: PREFS_VERSION,
      mode: state.mode,
      selectedPresetId: state.selectedPresetId,
      config: state.config,
    });
    lastSavedRef.current = { preset: state.selectedPresetId, mode: state.mode };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedPresetId, state.mode, state.status]);

  // Effect 2: debounced save on Custom slider changes during idle.
  useEffect(() => {
    if (state.status !== 'idle') return;
    if (state.selectedPresetId !== 'custom') return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    debounceTimerRef.current = setTimeout(() => {
      savePreferences({
        version: PREFS_VERSION,
        mode: state.mode,
        selectedPresetId: state.selectedPresetId,
        config: state.config,
      });
      debounceTimerRef.current = null;
    }, 300);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [state.config, state.status, state.selectedPresetId, state.mode]);

  // Effect 3: flush-on-start. When a session begins, commit any pending
  // debounced edit immediately so the started config is what gets persisted.
  // Only state.status is reactive here; the rest are read at flush time.
  useEffect(() => {
    if (state.status === 'running' && debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      savePreferences({
        version: PREFS_VERSION,
        mode: state.mode,
        selectedPresetId: state.selectedPresetId,
        config: state.config,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // Effect 4 (R71.5 P3): explicit session-end save. Fires on the transition
  // from running/rest to summary/idle regardless of whether preset/mode
  // changed — Effect 1's preset/mode comparison would otherwise skip it.
  useEffect(() => {
    const prev = lastStatusRef.current;
    const curr = state.status;
    lastStatusRef.current = curr;

    if (prev === null) return; // First render; nothing to compare against.

    const wasInSession = prev === 'running' || prev === 'rest';
    const isNowEnded = curr === 'summary' || curr === 'idle';

    if (wasInSession && isNowEnded) {
      savePreferences({
        version: PREFS_VERSION,
        mode: state.mode,
        selectedPresetId: state.selectedPresetId,
        config: state.config,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);
}
