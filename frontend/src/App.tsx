import { useSessionState } from './hooks/useSessionState';
import { useStimulusEngine } from './hooks/useStimulusEngine';
import { useInputHandler } from './hooks/useInputHandler';
import { PreSessionScreen } from './components/PreSessionScreen';
import { RunningView } from './components/RunningView';

function App() {
  const session = useSessionState();

  // Engine cycles whenever session is running (modality-agnostic).
  // The audio cue emitter (Step 10) will be another parallel consumer
  // of the same engine output, gated by mode at its own use site.
  const isSessionRunning = session.status === 'running';
  const { cue } = useStimulusEngine(isSessionRunning);

  // Consumer-side gating by status AND mode (Option C from R49 Q10,
  // tightened per R50C idle-stale-cue fix):
  // - isVisualCueActive requires BOTH session running AND visual/combined mode
  // - This closes the micro-window after Stop where status flipped to idle
  //   but the engine's cleanup (clearing currentCue) hasn't run yet. Without
  //   the isSessionRunning half of the gate, a keypress in that window would
  //   classify against a stale cue. (Same class of race as Step 6's R44A fix.)
  const isVisualModeSelected =
    session.mode === 'visual' || session.mode === 'combined';
  const isVisualCueActive = isSessionRunning && isVisualModeSelected;
  const cueForInput = isVisualCueActive ? cue : null;

  // Step 6 keyboard input handler — preserved, now receives status+mode-gated cue
  const { lastInput: _lastInput } = useInputHandler(cueForInput);

  return (
    <main className="relative min-h-dvh w-full bg-zinc-950">
      {session.status === 'idle' ? (
        <PreSessionScreen
          mode={session.mode}
          onModeChange={session.setMode}
          onStart={session.startSession}
        />
      ) : (
        <RunningView
          mode={session.mode}
          cue={isVisualCueActive ? cue : null}
          onStop={session.stopSession}
        />
      )}
    </main>
  );
}

export default App;
