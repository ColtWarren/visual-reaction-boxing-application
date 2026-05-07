import { useState } from 'react';
import Cue from './components/Cue';
import { getRandomCardinalCue } from './lib/cueDictionary';

function App() {
  // Lazy initializer: getRandomCardinalCue() runs once for this mount,
  // not on every render. Locks the cue against future re-renders caused
  // by state additions above this component (R34A catch, R35A wording fix).
  // Note: in React Strict Mode, the initializer may run more than once
  // across the simulated remount — that's acceptable because no side effects
  // depend on the selected cue value.
  const [cue] = useState(() => getRandomCardinalCue());

  return (
    // min-h-dvh: dynamic viewport height — adjusts for mobile address bar collapse/expand
    // relative: establishes positioning context for absolutely-positioned cues
    <main className="relative min-h-dvh w-full bg-zinc-950">
      <Cue color={cue.color} position={cue.position} />
    </main>
  );
}

export default App;
