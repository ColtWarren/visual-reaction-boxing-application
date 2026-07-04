import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

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
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __COMMIT_SHA__: JSON.stringify(commitSha),
  },
});
