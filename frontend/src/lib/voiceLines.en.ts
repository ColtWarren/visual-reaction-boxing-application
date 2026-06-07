/**
 * English voice line lookup table.
 *
 * V1 i18n architecture: keys are stable (VoiceLineKey template literal type).
 * Adding a new language is "add voiceLines.es.ts (or similar) + language
 * selector + locale persistence" — all deferred to post-Step-12 founder
 * validation, with a real library (react-i18next or equivalent). Step 10 ships
 * with English-only; the lookup-key architecture is the cheap forward-compat.
 *
 * Voice lines kept short and specific (R61 product lock). "lead body" not
 * "lead body shot" — shorter TTS render at the same training value.
 */

import type { VoiceLineKey } from '../types/attack';

export const VOICE_LINES_EN: Record<VoiceLineKey, string> = {
  'attack.jab': 'jab',
  'attack.cross': 'cross',
  'attack.lead-hook': 'lead hook',
  'attack.rear-hook': 'rear hook',
  'attack.lead-uppercut': 'lead uppercut',
  'attack.rear-uppercut': 'rear uppercut',
  'attack.lead-body': 'lead body',
  'attack.rear-body': 'rear body',
} as const;

/**
 * Lookup voice line text for a given key. Returns the English text in Step 10;
 * future i18n will replace this with a locale-aware lookup.
 */
export function getVoiceLine(key: VoiceLineKey): string {
  return VOICE_LINES_EN[key];
}
