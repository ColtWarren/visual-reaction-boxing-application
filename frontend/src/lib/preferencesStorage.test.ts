import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionConfig } from '../types/round';
import type { PersistedPreferencesV1 } from '../types/preferences';
import {
  PREFS_STORAGE_KEY,
  PREFS_VERSION,
  isValidPreferences,
  loadPreferences,
  savePreferences,
} from './preferencesStorage';

/**
 * Minimal in-memory localStorage stub — the storage layer under test only uses
 * getItem/setItem/removeItem. Installed fresh before each test so cases never
 * bleed state. Node test env has no DOM, so we provide our own.
 */
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

beforeEach(() => {
  globalThis.localStorage = new MemoryStorage() as unknown as Storage;
});

// Custom preset config passes through loadPreferences unchanged (Lock 5 only
// re-normalizes NON-custom presets), so tests can assert config preservation.
const CUSTOM_CONFIG: SessionConfig = {
  roundDurationMs: 120_000,
  restDurationMs: 30_000,
  totalRounds: 5,
};

/** Write a raw (possibly partial / legacy) payload straight to storage. */
function seedRaw(payload: Record<string, unknown>): void {
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(payload));
}

const BASE_VALID = {
  version: PREFS_VERSION,
  mode: 'combined' as const,
  selectedPresetId: 'custom' as const,
  config: CUSTOM_CONFIG,
};

describe('preferencesStorage — stance backfill + validation', () => {
  it('legacy payload (no stance) backfills orthodox and preserves mode/preset/config', () => {
    seedRaw({ ...BASE_VALID }); // no stance field
    const loaded = loadPreferences();
    expect(loaded).not.toBeNull();
    expect(loaded?.stance).toBe('orthodox');
    expect(loaded?.mode).toBe('combined');
    expect(loaded?.selectedPresetId).toBe('custom');
    expect(loaded?.config).toEqual(CUSTOM_CONFIG);
  });

  it('explicit stance orthodox is preserved', () => {
    seedRaw({ ...BASE_VALID, stance: 'orthodox' });
    expect(loadPreferences()?.stance).toBe('orthodox');
  });

  it('explicit stance southpaw is preserved', () => {
    seedRaw({ ...BASE_VALID, stance: 'southpaw' });
    expect(loadPreferences()?.stance).toBe('southpaw');
  });

  it('present-but-invalid stance is rejected → null → caller defaults', () => {
    seedRaw({ ...BASE_VALID, stance: 'south-paw' });
    expect(isValidPreferences({ ...BASE_VALID, stance: 'south-paw' })).toBe(false);
    expect(loadPreferences()).toBeNull();
  });

  it('missing stance still validates (tolerated); invalid does not', () => {
    expect(isValidPreferences({ ...BASE_VALID })).toBe(true);
    expect(isValidPreferences({ ...BASE_VALID, stance: 'southpaw' })).toBe(true);
    expect(isValidPreferences({ ...BASE_VALID, stance: 42 })).toBe(false);
  });

  it('unknown extra field is ignored (payload still valid)', () => {
    seedRaw({ ...BASE_VALID, stance: 'southpaw', unknownFuture: 'ignored' });
    const loaded = loadPreferences();
    expect(loaded).not.toBeNull();
    expect(loaded?.stance).toBe('southpaw');
    expect(loaded?.mode).toBe('combined');
  });

  it('save → load round-trip preserves stance', () => {
    const prefs: PersistedPreferencesV1 = {
      version: PREFS_VERSION,
      mode: 'audio',
      selectedPresetId: 'custom',
      config: CUSTOM_CONFIG,
      stance: 'southpaw',
    };
    savePreferences(prefs);
    const loaded = loadPreferences();
    expect(loaded).toEqual(prefs);
    expect(loaded?.stance).toBe('southpaw');
  });
});
