export const BY_MOBILE_CODES = ['25', '29', '33', '44'] as const;

function toNationalDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('375')) return digits.slice(3);
  if (digits.startsWith('80')) return digits.slice(2);
  if (digits.startsWith('8')) return digits.slice(1);
  return digits;
}

/**
 * Normalizes a Belarusian mobile number to `+375XXXXXXXXX`, or returns `null`
 * when the input is not a valid number (wrong length or operator code).
 */
export function normalizeBelarusPhone(input: string): string | null {
  const national = toNationalDigits(input);
  if (national.length !== 9) return null;
  const code = national.slice(0, 2);
  if (!(BY_MOBILE_CODES as readonly string[]).includes(code)) return null;
  return `+375${national}`;
}

export function isValidBelarusPhone(input: string): boolean {
  return normalizeBelarusPhone(input) !== null;
}

/**
 * Formats a Belarusian mobile number as `+375 XX XXX-XX-XX`, with partial
 * support for a typing mask. Returns an empty string for empty input.
 */
export function formatBelarusPhone(input: string): string {
  const national = toNationalDigits(input).slice(0, 9);
  if (national.length === 0) return '';

  let result = '+375';
  const code = national.slice(0, 2);
  if (code) result += ` ${code}`;
  const part1 = national.slice(2, 5);
  if (part1) result += ` ${part1}`;
  const part2 = national.slice(5, 7);
  if (part2) result += `-${part2}`;
  const part3 = national.slice(7, 9);
  if (part3) result += `-${part3}`;
  return result;
}
