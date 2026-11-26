import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

import { verifyViberSignature } from '@/lib/leads/viber';

const token = 'secret-token';

function sign(body: string, secret: string = token): string {
  return createHmac('sha256', secret).update(body).digest('hex');
}

describe('verifyViberSignature', () => {
  it('returns true for a valid signature', () => {
    const body = JSON.stringify({ event: 'message' });
    expect(verifyViberSignature(body, sign(body), token)).toBe(true);
  });

  it('returns false for a signature from the wrong token', () => {
    const body = JSON.stringify({ event: 'message' });
    expect(verifyViberSignature(body, sign(body, 'wrong-token'), token)).toBe(false);
  });

  it('returns false for a tampered body', () => {
    const body = JSON.stringify({ event: 'message' });
    expect(verifyViberSignature(`${body} tampered`, sign(body), token)).toBe(false);
  });

  it('returns false for a missing signature', () => {
    expect(verifyViberSignature('body', null, token)).toBe(false);
  });

  it('returns false for a missing token', () => {
    const body = JSON.stringify({ event: 'message' });
    expect(verifyViberSignature(body, sign(body), '')).toBe(false);
  });
});
