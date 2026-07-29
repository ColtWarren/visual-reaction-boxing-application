/**
 * DEFENSE_VISUAL_MAP: the single source of truth for visual representation
 * of defense families. Color, position, and arrow key derive from this map,
 * not from the attack dictionary. This preserves the "derive don't duplicate"
 * architecture lock from R60 — adding or modifying defense families means
 * one edit here, not 8 edits across the attack dictionary.
 *
 * Stance model (Theme 4) — Design B: for the southpaw stance the cue POSITION
 * and the player's response DIRECTION mirror together across the vertical axis,
 * and only for the slip pair (slip-lead ↔ slip-rear). Color stays bound to the
 * family — it never changes with stance — and cover/pull are axis-symmetric, so
 * they do not mirror. DEFENSE_VISUAL_MAP below is the orthodox baseline that
 * existing consumers read directly; ORTHODOX_/SOUTHPAW_DEFENSE_VISUAL_MAP and
 * the resolveDefenseVisual/resolveDefenseFromInputDirection helpers add the
 * stance-aware view on top without changing it.
 */

import type { DefenseFamily } from '../types/attack';
import type { Stance, InputDirection } from '../types/stance';

export type V1CardinalColor = 'red' | 'blue' | 'yellow' | 'green';
export type CuePosition = 'left' | 'right' | 'bottom-center' | 'top-center';
export type DefenseArrowKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowDown' | 'ArrowUp';

export interface DefenseVisual {
  color: V1CardinalColor;
  position: CuePosition;
  direction: InputDirection;
  key: DefenseArrowKey;
}

export const DEFENSE_VISUAL_MAP: Record<DefenseFamily, DefenseVisual> = {
  'slip-lead': { color: 'red', position: 'left', direction: 'left', key: 'ArrowLeft' },
  'slip-rear': { color: 'blue', position: 'right', direction: 'right', key: 'ArrowRight' },
  'cover': { color: 'yellow', position: 'bottom-center', direction: 'down', key: 'ArrowDown' },
  'pull': { color: 'green', position: 'top-center', direction: 'up', key: 'ArrowUp' },
} as const;

/**
 * Reverse map: arrow key → defense family. Used by input handler to derive
 * expected defense from keypress. Orthodox-oriented; stance-aware consumers
 * should route through ARROW_KEY_TO_DIRECTION + resolveDefenseFromInputDirection
 * so the slip pair mirrors correctly for southpaw (Design B).
 */
export const ARROW_KEY_TO_EXPECTED_DEFENSE: Record<string, DefenseFamily> = {
  ArrowLeft: 'slip-lead',
  ArrowRight: 'slip-rear',
  ArrowDown: 'cover',
  ArrowUp: 'pull',
} as const satisfies Record<string, DefenseFamily>;

/**
 * ORTHODOX_DEFENSE_VISUAL_MAP — the orthodox stance's source of truth. Entries
 * are spread from DEFENSE_VISUAL_MAP so the two can never drift; DEFENSE_VISUAL_MAP
 * itself stays the flat literal that existing consumers (RunningView) read
 * directly. Shallow-frozen at both the map and the entry level — these are flat
 * records, so no recursive freeze is needed.
 */
export const ORTHODOX_DEFENSE_VISUAL_MAP: Record<DefenseFamily, DefenseVisual> = Object.freeze({
  'slip-lead': Object.freeze<DefenseVisual>({ ...DEFENSE_VISUAL_MAP['slip-lead'] }),
  'slip-rear': Object.freeze<DefenseVisual>({ ...DEFENSE_VISUAL_MAP['slip-rear'] }),
  cover: Object.freeze<DefenseVisual>({ ...DEFENSE_VISUAL_MAP['cover'] }),
  pull: Object.freeze<DefenseVisual>({ ...DEFENSE_VISUAL_MAP['pull'] }),
});

/**
 * SOUTHPAW_DEFENSE_VISUAL_MAP — Design B derivation from the orthodox map. Only
 * the slip pair mirrors: position AND direction flip across the vertical axis
 * (slip-lead → right/right, slip-rear → left/left) while color and the family
 * identity (the record key) are spread through unchanged. cover and pull are
 * axis-symmetric and reuse their orthodox entries verbatim. Shallow-frozen at
 * both the map and the entry level, matching the orthodox map.
 */
export const SOUTHPAW_DEFENSE_VISUAL_MAP: Record<DefenseFamily, DefenseVisual> = Object.freeze({
  'slip-lead': Object.freeze<DefenseVisual>({
    ...ORTHODOX_DEFENSE_VISUAL_MAP['slip-lead'],
    position: 'right',
    direction: 'right',
  }),
  'slip-rear': Object.freeze<DefenseVisual>({
    ...ORTHODOX_DEFENSE_VISUAL_MAP['slip-rear'],
    position: 'left',
    direction: 'left',
  }),
  cover: ORTHODOX_DEFENSE_VISUAL_MAP['cover'],
  pull: ORTHODOX_DEFENSE_VISUAL_MAP['pull'],
});

/**
 * Stance → visual map lookup. Internal; the resolveDefense* helpers are the
 * public stance-aware surface.
 */
const DEFENSE_VISUAL_MAPS_BY_STANCE: Record<Stance, Record<DefenseFamily, DefenseVisual>> =
  Object.freeze({
    orthodox: ORTHODOX_DEFENSE_VISUAL_MAP,
    southpaw: SOUTHPAW_DEFENSE_VISUAL_MAP,
  });

/**
 * Arrow key → response direction. The stance-neutral half of input handling:
 * a physical key always means the same movement axis. Stance then decides which
 * defense family that direction maps to (see resolveDefenseFromInputDirection).
 */
export const ARROW_KEY_TO_DIRECTION: Record<DefenseArrowKey, InputDirection> = Object.freeze({
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
});

/**
 * Resolve the stance-aware color + cue position for a defense family. Color is
 * stance-invariant; position mirrors for the slip pair under southpaw (Design B).
 */
export function resolveDefenseVisual(
  family: DefenseFamily,
  stance: Stance,
): { color: V1CardinalColor; position: CuePosition } {
  const entry = DEFENSE_VISUAL_MAPS_BY_STANCE[stance][family];
  return { color: entry.color, position: entry.position };
}

/**
 * Resolve which defense family a response direction maps to, for the given
 * stance. Inverse of the stance map's `direction` field; directions are unique
 * within each stance map, so this round-trips with every entry's direction.
 */
export function resolveDefenseFromInputDirection(
  direction: InputDirection,
  stance: Stance,
): DefenseFamily {
  const map = DEFENSE_VISUAL_MAPS_BY_STANCE[stance];
  const family = (Object.keys(map) as DefenseFamily[]).find(
    (candidate) => map[candidate].direction === direction,
  );
  if (family === undefined) {
    throw new Error(`No defense family for direction "${direction}" in ${stance} stance`);
  }
  return family;
}
