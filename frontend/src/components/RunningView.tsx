import { resolveDefenseVisual } from '../lib';
import type { CueMode } from '../hooks/useSessionState';
import type { ActiveStimulus } from '../types/stimulus';
import type { InputDirection, Stance } from '../types/stance';
import Cue from './Cue';
import { TouchZones } from './TouchZones';
import { TopBar } from './TopBar';

interface RunningViewProps {
  mode: CueMode;
  stimulus: ActiveStimulus | null;
  /** Active (idle-locked) stance; drives stance-aware cue color/position. */
  stance: Stance;
  currentRoundIndex: number;
  totalRounds: number;
  onStop: () => void;
  /** Touch entry point (submitDefenseInput from useReactionInput). */
  onDefenseInput: (direction: InputDirection, inputAtMs: number) => void;
}

export function RunningView({
  mode,
  stimulus,
  stance,
  currentRoundIndex,
  totalRounds,
  onStop,
  onDefenseInput,
}: RunningViewProps) {
  const showVisualCue = mode === 'visual' || mode === 'combined';
  const showAudioPlaceholder = mode === 'audio';

  return (
    <>
      {/* In-session top bar (Block 6): round chip in the top-left dead corner and
          Stop in the top-right dead corner, center 50vw kept free for the
          top-center pull zone. Replaces the former fixed round counter and the
          bottom-right floating Stop. currentRoundIndex is 0-based; the chip shows
          currentRoundIndex + 1. */}
      <TopBar
        currentRound={currentRoundIndex + 1}
        totalRounds={totalRounds}
        onStop={onStop}
        layout="overlay"
      />

      {/* Touch input zones (Step 12). z-10 keeps them below the top bar (z-20)
          and the Stop button (z-30), so a Stop tap is never classified as a
          defense. Active in all modes — touch classifies via the same shared
          useReactionInput path as the keyboard. */}
      <TouchZones onDefenseInput={onDefenseInput} />

      {/* Visual cue (in visual or combined modes). Step 10 / Theme 4: color and
          position derive from the defense family via resolveDefenseVisual for the
          active stance — the single source of truth. Under southpaw the slip
          pair's position mirrors (Design B); color is stance-invariant. Cue
          stays a pure presentational component. */}
      {showVisualCue && stimulus && (
        <Cue
          color={resolveDefenseVisual(stimulus.defense, stance).color}
          position={resolveDefenseVisual(stimulus.defense, stance).position}
        />
      )}

      {/* Audio mode activity indicator (R49 Q5 revision). The
          text-rd-text-secondary here is the audio-mode placeholder, not the
          round counter — which moved to TopBar in Block 6. */}
      {showAudioPlaceholder && (
        <div className="flex items-center justify-center min-h-dvh gap-3">
          <span
            className="inline-block w-3 h-3 bg-emerald-500 rounded-full animate-pulse"
            aria-hidden="true"
          />
          <div className="text-rd-text-secondary text-lg uppercase tracking-widest">
            Audio Mode — Active
          </div>
        </div>
      )}
    </>
  );
}
