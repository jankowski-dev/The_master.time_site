/**
 * Returns the global `localStorage`, or `null` when it is unavailable. The
 * `window.localStorage` property getter itself can throw (e.g. private mode,
 * storage blocked by policy), so both the property access and `typeof window`
 * are guarded.
 */
export function getSafeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}
