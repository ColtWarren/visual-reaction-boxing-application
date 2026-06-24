import type { SessionConfig } from '../types/round';
import type { PresetId } from '../types/preferences';

/**
 * Default session configuration on app mount.
 * MVP default training session: 3-minute rounds, 1-minute rest, 3 rounds.
 * Identical to the 3x3 Standard preset; reused as that preset's canonical config.
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  roundDurationMs: 180_000,
  restDurationMs: 60_000,
  totalRounds: 3,
};

/**
 * Step 12 (Lock 5): the three workout presets. Display metadata only;
 * canonical configs for non-Custom presets live in PRESET_TO_CONFIG. Order
 * here is the render order on PreSessionScreen (Quick Demo is the on-ramp).
 */
export const WORKOUT_PRESETS: ReadonlyArray<{ id: PresetId; name: string }> = [
  { id: 'quick-demo', name: 'Quick Demo' },
  { id: '3x3-standard', name: '3x3 Standard' },
  { id: 'custom', name: 'Custom' },
];

/**
 * Canonical config for each non-Custom preset (Lock 5). Custom has no entry —
 * it preserves whatever the user edited. Selecting a non-Custom preset, or
 * loading persisted prefs with one, forces these canonical values.
 */
export const PRESET_TO_CONFIG: Record<
  Exclude<PresetId, 'custom'>,
  SessionConfig
> = {
  'quick-demo': { roundDurationMs: 60_000, restDurationMs: 0, totalRounds: 1 },
  '3x3-standard': DEFAULT_SESSION_CONFIG,
};

/**
 * Duration of "Round N starting" flash when restDurationMs === 0.
 * Provides visual confirmation between rounds without forcing a rest interval.
 * Per R63 lock 4.
 */
export const ROUND_START_FLASH_MS = 1000;

/**
 * UI configuration limits — slider min/max/step values.
 * Used by PreSessionScreen to enforce 30-second increments and bounds.
 */
export const SESSION_CONFIG_LIMITS = {
  roundDurationMs: { min: 60_000, max: 300_000, step: 30_000 },
  restDurationMs: { min: 0, max: 180_000, step: 30_000 },
  totalRounds: { min: 1, max: 12, step: 1 },
} as const;
