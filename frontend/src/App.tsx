import Cue from './components/Cue';

function App() {
  return (
    // min-h-dvh: dynamic viewport height — adjusts for mobile address bar collapse/expand
    // relative: establishes positioning context for absolutely-positioned cues
    <main className="relative min-h-dvh w-full bg-zinc-950">
      <Cue color="red" position="left" />
    </main>
  );
}

export default App;
