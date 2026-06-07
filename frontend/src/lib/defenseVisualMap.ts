/**
 * DEFENSE_VISUAL_MAP: the single source of truth for visual representation
 * of defense families. Color, position, and arrow key derive from this map,
 * not from the attack dictionary. This preserves the "derive don't duplicate"
 * architecture lock from R60 — adding or modifying defense families means
 * one edit here, not 8 edits across the attack dictionary.
 *
 * Orthodox baseline mapping. Stance toggle (Theme 4) will introduce a southpaw
 * variant that flips slip-lead ↔ slip-rear in the key mapping only; this map
 * stays orthodox.
 */

import type { DefenseFamily } from '../types/attack';

export type V1CardinalColor = 'red' | 'blue' | 'yellow' | 'green';
export type CuePosition = 'left' | 'right' | 'bottom-center' | 'top-center';
export type DefenseArrowKey = 'ArrowLeft' | 'ArrowRight' | 'ArrowDown' | 'ArrowUp';

export interface DefenseVisual {
  color: V1CardinalColor;
  position: CuePosition;
  key: DefenseArrowKey;
}

export const DEFENSE_VISUAL_MAP: Record<DefenseFamily, DefenseVisual> = {
  'slip-lead': { color: 'red', position: 'left', key: 'ArrowLeft' },
  'slip-rear': { color: 'blue', position: 'right', key: 'ArrowRight' },
  'cover': { color: 'yellow', position: 'bottom-center', key: 'ArrowDown' },
  'pull': { color: 'green', position: 'top-center', key: 'ArrowUp' },
} as const;

/**
 * Reverse map: arrow key → defense family. Used by input handler to derive
 * expected defense from keypress. Stance-agnostic (Theme 4 stance toggle will
 * flip the slip-lead/slip-rear pair).
 */
export const ARROW_KEY_TO_EXPECTED_DEFENSE: Record<string, DefenseFamily> = {
  ArrowLeft: 'slip-lead',
  ArrowRight: 'slip-rear',
  ArrowDown: 'cover',
  ArrowUp: 'pull',
} as const satisfies Record<string, DefenseFamily>;
