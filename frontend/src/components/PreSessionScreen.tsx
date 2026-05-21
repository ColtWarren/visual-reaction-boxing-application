import type { CueMode } from '../hooks/useSessionState';
import { ModeButton } from './ModeButton';

interface PreSessionScreenProps {
  mode: CueMode;
  onModeChange: (mode: CueMode) => void;
  onStart: () => void;
}

export function PreSessionScreen({
  mode,
  onModeChange,
  onStart,
}: PreSessionScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh text-white gap-8 p-6">
      <h1 className="text-3xl font-light">Visual Reaction Boxing</h1>

      <div className="flex flex-col items-center gap-4">
        <div className="text-sm uppercase tracking-wide text-gray-400">
          Mode
        </div>
        <div className="flex gap-2">
          <ModeButton
            label="Visual"
            active={mode === 'visual'}
            onClick={() => onModeChange('visual')}
          />
          <ModeButton
            label="Audio"
            active={mode === 'audio'}
            onClick={() => onModeChange('audio')}
          />
          <ModeButton
            label="Combined"
            active={mode === 'combined'}
            onClick={() => onModeChange('combined')}
          />
        </div>
      </div>

      <button
        onClick={onStart}
        className="px-12 py-4 text-xl bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-md transition-colors"
      >
        Start Session
      </button>
    </div>
  );
}
