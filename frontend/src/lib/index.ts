/**
 * Stable import paths for the lib/ directory.
 *
 * Consumers can import from 'lib/' without caring which specific file owns
 * which symbol. Migration safety: if a symbol moves between files, the
 * consumer import doesn't change.
 */

export { ATTACK_DICTIONARY } from './attackDictionary';
export {
  DEFENSE_VISUAL_MAP,
  ARROW_KEY_TO_EXPECTED_DEFENSE,
  ORTHODOX_DEFENSE_VISUAL_MAP,
  SOUTHPAW_DEFENSE_VISUAL_MAP,
  ARROW_KEY_TO_DIRECTION,
  resolveDefenseVisual,
  resolveDefenseFromInputDirection,
} from './defenseVisualMap';
export type {
  V1CardinalColor,
  CuePosition,
  DefenseArrowKey,
  DefenseVisual,
} from './defenseVisualMap';
export type { Stance, InputDirection } from '../types/stance';
export { VOICE_LINES_EN, getVoiceLine } from './voiceLines.en';
