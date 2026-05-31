import { useSessionState } from './hooks/useSessionState';
import { useStimulusEngine } from './hooks/useStimulusEngine';
import { useInputHandler } from './hooks/useInputHandler';
import { PreSessionScreen } from './components/PreSessionScreen';
import { RunningView } from './components/RunningView';
import { SessionSummary } from './components/SessionSummary';

function App() {
  const session = useSessionState();

  // Engine cycles whenever session is running (modality-agnostic).
  // The audio cue emitter (Step 10) will be another parallel consumer
  // of the same engine output, gated by mode at its own use site.
  const isSessionRunning = session.status === 'running';
  const { stimulus } = useStimulusEngine(isSessionRunning);

  // Consumer-side gating by status AND mode (Option C from R49 Q10,
  // tightened per R50C idle-stale-stimulus fix):
  // - isVisualStimulusActive requires BOTH session running AND visual/combined mode
  // - This closes the micro-window after Stop where status flipped to idle
  //   but the engine's cleanup (clearing currentStimulus) hasn't run yet.
  //   Without the isSessionRunning half of the gate, a keypress in that
  //   window would classify against a stale stimulus. (Same class of race
  //   as Step 6's R44A fix.)
  const isVisualModeSelected =
    session.mode === 'visual' || session.mode === 'combined';
  const isVisualStimulusActive = isSessionRunning && isVisualModeSelected;
  const stimulusForInput = isVisualStimulusActive ? stimulus : null;

  // Step 6 keyboard input handler — now side-effect-only via callback inversion
  // (R57 Decision 2). The hook fires session.recordReaction synchronously
  // inside the keydown handler after the id-keyed lock seals (R58 Refinement A).
  useInputHandler(stimulusForInput, session.recordReaction);

  return (
    <main className="relative min-h-dvh w-full bg-zinc-950">
      {session.status === 'idle' ? (
        <PreSessionScreen
          mode={session.mode}
          onModeChange={session.setMode}
          onStart={session.startSession}
        />
      ) : session.status === 'running' ? (
        <RunningView
          mode={session.mode}
          stimulus={isVisualStimulusActive ? stimulus : null}
          onStop={session.stopSession}
        />
      ) : (
        <SessionSummary
          results={session.results}
          onDismiss={session.dismissSummary}
        />
      )}
    </main>
  );
}

export default App;
