import type { CueMode } from '../hooks/useSessionState';
import type { SessionConfig } from '../types/round';
import type { PresetId } from '../types/preferences';
import { SESSION_CONFIG_LIMITS, WORKOUT_PRESETS } from '../lib/sessionConfig';
import { ModeButton } from './ModeButton';

interface PreSessionScreenProps {
  mode: CueMode;
  selectedPresetId: PresetId;
  config: SessionConfig;
  onModeChange: (mode: CueMode) => void;
  onSelectPreset: (presetId: PresetId) => void;
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
  selectedPresetId,
  config,
  onModeChange,
  onSelectPreset,
  onConfigChange,
  onStart,
}: PreSessionScreenProps) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-dvh text-white gap-8"
      style={{
        paddingTop: 'calc(1.5rem + var(--safe-top))',
        paddingRight: 'calc(1.5rem + var(--safe-right))',
        paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
        paddingLeft: 'calc(1.5rem + var(--safe-left))',
      }}
    >
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

      <div className="flex flex-col items-stretch gap-2 w-full max-w-sm">
        <div className="text-sm uppercase tracking-wide text-gray-400 text-center">
          Workout
        </div>
        {WORKOUT_PRESETS.map((preset) => {
          const emphasized = preset.id === 'quick-demo';
          const active = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`w-full min-h-[48px] rounded-md transition-colors ${
                emphasized ? 'py-4 text-xl' : 'py-3'
              } ${
                active
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {selectedPresetId === 'custom' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-sm uppercase tracking-wide text-gray-400">
            Custom Settings
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
      )}

      {/* Always rendered (Lock 7); no device-capability heuristic. */}
      <p className="text-sm text-gray-400">Tap the matching edge</p>

      <button
        onClick={onStart}
        className="px-12 py-4 text-xl bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-md transition-colors"
      >
        Start Session
      </button>
    </div>
  );
}
