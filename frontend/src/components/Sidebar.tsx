import { NavItem } from './NavItem';
import { NavSeparator } from './NavSeparator';

/**
 * Desktop-only left sidebar (hidden below md; the mobile drawer arrives in
 * Block 4, which will extract a shared SidebarContent so the drawer can reuse
 * the nav without nesting an <aside>). Width is driven by --rd-sidebar-width
 * (240px, Block 0b). `shrink-0` keeps it fixed-width beside wide content.
 */
export function Sidebar() {
  return (
    <aside className="hidden h-dvh w-[var(--rd-sidebar-width)] shrink-0 flex-col border-r border-rd-border-subtle bg-rd-bg-surface p-3 md:flex">
      {/* Brand */}
      <div className="mb-2 px-3 py-4">
        <div className="text-base font-semibold text-rd-text-primary">
          Reaction Defense
        </div>
        <div className="text-xs text-rd-text-muted">Training</div>
      </div>

      {/* Primary nav */}
      <nav aria-label="Primary navigation" className="flex flex-1 flex-col gap-1">
        <NavItem to="/" label="Workout" />
        <NavItem to="/settings" label="Settings" />
        <NavItem to="/about" label="About" />
      </nav>

      {/* Bottom: separator + install slot (Block 15) + version */}
      <div>
        <NavSeparator />
        {/* InstallButton mounts here in Block 15 (lifted to AppShell per R2 DeepSeek P0). */}
        <div className="px-3 py-2 text-xs tabular-nums text-rd-text-muted">
          v{__APP_VERSION__}
        </div>
      </div>
    </aside>
  );
}
