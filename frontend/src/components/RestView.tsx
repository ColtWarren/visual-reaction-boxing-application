import type { ReactionResult } from '../types/reaction';
import { computeStats } from '../lib/sessionStats';

interface RestViewProps {
  currentRoundIndex: number;
  totalRounds: number;
  restDurationMs: number;
  /** Time remaining in current rest phase, in ms. Driven by useRoundTimer in App. */
  restRemainingMs: number;
  results: ReactionResult[];
  onStop: () => void;
}

// Shipped 'N ms' / em-dash convention (matches SessionSummary.formatMs).
// computeStats returns 0 for avg/best RT when there are no correct hits, which
// renders as the em-dash placeholder.
function formatMs(ms: number): string {
  return ms === 0 ? '—' : `${Math.round(ms)} ms`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Matches RunningView's translucent Stop button (consistent across active screens).
const STOP_BUTTON_CLASS =
  'fixed bottom-6 right-6 px-8 py-3 text-sm ' +
  'bg-white/20 hover:bg-white/30 text-white/80 hover:text-white ' +
  'border border-white/20 rounded-md backdrop-blur-sm transition-colors';

export function RestView({
  currentRoundIndex,
  totalRounds,
  restDurationMs,
  restRemainingMs,
  results,
  onStop,
}: RestViewProps) {
  // During rest, currentRoundIndex is the round that just finished (the reducer
  // increments on restTimerExpired, not roundTimerExpired). So results for the
  // finished round carry roundIndex === currentRoundIndex.
  const justFinishedStats = computeStats(
    results.filter((r) => r.roundIndex === currentRoundIndex),
  );
  const sessionStats = computeStats(results);

  // Rest = 0: 1-second "Round N starting" flash, no countdown UI (R63 lock 4).
  if (restDurationMs === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-zinc-100">
        <div className="text-3xl uppercase tracking-widest">
          Round {currentRoundIndex + 2} of {totalRounds}
        </div>
        <div className="text-sm uppercase tracking-widest text-zinc-400">
          starting
        </div>
        <button onClick={onStop} className={STOP_BUTTON_CLASS}>
          Stop
        </button>
      </div>
    );
  }

  // Standard rest — compact stacked layout (countdown / round / session).
  return (
    <div className="flex min-h-dvh flex-col items-center p-8 text-zinc-100">
      {/* Countdown header */}
      <div className="mb-8 text-center">
        <div className="text-sm uppercase tracking-widest text-zinc-400">Rest</div>
        <div className="mt-1 text-2xl">
          Next Round: {currentRoundIndex + 2} / {totalRounds}
        </div>
        <div className="mt-3 text-5xl tabular-nums">
          {formatCountdown(restRemainingMs)}
        </div>
      </div>

      {/* Just-finished round stats */}
      <div className="mb-6 w-full max-w-sm">
        <div className="mb-2 text-sm uppercase tracking-wide text-zinc-400">
          Round {currentRoundIndex + 1}
        </div>
        <div className="space-y-1 text-sm">
          <div>
            Accuracy:{' '}
            <span className="tabular-nums">{justFinishedStats.accuracy.toFixed(0)}%</span>
          </div>
          <div>
            Average RT:{' '}
            <span className="tabular-nums">{formatMs(justFinishedStats.avgRtMs)}</span>
          </div>
          <div>
            Best RT:{' '}
            <span className="tabular-nums">{formatMs(justFinishedStats.bestRtMs)}</span>
          </div>
          <div>
            Correct / Incorrect / Missed:{' '}
            <span className="tabular-nums">
              {justFinishedStats.correctCount} / {justFinishedStats.incorrectCount} /{' '}
              {justFinishedStats.missCount}
            </span>
          </div>
        </div>
      </div>

      {/* Session so far — hidden during the first rest (currentRoundIndex === 0),
          where it would be identical to the round-1 summary by definition. */}
      {currentRoundIndex > 0 && (
        <div className="w-full max-w-sm">
          <div className="mb-2 text-sm uppercase tracking-wide text-zinc-400">
            Session So Far
          </div>
          <div className="space-y-1 text-sm">
            <div>
              Accuracy:{' '}
              <span className="tabular-nums">{sessionStats.accuracy.toFixed(0)}%</span>
            </div>
            <div>
              Average RT:{' '}
              <span className="tabular-nums">{formatMs(sessionStats.avgRtMs)}</span>
            </div>
            <div>
              Correct / Incorrect / Missed:{' '}
              <span className="tabular-nums">
                {sessionStats.correctCount} / {sessionStats.incorrectCount} /{' '}
                {sessionStats.missCount}
              </span>
            </div>
          </div>
        </div>
      )}

      <button onClick={onStop} className={STOP_BUTTON_CLASS}>
        Stop
      </button>
    </div>
  );
}
