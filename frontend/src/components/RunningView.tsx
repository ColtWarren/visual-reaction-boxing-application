import type { CueMode } from '../hooks/useSessionState';
import type { CueDictionaryEntry } from '../lib/cueDictionary';
import Cue from './Cue';

interface RunningViewProps {
  mode: CueMode;
  cue: CueDictionaryEntry | null;
  onStop: () => void;
}

export function RunningView({ mode, cue, onStop }: RunningViewProps) {
  const showVisualCue = mode === 'visual' || mode === 'combined';
  const showAudioPlaceholder = mode === 'audio';

  return (
    <>
      {/* Visual cue (in visual or combined modes) */}
      {showVisualCue && cue && (
        <Cue color={cue.color} position={cue.position} />
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
