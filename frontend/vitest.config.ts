import { defineConfig } from 'vitest/config';

// Minimal, DOM-free test config. The lib/ logic under test is pure (no React,
// no browser APIs), so we run in the plain Node environment and skip the app's
// vite.config.ts plugin stack (React/Tailwind/PWA) entirely. A dedicated
// vitest.config.ts takes precedence over vite.config.ts, keeping test runs fast
// and free of build-time side effects.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
