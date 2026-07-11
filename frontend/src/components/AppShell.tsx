import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { SidebarContent } from './SidebarContent';
import { MobileDrawer } from './MobileDrawer';
import { HamburgerButton } from './HamburgerButton';
import { useDrawer } from '../hooks/useDrawer';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

interface AppShellProps {
  children: ReactNode;
}

const DRAWER_ID = 'app-primary-drawer';

/**
 * Persistent shell for non-session routes: desktop sidebar (md+) OR mobile
 * hamburger + overlay drawer (below md), beside a scrollable <main> content
 * area. Session-active surfaces (running/rest) render fullscreen and bypass this
 * shell entirely (App.tsx precedence invariant, Block 2), so the hamburger/drawer
 * pair only exists on idle/summary + leaf routes. `min-w-0 flex-1` on the content
 * area prevents wide children from overflowing.
 */
export function AppShell({ children }: AppShellProps) {
  const { isOpen, open, close, triggerRef } = useDrawer();
  // Single owner of the install model; threaded to both sidebar contexts below.
  const installPrompt = useInstallPrompt();

  return (
    <div className="flex min-h-dvh w-full bg-rd-bg-base">
      {/* Desktop sidebar (owns its <aside>) */}
      <Sidebar installPrompt={installPrompt} />

      {/* Mobile hamburger toggle */}
      <HamburgerButton
        ref={triggerRef}
        isOpen={isOpen}
        onClick={isOpen ? close : open}
        ariaControls={DRAWER_ID}
      />

      {/* Mobile overlay drawer (owns a <div>; nav from shared SidebarContent) */}
      <MobileDrawer isOpen={isOpen} onClose={close} id={DRAWER_ID}>
        <SidebarContent installPrompt={installPrompt} onNavigate={close} />
      </MobileDrawer>

      <main className="min-h-dvh min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
