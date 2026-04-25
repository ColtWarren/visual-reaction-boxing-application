# Product Principles

Five principles that govern every product decision. If a feature violates
these — or if it violates the spirit of these over the long arc — we don't
build it.

## 1. Movement Over Tapping

The product moves toward **real movement**, not screen interaction.

Keyboard and touch are acceptable for V1 because they're accessible. But the
long arc points toward webcam movement validation, pose estimation, and
physical-response scoring. Every feature should be evaluated on whether it
brings us closer to training real movement or further from it.

## 2. Accuracy Before Ego Speed

**A 190ms wrong reaction is worse than a 330ms correct reaction.**

Scoring, feedback, and progression never reward pure speed. The Reaction
Quality Index (RQI — defined canonically in [MODE_SPECS.md](./MODE_SPECS.md))
weights accuracy heavily because choosing the wrong defense fast is how
fighters get hit. Speed without correctness is noise.

**Consequence:** This is not a "test your reaction time" gimmick. Raw reaction
speed is not the leaderboard metric.

## 3. Trainable, Not Fixed

Reaction performance is not a fixed trait. It adapts through structured,
progressive training. The product's language, feedback, and progression
structure should communicate this clearly.

**Consequence:** No toxic messaging. No "you're too slow" framing. Progress
is personal — measured against the user's own baseline, not a global
leaderboard designed to create inadequacy.

## 4. Coach-Friendly

The product supports real coaches. It does not compete with them, replace
them, or undermine them.

Phase 2 introduces a Coach tier explicitly because human coaching remains
irreplaceable — the product's job is to give coaches **better data**, not
pretend to be one.

**Consequence:** The product does not replace coaching, and does not claim
to.

## 5. Accessible Performance Science

High-quality visual-motor training should not be gatekept by expensive
facilities, specialized hardware systems, or lab equipment. A fighter with a phone and a web
browser should be able to train seriously.

This principle constrains technology choices: PWA over native-first, web
browsers over proprietary apps, keyboard before pose estimation. The
product ships value without hardware barriers.

---

## Phase 1 Compromises (Read This)

The principles describe the product's north star. Phase 1 does not fully meet
them yet — and that's documented honestly rather than hidden.

**Principle 1 (Movement Over Tapping) is partially violated in Phase 1.**
Keyboard input is tapping, not movement. This is a deliberate bridge:
keyboard lets us prove the cue-decision-feedback loop on accessible hardware
before investing in touch input (Phase 1.5), pose estimation (Phase 3), and
full camera-based movement validation (Phase 3+).

**Principle 5 (Accessibility) is partially violated on mobile in Phase 1.**
WASD keyboard input assumes a physical keyboard. Touch-optimized input
arrives in Phase 1.5 so the principle holds on mobile devices too.

**Exit path:** [ROADMAP.md](./ROADMAP.md) documents how each Phase closes
the gap between current state and the principles.

---

## Decision Filter

Before shipping a feature, run it through these five:

1. Does it move us toward real movement, or lock us into screen taps?
2. Does it reward speed over accuracy?
3. Does it frame reaction as fixed, or as trainable?
4. Does it help coaches, or bypass them?
5. Does it require expensive hardware, or work on commodity devices?

**Pass all five → ship. Fail any → redesign, drop, or explicitly document
as a temporary Phase-specific compromise.**
