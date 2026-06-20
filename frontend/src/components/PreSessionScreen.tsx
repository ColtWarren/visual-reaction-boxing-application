import type { CueMode } from '../hooks/useSessionState';
import type { SessionConfig } from '../types/round';
import { SESSION_CONFIG_LIMITS } from '../lib/sessionConfig';
import { ModeButton } from './ModeButton';

interface PreSessionScreenProps {
  mode: CueMode;
  config: SessionConfig;
  onModeChange: (mode: CueMode) => void;
  onConfigChange: (config: Partial<SessionConfig>) => void;
  onStart: () => void;
}

// Format a millisecond duration as M:SS (e.g. 180_000 -> "3:00", 0 -> "0:00").
function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PreSessionScreen({
  mode,
  config,
  onModeChange,
  onConfigChange,
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

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="text-sm uppercase tracking-wide text-gray-400">
          Session
        </div>

        <div className="w-full">
          <div className="flex justify-between text-sm">
            <span>Round duration</span>
            <span className="font-mono">{formatDuration(config.roundDurationMs)}</span>
          </div>
          <input
            type="range"
            min={SESSION_CONFIG_LIMITS.roundDurationMs.min}
            max={SESSION_CONFIG_LIMITS.roundDurationMs.max}
            step={SESSION_CONFIG_LIMITS.roundDurationMs.step}
            value={config.roundDurationMs}
            onChange={(e) => onConfigChange({ roundDurationMs: Number(e.target.value) })}
            className="w-full mt-1 accent-red-600"
          />
        </div>

        <div className="w-full">
          <div className="flex justify-between text-sm">
            <span>Rest duration</span>
            <span className="font-mono">{formatDuration(config.restDurationMs)}</span>
          </div>
          <input
            type="range"
            min={SESSION_CONFIG_LIMITS.restDurationMs.min}
            max={SESSION_CONFIG_LIMITS.restDurationMs.max}
            step={SESSION_CONFIG_LIMITS.restDurationMs.step}
            value={config.restDurationMs}
            onChange={(e) => onConfigChange({ restDurationMs: Number(e.target.value) })}
            className="w-full mt-1 accent-red-600"
          />
        </div>

        <div className="w-full">
          <div className="flex justify-between text-sm">
            <span>Rounds</span>
            <span className="font-mono">{config.totalRounds}</span>
          </div>
          <input
            type="range"
            min={SESSION_CONFIG_LIMITS.totalRounds.min}
            max={SESSION_CONFIG_LIMITS.totalRounds.max}
            step={SESSION_CONFIG_LIMITS.totalRounds.step}
            value={config.totalRounds}
            onChange={(e) => onConfigChange({ totalRounds: Number(e.target.value) })}
            className="w-full mt-1 accent-red-600"
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
