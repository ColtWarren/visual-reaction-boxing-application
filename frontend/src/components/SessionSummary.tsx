import { useMemo } from 'react';
import type { ReactionResult } from '../types/reaction';

interface SessionSummaryProps {
  results: ReactionResult[];
  onDismiss: () => void;
}

interface SummaryStats {
  total: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercent: number;
  averageAllMs: number | null;
  averageCorrectMs: number | null;
  bestCorrectMs: number | null;
}

function computeSummaryStats(results: ReactionResult[]): SummaryStats {
  const total = results.length;
  const correct = results.filter((r) => r.classification === 'correct');
  const incorrectCount = total - correct.length;

  const averageAllMs =
    total > 0
      ? results.reduce((sum, r) => sum + r.reactionTimeMs, 0) / total
      : null;

  const averageCorrectMs =
    correct.length > 0
      ? correct.reduce((sum, r) => sum + r.reactionTimeMs, 0) / correct.length
      : null;

  const bestCorrectMs =
    correct.length > 0
      ? Math.min(...correct.map((r) => r.reactionTimeMs))
      : null;

  return {
    total,
    correctCount: correct.length,
    incorrectCount,
    accuracyPercent: total > 0 ? (correct.length / total) * 100 : 0,
    averageAllMs,
    averageCorrectMs,
    bestCorrectMs,
  };
}

function formatMs(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)} ms`;
}

export function SessionSummary({ results, onDismiss }: SessionSummaryProps) {
  const stats = useMemo(() => computeSummaryStats(results), [results]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-8 text-zinc-100">
      <h1 className="mb-8 text-3xl font-bold">Session Complete</h1>

      <div className="mb-10 grid grid-cols-2 gap-x-12 gap-y-4 text-lg">
        <div className="text-zinc-400">Total reactions</div>
        <div className="text-right tabular-nums">{stats.total}</div>

        <div className="text-zinc-400">Correct</div>
        <div className="text-right tabular-nums text-emerald-400">
          {stats.correctCount}
        </div>

        <div className="text-zinc-400">Incorrect</div>
        <div className="text-right tabular-nums text-rose-400">
          {stats.incorrectCount}
        </div>

        <div className="text-zinc-400">Accuracy</div>
        <div className="text-right tabular-nums">
          {Math.round(stats.accuracyPercent)}%
        </div>

        <div className="border-t border-zinc-800 pt-4 text-zinc-400">
          Avg reaction (all)
        </div>
        <div className="border-t border-zinc-800 pt-4 text-right text-xl tabular-nums">
          {formatMs(stats.averageAllMs)}
        </div>

        <div className="text-zinc-400">Avg reaction (correct)</div>
        <div className="text-right tabular-nums">
          {formatMs(stats.averageCorrectMs)}
        </div>

        <div className="text-zinc-400">Best (correct)</div>
        <div className="text-right tabular-nums">
          {formatMs(stats.bestCorrectMs)}
        </div>
      </div>

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
