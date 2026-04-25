# Science Foundation

Science that informed the product's design choices. Informed by research
concepts in visual-motor reaction, motor decision-making, and sport-specific
training transfer.

This document is a reference for the design rationale, not a systematic
literature review. Claims are framed as design principles, not guaranteed
outcomes.

## The Reaction Pipeline

Reaction speed is not one skill. It is a pipeline:

```
Visual stimulus → Attention → Perception → Interpretation →
Decision → Motor preparation → Movement initiation →
Movement execution → Feedback → Adaptation
```

The product is **designed to target more of this pipeline** than raw
tap-speed tests do — not to claim we train every stage perfectly.

## Simple vs Choice Reaction Time

| Type | Description | Boxing Relevance |
|------|-------------|------------------|
| **Simple Reaction** | One stimulus → one response | Useful as baseline |
| **Choice Reaction** | Multiple stimuli → multiple responses | Closer to sport demand |

Boxing is not about reacting to "something." It's about selecting the
correct response under uncertainty. Choice reaction better matches sport
demand, so the product prioritizes it over simple reaction. Level 1 keeps
simple reaction as a baseline measurement.

## Perception-Action Coupling

The design principle most central to the product:

**Perception and movement should be linked through training, not separated
into isolated cognitive tasks.**

Tapping a phone screen may improve app scores but transfer weakly to
boxing. The better model:

```
Visual cue → boxing-specific movement intent → immediate feedback
```

Phase 1 keyboard input maps directly to defensive movement intent
(A = roll left, D = roll right, W = guard, S = body block) — not abstract
button presses. The goal is to make the cue-response mapping *mean something
to a boxer* even when executed as a key press.

## Anticipation Over Reflex

Elite athletes often appear to have superhuman reflexes, but much of their
advantage is pattern recognition, not raw speed. They react faster because
they recognize cues earlier.

For inside fighters, those cues include shoulder rotation, weight shift,
lead foot position, hip loading, guard opening, rhythm change.

Phase 1 uses abstract cues (colors at positions) as a bridge. Phase 3 with
opponent avatars or video will train cue recognition more directly.

## The Speed-Accuracy Tradeoff

Faster is not always better. A fighter can react quickly and choose the
wrong defense — that is worse than reacting correctly slower.

Research on motor decision-making consistently describes a tradeoff: more
difficult decisions produce longer reaction times but better accuracy. This
is why the product's scoring model (the Reaction Quality Index, defined in
[MODE_SPECS.md](./MODE_SPECS.md)) weights accuracy most heavily and treats
raw reaction time as one component among several.

## Inhibition and No-Go Discipline

Reacting to every cue is dangerous in boxing. A fighter must not bite on
every twitch or feint. Training inhibition (the ability to *not* respond)
is as important as training reaction.

This is why **Level 4 (Feints / No-Go)** is in Phase 1, not deferred.

## Peripheral Vision

Boxers don't stare at a single point. They process information across a
wide visual field while moving. Level 3 introduces edge/corner stimuli to
approximate this demand — cues appear at screen edges while the user
maintains central fixation.

## Cognitive Load and Fatigue

Central (neural) fatigue degrades decision quality before peripheral
(physical) fatigue degrades movement speed. The product's difficulty
progression increases cue frequency and decreases stimulus duration at
Level 3+ in part to train decision quality under cognitive load — not just
raw speed.

Later phases (Level 7 — Fatigue Rounds) extend this by measuring
round-over-round decay in accuracy and inhibition.

## Progressive Uncertainty

Combat sports are uncertainty machines. The product introduces **controlled**
uncertainty in a structured progression:

| Level | Uncertainty Added |
|-------|-------------------|
| 1 | One cue, one action (no uncertainty) |
| 2 | Four cues, four actions (choice uncertainty) |
| 3 | Short duration, peripheral position (perceptual uncertainty) |
| 4 | Feints, no-go stimuli (inhibition uncertainty) |
| 5 | Combinations (sequence uncertainty) — Phase 1.5+ |
| 6 | Counter windows (timing uncertainty) — Phase 2 |
| 7 | Fatigue rounds (physiological uncertainty) — Phase 2 |
| 8 | Camera validation (movement-quality uncertainty) — Phase 3 |

## Timing Precision

Measuring reaction time in milliseconds in a browser is possible, but
requires discipline:

- Use `performance.now()` — sub-millisecond resolution, monotonic clock
- Capture the stimulus timestamp **at the actual render moment** using
  `requestAnimationFrame`, not when `setTimeout` fires
- The gap between `setTimeout` callback and pixel-on-screen can be 16ms+
  on a 60Hz display
- Document per-device variance during Phase 1 benchmarking; don't promise
  fixed accuracy figures

## What the Research Supports

**Design principles we can stand behind:**

- Choice reaction training has closer transfer to sport demand than simple
  reaction training
- Accuracy-weighted scoring better reflects sport-relevant performance than
  pure speed
- Inhibition training (no-go) addresses a distinct cognitive skill (response
  suppression) underweighted by reaction-only training
- Perception-action coupling through sport-specific cue-response mappings
  improves transfer relative to abstract cue-response mappings

**Claims we do not make (without internal validation):**

- "Scientifically proven to make you a better boxer"
- "Rewires your nervous system in X days"
- "Guarantees faster punches"

Transfer of generic visual training to sport performance is mixed in the
literature. The strongest transfer comes from sport-specific training — which
is why the product uses boxing-specific cue-action mappings, not abstract
symbols.

## Validation Path (Phase 2+)

To make real training-impact claims, the product will need its own
validation study. Planning moves to `VALIDATION.md` in Phase 2.

---

## References and Further Reading

*Sources and citations will be added as the product develops. This doc
reflects a working synthesis of current research, not a formal literature
review.*
