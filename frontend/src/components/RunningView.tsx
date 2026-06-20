import { DEFENSE_VISUAL_MAP } from '../lib';
import type { CueMode } from '../hooks/useSessionState';
import type { ActiveStimulus } from '../types/stimulus';
import Cue from './Cue';

interface RunningViewProps {
  mode: CueMode;
  stimulus: ActiveStimulus | null;
  currentRoundIndex: number;
  totalRounds: number;
  onStop: () => void;
}

export function RunningView({
  mode,
  stimulus,
  currentRoundIndex,
  totalRounds,
  onStop,
}: RunningViewProps) {
  const showVisualCue = mode === 'visual' || mode === 'combined';
  const showAudioPlaceholder = mode === 'audio';

  return (
    <>
      {/* Round counter overlay (top-left, non-interactive). currentRoundIndex
          is 0-based; displayed round is currentRoundIndex + 1. pointer-events-none
          keeps it from intercepting taps over the cue area. */}
      <div className="fixed top-4 left-4 text-sm uppercase tracking-widest text-zinc-500 pointer-events-none">
        Round {currentRoundIndex + 1} / {totalRounds}
      </div>

      {/* Visual cue (in visual or combined modes). Step 10: color/position
          derive from the defense family via DEFENSE_VISUAL_MAP — the single
          source of truth. Cue stays a pure presentational component. */}
      {showVisualCue && stimulus && (
        <Cue
          color={DEFENSE_VISUAL_MAP[stimulus.defense].color}
          position={DEFENSE_VISUAL_MAP[stimulus.defense].position}
        />
      )}

      {/* Audio mode activity indicator (R49 Q5 revision) */}
      {showAudioPlaceholder && (
        <div className="flex items-center justify-center min-h-dvh gap-3">
          <span
            className="inline-block w-3 h-3 bg-emerald-500 rounded-full animate-pulse"
            aria-hidden="true"
          />
          <div className="text-gray-400 text-lg uppercase tracking-widest">
            Audio Mode — Active
          </div>
        </div>
      )}

      {/* Translucent Stop button (always visible during running) */}
      <button
        onClick={onStop}
        className="fixed bottom-6 right-6 px-8 py-3 text-sm
                   bg-white/20 hover:bg-white/30 text-white/80 hover:text-white
                   border border-white/20 rounded-md backdrop-blur-sm
                   transition-colors"
      >
        Stop
      </button>
    </>
  );
}
