/**
 * Stance domain types (Theme 4).
 *
 * Stance is a property of the consumer, not the attack dictionary — the
 * dictionary stays stance-agnostic. InputDirection is the stance-aware
 * response axis: it decouples the player's intended movement ('left' = slip
 * toward the lead side) from the physical key that produced it. Under Design B
 * (see defenseVisualMap.ts), southpaw mirrors cue position AND response
 * direction together; color stays bound to the family.
 */

export type Stance = 'orthodox' | 'southpaw';
export type InputDirection = 'left' | 'right' | 'up' | 'down';
