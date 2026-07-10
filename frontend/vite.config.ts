import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

// DEPLOY_BASE (EDR) — the public base path the app is served from. Mirrors
// Vite's default base ('/'), kept as a named constant so the SW navigateFallback
// stays parameterized rather than hardcoding a leading slash (Block 13).
const DEPLOY_BASE = '/';

// APP_VERSION_SOURCE (EDR) = package.json — single source of truth for the app
// version surfaced in the sidebar / About page.
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Short commit SHA resolved at build time; falls back to 'dev' outside git.
let commitSha = 'dev';
try {
  commitSha = execSync('git rev-parse --short HEAD').toString().trim();
} catch {
  // Not a git repo / git unavailable — keep 'dev'.
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Service worker precache + offline (Block 13). Four safeguards:
    //  (1) registerType 'prompt' — never silently swap the running app; the
    //      usePWAUpdate hook surfaces an explicit refresh.
    //  (2) injectRegister null — usePWAUpdate is the SINGLE registration owner;
    //      nothing auto-injects a registerSW into the entry (main.tsx stays clean).
    //  (3) navigateFallback parameterized off DEPLOY_BASE so SPA navigations
    //      resolve to the precached shell (offline deep-link support).
    //  (4) runtimeCaching explicitly empty — precache ONLY (globPatterns), no
    //      stale-while-revalidate runtime handlers.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      // We ship our own manifest (public/manifest.webmanifest, Block 12); do not
      // let the plugin generate or inject a competing one.
      manifest: false,
      // No service worker in dev — avoids caching surprises during development.
      devOptions: { enabled: false },
      workbox: {
        navigateFallback: `${DEPLOY_BASE}index.html`,
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        runtimeCaching: [],
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
});
