import { describe, it, expect, vi, type Mock } from 'vitest';

import { createViberNotifier, sendViberText } from '@/lib/leads/viber';
import type { ViberConfig } from '@/lib/leads/viber';
import type { Lead } from '@/lib/leads/types';

const config: ViberConfig = { token: 'token-123', adminId: '+375257076793' };

function lead(): Lead {
  return {
    id: 'lead-1',
    createdAt: '2026-11-26T10:00:00.000Z',
    name: 'Иван',
    phone: '+375291234567',
    source: 'form',
    page: '/kalkulyator',
    attribution: {},
    consent: true,
    photos: [],
    estimateFrom: 40,
    estimateTo: 60
  };
}

function fakeFetch(status: number): Mock<typeof fetch> {
  return vi.fn<typeof fetch>(async () => new Response(null, { status }));
}

describe('createViberNotifier', () => {
  it('returns null when the token is missing', () => {
    expect(createViberNotifier({ token: '', adminId: '+375257076793' })).toBeNull();
  });

  it('returns null when the admin id is missing', () => {
    expect(createViberNotifier({ token: 'token-123', adminId: '' })).toBeNull();
  });

  it('posts a text message to the Viber API', async () => {
    const fetchImpl = fakeFetch(200);
    const notifier = createViberNotifier(config, fetchImpl);
    expect(notifier).not.toBeNull();
    await notifier!.send(lead());

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://chatapi.viber.com/pa/send_message');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['X-Viber-Auth-Token']).toBe('token-123');

    const body = JSON.parse(init?.body as string) as Record<string, unknown>;
    expect(body.receiver).toBe('+375257076793');
    expect(body.type).toBe('text');
    expect(body.text).toEqual(expect.stringContaining('+375291234567'));
  });
});

describe('sendViberText', () => {
  it('resolves on a 2xx response', async () => {
    await expect(sendViberText(config, 'hello', fakeFetch(200))).resolves.toBeUndefined();
  });

  it('rejects on a non-2xx response', async () => {
    await expect(sendViberText(config, 'hello', fakeFetch(500))).rejects.toThrow('500');
  });
});
