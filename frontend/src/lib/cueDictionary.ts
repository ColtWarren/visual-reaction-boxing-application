/**
 * Cue Dictionary — cue → action map for Inside Fighter Mode V1.
 *
 * Step 5.5 (current): 4 cardinal cues (red/blue/green/yellow) with
 *                     position and action description. Random selection
 *                     via getRandomCardinalCue().
 * Step 5.6+: stimulus engine will call getRandomCardinalCue() (or a
 *            seeded variant) on a timer.
 * Step 8+: action field may become typed union when input mapping lands.
 *
 * Excluded from V1 cardinal set (per MODE_SPECS):
 *   - gray (feint / no-go) — needs flash + inhibit logic, Step 8 territory
 *   - purple (uppercut) — Level 5+ only
 *   - white (counter-attack) — Level 5+ only
 *
 * The CueColor union (in Cue.tsx) still includes all 7 colors for future
 * extensibility, but the dictionary only maps the 4 cardinals.
 */

import type { CueColor, CuePosition } from '../components/Cue';

/**
 * V1 cardinal cue colors. Local subtype of CueColor — captures the fact
 * that the dictionary intentionally covers only 4 of the 7 colors.
 *
 * Why a local subtype (not Partial<Record<CueColor, ...>>):
 *   - Partial<> would weaken type safety, allowing missing values silently
 *   - Local subtype makes the omission explicit and documented
 *   - Adding gray/purple/white later is a deliberate change to this type
 */
export type V1CardinalColor = 'red' | 'blue' | 'green' | 'yellow';

export interface CueDictionaryEntry {
  color: CueColor;
  position: CuePosition;
  // NOTE: `action` is descriptive only until Step 8 (validation logic)
  // defines typed input mapping. Not consumed by components yet.
  action: string;
}

// Color appears as both key AND entry field — intentional. Lets Step 5.6+
// pass entries around independently of the dictionary key without losing
// the cue's identity. Runtime integrity check below ensures key === color.
//
// `as const satisfies Record<>` (R35A polish): both `as const` and
// `satisfies` work together — `as const` makes the object deeply readonly
// and preserves literal types maximally, `satisfies` enforces that all
// V1CardinalColor keys are present without widening the inferred type.
export const CUE_DICTIONARY = {
  red: {
    color: 'red',
    position: 'left',
    action: 'defend left hook → roll right',
  },
  blue: {
    color: 'blue',
    position: 'right',
    action: 'defend right hook → roll left',
  },
  green: {
    color: 'green',
    position: 'top-center',
    action: 'block straight → high guard',
  },
  yellow: {
    color: 'yellow',
    position: 'bottom-center',
    action: 'body defense → elbow block',
  },
} as const satisfies Record<V1CardinalColor, CueDictionaryEntry>;

// Runtime integrity check — runs once at module load (R34BC catch).
// TypeScript's `satisfies Record<>` enforces that keys match V1CardinalColor,
// but does NOT enforce that entry.color === key. This guard catches a class
// of bug where, e.g., red's entry accidentally has color: 'blue'. Both are
// valid CueColor values, so TS would accept it; the visual would be wrong.
for (const [key, entry] of Object.entries(CUE_DICTIONARY)) {
  if (key !== entry.color) {
    throw new Error(
      `CUE_DICTIONARY integrity error: key '${key}' does not match entry.color '${entry.color}'`
    );
  }
}

// TODO (Step 5.6+): Replace Math.random with injectable seeded RNG for
// level progression and test reproducibility. Current implementation is
// non-deterministic by design (refresh shows variety).
//
// Synchronous, dependency-free selector (NOT pure — Math.random() introduces
// non-determinism). No side effects beyond reading Math.random().
export function getRandomCardinalCue(): CueDictionaryEntry {
  const colors = Object.keys(CUE_DICTIONARY) as V1CardinalColor[];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return CUE_DICTIONARY[randomColor];
}
