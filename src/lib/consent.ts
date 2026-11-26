export const CONSENT_KEY = 'tmt_consent';

export type ConsentValue = 'accepted' | 'declined';

/** Reads the stored cookie-consent value, or `null` when unset or unavailable. */
export function getConsent(storage?: Storage | null): ConsentValue | null {
  if (!storage) return null;
  try {
    const value = storage.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
}

/** Persists the consent value. Never throws (storage may be unavailable). */
export function setConsent(value: ConsentValue, storage?: Storage | null): void {
  if (!storage) return;
  try {
    storage.setItem(CONSENT_KEY, value);
  } catch {
    // ignore storage failures
  }
}
