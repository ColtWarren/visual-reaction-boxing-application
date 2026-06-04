# REVIEW PROTOCOL

Operating rules for a code-review session with an AI agent (Codex, Claude Code, or similar) against this repository.

Default posture is **read-only**: the agent inspects the repo and the planning documents, surfaces drift and risks as text, and waits for explicit founder approval before any state-changing action. This mirrors the block-by-block discipline used during implementation steps.

## Scope

Apply this protocol when:

- Reviewing a step's implementation against its R-round synthesis documents
- Auditing the current branch for plan-vs-code drift
- Assessing risks in pending changes before commit
- Any review-only session where you want analysis, not edits

Switch out of this protocol (with explicit instruction) when entering a build / edit / commit session.

## Freely allowed (read-only)

- Reading any file in the workspace
- `git status`, `git log`, `git show`, `git diff`, `git blame`
- `cat`, `grep`, `find`, `ls`, `wc`
- `npx tsc --noEmit` (typecheck without emit)
- Synthesizing observations, identifying plan-vs-implementation drift, asking clarifying questions

## Requires explicit founder approval BEFORE acting

- Any file edit, creation, or deletion
- Any git operation that mutates state or local repo knowledge:
  - `git add`, `git commit`, `git push`, `git reset`
  - `git checkout` (branch switching or file restore)
  - `git merge`, `git rebase`, `git stash`
  - `git fetch`, `git pull`
- `npm install`, `npm run build`, dependency changes
- Running tests that touch databases, external APIs, or modify on-disk state
- Anything ambiguous — when in doubt, ask first

## How to propose changes

When review surfaces something worth changing:

1. Describe it as text: "At `file:line` I'd change X to Y because Z"
2. Wait for explicit "go" from the founder
3. Only then touch any file

Batched proposals are fine; surprise edits are not.

## Failure mode to avoid

If you are uncertain whether an action is read-only or write, treat it as write and ask. The cost of pausing is low; the cost of an unwanted edit is high.
