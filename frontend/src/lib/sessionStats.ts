import type { ReactionResult, HitReaction, MissReaction } from '../types/reaction';

export function isHitReaction(r: ReactionResult): r is HitReaction {
  return r.result === 'hit';
}

export function isMissReaction(r: ReactionResult): r is MissReaction {
  return r.result === 'miss';
}

export interface SessionStats {
  /** Percentage 0-100; calculated from hits only (misses excluded from accuracy denominator). */
  accuracy: number;
  /** Average reaction time of correct hits only, in ms. 0 when no correct hits. */
  avgRtMs: number;
  /** Best (lowest) reaction time of correct hits only, in ms. 0 when no correct hits. */
  bestRtMs: number;
  /** Count of correct HitReactions. */
  correctCount: number;
  /** Count of incorrect HitReactions. */
  incorrectCount: number;
  /** Count of MissReactions. Separate metric, NOT in accuracy. */
  missCount: number;
}

/**
 * Compute aggregate stats from a flat ReactionResult array.
 *
 * Per R63 lock 1 (hybrid miss semantics):
 *   - Accuracy = correct / (correct + incorrect) when hits exist, else 0
 *   - Misses tracked separately (NOT in accuracy denominator)
 *   - avgRt and bestRt computed from CORRECT hits only (excludes incorrect)
 */
export function computeStats(results: ReactionResult[]): SessionStats {
  const hits = results.filter(isHitReaction);
  const misses = results.filter(isMissReaction);
  const correct = hits.filter((h) => h.classification === 'correct');
  const incorrect = hits.filter((h) => h.classification === 'incorrect');

  const accuracy = hits.length > 0
    ? (correct.length / hits.length) * 100
    : 0;
  const avgRtMs = correct.length > 0
    ? correct.reduce((sum, h) => sum + h.reactionTimeMs, 0) / correct.length
    : 0;
  const bestRtMs = correct.length > 0
    ? Math.min(...correct.map((h) => h.reactionTimeMs))
    : 0;

  return {
    accuracy,
    avgRtMs,
    bestRtMs,
    correctCount: correct.length,
    incorrectCount: incorrect.length,
    missCount: misses.length,
  };
}
