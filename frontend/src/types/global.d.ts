// iOS Safari exposes a non-standard, read-only `navigator.standalone` boolean
// that is true when the page runs as an installed Home Screen app. It's absent
// from TypeScript's DOM lib, so declare it here — this lets useInstallPrompt's
// isInstalled() read it directly, with no `as any` cast. Block 15.
//
// No top-level import/export here on purpose: a `.d.ts` without them is a global
// script, so this `interface Navigator` merges into the ambient Navigator type.
interface Navigator {
  /** iOS-only: true when launched from the Home Screen as a standalone PWA. */
  readonly standalone?: boolean;
}
