import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface IosInstallTooltipProps {
  /** Dismiss the tooltip (button toggles it back closed). */
  onClose: () => void;
  /** Element focus returns to on close — the Install button that opened it. */
  returnFocusTo: RefObject<HTMLElement | null>;
}

/**
 * iOS manual-install instructions (Block 15). iOS Safari has no programmatic
 * install prompt, so we point the athlete at the Share-sheet flow instead.
 *
 * role="dialog" aria-modal="false" — it's a non-modal popover (the page behind
 * stays interactive), labelled by its title. Dismisses on Escape and on any
 * outside pointer press; focus moves in on open and returns to the trigger on
 * close (the unmount cleanup), so keyboard users aren't dropped at the top.
 */
export function IosInstallTooltip({ onClose, returnFocusTo }: IosInstallTooltipProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Focus the dialog on open; return focus to the trigger on close (unmount).
  // The trigger stays mounted while the tooltip is open, so capturing the node
  // now is equivalent to reading it at cleanup — and satisfies exhaustive-deps.
  useEffect(() => {
    dialogRef.current?.focus();
    const trigger = returnFocusTo.current;
    return () => {
      trigger?.focus();
    };
  }, [returnFocusTo]);

  // Escape closes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Outside-pointer dismiss. The click that opened the tooltip has already
  // finished propagating by the time this post-commit effect binds, so it won't
  // self-dismiss.
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="ios-install-tooltip-title"
      tabIndex={-1}
      className="absolute inset-x-3 bottom-full mb-2 rounded-[var(--rd-radius-card)] border border-rd-border-default bg-rd-bg-elevated p-3 shadow-lg outline-none"
    >
      <p
        id="ios-install-tooltip-title"
        className="text-sm font-semibold text-rd-text-primary"
      >
        Install this app
      </p>
      <p className="mt-1 text-xs leading-relaxed text-rd-text-secondary">
        Tap the Share button, then choose{' '}
        <span className="font-medium text-rd-text-primary">Add to Home Screen</span>.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 min-h-9 rounded-[var(--rd-radius-pill)] px-3 text-xs font-medium text-rd-text-secondary transition-colors hover:text-rd-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary"
      >
        Got it
      </button>
    </div>
  );
}
