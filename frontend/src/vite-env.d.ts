/// <reference types="vite/client" />

// Build-time constants injected by Vite `define` (see vite.config.ts). Added in
// Step 13 Block 3 (moved up from Block 8 so the Sidebar can consume the version
// without a build-ordering type failure). Consumed by the Sidebar (version) and
// Settings/About in Blocks 8/9 — do NOT redeclare there.
declare const __APP_VERSION__: string;
declare const __COMMIT_SHA__: string;
