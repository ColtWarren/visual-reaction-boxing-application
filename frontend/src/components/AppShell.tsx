import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Persistent shell for non-session routes: desktop sidebar beside a scrollable
 * content area. Session-active surfaces (running/rest) render fullscreen and
 * bypass this shell entirely (App.tsx precedence invariant, Block 2).
 * `min-w-0 flex-1` on the content area prevents wide children from overflowing.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full bg-rd-bg-base">
      <Sidebar />
      <main className="min-h-dvh min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
