# Mode Specifications

This document is the **canonical source for the Reaction Quality Index (RQI)
scoring formula.** Other documents reference RQI but do not redefine it.

## Hero Mode: Inside Fighter Mode

The Phase 1 hero mode. All other modes (Outside Fighter, Fatigue Round,
etc.) are deferred to Phase 2+.

### Cue → Action Map

| Cue | Color | Position | Meaning | Keyboard |
|-----|-------|----------|---------|----------|
| 1 | 🔴 Red | Left edge | Defend left hook → roll right | `A` |
| 2 | 🔵 Blue | Right edge | Defend right hook → roll left | `D` |
| 3 | 🟢 Green | Center high | Block straight → high guard | `W` |
| 4 | 🟡 Yellow | Center low | Body defense → elbow block | `S` |
| 5 | 🟣 Purple | Center up | Uppercut defense | `W` *(Level 5+)* |
| 6 | ⚪ White | Flash | Counter window | `Space` *(Level 5+)* |
| 7 | ⚫ Gray | Flash | Feint / No-Go (do not move) | *(no key)* |

### Session Shape

- 20 trials per session (configurable later)
- Random inter-trial delay: 800–2500ms
- Cue appears → user responds → feedback → next trial
- Session summary at end (RQI breakdown, per-cue performance, asymmetry)

---

## Level Progression (1–8)

### Level 1: Basic Cue-Response *(Phase 1)*

- One cue type, one response
- Large central stimulus
- Slow, predictable timing
- **Purpose:** baseline measurement, teaching the input system

### Level 2: Defensive Choice *(Phase 1)*

- Four cues (Red, Blue, Green, Yellow), four responses
- Moderate speed, random interval
- **Purpose:** choice reaction time, basic cue-action mapping

### Level 3: Close-Range Chaos *(Phase 1)*

- Short cue duration (perceptual pressure)
- Randomized timing (rhythm disruption)
- Edge and corner stimuli (peripheral awareness)
- **Purpose:** perceptual uncertainty, peripheral cue response

### Level 4: Feints and No-Go *(Phase 1)*

- Gray cue = inhibit movement
- Fake cue followed by real cue
- **Purpose:** response inhibition, feint discipline

---

### Level 5: Combination Defense *(Phase 1.5)*

- Sequential cues (hook → uppercut, body → hook, etc.)
- Requires chained defensive responses
- Adds Purple (uppercut defense) to active cue set

### Level 6: Counter Windows *(Phase 2)*

- After correct defense, White counter cue appears briefly
- User must counter within a short window
- Adds Space (counter) to active inputs

### Level 7: Fatigue Rounds *(Phase 2)*

- 3-minute round simulation with continuous cues
- Reaction degradation tracked across round
- Measures late-round accuracy drop, false reaction increase,
  left/right asymmetry under fatigue

### Level 8: Camera Validation *(Phase 3)*

- Webcam pose estimation validates actual movement
- Measures: reaction start, movement completion, guard recovery,
  reset to stance
- Movement quality scoring

---

## Scoring: Reaction Quality Index (RQI) — CANONICAL

The product does not rank users on raw reaction time. It uses RQI:

```
RQI =
    0.40 × accuracy_rate
  + 0.25 × reaction_speed_percentile
  + 0.15 × consistency_score
  + 0.10 × inhibition_score
  + 0.10 × fatigue_resistance
```

### Component Definitions

| Component | Definition |
|-----------|------------|
| **accuracy_rate** | (correct responses) / (total trials requiring a response) |
| **reaction_speed_percentile** | User's mean RT percentile vs their own history |
| **consistency_score** | 1 − (std_dev of RT / mean RT) |
| **inhibition_score** | (correct no-go holds) / (total no-go trials) |
| **fatigue_resistance** | Last-third RQI / first-third RQI, clamped [0–1] |

### Phase-Specific Notes

- **Phase 1 V1:** Only accuracy + speed components are fully implemented.
  Consistency, inhibition, and fatigue resistance components appear in
  Phase 1.5 / Phase 2.
- **Weights are provisional.** Subject to tuning during Phase 1 benchmarking
  and Phase 2 validation. Any weight change is documented in commit history
  and this doc is updated.
- **Full scoring engine spec** moves to `METRICS.md` when the engine is
  built (Step 5+).

---

## Phase 1 Success Criteria

The V1 ships when the founder can:

- Run a session of any Level 1–4 on desktop and mobile browser
- Install the PWA on phone home screen
- Complete 20 trials and receive a session summary (accuracy + speed breakdown)
- Use the tool 3x/week for 4 weeks as a personal training baseline

External user count is explicitly not a Phase 1 success metric. Founder
use validates the tool before we invite others.
