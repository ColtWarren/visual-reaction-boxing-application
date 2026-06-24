/**
 * Step 12: Configuration persistence type contract (Lock 4 / Lock 5).
 *
 * Versioned localStorage envelope for user preferences. The envelope is
 * deliberately minimal — only the inputs a returning user expects to be
 * remembered (cue mode, chosen preset, and the resolved session config).
 *
 * Pure storage/validation functions live in `lib/preferencesStorage.ts`.
 * Reducer integration (lazy initializer + lifecycle hook) is Block 2.
 */

import type { CueMode } from '../hooks/useSessionState';
import type { SessionConfig } from './round';

/** The three workout presets (Lock 5). `custom` preserves user-edited config. */
export type PresetId = 'quick-demo' | '3x3-standard' | 'custom';

/**
 * Persisted preferences envelope, version 1.
 *
 * Stored under `reaction-defense.preferences.v1`. The `version` literal gates
 * forward compatibility: a mismatch resets to first-launch defaults (Lock 4).
 */
export interface PersistedPreferencesV1 {
  version: 1;
  mode: CueMode;
  selectedPresetId: PresetId;
  config: SessionConfig;
}
