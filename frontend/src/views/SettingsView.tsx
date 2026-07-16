import { useEffect, useRef, useState } from 'react';

interface SettingsViewProps {
  /** Wired by App to usePreferencesPersistence.resetPreferences (single owner
   *  of the removeItem + suppression-flag + dispatch semantics). */
  onReset: () => void;
}

/**
 * Step 13 Block 8 — Settings page. Two sections only (per Q6 lean): reset
 * preferences (functional) and version display. No theme / sound / vibration /
 * accessibility toggles, no future-feature stubs.
 */
export function SettingsView({ onReset }: SettingsViewProps) {
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const confirmationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear the confirmation timer on unmount so it can't fire into an unmounted
  // component (e.g. navigating away right after a reset).
  useEffect(() => {
    return () => {
      if (confirmationTimerRef.current != null) {
        clearTimeout(confirmationTimerRef.current);
      }
    };
  }, []);

  const handleReset = () => {
    onReset();
    setConfirmation('Preferences reset.');
    if (confirmationTimerRef.current != null) {
      clearTimeout(confirmationTimerRef.current);
    }
    confirmationTimerRef.current = setTimeout(() => {
      setConfirmation(null);
      confirmationTimerRef.current = null;
    }, 3000);
  };

  return (
    <div className="min-h-dvh w-full bg-rd-bg-base text-rd-text-primary">
      <div
        className="mx-auto flex max-w-md flex-col gap-8 p-6 sm:p-8"
        style={{
          // Reserve room for the fixed mobile hamburger (top-left). Desktop uses
          // the sidebar, but the extra top padding is harmless there.
          paddingTop: 'calc(3rem + var(--safe-top))',
        }}
      >
        <h1 className="text-2xl font-semibold">Settings</h1>

        {/* Reset preferences */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-rd-text-secondary">
            Preferences
          </h2>
          <p className="mb-3 text-sm text-rd-text-muted">
            Reset to defaults (Visual mode, Quick Demo preset).
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-11 rounded-lg border border-rd-border-subtle bg-rd-bg-elevated px-4 py-2 text-rd-text-primary transition-colors hover:bg-rd-bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary"
          >
            Reset preferences
          </button>
          {confirmation && (
            <p role="status" className="mt-2 text-sm text-rd-accent-success">
              {confirmation}
            </p>
          )}
        </section>

        {/* Version */}
        <section>
          <h2 className="mb-2 text-sm font-medium text-rd-text-secondary">
            About
          </h2>
          <p className="text-sm tabular-nums text-rd-text-muted">
            v{__APP_VERSION__} ({__COMMIT_SHA__})
          </p>
        </section>
      </div>
    </div>
  );
}
