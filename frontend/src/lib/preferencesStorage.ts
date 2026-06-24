/**
 * Step 12: Pure storage + validation for persisted preferences (Lock 4).
 *
 * Graceful degradation: every read/write is wrapped in try/catch. Failures
 * (private-mode quota, disabled storage, malformed data) fall back silently
 * to first-launch defaults with a single `console.warn` — never throw.
 *
 * Block 1 scope: validation only. Preset normalization (Lock 5 — non-Custom
 * presets force canonical config) is added to `loadPreferences` in Block 2,
 * once `PRESET_TO_CONFIG` exists.
 */

import type { CueMode } from '../hooks/useSessionState';
import type { SessionConfig } from '../types/round';
import type { PersistedPreferencesV1, PresetId } from '../types/preferences';
import { PRESET_TO_CONFIG } from './sessionConfig';

export const PREFS_STORAGE_KEY = 'reaction-defense.preferences.v1';
export const PREFS_VERSION = 1 as const;

const VALID_MODES: readonly CueMode[] = ['visual', 'audio', 'combined'];
const VALID_PRESET_IDS: readonly PresetId[] = [
  'quick-demo',
  '3x3-standard',
  'custom',
];

/** Structural guard for the embedded SessionConfig (numbers only; no bounds). */
function isValidConfig(value: unknown): value is SessionConfig {
  if (value === null || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.roundDurationMs === 'number' &&
    typeof c.restDurationMs === 'number' &&
    typeof c.totalRounds === 'number'
  );
}

/**
 * Full structural validation of an unknown parsed value. A `version` other
 * than PREFS_VERSION fails here, so version mismatches resolve to defaults.
 */
function isValidPreferences(value: unknown): value is PersistedPreferencesV1 {
  if (value === null || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (p.version !== PREFS_VERSION) return false;
  if (typeof p.mode !== 'string' || !VALID_MODES.includes(p.mode as CueMode)) {
    return false;
  }
  if (
    typeof p.selectedPresetId !== 'string' ||
    !VALID_PRESET_IDS.includes(p.selectedPresetId as PresetId)
  ) {
    return false;
  }
  if (!isValidConfig(p.config)) return false;
  return true;
}

/**
 * Read preferences from localStorage. Returns null for empty, corrupt,
 * version-mismatched, or structurally invalid storage — the caller then
 * falls back to first-launch defaults.
 */
export function loadPreferences(): PersistedPreferencesV1 | null {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidPreferences(parsed)) return null;
    // Lock 5: non-Custom presets force canonical config, so tampered or stale
    // storage can never surface a named preset with off-spec durations.
    if (parsed.selectedPresetId !== 'custom') {
      parsed.config = PRESET_TO_CONFIG[parsed.selectedPresetId];
    }
    return parsed;
  } catch (e) {
    console.warn('[preferences] load failed:', e);
    return null;
  }
}

/** Persist preferences. Storage failures degrade silently (console.warn only). */
export function savePreferences(prefs: PersistedPreferencesV1): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn('[preferences] save failed:', e);
  }
}
