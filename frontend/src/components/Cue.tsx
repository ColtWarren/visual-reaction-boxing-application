/**
 * Cue — visual stimulus rendered on the training canvas.
 *
 * Step 5 (current): propped component with discriminated union types
 *                   for color and position. App.tsx still hardcodes
 *                   props; future steps will drive dynamically.
 * Step 5.5+: cue dictionary will provide cue → action mappings.
 * Step 5.6+: stimulus engine will drive prop changes on a timer.
 *
 * Sizing: responsive — 120px on small phones, 150px at sm: breakpoint+
 *         (avoids dominating viewport on narrow devices like iPhone SE).
 * pointer-events-none: cue is visual output only; Step 6 input handler
 *                      will attach to <main> or document, not the cue.
 */

export type CueColor = 'red' | 'blue' | 'green' | 'yellow' | 'gray' | 'purple' | 'white';

export type CuePosition = 'left' | 'right' | 'top-center' | 'bottom-center';

export interface CueProps {
  color: CueColor;
  position: CuePosition;
}

// Static class lookups (Tailwind v4 cannot detect dynamic class names
// like `bg-cue-${color}`, so we use full literals here).
//
// `satisfies Record<>` instead of `: Record<>` annotation — both forms
// enforce exhaustiveness (must define all keys of the union), but
// `satisfies` preserves literal value types (R33B catch). TypeScript
// knows `COLOR_CLASS.red` is exactly `'bg-cue-red'`, not just `string`.
const COLOR_CLASS = {
  red: 'bg-cue-red',
  blue: 'bg-cue-blue',
  green: 'bg-cue-green',
  yellow: 'bg-cue-yellow',
  gray: 'bg-cue-gray',
  purple: 'bg-cue-purple',
  white: 'bg-cue-white',
} satisfies Record<CueColor, string>;

// V1 visual slots. Top/bottom offsets (10%) may be tuned after real
// mobile movement testing. R32B's math: 15% on an 800px-tall phone put
// the cue center near 195px from top — closer to middle than to top.
// 10% gives a more head-level "high" cue feel while staying clear of
// notches/dynamic islands.
const POSITION_CLASS = {
  left: 'left-[5%] top-1/2 -translate-y-1/2',
  right: 'right-[5%] top-1/2 -translate-y-1/2',
  'top-center': 'left-1/2 top-[10%] -translate-x-1/2',
  'bottom-center': 'left-1/2 bottom-[10%] -translate-x-1/2',
} satisfies Record<CuePosition, string>;

function Cue({ color, position }: CueProps) {
  return (
    <div
      className={`pointer-events-none absolute h-[120px] w-[120px] rounded-full sm:h-[150px] sm:w-[150px] ${COLOR_CLASS[color]} ${POSITION_CLASS[position]}`}
    />
  );
}

export default Cue;
