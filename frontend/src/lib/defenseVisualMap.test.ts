import { describe, expect, it } from 'vitest';
import type { DefenseFamily } from '../types/attack';
import type { Stance } from '../types/stance';
import {
  ORTHODOX_DEFENSE_VISUAL_MAP,
  SOUTHPAW_DEFENSE_VISUAL_MAP,
  resolveDefenseVisual,
  resolveDefenseFromInputDirection,
} from './defenseVisualMap';
import type { CuePosition, InputDirection, V1CardinalColor } from './index';

interface Expected {
  stance: Stance;
  family: DefenseFamily;
  color: V1CardinalColor;
  position: CuePosition;
  direction: InputDirection;
}

// Design B expectation table (mirrors the Block 1 spec exactly).
const CASES: Expected[] = [
  { stance: 'orthodox', family: 'slip-lead', color: 'red', position: 'left', direction: 'left' },
  { stance: 'orthodox', family: 'slip-rear', color: 'blue', position: 'right', direction: 'right' },
  { stance: 'southpaw', family: 'slip-lead', color: 'red', position: 'right', direction: 'right' },
  { stance: 'southpaw', family: 'slip-rear', color: 'blue', position: 'left', direction: 'left' },
  // cover/pull: identical across both stances.
  { stance: 'orthodox', family: 'cover', color: 'yellow', position: 'bottom-center', direction: 'down' },
  { stance: 'southpaw', family: 'cover', color: 'yellow', position: 'bottom-center', direction: 'down' },
  { stance: 'orthodox', family: 'pull', color: 'green', position: 'top-center', direction: 'up' },
  { stance: 'southpaw', family: 'pull', color: 'green', position: 'top-center', direction: 'up' },
];

const MAP_BY_STANCE: Record<Stance, typeof ORTHODOX_DEFENSE_VISUAL_MAP> = {
  orthodox: ORTHODOX_DEFENSE_VISUAL_MAP,
  southpaw: SOUTHPAW_DEFENSE_VISUAL_MAP,
};

const STANCES: Stance[] = ['orthodox', 'southpaw'];
const FAMILIES: DefenseFamily[] = ['slip-lead', 'slip-rear', 'cover', 'pull'];

describe('defenseVisualMap — Design B table', () => {
  it.each(CASES)(
    '$stance $family → color=$color position=$position direction=$direction',
    ({ stance, family, color, position, direction }) => {
      const visual = resolveDefenseVisual(family, stance);
      expect(visual.color).toBe(color);
      expect(visual.position).toBe(position);
      expect(MAP_BY_STANCE[stance][family].direction).toBe(direction);
    },
  );
});

describe('defenseVisualMap — invariants', () => {
  it('color never changes with stance', () => {
    for (const family of FAMILIES) {
      const orthodoxColor = resolveDefenseVisual(family, 'orthodox').color;
      const southpawColor = resolveDefenseVisual(family, 'southpaw').color;
      expect(southpawColor).toBe(orthodoxColor);
    }
  });

  it('cover/pull position + direction are identical across stances', () => {
    for (const family of ['cover', 'pull'] as DefenseFamily[]) {
      expect(resolveDefenseVisual(family, 'southpaw').position).toBe(
        resolveDefenseVisual(family, 'orthodox').position,
      );
      expect(SOUTHPAW_DEFENSE_VISUAL_MAP[family].direction).toBe(
        ORTHODOX_DEFENSE_VISUAL_MAP[family].direction,
      );
    }
  });

  it('slip pair position AND direction both flip southpaw vs orthodox', () => {
    for (const family of ['slip-lead', 'slip-rear'] as DefenseFamily[]) {
      expect(resolveDefenseVisual(family, 'southpaw').position).not.toBe(
        resolveDefenseVisual(family, 'orthodox').position,
      );
      expect(SOUTHPAW_DEFENSE_VISUAL_MAP[family].direction).not.toBe(
        ORTHODOX_DEFENSE_VISUAL_MAP[family].direction,
      );
    }
  });

  it('round-trips: resolveDefenseFromInputDirection(entry.direction, stance) === family', () => {
    for (const stance of STANCES) {
      for (const family of FAMILIES) {
        const { direction } = MAP_BY_STANCE[stance][family];
        expect(resolveDefenseFromInputDirection(direction, stance)).toBe(family);
      }
    }
  });
});
