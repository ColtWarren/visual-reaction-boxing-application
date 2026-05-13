import Cue from './components/Cue';
import { useInputHandler } from './hooks/useInputHandler';
import { useStimulusEngine } from './hooks/useStimulusEngine';

function App() {
  // useStimulusEngine drives cue appearance/disappearance on a timer.
  // useInputHandler receives the current cue and classifies keyboard
  // input against it, with per-cue locking and event-object state.
  // Single engine owner: App is the sole consumer of useStimulusEngine;
  // useInputHandler receives cue as an argument.
  const { cue } = useStimulusEngine();
  // lastInput is captured but not rendered yet — visual feedback for
  // correct/incorrect inputs is a separate concern (Step 6.5 or 7).
  // Underscore prefix signals intentional non-consumption. Step 7 will
  // replace _lastInput with actual usage (e.g., reaction-time analysis).
  const { lastInput: _lastInput } = useInputHandler(cue);

  return (
    // min-h-dvh: dynamic viewport height — adjusts for mobile address bar collapse/expand
    // relative: establishes positioning context for absolutely-positioned cues
    <main className="relative min-h-dvh w-full bg-zinc-950">
      {cue && <Cue color={cue.color} position={cue.position} />}
    </main>
  );
}

export default App;
