/**
 * Step 13 Block 9 — About page. Lean per Q7: brief description, how-to
 * (modes / presets / controls — including edge taps AND arrow keys), version +
 * commit SHA (matching SettingsView), and the GitHub repo link. No founder bio,
 * no marketing copy.
 */
export function AboutView() {
  return (
    <div className="min-h-dvh w-full bg-rd-bg-base text-rd-text-primary">
      <div
        className="mx-auto flex max-w-md flex-col gap-6 p-6 sm:p-8"
        style={{
          // Reserve room for the fixed mobile hamburger (top-left). Desktop uses
          // the sidebar, but the extra top padding is harmless there.
          paddingTop: 'calc(3rem + var(--safe-top))',
        }}
      >
        <h1 className="text-2xl font-semibold">About</h1>

        <section>
          <p className="text-rd-text-secondary">
            Reaction Defense Training is a tool for training visual reaction
            time in boxing defense. A cue appears at a screen edge; respond with
            the matching defense before the round timer runs out.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-rd-text-secondary">
            How it works
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-rd-text-muted">
            <li>
              <strong className="text-rd-text-secondary">Modes:</strong> Visual
              (cues appear at screen edges), Audio (cues are spoken), Combined
              (both).
            </li>
            <li>
              <strong className="text-rd-text-secondary">Presets:</strong> Quick
              Demo for a fast sample, 3×3 Standard for a structured workout, or
              Custom to set your own round duration, rest, and number of rounds.
            </li>
            <li>
              <strong className="text-rd-text-secondary">Controls:</strong> Tap
              the matching edge of the screen (left / right / top / bottom). On
              desktop, use the arrow keys.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-rd-text-secondary">
            Source
          </h2>
          <a
            href="https://github.com/ColtWarren/visual-reaction-boxing-application"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded text-rd-text-primary underline hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary"
          >
            github.com/ColtWarren/visual-reaction-boxing-application
          </a>
          <p className="mt-2 text-sm tabular-nums text-rd-text-muted">
            v{__APP_VERSION__} ({__COMMIT_SHA__})
          </p>
        </section>
      </div>
    </div>
  );
}
