interface UpdateToastProps {
  /** Show the prompt. App.tsx derives this from the PWA hook + dismiss state. */
  visible: boolean;
  /** Activate the waiting service worker and reload to the new build. */
  onAccept: () => void;
  /** Hide the prompt for the rest of this page load. */
  onDismiss: () => void;
}

/**
 * Step 13 (Block 14): the service-worker update prompt.
 *
 * Floating bottom toast, mounted outside the session-precedence branch so it can
 * surface over any non-session screen (fixed z-50). usePWAUpdate already holds
 * `needRefresh` back during a live round/rest, so the prompt never interrupts a
 * session — it appears only once the athlete is idle or on the summary.
 *
 * A11y: the <section aria-label> is the labelled region; the announcement lives
 * in a role="status" aria-live="polite" <p> so screen readers hear it when it
 * appears. The Update/Dismiss buttons are SIBLINGS of that <p> — kept OUT of the
 * live region so their labels aren't re-announced as part of the status text.
 *
 * The outer <section> is pointer-events-none (it spans the viewport width for
 * centering) with the card re-enabling pointer events, so taps outside the card
 * still reach the screen beneath. Both controls are min-h-11 (44px) touch
 * targets; Dismiss is also min-w-11 for the same reason.
 */
export function UpdateToast({ visible, onAccept, onDismiss }: UpdateToastProps) {
  if (!visible) return null;

  return (
    <section
      aria-label="Application update"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center"
      style={{
        paddingBottom: 'calc(1rem + var(--safe-bottom))',
        paddingLeft: 'calc(1rem + var(--safe-left))',
        paddingRight: 'calc(1rem + var(--safe-right))',
      }}
    >
      <div className="pointer-events-auto flex w-[calc(100vw-2rem)] max-w-sm flex-wrap items-center gap-3 rounded-[var(--rd-radius-card)] border border-rd-border-default bg-rd-bg-elevated px-4 py-3 shadow-lg">
        <p
          role="status"
          aria-live="polite"
          className="min-w-0 flex-1 text-sm text-rd-text-primary"
        >
          A new version is available.
        </p>
        <button
          type="button"
          onClick={onAccept}
          className="min-h-11 rounded-[var(--rd-radius-pill)] bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-500 active:bg-red-700"
        >
          Update
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-11 min-w-11 rounded-[var(--rd-radius-pill)] border border-rd-border-default px-4 text-sm font-medium text-rd-text-secondary transition-colors hover:text-rd-text-primary"
        >
          Dismiss
        </button>
      </div>
    </section>
  );
}
