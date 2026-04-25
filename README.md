# 🥊 Visual Reaction Boxing

**Close-range defensive reaction training for pressure fighters.**

> Fighters don't need faster thumbs. They need faster visual decisions
> connected to real movement.

## 📍 How to Read This Repo

- **New here?** Start with **[docs/MISSION.md](./docs/MISSION.md)** for what the product is and who it serves.
- **Product principles?** Read **[docs/PRINCIPLES.md](./docs/PRINCIPLES.md)**.
- **Curious about the science?** See **[docs/SCIENCE.md](./docs/SCIENCE.md)**.
- **Scope and phases?** Read **[docs/ROADMAP.md](./docs/ROADMAP.md)**.
- **Technical decisions?** See **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.
- **Training modes and progression?** Read **[docs/MODE_SPECS.md](./docs/MODE_SPECS.md)**.

## What This Is

A visual-motor reaction training system designed for boxers — starting with
close-range defensive decision-making. The goal is to help athletes practice
faster perception, cleaner decisions, and better movement under pressure,
using accessible technology instead of expensive lab equipment.

## Current Scope — Phase 1 (MVP)

**Inside Fighter Mode — Levels 1 through 4:**

| Level | Training Focus |
|-------|----------------|
| 1 | Basic cue-response (one cue, one action) |
| 2 | Defensive choice (4 cues → 4 defenses) |
| 3 | Close-range chaos (short cue duration, edge/corner stimuli) |
| 4 | Feints and no-go inhibition |

Delivered as a browser-based Progressive Web App (installable on mobile home
screen). Levels 5–8, backend, user accounts, and session persistence are
deferred to later phases — see [ROADMAP.md](./docs/ROADMAP.md).

## Cue → Action Map (V1)

| Cue Color | Position | Meaning | Keyboard |
|-----------|----------|---------|----------|
| Red | Left edge | Defend left hook → roll right | `A` |
| Blue | Right edge | Defend right hook → roll left | `D` |
| Green | Center high | Block straight → high guard | `W` |
| Yellow | Center low | Body defense → elbow block | `S` |
| Gray | Flash | Feint / No-Go (inhibit!) | *(no key)* |

*Levels 5+ introduce additional cues (Purple for uppercut, White for counter window).*

## Tech Stack

**Frontend (Phase 1):**
- React + TypeScript
- Vite (build tool)
- Tailwind CSS (utility-first styling) + shadcn/ui (component primitives)
- React Router v6
- vite-plugin-pwa
- Lucide icons
- *Framer Motion (candidate — added when polish phase requires it)*

**Backend (Phase 2):**
- Spring Boot + Java 21
- PostgreSQL

## Repo Structure

```
/frontend   — React PWA (Inside Fighter Mode + cue engine)
/backend    — Spring Boot API (Phase 2)
/docs       — Mission, principles, science, specs, roadmap, architecture
/scripts    — Dev and build automation
```

## Getting Started

<!-- TODO: Setup instructions added after /frontend is scaffolded with Vite (Step 2) -->

## License

All Rights Reserved. See [LICENSE](./LICENSE) for details.

**This repository is publicly visible for portfolio and project transparency.
The code and documentation are not open-source licensed. Forking, copying,
or redistribution is not permitted without explicit written consent.**
