# CLAUDE.md — Visual Reaction Boxing Application

Project instructions for Claude Code. Read this before doing anything.

---

## Project

Reaction Defense — browser-based PWA that trains boxing reaction time and
defense decision-making. Live at https://reactiondefense.com

**Monorepo layout.** The Vite app lives in `frontend/`. Also `backend/`,
`docs/`, `scripts/`.

**Stack:** Vite 8 · React 19 · TypeScript · Tailwind v4 · Wouter (path routing)
· vite-plugin-pwa + Workbox · vitest

**Hosting:** Cloudflare Pages. `main` auto-deploys to production. Non-production
branches get preview deployments with a stable branch alias.

---

## 🚫 Git — Colt owns all write operations

**Do NOT run any git command that writes.** Not `add`, `commit`, `push`,
`checkout`, `switch`, `merge`, `rebase`, `tag`, `stash`, `reset`, `revert`,
`cherry-pick`, `branch -d`, or anything else that mutates the repo or remote.

Read-only git is fine and encouraged for recon: `status`, `log`, `diff`,
`show`, `grep`, `rev-parse`, `branch -vv`, `check-ignore`.

When work is ready to commit, **stop and hand off**: state which files changed
and why, and provide the commit message in a copyable block. Colt stages,
commits, and pushes himself.

This is deliberate. It is not a temporary restriction to be worked around.

---

## Workflow

`recon → ratify → edit → build+test → verify → hand off for commit`

Colt gives an explicit yes/no at every transition. **Never proceed to the next
step without it.** Never start the next block without ratification.

**Branching.** `dev` is the long-lived integration branch and carries a stable
Cloudflare preview alias. Epics are built on `dev`, verified against the preview
alias, then merged to `main` via `--no-ff` PR at release. Never commit directly
to `main`.

Branch names use plain hyphens — no `/` or `.`. The preview alias is derived
from the branch name.

---

## Hard rules

### Recon before every edit
Verify every file path, symbol name, and type shape **against the live repo**,
never against a plan snippet or a previous conversation. Paths drift. If a plan
says a file is at path X, confirm it before editing.

### `npm run build` is the real type-check gate
`npm run build` = `tsc -b && vite build`. Run it from `frontend/`.

Bare `npx tsc --noEmit` and `npm run type-check` **return exit 0 without
checking `src/`** — the root `tsconfig.json` is solution-style (references only,
no files/include glob). They are no-ops. Do not use them as gates.

Standalone type-check, if genuinely needed: `npx tsc --noEmit -p tsconfig.app.json`

### Raw verbatim stdout at every gate
Paste actual terminal output. **Never a summary table.** Summary tables have
produced false-green results on this project repeatedly. If output is long or
colored, say so — the chat channel mangles it — and prefer short plain forms
(`git status --short`, grep counts) or screenshots.

### `git grep -nP`, never `-E`
The `\b` word-boundary pattern silently returns empty with `-E` on macOS.
False negatives look identical to real absences.

### Tag dereference
`git rev-parse v0.13.0^{commit}` to compare an annotated tag to a branch HEAD.
Plain `git rev-parse v0.13.0` returns the tag object SHA, not the commit SHA.

---

## Commits

Colt runs these — you supply the message and the file list.

- Single-quoted heredoc: `<<'EOF'`. Write backticks naturally; do **not**
  pre-escape them. Pre-escaping inside a single-quoted heredoc produces literal
  backslash-backtick in the output.
- **No `Co-Authored-By` trailer.** Author is Colt Warren
  <thefallguy180@yahoo.com>.
- **Stage files BY NAME.** Never `git add .`. Genuinely-new files have been
  silently omitted before (`stance.ts`, Step 14 Block 1). Always list the staged
  set for review before committing.
- Every falsifiable claim in a commit message must be verified against the
  actual diff. No over-claims, no under-claims.

---

## Code conventions

- **ESLint underscore-prefix is enabled** — `argsIgnorePattern: '^_'`,
  `varsIgnorePattern: '^_'`, `caughtErrorsIgnorePattern: '^_'` are configured on
  `@typescript-eslint/no-unused-vars`. Use `_unused` freely.
- **Subdirectories, not flat `src/`.** e.g. `src/lib/cueDictionary.ts`,
  `src/components/Cue.tsx`, `src/hooks/usePWAUpdate.ts`. Plans have repeatedly
  drifted assuming a flat `src/`. Only filesystem recon catches this.
- Design tokens are semantic `--rd-*` CSS variables. Use them; don't hardcode.

---

## Testing & verification

- vitest is the test framework (introduced Step 14). `npm test` from `frontend/`.
- A green build proves it compiles. It does **not** prove behavior. Behavioral
  claims need a browser or device check.
- **Test device: Samsung Galaxy S23** (Android/Chromium).
- **iOS is UNVERIFIED by design** — no Apple hardware available. Log iOS rows as
  UNVERIFIED. Never mark them passed.
- DevTools "Offline" checkbox contaminates PWA tests. If toggled accidentally,
  re-run clean.
- Minified `sw.js` uses **unquoted keys** (`url:"..."`), defeating standard grep
  patterns. The Workbox routing runtime lives in a separate `workbox-<hash>.js`
  chunk, not in `sw.js`.
- Local `dist/` is **not** a reliable proxy for what is deployed — content
  hashes have diverged between local and Cloudflare builds on the same commit.
  To check production, fetch the deployed `index.html` first and read the real
  hash from it.

---

## Environment notes

- Colt runs the dev server in his own terminal. Background dev-server tasks
  started by Claude Code get reaped.
- LAN IP is DHCP-dynamic. Read it from Vite's `--host` log output every time.
  Never hardcode or reuse a cached value.
- Document uploads from Claude Code arrive empty. Use screenshots or typed
  terminal output instead.
- The Codex reviewer runs on a **stale clone** at `~/Documents/...`. Verify any
  repo-specific claim it makes against this tree before accepting it. Known
  false claims from that clone: `package.json` version `0.0.0`, `views/` missing.

---

## Output style

Direct, step-by-step, code-first, minimal fluff. Exact file paths. Full code
unless partial is explicitly requested. State how to verify and what the common
failure points are. No vague suggestions. Don't assume a file exists unless it
was just created — check.
