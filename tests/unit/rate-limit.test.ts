import { describe, it, expect } from 'vitest';

import { createRateLimiter } from '@/lib/leads/rate-limit';

describe('createRateLimiter', () => {
  it('allows max calls per window then blocks', () => {
    const t = 0;
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: () => t });

    expect(limiter.check('1.2.3.4')).toBe(true);
    expect(limiter.check('1.2.3.4')).toBe(true);
    expect(limiter.check('1.2.3.4')).toBe(false);
  });

  it('allows again after the window elapses', () => {
    let t = 0;
    const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: () => t });

    limiter.check('1.2.3.4');
    limiter.check('1.2.3.4');
    expect(limiter.check('1.2.3.4')).toBe(false);

    t = 61_000;
    expect(limiter.check('1.2.3.4')).toBe(true);
  });

  it('tracks each key independently', () => {
    const t = 0;
    const limiter = createRateLimiter({ windowMs: 60_000, max: 1, now: () => t });

    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('b')).toBe(true);
    expect(limiter.check('a')).toBe(false);
  });
});
