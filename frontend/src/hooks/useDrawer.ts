import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Open/close state for the mobile nav drawer plus its cross-cutting behaviors:
 * Escape-to-close, background scroll-lock while open, and focus return to the
 * trigger (hamburger) on close. Block 4.
 */
export function useDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to the trigger once the close has committed.
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);

  // Escape closes the drawer while open.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Lock background scroll while open; restore the prior value on close.
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  return { isOpen, open, close, triggerRef };
}
