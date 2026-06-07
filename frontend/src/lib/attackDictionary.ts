/**
 * ATTACK_DICTIONARY: the 8-attack roster with defense family + voice line key.
 *
 * Visual rendering is derived from defense family via DEFENSE_VISUAL_MAP.
 * Audio rendering looks up voice line text from VOICE_LINES_EN[voiceLineKey].
 *
 * Adding a new attack requires:
 *   1. Add to AttackName union (types/attack.ts)
 *   2. Add an entry below
 *   3. Add corresponding key/text to VOICE_LINES_EN (voiceLines.en.ts)
 * If a new defense family is needed, also update DefenseFamily union AND
 * add an entry to DEFENSE_VISUAL_MAP (defenseVisualMap.ts).
 *
 * Mapping locked from outside-reviewer boxing-manual citation review:
 *   straight punches → slip outside (lead/rear)
 *   hooks (head) + body shots → cover/shell family
 *   uppercuts → pull/step back
 */

import type { AttackDictionaryEntry } from '../types/attack';

export const ATTACK_DICTIONARY: readonly AttackDictionaryEntry[] = [
  { attack: 'jab',           defense: 'slip-lead', voiceLineKey: 'attack.jab' },
  { attack: 'cross',         defense: 'slip-rear', voiceLineKey: 'attack.cross' },
  { attack: 'lead-hook',     defense: 'cover',     voiceLineKey: 'attack.lead-hook' },
  { attack: 'rear-hook',     defense: 'cover',     voiceLineKey: 'attack.rear-hook' },
  { attack: 'lead-uppercut', defense: 'pull',      voiceLineKey: 'attack.lead-uppercut' },
  { attack: 'rear-uppercut', defense: 'pull',      voiceLineKey: 'attack.rear-uppercut' },
  { attack: 'lead-body',     defense: 'cover',     voiceLineKey: 'attack.lead-body' },
  { attack: 'rear-body',     defense: 'cover',     voiceLineKey: 'attack.rear-body' },
] as const;
