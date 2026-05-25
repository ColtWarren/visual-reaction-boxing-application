import type { CueDictionaryEntry } from '../lib/cueDictionary';

/**
 * A single stimulus occurrence presented to the user.
 *
 * Wraps the static cue (what to show) with per-occurrence runtime metadata:
 * - `id`: a fresh monotonic integer per occurrence, even when the same color
 *   repeats. Stable identity for the input lock (R54) and the Step 11 scorecard.
 * - `appearedAtMs`: stimulus ACTIVATION timestamp from performance.now(), captured
 *   when the engine sets state. NOT a lab-grade paint timestamp — there is a small
 *   systematic render/paint offset, acceptable for within-app relative measurement.
 *   Used by Step 9 for reaction time (inputAtMs - appearedAtMs).
 *
 * Nullability is top-level (ActiveStimulus | null) wherever consumed: the object is
 * either fully present (all three fields) or null. Never per-field-nullable.
 */
export interface ActiveStimulus {
  id: number;
  cue: CueDictionaryEntry;
  appearedAtMs: number;
}
