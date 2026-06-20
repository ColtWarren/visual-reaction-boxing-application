import type { SessionConfig } from '../types/round';

/**
 * Default session configuration on app mount.
 * MVP default training session: 3-minute rounds, 1-minute rest, 3 rounds.
 * User can adjust before starting via PreSessionScreen.
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  roundDurationMs: 180_000,
  restDurationMs: 60_000,
  totalRounds: 3,
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
