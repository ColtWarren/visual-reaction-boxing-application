import { DEFENSE_VISUAL_MAP } from '../lib';
import type { CueMode } from '../hooks/useSessionState';
import type { ActiveStimulus } from '../types/stimulus';
import type { DefenseFamily } from '../types/attack';
import Cue from './Cue';
import { TouchZones } from './TouchZones';

interface RunningViewProps {
  mode: CueMode;
  stimulus: ActiveStimulus | null;
  currentRoundIndex: number;
  totalRounds: number;
  onStop: () => void;
  /** Touch entry point (submitDefenseInput from useReactionInput). */
  onDefenseInput: (defense: DefenseFamily, inputAtMs: number) => void;
}

export function RunningView({
  mode,
  stimulus,
  currentRoundIndex,
  totalRounds,
  onStop,
  onDefenseInput,
}: RunningViewProps) {
  const showVisualCue = mode === 'visual' || mode === 'combined';
  const showAudioPlaceholder = mode === 'audio';

  return (
    <>
      {/* Round counter overlay (top-left, non-interactive). currentRoundIndex
          is 0-based; displayed round is currentRoundIndex + 1. pointer-events-none
          keeps it from intercepting taps over the cue area. */}
      <div
        className="fixed text-sm uppercase tracking-widest text-zinc-500 pointer-events-none z-20"
        style={{
          top: 'calc(1rem + var(--safe-top))',
          left: 'calc(1rem + var(--safe-left))',
        }}
      >
        Round {currentRoundIndex + 1} / {totalRounds}
      </div>

      {/* Touch input zones (Step 12). Rendered BEFORE the Stop button in DOM so
          Stop paints/hit-tests on top (z-30 > z-10). Active in all modes —
          touch is a universal input that classifies via the same shared
          useReactionInput path as the keyboard. */}
      <TouchZones onDefenseInput={onDefenseInput} />

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

      {/* Translucent Stop button (always visible during running). Rendered LAST
          in the fragment.

          Isolation from touch zones (MC3 — in order of guarantee):
          1. Topmost hit-testing (LOAD-BEARING): z-30 > zones' z-10, and Stop is
             last in DOM, so the browser dispatches pointer events here, not to
             an underlying zone. This is the actual guarantee that a Stop tap is
             never classified as a defense.
          2. Dead-corner placement (OVERLAP REDUCTION, not a guarantee): bottom-6
             right-6 sits in/near the bottom-right dead corner, but on narrow or
             landscape viewports (and once safe-area insets land in Block 7) the
             button rectangle MAY overlap the bottom/right zones. Geometry only
             reduces overlap likelihood.
          3. stopPropagation (DEFENSIVE): keeps the pointer event from bubbling
             to any future ancestor handler. It does NOT stop sibling zones from
             receiving the event — they never would, since the event target is
             Stop. Belt-and-suspenders only. */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onStop}
        style={{
          bottom: 'calc(1.5rem + var(--safe-bottom))',
          right: 'calc(1.5rem + var(--safe-right))',
        }}
        className="fixed z-30 px-8 py-3 text-sm
                   bg-white/20 hover:bg-white/30 text-white/80 hover:text-white
                   border border-white/20 rounded-md backdrop-blur-sm
                   transition-colors"
      >
        Stop
      </button>
    </>
  );
}
