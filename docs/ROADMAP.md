# Roadmap

## Phase 1 — Frontend MVP (current)

**Goal:** Ship a browser-based PWA with Inside Fighter Mode, Levels 1–4,
usable by the founder as a personal training tool.

### Phase 1 Scope

- Inside Fighter Mode — Levels 1 through 4 (see [MODE_SPECS.md](./MODE_SPECS.md))
- Dashboard home screen (mode selection, quick stats)
- Settings (cue mapping preview, round duration, cue frequency)
- Session summary (accuracy + speed breakdown — full RQI in Phase 2)
- Dark, high-contrast, mobile-first UI
- PWA: installable on phone home screen
- Keyboard + touch input (touch in Phase 1.5)

### Out of Scope for Phase 1

- User accounts / authentication
- Backend / database
- Persistent session history
- Camera / movement detection
- Payments
- Levels 5–8
- Global leaderboards (by design — see PRINCIPLES.md)

### Phase 1 Success Metrics

- Four Inside Fighter levels functional end-to-end
- Installable as PWA on iOS and Android
- Reaction timing designed for millisecond-resolution measurement using
  `performance.now()`; per-device variance benchmarked during Phase 1
- Smooth 60fps target on mid-tier mobile devices (validated, not promised)
- **Founder personal-use metric:** 3x/week for 4 weeks, measurable RQI
  improvement from baseline

---

## Phase 1.5 — Extension (post-V1)

- **Stance-aware cue mapping** (orthodox / southpaw — cue-to-defense mapping
  mirrors with stance; first mechanic change since Step 12) — **SHIPPED**
  (Step 14, v0.14.0; Design B — see `docs/step-14/STEP_14_COMPLETION.md`)
  - Per-session stance persistence rides with the IndexedDB session history
    (below); the summary displays stance now, durable records come with the store.
  - Hybrid IA (Settings defaults + PreSession effective value +
    `activeSessionConfig` snapshot) adopted when intensity/difficulty and
    discipline/strike-pattern features land.
  - Radiogroup a11y pass across Mode + Workout + Stance together (currently the
    bare-button convention — keyboard-operable, but no `role="radiogroup"`).
- **Touch input optimization** (closes gap on Principle 5 — mobile accessibility)
- **Level 5: Combination Defense** (sequential cue chains, Purple cue active)
- Per-cue weakness tracking
- Left/right asymmetry reporting
- Session history stored in browser (IndexedDB, no backend yet)

---

## Phase 2 — Backend + Monetization

- Spring Boot + Java 21 REST API
- PostgreSQL (session history, user data, coach-athlete relationships)
- Authentication
- **Level 6: Counter Windows** (White cue active)
- **Level 7: Fatigue Rounds** (3-minute continuous sessions)
- Stripe integration for subscriptions
- Privacy-focused analytics (Plausible / Umami class)
- **Validation pilot study** (20–40 athletes, 4–6 weeks)
- Coach dashboard beta

### Phase 2 Monetization Tiers

| Tier | Audience | Key Features |
|------|----------|--------------|
| **Free** | Accessibility | Levels 1–2, 10-trial sessions, basic stats |
| **Athlete Pro** | Serious users | All Levels 1–7, session history, weakness tracking, fatigue rounds |
| **Coach / Gym** | Primary revenue | Athlete dashboards, assignable drills, group reports, exportable data |

Full pricing and gating strategy → `MONETIZATION.md` (added in Phase 2).

---

## Phase 3 — AI + Native

- **Level 8: Camera Validation** (pose estimation via MediaPipe or
  TensorFlow.js validates actual movement — closes Principle 1)
- Automatic hit/miss validation based on detected motion
- AI coaching feedback
- Optional Expo / React Native native app wrapper (if native features
  like haptics, background sensors, or wake lock reliability become
  must-haves)

---

## Founder Stages (parallel to Phase progression)

| Stage | Focus |
|-------|-------|
| **Stage 1: Personal Tool** (now) | Founder uses V1 to train own reaction |
| **Stage 2: Small Beta** | 3 boxers + 1 coach + 1 beginner + 1 experienced fighter |
| **Stage 3: Coaching Product** | Saved sessions, athlete profiles, coach notes, drill assignment |
| **Stage 4: Validation Study** | 4-week practical pilot. Pre/post + coach-rated improvement |
| **Stage 5: Monetization Launch** | Free + Pro + Coach tiers live |
