export interface RateLimiter {
  check(key: string): boolean;
}

/**
 * A fixed-window, in-memory rate limiter. Tracks a timestamp per allowed call
 * and prunes entries older than the window on every check.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  now?: () => number;
}): RateLimiter {
  const timestamps = new Map<string, number[]>();
  const now = options.now ?? Date.now;

  return {
    check(key: string): boolean {
      const t = now();
      const list = (timestamps.get(key) ?? []).filter((ts) => t - ts < options.windowMs);

      if (list.length >= options.max) {
        timestamps.set(key, list);
        return false;
      }

      list.push(t);
      timestamps.set(key, list);
      return true;
    }
  };
}
