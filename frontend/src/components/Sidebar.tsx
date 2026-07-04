import { SidebarContent } from './SidebarContent';

/**
 * Desktop-only left sidebar (hidden below md). Owns the <aside> landmark and
 * desktop chrome (fixed width via --rd-sidebar-width, 240px; `shrink-0` keeps it
 * beside wide content). Nav contents are the shared SidebarContent, also used by
 * the MobileDrawer. Refactored in Block 4 to share those contents.
 */
export function Sidebar() {
  return (
    <aside className="hidden h-dvh w-[var(--rd-sidebar-width)] shrink-0 flex-col border-r border-rd-border-subtle bg-rd-bg-surface p-3 md:flex">
      <SidebarContent />
    </aside>
  );
}
