/**
 * Step 11: Rounds + rest periods domain types.
 *
 * SessionConfig is the canonical configuration type. Defined here;
 * imported everywhere else (reducer, timer, UI, config defaults).
 * No duplication.
 */

export interface SessionConfig {
  roundDurationMs: number;   // 60_000-300_000 in 30_000 increments; default 180_000
  restDurationMs: number;    // 0-180_000 in 30_000 increments; default 60_000
  totalRounds: number;       // 1-12; default 3
}
