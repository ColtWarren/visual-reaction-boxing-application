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
import type { Stance } from './stance';

/** The three workout presets (Lock 5). `custom` preserves user-edited config. */
export type PresetId = 'quick-demo' | '3x3-standard' | 'custom';

/**
 * Persisted preferences envelope, version 1.
 *
 * Stored under `reaction-defense.preferences.v1`. The `version` literal gates
 * forward compatibility: a mismatch resets to first-launch defaults (Lock 4).
 */
export interface PersistedPreferencesV1 {
  /**
   * Schema version literal. `isValidPreferences` rejects any payload whose
   * `version` !== `PREFS_VERSION`, so a mismatch resolves to first-launch
   * defaults (Lock 4). Versioning policy: breaking changes (removing or
   * retyping existing fields) require a new version literal plus a migration;
   * additive optional fields with a sensible default may be introduced within
   * the current version without a bump (loadPreferences backfills the default).
   */
  version: 1;

  /**
   * Cue delivery mode the user last selected — 'visual' | 'audio' | 'combined'
   * (see `CueMode`). Restored on next launch.
   */
  mode: CueMode;

  /**
   * Which workout preset is active. `custom` preserves the user-edited
   * `config`; for named presets, `loadPreferences` re-normalizes `config` from
   * `PRESET_TO_CONFIG` on read, so a named preset can never surface off-spec
   * durations (Lock 5).
   */
  selectedPresetId: PresetId;

  /**
   * Resolved session config (round/rest durations, total rounds). Persisted so
   * Custom edits survive reload; overwritten by the canonical preset config on
   * load for any non-`custom` preset.
   */
  config: SessionConfig;

  /**
   * Boxing stance — 'orthodox' | 'southpaw' (Theme 4). Additive field within v1:
   * legacy envelopes written before stance existed have none, so `loadPreferences`
   * backfills 'orthodox' after validation and `isValidPreferences` tolerates a
   * missing stance while rejecting a present-but-invalid one.
   */
  stance: Stance;
}
