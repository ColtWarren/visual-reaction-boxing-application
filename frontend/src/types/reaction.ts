/**
 * Step 9: Reaction-time result types.
 *
 * Produced by useInputHandler on each classified keypress, consumed by
 * useSessionState reducer (accumulation) and SessionSummary (display).
 *
 * stimulusId carries the per-occurrence id from ActiveStimulus, enabling
 * Step 11's per-cue scorecard without a data migration.
 *
 * reactionTimeMs is the delta inputAtMs - stimulus.appearedAtMs, both
 * captured via performance.now() (Step 8 ensured same clock source).
 */

export type ReactionClassification = 'correct' | 'incorrect';

export interface ReactionResult {
  stimulusId: number;
  classification: ReactionClassification;
  reactionTimeMs: number;
}
