import { describe, it, expect } from 'vitest';
import { normalizeBelarusPhone, formatBelarusPhone, isValidBelarusPhone, BY_MOBILE_CODES } from '@/lib/phone';

describe('phone', () => {
  it.each([
    ['+375291234567', '+375291234567'],
    ['375291234567', '+375291234567'],
    ['80291234567', '+375291234567'],
    ['8291234567', '+375291234567'],
    ['291234567', '+375291234567'],
    ['+375 29 123-45-67', '+375291234567']
  ])('normalizes %s', (input, expected) => {
    expect(normalizeBelarusPhone(input)).toBe(expected);
  });

  it('rejects wrong operator code', () => {
    expect(normalizeBelarusPhone('+375111234567')).toBeNull();
  });

  it('rejects short numbers', () => {
    expect(normalizeBelarusPhone('+37529123')).toBeNull();
  });

  it('rejects letters', () => {
    expect(normalizeBelarusPhone('+375 29 abc-45-67')).toBeNull();
  });

  it('formats partial input for the mask', () => {
    expect(formatBelarusPhone('291234567')).toBe('+375 29 123-45-67');
    expect(formatBelarusPhone('')).toBe('');
    expect(formatBelarusPhone('29')).toBe('+375 29');
    expect(formatBelarusPhone('+375 29 1')).toBe('+375 29 1');
  });

  it('validates', () => {
    expect(isValidBelarusPhone('+375291234567')).toBe(true);
    expect(isValidBelarusPhone('+375111234567')).toBe(false);
  });

  it('exposes Belarusian mobile codes', () => {
    expect(BY_MOBILE_CODES).toEqual(['25', '29', '33', '44']);
  });
});
