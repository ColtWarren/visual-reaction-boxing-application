import { useSessionState } from './hooks/useSessionState';
import { useStimulusEngine } from './hooks/useStimulusEngine';
import { useInputHandler } from './hooks/useInputHandler';
import { useAudioCueRenderer } from './hooks/useAudioCueRenderer';
import { PreSessionScreen } from './components/PreSessionScreen';
import { RunningView } from './components/RunningView';
import { SessionSummary } from './components/SessionSummary';

function App() {
  const session = useSessionState();

  // Engine cycles whenever session is running (modality-agnostic).
  // The audio cue emitter (Step 10) will be another parallel consumer
  // of the same engine output, gated by mode at its own use site.
  const isSessionRunning = session.status === 'running';
  const { stimulus, recordAudioRequested, recordAudioStarted, recordAudioFailed } =
    useStimulusEngine(isSessionRunning);

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
  const isAudioModeSelected =
    session.mode === 'audio' || session.mode === 'combined';
  const isVisualStimulusActive = isSessionRunning && isVisualModeSelected;

  // Q1 audio-input gate (R61 Option C lock). Pure audio mode refuses keypresses
  // until audioStartedAtMs exists — the cue cannot be perceived before TTS
  // onset, so an earlier press is impossibly-early and silently dropped. For
  // non-audio modes this is vacuously true (the visual gate governs instead).
  const isAudioInputReady =
    session.mode !== 'audio' || stimulus?.audioStartedAtMs != null;

  // stimulusForInput: the stimulus handed to the (mode-agnostic) input handler.
  // - Visual/combined modes: R50C dual-gate, appearedAtMs = engine emission
  //   (Step 9 RT semantics unchanged).
  // - Pure audio mode: RT anchors to audioStartedAtMs (Q1 Option C, test 21).
  //   The input handler computes inputAtMs - appearedAtMs, so we substitute
  //   audioStartedAtMs AS appearedAtMs for the audio-mode input stimulus. The
  //   gate above guarantees audioStartedAtMs exists when this branch yields a
  //   non-null stimulus. This keeps the input handler mode-agnostic (Q3 lock):
  //   App.tsx is the mode-aware integration point that selects the onset anchor.
  const stimulusForInput =
    session.mode === 'audio'
      ? isSessionRunning && isAudioInputReady && stimulus != null
        ? // isAudioInputReady guarantees audioStartedAtMs is defined here, so the
          // non-null assertion is sound; it becomes the RT onset anchor.
          { ...stimulus, appearedAtMs: stimulus.audioStartedAtMs! }
        : null
      : isVisualStimulusActive
        ? stimulus
        : null;

  // Audio renderer — active when audio or combined mode is running. Consumes
  // the same engine event stream and speaks the attack's voice line via Web
  // Speech API, reporting timing back to the engine (Path A: engine owns audio
  // timing). Watchdog + stale-callback guards live inside the hook.
  const isAudioCueActive = isSessionRunning && isAudioModeSelected;
  useAudioCueRenderer({
    active: isAudioCueActive,
    stimulus,
    onAudioRequested: recordAudioRequested,
    onAudioStarted: recordAudioStarted,
    onAudioFailed: recordAudioFailed,
  });

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
