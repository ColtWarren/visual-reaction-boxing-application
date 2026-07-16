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

// Accuracy color bands, ratified at v2 (ACCURACY_COLOR_THRESHOLDS):
// >=80 success, 60-79 warning, <60 danger.
function accuracyColorClass(accuracy: number): string {
  if (accuracy >= 80) return 'text-rd-accent-success';
  if (accuracy >= 60) return 'text-rd-accent-warning';
  return 'text-rd-accent-danger';
}

function SecondaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--rd-radius-card)] bg-rd-bg-surface/50 p-3 text-center">
      <div className="mb-1 text-xs uppercase tracking-wider text-rd-text-muted">
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums text-rd-text-primary">
        {value}
      </div>
    </div>
  );
}

function TallyStat({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass?: string;
}) {
  return (
    <div className="text-center">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-rd-text-muted">
        {label}
      </div>
      <div
        className={`text-base font-semibold tabular-nums ${colorClass ?? 'text-rd-text-primary'}`}
      >
        {value}
      </div>
    </div>
  );
}

export function SessionSummary({ results, totalRounds, onDismiss }: SessionSummaryProps) {
  // R63 lock 1: accuracy = correct / (correct + incorrect); misses are a separate
  // metric, NOT in the accuracy denominator. computeStats owns this formula.
  const sessionStats = useMemo(() => computeStats(results), [results]);

  // Per-round breakdown: one entry per round that had activity. Rounds with no
  // results (e.g. an early-stopped round) are filtered out. Derived internally
  // from results + totalRounds — no roundBreakdowns prop.
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

  // Zero-classified (all misses / no responses): the accuracy denominator is 0,
  // so show a neutral em-dash rather than 0% in red.
  const hasClassified =
    sessionStats.correctCount + sessionStats.incorrectCount > 0;
  const showPerRound = totalRounds > 1 && roundStats.length > 0;

  return (
    <div
      className="flex min-h-dvh w-full flex-col items-center overflow-y-auto bg-rd-bg-base text-rd-text-primary"
      style={{
        paddingTop: 'calc(2rem + var(--safe-top))',
        paddingRight: 'calc(2rem + var(--safe-right))',
        paddingBottom: 'calc(2rem + var(--safe-bottom))',
        paddingLeft: 'calc(2rem + var(--safe-left))',
      }}
    >
      {/* my-auto centers the column when it fits and lets it scroll when tall
          (multi-round breakdown) without the flex-centering clip. */}
      <div className="my-auto flex w-full max-w-md flex-col gap-6">
        <h1 className="text-center text-xl font-semibold">Session Complete</h1>

        {/* HERO: Accuracy — neutral em-dash when nothing was classified. */}
        <div className="text-center">
          <div className="mb-2 text-xs uppercase tracking-wider text-rd-text-muted">
            Accuracy
          </div>
          {hasClassified ? (
            <div
              className={`text-5xl font-bold tabular-nums ${accuracyColorClass(sessionStats.accuracy)}`}
            >
              {Math.round(sessionStats.accuracy)}%
            </div>
          ) : (
            <>
              <div className="text-5xl font-bold text-rd-text-muted">—</div>
              <div className="mt-1 text-xs text-rd-text-muted">
                No classified responses
              </div>
            </>
          )}
        </div>

        {/* SECONDARY: Avg RT / Best RT (correct hits only). */}
        <div className="grid grid-cols-2 gap-3">
          <SecondaryStat label="Avg RT" value={formatMs(sessionStats.avgRtMs)} />
          <SecondaryStat label="Best RT" value={formatMs(sessionStats.bestRtMs)} />
        </div>

        {/* TALLY: Total / Correct / Incorrect / Missed — responsive 2x2 → 4-across. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <TallyStat label="Total" value={totalReactions} />
          <TallyStat
            label="Correct"
            value={sessionStats.correctCount}
            colorClass="text-rd-accent-success"
          />
          <TallyStat
            label="Incorrect"
            value={sessionStats.incorrectCount}
            colorClass="text-rd-accent-warning"
          />
          <TallyStat
            label="Missed"
            value={sessionStats.missCount}
            colorClass="text-rd-accent-danger"
          />
        </div>

        {/* PER-ROUND breakdown (optional) — full detail (Accuracy, Avg RT, Best
            RT, and colored Correct/Incorrect/Missed), derived internally. */}
        {showPerRound && (
          <div className="flex flex-col gap-4 rounded-[var(--rd-radius-card)] bg-rd-bg-surface/50 p-4">
            <div className="text-xs uppercase tracking-wider text-rd-text-muted">
              Per Round
            </div>
            {roundStats.map(({ roundIndex, stats }) => (
              <div key={roundIndex} className="flex flex-col gap-1">
                <div className="text-sm font-medium text-rd-text-secondary">
                  Round {roundIndex + 1}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-rd-text-muted">
                  <div>
                    Accuracy:{' '}
                    <span className="tabular-nums text-rd-text-primary">
                      {Math.round(stats.accuracy)}%
                    </span>
                  </div>
                  <div>
                    Avg RT:{' '}
                    <span className="tabular-nums text-rd-text-primary">
                      {formatMs(stats.avgRtMs)}
                    </span>
                  </div>
                  <div>
                    Best RT:{' '}
                    <span className="tabular-nums text-rd-text-primary">
                      {formatMs(stats.bestRtMs)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-rd-text-muted">
                  <span className="tabular-nums text-rd-accent-success">
                    {stats.correctCount}
                  </span>{' '}
                  correct
                  {' · '}
                  <span className="tabular-nums text-rd-accent-warning">
                    {stats.incorrectCount}
                  </span>{' '}
                  incorrect
                  {' · '}
                  <span className="tabular-nums text-rd-accent-danger">
                    {stats.missCount}
                  </span>{' '}
                  missed
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Done → onDismiss → idle (behavior unchanged). */}
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-11 w-full rounded-[var(--rd-radius-pill)] bg-rd-text-primary px-6 py-3 font-medium text-rd-bg-base transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary"
        >
          Done
        </button>
      </div>
    </div>
  );
}
