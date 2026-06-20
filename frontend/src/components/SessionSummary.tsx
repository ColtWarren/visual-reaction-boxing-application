import { useMemo } from 'react';
import type { ReactionResult } from '../types/reaction';
import { computeStats } from '../lib/sessionStats';

interface SessionSummaryProps {
  results: ReactionResult[];
  totalRounds: number;
  onDismiss: () => void;
}

// Shipped 'N ms' / em-dash convention. computeStats returns 0 for avg/best RT
// when there are no correct hits, which renders as the em-dash placeholder.
function formatMs(ms: number): string {
  return ms === 0 ? '—' : `${Math.round(ms)} ms`;
}

export function SessionSummary({ results, totalRounds, onDismiss }: SessionSummaryProps) {
  // R63 lock 1: accuracy = correct / (correct + incorrect); misses are a
  // separate metric, NOT in the accuracy denominator. Inline math replaced by
  // computeStats — the previous total-based denominator counted misses as
  // incorrect once Step 11 began producing MissReactions.
  const sessionStats = useMemo(() => computeStats(results), [results]);

  // Per-round breakdown: one entry per round that had activity. Rounds with no
  // results (e.g. an early-stopped round) are filtered out.
  const roundStats = useMemo(() => {
    return Array.from({ length: totalRounds }, (_, i) => {
      const roundResults = results.filter((r) => r.roundIndex === i);
      return { roundIndex: i, stats: computeStats(roundResults) };
    }).filter(
      ({ stats }) => stats.correctCount + stats.incorrectCount + stats.missCount > 0,
    );
  }, [results, totalRounds]);

  const totalReactions =
    sessionStats.correctCount + sessionStats.incorrectCount + sessionStats.missCount;

  return (
    <div className="flex min-h-dvh flex-col items-center overflow-y-auto p-8 text-zinc-100">
      <h1 className="mb-8 text-3xl font-bold">Session Complete</h1>

      <div className="mb-10 grid grid-cols-2 gap-x-12 gap-y-4 text-lg">
        <div className="text-zinc-400">Total reactions</div>
        <div className="text-right tabular-nums">{totalReactions}</div>

        <div className="text-zinc-400">Correct</div>
        <div className="text-right tabular-nums text-emerald-400">
          {sessionStats.correctCount}
        </div>

        <div className="text-zinc-400">Incorrect</div>
        <div className="text-right tabular-nums text-rose-400">
          {sessionStats.incorrectCount}
        </div>

        <div className="text-zinc-400">Missed</div>
        <div className="text-right tabular-nums text-amber-400">
          {sessionStats.missCount}
        </div>

        <div className="border-t border-zinc-800 pt-4 text-zinc-400">Accuracy</div>
        <div className="border-t border-zinc-800 pt-4 text-right text-xl tabular-nums">
          {Math.round(sessionStats.accuracy)}%
        </div>

        <div className="text-zinc-400">Average RT (correct)</div>
        <div className="text-right tabular-nums">{formatMs(sessionStats.avgRtMs)}</div>

        <div className="text-zinc-400">Best RT (correct)</div>
        <div className="text-right tabular-nums">{formatMs(sessionStats.bestRtMs)}</div>
      </div>

      {/* Per-round breakdown — only when multi-round AND at least one round had
          activity. Misses appear as a separate metric per round. */}
      {totalRounds > 1 && roundStats.length > 0 && (
        <div className="mb-10 w-full max-w-md">
          <div className="mb-3 text-sm uppercase tracking-wide text-zinc-400">
            Per Round
          </div>
          {roundStats.map(({ roundIndex, stats }) => (
            <div key={roundIndex} className="mb-3 border-b border-zinc-800 pb-3">
              <div className="mb-1 text-sm font-bold">Round {roundIndex + 1}</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                <div>
                  Accuracy:{' '}
                  <span className="tabular-nums text-zinc-100">
                    {Math.round(stats.accuracy)}%
                  </span>
                </div>
                <div>
                  Avg RT:{' '}
                  <span className="tabular-nums text-zinc-100">
                    {formatMs(stats.avgRtMs)}
                  </span>
                </div>
                <div>
                  Hits / Missed:{' '}
                  <span className="tabular-nums text-zinc-100">
                    {stats.correctCount + stats.incorrectCount} / {stats.missCount}
                  </span>
                </div>
                <div>
                  Best RT:{' '}
                  <span className="tabular-nums text-zinc-100">
                    {formatMs(stats.bestRtMs)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg bg-zinc-800 px-8 py-3 text-lg font-semibold transition-colors hover:bg-zinc-700"
      >
        Done
      </button>
    </div>
  );
}
