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
      className="flex min-h-dvh w-full flex-col items-center justify-center bg-rd-bg-base text-rd-text-primary"
      style={{
        paddingTop: 'calc(1.5rem + var(--safe-top))',
        paddingRight: 'calc(1.5rem + var(--safe-right))',
        paddingBottom: 'calc(1.5rem + var(--safe-bottom))',
        paddingLeft: 'calc(1.5rem + var(--safe-left))',
      }}
    >
      {/* Config card (Q4): subtle surface tint, rounded, generous padding, no heavy border. */}
      <div className="flex w-full max-w-md flex-col gap-6 rounded-[var(--rd-radius-card)] bg-rd-bg-surface/50 p-6 sm:p-8">
        <h1 className="text-center text-xl font-semibold text-rd-text-primary">
          Visual Reaction Boxing
        </h1>

        {/* Mode */}
        <section>
          <h2 className="mb-3 text-xs uppercase tracking-wider text-rd-text-muted">
            Mode
          </h2>
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
        </section>

        {/* Workout */}
        <section>
          <h2 className="mb-3 text-xs uppercase tracking-wider text-rd-text-muted">
            Workout
          </h2>
          <div className="flex flex-col gap-2">
            {WORKOUT_PRESETS.map((preset) => {
              const emphasized = preset.id === 'quick-demo';
              const active = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset.id)}
                  className={`min-h-[48px] w-full rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary ${
                    emphasized ? 'py-4 text-xl' : 'py-3'
                  } ${
                    active
                      ? 'bg-rd-text-primary text-rd-bg-base'
                      : 'bg-rd-bg-elevated text-rd-text-secondary hover:text-rd-text-primary'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Settings (conditional — sliders when the custom preset is active) */}
        {selectedPresetId === 'custom' && (
          <section>
            <h2 className="mb-3 text-xs uppercase tracking-wider text-rd-text-muted">
              Custom Settings
            </h2>
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <div className="flex justify-between text-sm">
                  <span>Round duration</span>
                  <span className="tabular-nums">
                    {formatDuration(config.roundDurationMs)}
                  </span>
                </div>
                <input
                  type="range"
                  min={SESSION_CONFIG_LIMITS.roundDurationMs.min}
                  max={SESSION_CONFIG_LIMITS.roundDurationMs.max}
                  step={SESSION_CONFIG_LIMITS.roundDurationMs.step}
                  value={config.roundDurationMs}
                  onChange={(e) =>
                    onConfigChange({ roundDurationMs: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-red-600"
                />
              </div>

              <div className="w-full">
                <div className="flex justify-between text-sm">
                  <span>Rest duration</span>
                  <span className="tabular-nums">
                    {formatDuration(config.restDurationMs)}
                  </span>
                </div>
                <input
                  type="range"
                  min={SESSION_CONFIG_LIMITS.restDurationMs.min}
                  max={SESSION_CONFIG_LIMITS.restDurationMs.max}
                  step={SESSION_CONFIG_LIMITS.restDurationMs.step}
                  value={config.restDurationMs}
                  onChange={(e) =>
                    onConfigChange({ restDurationMs: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-red-600"
                />
              </div>

              <div className="w-full">
                <div className="flex justify-between text-sm">
                  <span>Rounds</span>
                  <span className="tabular-nums">{config.totalRounds}</span>
                </div>
                <input
                  type="range"
                  min={SESSION_CONFIG_LIMITS.totalRounds.min}
                  max={SESSION_CONFIG_LIMITS.totalRounds.max}
                  step={SESSION_CONFIG_LIMITS.totalRounds.step}
                  value={config.totalRounds}
                  onChange={(e) =>
                    onConfigChange({ totalRounds: Number(e.target.value) })
                  }
                  className="mt-1 w-full accent-red-600"
                />
              </div>
            </div>
          </section>
        )}

        {/* Always rendered (Lock 7); no device-capability heuristic. */}
        <p className="text-center text-sm text-rd-text-secondary">
          Tap the matching edge
        </p>

        {/* start-red: keeps the red brand accent (not a token — no --rd- red
            token exists yet). Candidate for tokenization in Block 10. */}
        <button
          onClick={onStart}
          className="w-full rounded-[var(--rd-radius-pill)] bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-500 active:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary"
        >
          Start Session
        </button>
      </div>
    </div>
  );
}
