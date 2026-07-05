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
 *
 * Step 13 (Block 8): also owns the reset controller consumed by SettingsView.
 * Reset removes the stored key, arms two independent write-suppression flags
 * (one per write effect, so the post-reset re-render can't rewrite defaults),
 * and dispatches the reducer's pure reset via the focused callback.
 */

import { useEffect, useRef, useCallback } from 'react';
import type {
  CueMode,
  SessionState,
  SessionStatus,
} from './useSessionState';
import type { PresetId } from '../types/preferences';
import {
  savePreferences,
  PREFS_VERSION,
  PREFS_STORAGE_KEY,
} from '../lib/preferencesStorage';

export function usePreferencesPersistence(state: SessionState): {
  resetPreferences: () => void;
} {
  const lastSavedRef = useRef<{ preset: PresetId; mode: CueMode } | null>(null);
  const lastStatusRef = useRef<SessionStatus | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Two INDEPENDENT suppression flags — one per write effect (R2 DeepSeek HIGH).
  // A single shared flag would be consumed by whichever effect ran first after a
  // reset, leaving the other free to write the defaults straight back to storage.
  const suppressImmediateWriteRef = useRef(false);
  const suppressConfigWriteRef = useRef(false);

  const cancelPending = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Reset controller (single owner). Cancels the pending debounce, arms BOTH
  // suppression flags so the post-reset re-render doesn't rewrite defaults,
  // removes only this app's key (NOT localStorage.clear()), then dispatches the
  // pure reducer reset via the focused callback (never raw dispatch — Codex HIGH).
  const dispatchReset = state.resetPreferences;
  const resetPreferences = useCallback(() => {
    cancelPending();
    suppressImmediateWriteRef.current = true;
    suppressConfigWriteRef.current = true;
    localStorage.removeItem(PREFS_STORAGE_KEY);
    dispatchReset();
  }, [cancelPending, dispatchReset]);

  // Effect 1: immediate save on idle/summary preset or mode changes.
  // config is read but intentionally NOT a dependency — slider-driven config
  // edits are handled by the debounced Effect 2; including it here would fire
  // an undebounced save on every drag tick.
  useEffect(() => {
    // Consume the immediate-write suppression flag FIRST (before the status /
    // change guards) so a reset always clears it, even when the guards would
    // have returned early anyway.
    if (suppressImmediateWriteRef.current) {
      suppressImmediateWriteRef.current = false;
      return;
    }
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
    // Consume the config-write suppression flag FIRST — the preset guard below
    // would otherwise return early (post-reset preset is 'quick-demo', not
    // 'custom') and leave the flag armed to swallow a later genuine edit.
    if (suppressConfigWriteRef.current) {
      suppressConfigWriteRef.current = false;
      return;
    }
    if (state.status !== 'idle') return;
    if (state.selectedPresetId !== 'custom') return;
    cancelPending();
    debounceTimerRef.current = setTimeout(() => {
      savePreferences({
        version: PREFS_VERSION,
        mode: state.mode,
        selectedPresetId: state.selectedPresetId,
        config: state.config,
      });
      debounceTimerRef.current = null;
    }, 300);
    return () => cancelPending();
  }, [state.config, state.status, state.selectedPresetId, state.mode, cancelPending]);

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

  return { resetPreferences };
}
