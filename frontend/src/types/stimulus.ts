/**
 * Step 10: ActiveStimulus evolves from color-centric to attack-centric.
 *
 * Step 9 shape: { id, color, position, appearedAtMs }
 * Step 10 shape: { id, attack, defense, voiceLineKey, appearedAtMs,
 *                  audioRequestedAtMs?, audioStartedAtMs? }
 *
 * Visual rendering: derive color/position from DEFENSE_VISUAL_MAP[stimulus.defense]
 * Audio rendering: lookup voice line text from VOICE_LINES_EN[stimulus.voiceLineKey]
 *
 * Audio timing fields are populated by the audio renderer (renderer-observed
 * timing metadata). The engine emits the immutable initial event with
 * appearedAtMs; the audio renderer reports back audioRequestedAtMs (at speak()
 * call) and audioStartedAtMs (at utterance.onstart). These are the load-bearing
 * fields for Q1 Option C (R61 lock): pure audio mode RT anchors to
 * audioStartedAtMs; pure audio mode input gates until audioStartedAtMs exists.
 *
 * The id field remains stance-agnostic, mount-level, monotonically increasing
 * (Step 8 lesson). It is the load-bearing key for R54 id-keyed locks and the
 * stale-callback guards in the audio renderer (R61 Q1 Codex catch).
 */

import type { AttackName, DefenseFamily, VoiceLineKey } from './attack';

export interface ActiveStimulus {
  id: number;
  attack: AttackName;
  defense: DefenseFamily;
  voiceLineKey: VoiceLineKey;
  appearedAtMs: number;
  /**
   * Timestamp (performance.now()) when this stimulus expires.
   * Computed at activation as appearedAtMs + DISPLAY_WINDOW_MS.
   * Future Theme 1 will support per-cue variable expiry by computing
   * this from per-attack difficulty parameters.
   *
   * Consumed by useMissDetector to schedule miss emission accurately;
   * the engine's expiry timing is observable to consumers via this field
   * rather than via an exported DISPLAY_WINDOW_MS constant.
   */
  expiresAtMs: number;
  audioRequestedAtMs?: number;
  audioStartedAtMs?: number;
}
