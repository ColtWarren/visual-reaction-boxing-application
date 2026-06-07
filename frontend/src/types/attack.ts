/**
 * Attack-centric domain types for Step 10.
 *
 * The cue model evolved from color-centric (Step 5-9) to attack-centric (Step 10).
 * The dictionary stores attacks; visual rendering (color, position, arrow key)
 * derives from defense family via DEFENSE_VISUAL_MAP. The dictionary stays
 * stance-agnostic; stance awareness is a property of the consumer (input handler).
 *
 * Forward-compat note: VoiceLineKey is a template literal type, so TypeScript
 * catches typos at definition time. Adding a new attack requires:
 *   1. Extend AttackName union
 *   2. Add entry to ATTACK_DICTIONARY (attackDictionary.ts)
 *   3. Add entry to VOICE_LINES_EN (voiceLines.en.ts)
 * If defense family is new, also update DefenseFamily union and DEFENSE_VISUAL_MAP.
 */

export type AttackName =
  | 'jab'
  | 'cross'
  | 'lead-hook'
  | 'rear-hook'
  | 'lead-uppercut'
  | 'rear-uppercut'
  | 'lead-body'
  | 'rear-body';

export type DefenseFamily =
  | 'slip-lead'
  | 'slip-rear'
  | 'cover'
  | 'pull';

export type VoiceLineKey = `attack.${AttackName}`;

export interface AttackDictionaryEntry {
  attack: AttackName;
  defense: DefenseFamily;
  voiceLineKey: VoiceLineKey;
}
