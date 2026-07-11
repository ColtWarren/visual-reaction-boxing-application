import { NavItem } from './NavItem';
import { NavSeparator } from './NavSeparator';
import { InstallButton } from './InstallButton';
import type { InstallPromptState } from '../hooks/useInstallPrompt';

interface SidebarContentProps {
  /** Called after a nav tap — the mobile drawer passes its close() here. */
  onNavigate?: () => void;
  /** Install model threaded from AppShell; rendered in the bottom slot. */
  installPrompt: InstallPromptState;
}

/**
 * Shared nav contents (brand + primary nav + version) with no landmark wrapper.
 * The desktop Sidebar wraps this in its <aside>; the MobileDrawer wraps it in a
 * <div>. Extracted in Block 4 so both reuse it without nesting <aside> elements.
 * Relies on a flex-column parent so the version pins to the bottom.
 */
export function SidebarContent({ onNavigate, installPrompt }: SidebarContentProps) {
  return (
    <>
      {/* Brand */}
      <div className="mb-2 px-3 py-4">
        <div className="text-base font-semibold text-rd-text-primary">
          Reaction Defense
        </div>
        <div className="text-xs text-rd-text-muted">Training</div>
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1">
        <NavItem to="/" label="Workout" onNavigate={onNavigate} />
        <NavItem to="/settings" label="Settings" onNavigate={onNavigate} />
        <NavItem to="/about" label="About" onNavigate={onNavigate} />
      </nav>

      {/* Bottom: separator + install slot (Block 15) + version */}
      <div>
        <NavSeparator />
        <InstallButton installPrompt={installPrompt} />
        <div className="px-3 py-2 text-xs tabular-nums text-rd-text-muted">
          v{__APP_VERSION__}
        </div>
      </div>
    </>
  );
}
