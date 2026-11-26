import { describe, it, expect } from 'vitest';
import { getConsent, setConsent, CONSENT_KEY } from '@/lib/consent';
import { makeStorage, throwingStorage } from './storage';

describe('consent', () => {
  it('defaults to null', () => {
    expect(getConsent(makeStorage())).toBeNull();
    expect(getConsent(undefined)).toBeNull();
  });

  it('stores and reads accepted', () => {
    const storage = makeStorage();
    setConsent('accepted', storage);
    expect(getConsent(storage)).toBe('accepted');
    expect(storage.getItem(CONSENT_KEY)).toBe('accepted');
  });

  it('stores and reads declined', () => {
    const storage = makeStorage();
    setConsent('declined', storage);
    expect(getConsent(storage)).toBe('declined');
  });

  it('ignores unknown stored values', () => {
    const storage = makeStorage({ [CONSENT_KEY]: 'maybe' });
    expect(getConsent(storage)).toBeNull();
  });

  it('returns null and does not throw on storage failure', () => {
    expect(getConsent(throwingStorage())).toBeNull();
    expect(() => setConsent('accepted', throwingStorage())).not.toThrow();
  });

  it('tolerates a null storage', () => {
    expect(getConsent(null)).toBeNull();
    expect(() => setConsent('accepted', null)).not.toThrow();
  });
});
