import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  id: string;
}

/**
 * Mobile-only overlay drawer (backdrop + left panel). The panel is a <div>, not
 * an <aside> — the shared SidebarContent it wraps carries the <nav>, and the
 * desktop Sidebar owns the only <aside> (no nested landmarks).
 *
 * Closed state is fully non-interactive via three belt-and-suspenders signals:
 * `inert` (set post-commit in useLayoutEffect so the closed panel's links are
 * never Tab-focusable, even on first paint), `aria-hidden`, and
 * `pointer-events-none`. Slide + fade honor prefers-reduced-motion.
 */
export function MobileDrawer({ isOpen, onClose, children, id }: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Reflect open state onto the `inert` IDL property after commit — NOT in the
  // render body (that mutates during render, and with a null ref on the first
  // render would leave the closed panel's links focusable on first paint).
  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    drawer.inert = !isOpen;
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-rd-bg-overlay transition-opacity duration-200 ease-out motion-reduce:transition-none md:hidden ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Drawer panel — a <div>, not an <aside> (SidebarContent carries <nav>). */}
      <div
        ref={drawerRef}
        id={id}
        aria-hidden={isOpen ? undefined : 'true'}
        className={`fixed left-0 top-0 z-30 flex h-dvh flex-col border-r border-rd-border-subtle bg-rd-bg-surface transition-transform duration-200 ease-out motion-reduce:transition-none md:hidden ${
          isOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
        style={{
          width: 'min(var(--rd-drawer-width), calc(100vw - 2rem))',
          // Extra top padding clears the fixed hamburger (h-11 = 2.75rem, at
          // top 0.75rem + safe-top) so the brand text isn't overlapped by it.
          // Drawer-only — the desktop Sidebar keeps its own p-3 and never
          // renders through MobileDrawer, so desktop spacing is unaffected.
          paddingTop: 'calc(0.75rem + var(--safe-top) + 2.75rem + 0.5rem)',
          paddingRight: 'calc(0.75rem + var(--safe-right))',
          paddingBottom: 'calc(0.75rem + var(--safe-bottom))',
          paddingLeft: 'calc(0.75rem + var(--safe-left))',
        }}
      >
        {children}
      </div>
    </>
  );
}
