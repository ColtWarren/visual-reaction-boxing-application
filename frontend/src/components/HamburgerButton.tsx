import { forwardRef } from 'react';

interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  ariaControls: string;
}

/**
 * Mobile-only menu toggle, fixed top-left with safe-area-additive offset so it
 * clears notches / rounded corners. Hidden at md+ (desktop uses the sidebar).
 */
export const HamburgerButton = forwardRef<HTMLButtonElement, HamburgerButtonProps>(
  function HamburgerButton({ isOpen, onClick, ariaControls }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls={ariaControls}
        className="fixed z-40 flex h-11 w-11 items-center justify-center rounded-lg border border-rd-border-subtle bg-rd-bg-surface/80 text-rd-text-primary backdrop-blur-sm md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rd-text-primary"
        style={{
          top: 'calc(0.75rem + var(--safe-top))',
          left: 'calc(0.75rem + var(--safe-left))',
        }}
      >
        {/* Decorative hamburger glyph; the button's aria-label carries the name. */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <line x1="3" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="3" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    );
  },
);

HamburgerButton.displayName = 'HamburgerButton';
