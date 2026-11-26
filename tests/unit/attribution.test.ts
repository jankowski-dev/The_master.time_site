import { describe, it, expect } from 'vitest';
import { captureAttribution, getAttribution, ATTRIBUTION_KEY } from '@/lib/attribution';
import { makeStorage, throwingStorage } from './storage';

describe('attribution', () => {
  it('captures and stores utm/gclid fields', () => {
    const storage = makeStorage();
    const result = captureAttribution(
      '?utm_source=instagram&utm_medium=social&gclid=abc',
      'https://google.com',
      '/uslugi/santehnika',
      storage
    );

    expect(result).toMatchObject({
      utmSource: 'instagram',
      utmMedium: 'social',
      gclid: 'abc',
      referrer: 'https://google.com',
      landingPage: '/uslugi/santehnika'
    });

    const raw = storage.getItem(ATTRIBUTION_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored.utmSource).toBe('instagram');
    expect(typeof stored.expiresAt).toBe('number');
  });

  it('maps yclid', () => {
    const storage = makeStorage();
    const result = captureAttribution('?yclid=123&utm_campaign=spring', '', '/', storage);
    expect(result).toMatchObject({ yclid: '123', utmCampaign: 'spring' });
  });

  it('returns stored attribution with page and device', () => {
    const storage = makeStorage();
    captureAttribution('?utm_source=instagram', 'https://google.com', '/', storage);
    const result = getAttribution(storage, '/ceny', 'mobile');
    expect(result.utmSource).toBe('instagram');
    expect(result.page).toBe('/ceny');
    expect(result.device).toBe('mobile');
  });

  it('returns {} when nothing is stored', () => {
    expect(getAttribution(makeStorage(), '/ceny', 'mobile')).toEqual({});
  });

  it('returns {} for expired entries', () => {
    const now = Date.now();
    const storage = makeStorage({
      [ATTRIBUTION_KEY]: JSON.stringify({ utmSource: 'x', expiresAt: now - 1000 })
    });
    expect(getAttribution(storage, '/ceny', 'mobile', now)).toEqual({});
  });

  it('returns {} for invalid stored JSON', () => {
    const storage = makeStorage({ [ATTRIBUTION_KEY]: 'not-json{' });
    expect(getAttribution(storage, '/ceny', 'mobile')).toEqual({});
  });

  it('keeps existing attribution when no new params', () => {
    const storage = makeStorage();
    captureAttribution('?utm_source=instagram', 'https://google.com', '/', storage);
    const result = captureAttribution('', '', '/other', storage);
    expect(result.utmSource).toBe('instagram');
  });

  it('does not throw when storage is unavailable', () => {
    expect(() => captureAttribution('?utm_source=x', '', '/', throwingStorage())).not.toThrow();
    expect(() => getAttribution(throwingStorage(), '/', 'desktop')).not.toThrow();
  });

  it('returns {} when storage fails to persist', () => {
    const result = captureAttribution('?utm_source=x', '', '/', throwingStorage());
    expect(result).toEqual({});
  });

  it('tolerates a null storage', () => {
    expect(captureAttribution('?utm_source=x', '', '/', null)).toEqual({});
    expect(getAttribution(null, '/ceny', 'mobile')).toEqual({});
  });
});
