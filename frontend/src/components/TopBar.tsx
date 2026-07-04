import { StopButton } from './StopButton';

interface TopBarProps {
  currentRound: number;
  totalRounds: number;
  onStop: () => void;
  /** overlay = absolute over RunningView; flow = in-flow above RestView content. */
  layout: 'overlay' | 'flow';
}

/**
 * In-session top bar: round chip in the top-left dead corner, Stop in the
 * top-right dead corner, center 50vw kept free for the top-center pull zone
 * (TouchZones x:25-75%, y:0-25%). The explicit 25vw/50vw/25vw grid forces both
 * chips into the corners regardless of content width (narrow-viewport safe).
 *
 * The <header> container is pointer-events-none (only StopButton re-enables
 * events), so taps in the round-chip / center areas fall through to the zones
 * beneath. Blur is LOCAL to each chip, never a full-width strip, so the bar can
 * never obscure the 120px pull cue (audit A3). `min-height` (not `height`) plus
 * `paddingTop: var(--safe-top)` reserves the 48px row PLUS the iOS safe-area
 * inset without a border-box conflict.
 */
export function TopBar({ currentRound, totalRounds, onStop, layout }: TopBarProps) {
  const positionClasses =
    layout === 'overlay' ? 'absolute inset-x-0 top-0 z-20' : 'relative z-20';

  return (
    <header
      className={`${positionClasses} pointer-events-none`}
      style={{
        minHeight: 'calc(var(--rd-topbar-height) + var(--safe-top))',
        paddingTop: 'var(--safe-top)',
      }}
    >
      <div className="grid grid-cols-[25vw_50vw_25vw]">
        {/* Left dead corner: round chip (non-interactive) */}
        <div className="flex items-start justify-start pl-3 pt-2">
          <div
            data-testid="top-bar-round-chip"
            className="pointer-events-none max-w-full truncate rounded-lg border border-rd-border-subtle bg-rd-bg-elevated/80 px-3 py-1.5 text-sm font-medium uppercase tracking-wider text-rd-text-secondary backdrop-blur-sm"
          >
            {/* Compact "R n/total" so the round number never truncates inside the
                25vw dead corner on narrow viewports ("ROUND n/total" overflowed). */}
            R {currentRound}/{totalRounds}
          </div>
        </div>

        {/* Center: reserved for the top-center pull zone — kept free + non-interactive. */}
        <div aria-hidden="true" />

        {/* Right dead corner: Stop */}
        <div className="flex items-start justify-end pr-3 pt-2">
          <StopButton onClick={onStop} />
        </div>
      </div>
    </header>
  );
}
