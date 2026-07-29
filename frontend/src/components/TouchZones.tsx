import type { InputDirection } from '../types/stance';

interface TouchZonesProps {
  onDefenseInput: (direction: InputDirection, inputAtMs: number) => void;
}

/**
 * Edge-anchored touch zones (Lock 1; geometry settled R71). Each zone occupies
 * a viewport edge band and maps to a stance-neutral input DIRECTION (Theme 4,
 * Design B); the shared classifier resolves direction -> defense family for the
 * active stance, so these zones stay pure geometry — no stance, no family:
 *   left  edge   x 0-25%,   y 25-75%
 *   right edge   x 75-100%, y 25-75%
 *   up    (top)  x 25-75%,  y 0-25%
 *   down  (bottom) x 25-75%, y 75-100%
 * The four corners (25%x25% each) and the center (50%x50%) belong to no zone
 * and are dead. Units are viewport-relative so proportions hold across
 * orientations (Lock 6).
 */
const ZONES: ReadonlyArray<{ direction: InputDirection; className: string }> = [
  { direction: 'left', className: 'left-0 top-1/4 h-1/2 w-[25%]' },
  { direction: 'right', className: 'right-0 top-1/4 h-1/2 w-[25%]' },
  { direction: 'up', className: 'top-0 left-1/4 w-1/2 h-[25%]' },
  { direction: 'down', className: 'bottom-0 left-1/4 w-1/2 h-[25%]' },
];

/**
 * Renders the four defense touch zones as absolutely-positioned siblings.
 * Consumes submitDefenseInput from useReactionInput via onDefenseInput, so
 * touch and keyboard share one classifier and one R54 lock.
 *
 * Zones receive NO safe-area padding (Lock 10) — they stay full-bleed to the
 * physical screen edges for reachability. z-10 keeps them below the Stop button
 * (z-30, Block 6). aria-hidden because they are a pointer surface, not content.
 */
export function TouchZones({ onDefenseInput }: TouchZonesProps) {
  return (
    <>
      {ZONES.map(({ direction, className }) => (
        <div
          key={direction}
          aria-hidden="true"
          className={`absolute ${className} z-10 active:bg-white/[0.08]`}
          onPointerDown={(event) => {
            // Lock 3: capture the input moment FIRST, before any filter.
            const inputAtMs = performance.now();
            if (!event.isPrimary) return; // primary pointer only (multi-touch)
            event.preventDefault();
            onDefenseInput(direction, inputAtMs);
          }}
        />
      ))}
    </>
  );
}
