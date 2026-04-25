# Architecture Decisions

Captures the **why** behind key stack and structural choices. Written as
an audit trail for future contributors and future me.

## The Architectural Spine: Stimulus-Response Pipeline

The product is not a "reaction timer." It's a **visual-motor decision
training system**. That framing drives the architecture. The spine is a
seven-stage pipeline:

```
Stimulus Engine
     ↓
Timing System
     ↓
Decision Logic
     ↓
Input Handler
     ↓
Validation
     ↓
Feedback System
     ↓
Session Analytics
```

Every frontend module maps to one stage. This keeps the codebase aligned
with the training-science framing.

### Stage Responsibilities

| Stage | Responsibility |
|-------|----------------|
| Stimulus Engine | Generate cues (color, position, duration, delay, feint/no-go status) |
| Timing System | High-resolution timestamping via `performance.now()` + `requestAnimationFrame` |
| Decision Logic | Map cues to expected actions; track trial state |
| Input Handler | Capture user response (keyboard → touch → gamepad → camera) |
| Validation | Compare actual response vs expected; classify correct / wrong / no-go-hold / miss |
| Feedback System | Immediate visual/audio feedback (green = correct, red = wrong, gray = no-go held) |
| Session Analytics | Compute summary metrics; RQI formula canonical in [MODE_SPECS.md](./MODE_SPECS.md) |

## Monorepo

**Decision:** Single GitHub repository containing all four domains.

**Rationale:** Solo developer, cross-layer changes ship in one PR, simpler
CI later, easier onboarding.

---

## Frontend Stack

### Build Tool: Vite

Vite over Create React App, Next.js, or Parcel. CRA deprecated (2023).
Next.js overkill for a browser-only PWA. Vite: fast dev server, modern
ES modules, strong ecosystem.

### Language: TypeScript

TypeScript over plain JavaScript. Java background transfers directly —
interfaces, generics, enums are familiar mental models. The pipeline has
natural type shapes (`CueType`, `Stimulus`, `Response`, `TrialResult`,
`SessionSummary`) that TypeScript keeps safe at compile time.

### Styling: Tailwind CSS + shadcn/ui

Tailwind utility-first + shadcn/ui copy-paste components. Dominant CSS
approach for React in 2026. shadcn/ui (built on Radix + Tailwind) delivers
the dashboard aesthetic seen in modern AI tooling. Components live in our
codebase — owned, customizable, no version lock-in.

### Routing: React Router v6

React Router over Next.js routing or TanStack Router. Dashboard + multiple
training levels imply routes. React Router is the proven, heavily-documented
choice.

### Animation: Framer Motion *(candidate, not core)*

Treated as a candidate library added during the polish phase, not part
of the initial frontend bootstrap. Keeps initial dependency surface lean.
CSS transitions first; Framer Motion when orchestrated animation demands it.

### PWA: vite-plugin-pwa

Progressive Web App in Phase 1 — React Native deferred to Phase 3.
Installable to phone home screen without App Store gatekeeping. Stripe
direct for subscriptions. React Native migration path stays open if Phase 3
native features (haptics, background sensors, wake lock reliability) become
must-haves.

### State: React hooks + Context (Phase 1)

No external state library in Phase 1. No persistence, no cross-session
state in MVP. Zustand likely the Phase 2 choice when session history and
cross-component state arrive.

### Code Quality Tooling

ESLint + Prettier installed during Step 2. React + TypeScript recommended
rule sets, Prettier integration to avoid lint-vs-format conflicts.

---

## Timing Strategy

- **Use `performance.now()`** — sub-millisecond resolution, monotonic clock
- **Capture stimulus timestamp at actual render**, using `requestAnimationFrame`
  callback — not when `setTimeout` fires
- The gap between `setTimeout` and pixel-on-screen can be 16ms+ on a 60Hz
  display; capturing too early invalidates measurements
- Phase 1 ships with main-thread timing and benchmarks per-device variance
- If benchmarking reveals unacceptable jitter on mobile browsers, Phase 2
  moves stimulus dispatch and timing capture into a Web Worker — this is
  documented as a known evolution path, not a Phase 1 requirement

---

## Scoring: Reaction Quality Index (RQI)

**Decision:** Score on quality, not raw speed.

**Rationale:** Per Principle 2 (Accuracy Before Ego Speed), pure reaction
time is a misleading metric. RQI weights accuracy, consistency, inhibition,
and fatigue resistance alongside speed.

**Canonical formula and component definitions:** [MODE_SPECS.md](./MODE_SPECS.md).
Full scoring engine specification moves to `METRICS.md` when the engine
is built.

---

## Backend Stack (Phase 2)

- **Spring Boot + Java 21** — developer's primary expertise
- **PostgreSQL** — scalable, battle-tested, strong JSON support
- **Maven** — Java ecosystem default, simpler than Gradle for new projects

---

## License Strategy

**Decision:** All Rights Reserved placeholder with SPDX identifier.

**Rationale:** Preserves full commercial optionality. Relicensing to
permissive (MIT, Apache 2.0) is always possible later; tightening from
open source is not. The SPDX identifier prevents GitHub from displaying
"No license." Public repo visibility is for portfolio transparency — this
is not an open-source project (see README + LICENSE).
