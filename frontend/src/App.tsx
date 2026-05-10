import Cue from './components/Cue';
import { useStimulusEngine } from './hooks/useStimulusEngine';

function App() {
  // useStimulusEngine drives cue appearance/disappearance on a timer.
  // Returns { cue } object (forward-compatible with future Step 6+ controls
  // like pause/restart per R39C). Destructure to access the current cue.
  // Replaces Step 5.5's lazy useState one-shot with continuous cycling.
  const { cue } = useStimulusEngine();

  return (
    // min-h-dvh: dynamic viewport height — adjusts for mobile address bar collapse/expand
    // relative: establishes positioning context for absolutely-positioned cues
    <main className="relative min-h-dvh w-full bg-zinc-950">
      {cue && <Cue color={cue.color} position={cue.position} />}
    </main>
  );
}

export default App;
