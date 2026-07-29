import { useState } from 'react';
import { Route, Switch, useLocation, Redirect } from 'wouter';
import { useSessionState } from './hooks/useSessionState';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { usePreferencesPersistence } from './hooks/usePreferencesPersistence';
import { useStimulusEngine } from './hooks/useStimulusEngine';
import { useReactionInput } from './hooks/useReactionInput';
import { useAudioCueRenderer } from './hooks/useAudioCueRenderer';
import { useRoundTimer } from './hooks/useRoundTimer';
import { useMissDetector } from './hooks/useMissDetector';
import { PreSessionScreen } from './components/PreSessionScreen';
import { RunningView } from './components/RunningView';
import { RestView } from './components/RestView';
import { SessionSummary } from './components/SessionSummary';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { AppShell } from './components/AppShell';
import { UpdateToast } from './components/UpdateToast';

// AppContent holds all session hook wiring AND consumes router context
// (useLocation). It must render UNDER the router provider — for ROUTING_MODE=path
// (Block 0a) Wouter's implicit router suffices, so App just delegates here.
function AppContent() {
  const session = useSessionState();

  // Step 12 (Lock 4): persist preferences across the session lifecycle.
  // Step 13 (Block 8): also exposes the reset controller for SettingsView.
  const { resetPreferences } = usePreferencesPersistence(session);

  // Step 13 (Block 13): service-worker update owner. Gated on session.status so a
  // pending update never interrupts a live round.
  const { needRefresh: pwaNeedRefresh, updateServiceWorker: applyPWAUpdate } =
    usePWAUpdate(session.status);

  // Step 13 (Block 14): update-prompt lifecycle. The hook already gates
  // pwaNeedRefresh out during a live round/rest; dismissal is UI-only state that
  // hides the toast for the rest of this page load (a genuinely new build would
  // re-fire onNeedRefresh on the next visit). acceptUpdate reloads to the new
  // build; dismissUpdate just suppresses the prompt.
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const toastVisible = pwaNeedRefresh && !updateDismissed;
  const acceptUpdate = applyPWAUpdate;
  const dismissUpdate = () => setUpdateDismissed(true);

  // Engine cycles whenever session is running (modality-agnostic).
  // The audio cue emitter (Step 10) will be another parallel consumer
  // of the same engine output, gated by mode at its own use site.
  const isSessionRunning = session.status === 'running';

  // Step 11 (Anchor 6): the current round ends at phaseStartedAtMs +
  // roundDurationMs while running. Null in idle/rest/summary so the engine
  // applies no round bound (the activation guard only fires when this is set).
  const roundEndsAtMs =
    isSessionRunning && session.phaseStartedAtMs != null
      ? session.phaseStartedAtMs + session.config.roundDurationMs
      : null;

  const { stimulus, recordAudioRequested, recordAudioStarted, recordAudioFailed } =
    useStimulusEngine({ active: isSessionRunning, roundEndsAtMs });

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
  // Step 11: currentRoundIndex injected so each HitReaction carries round metadata.
  // Step 12: unified useReactionInput. Keyboard path is internal (window
  // listener); submitDefenseInput is the touch entry point, wired into
  // RunningView's TouchZones below. Both modalities share one classifier and
  // one R54 lock.
  const { submitDefenseInput } = useReactionInput(
    stimulusForInput,
    session.currentRoundIndex,
    session.recordReaction,
    session.stance,
  );

  // Step 11: miss detection (Anchor 7). Active only while running; the timeout
  // registry survives engine-driven stimulus->null states. Emits MissReaction
  // via session.recordReaction; the audio-failure rule (R63 lock 2) suppresses
  // pure-audio system failures. Passed the raw engine `stimulus` (NOT the
  // input-gated/anchor-substituted one) so the snapshot cache records true
  // engine timing fields including audioStartedAtMs.
  useMissDetector({
    active: isSessionRunning,
    stimulus,
    mode: session.mode,
    currentRoundIndex: session.currentRoundIndex,
    results: session.results,
    onMiss: session.recordReaction,
  });

  // Step 11: round/rest timer. Timestamp-based; drives phase completion via
  // completeRound/completeRest and exposes remainingMs for the RestView countdown.
  const { remainingMs } = useRoundTimer({
    status: session.status,
    phaseStartedAtMs: session.phaseStartedAtMs,
    config: session.config,
    onCompleteRound: session.completeRound,
    onCompleteRest: session.completeRest,
  });

  const [, navigate] = useLocation();

  // Normalize the route to / before starting a session (replace, not push, so
  // browser Back doesn't return to a pre-session route entry). Wraps the Step 12
  // start dispatch, which is otherwise unchanged.
  const handleStart = () => {
    navigate('/', { replace: true });
    session.startSession();
  };

  // Session-state precedence (invariant): while running or resting, the session
  // surface renders fullscreen regardless of route. The <main> wrapper is
  // load-bearing (full-bleed sizing + positioning surface for absolute
  // TouchZones/Cue) and is preserved in BOTH branches (see Step 12). bg-rd-bg-base
  // is Block 0b's token for zinc-950 (#09090b) — a rename, not a color change.
  const isSessionActive =
    session.status === 'running' || session.status === 'rest';

  if (isSessionActive) {
    return (
      <main className="relative min-h-dvh w-full bg-rd-bg-base">
        {session.status === 'running' && (
          <RunningView
            mode={session.mode}
            stimulus={isVisualStimulusActive ? stimulus : null}
            stance={session.stance}
            currentRoundIndex={session.currentRoundIndex}
            totalRounds={session.config.totalRounds}
            onStop={session.stopSession}
            onDefenseInput={submitDefenseInput}
          />
        )}
        {session.status === 'rest' && (
          <RestView
            currentRoundIndex={session.currentRoundIndex}
            totalRounds={session.config.totalRounds}
            restDurationMs={session.config.restDurationMs}
            restRemainingMs={remainingMs}
            results={session.results}
            onStop={session.stopSession}
          />
        )}
      </main>
    );
  }

  // Idle and summary states share the workout (/) route surface, wrapped in the
  // persistent AppShell (desktop sidebar + content area). Leaf routes
  // (/settings, /about) are additive placeholders (Blocks 8/9). The trailing
  // catch-all redirects unknown paths to / — Wouter renders only the first
  // match, so without it an unsupported path would render blank. The
  // session-active branch above intentionally bypasses AppShell (fullscreen).
  return (
    <>
      <AppShell>
        <Switch>
          <Route path="/settings">
            <SettingsView onReset={resetPreferences} />
          </Route>
          <Route path="/about">
            <AboutView />
          </Route>
          <Route path="/">
            {session.status === 'idle' && (
              <PreSessionScreen
                mode={session.mode}
                selectedPresetId={session.selectedPresetId}
                config={session.config}
                onModeChange={session.setMode}
                onSelectPreset={session.selectPreset}
                onConfigChange={session.setConfig}
                onStart={handleStart}
              />
            )}
            {session.status === 'summary' && (
              <SessionSummary
                results={session.results}
                totalRounds={session.config.totalRounds}
                onDismiss={session.dismissSummary}
              />
            )}
          </Route>
          <Route>
            <Redirect to="/" replace />
          </Route>
        </Switch>
      </AppShell>
      {/* Mounted outside the session-precedence branch above so it floats over
          any non-session screen (fixed z-50). usePWAUpdate suppresses the prompt
          during running/rest, so no in-progress round is ever interrupted. */}
      <UpdateToast
        visible={toastVisible}
        onAccept={acceptUpdate}
        onDismiss={dismissUpdate}
      />
    </>
  );
}

// App: router-provider boundary. ROUTING_MODE=path (Block 0a) uses Wouter's
// implicit router, so no <Router> wrapper is needed — AppContent renders the
// session hooks and router consumers one level below this delegating shell.
function App() {
  return <AppContent />;
}

export default App;
