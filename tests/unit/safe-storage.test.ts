import { describe, it, expect, vi, afterEach } from 'vitest';
import { getSafeStorage } from '@/lib/safe-storage';
import { makeStorage } from './storage';

describe('getSafeStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the storage when localStorage is available', () => {
    const storage = makeStorage();
    vi.stubGlobal('window', { localStorage: storage });
    expect(getSafeStorage()).toBe(storage);
  });

  it('returns null when the localStorage getter throws', () => {
    const fake: Record<string, unknown> = {};
    Object.defineProperty(fake, 'localStorage', {
      get() {
        throw new Error('storage blocked');
      }
    });
    vi.stubGlobal('window', fake);
    expect(getSafeStorage()).toBeNull();
  });

  it('returns null when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    expect(getSafeStorage()).toBeNull();
  });
});
