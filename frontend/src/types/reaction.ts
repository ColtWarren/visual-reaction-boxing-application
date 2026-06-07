/**
 * Step 10: ReactionResult becomes a discriminated union.
 *
 * Step 9 shape: { stimulusId, classification, reactionTimeMs }
 * Step 10 shape: { result: 'hit' | 'miss' | 'correct-ignore', ... }
 *
 * Step 10 producer (useInputHandler) emits ONLY the 'hit' variant. The 'miss'
 * variant will be produced by Step 11's miss detection logic (cue expired
 * without input). The 'correct-ignore' variant will be produced when decoy
 * mechanics land (Theme 2). The data shape is honest from Step 10 forward —
 * SessionSummary handles all three variants gracefully, even though only 'hit'
 * appears in production data this step.
 *
 * TypeScript discriminated union prevents reading reactionTimeMs on a miss
 * (illegal states unrepresentable). Consumer pattern:
 *   const hits = results.filter((r): r is HitReaction => r.result === 'hit');
 */

export type ReactionClassification = 'correct' | 'incorrect';

export interface HitReaction {
  result: 'hit';
  stimulusId: number;
  classification: ReactionClassification;
  reactionTimeMs: number;
}

export interface MissReaction {
  result: 'miss';
  stimulusId: number;
}

export interface CorrectIgnoreReaction {
  result: 'correct-ignore';
  stimulusId: number;
}

export type ReactionResult = HitReaction | MissReaction | CorrectIgnoreReaction;
