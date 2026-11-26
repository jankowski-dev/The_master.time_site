import { describe, it, expect, vi } from 'vitest';

import { createNotifiers, notifyLead } from '@/lib/leads/notify';
import type { EmailConfig, Lead, LeadNotifier } from '@/lib/leads/types';
import type { ViberConfig } from '@/lib/leads/viber';

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
    photos: []
  };
}

function okNotifier(name: string): LeadNotifier {
  return { name, send: vi.fn(async () => {}) };
}

function failNotifier(name: string): LeadNotifier {
  return {
    name,
    send: vi.fn(async () => {
      throw new Error(`${name} down`);
    })
  };
}

const emailConfig: EmailConfig = {
  host: 'smtp.example.com',
  port: 587,
  user: 'user',
  pass: 'pass',
  from: 'from@example.com',
  to: 'to@example.com'
};

const viberConfig: ViberConfig = { token: 'token-123', adminId: '+375257076793' };

describe('notifyLead', () => {
  it('delivers when email fails but viber succeeds', async () => {
    const result = await notifyLead(lead(), [failNotifier('email'), okNotifier('viber')]);
    expect(result.delivered).toBe(true);
    expect(result.results).toEqual([
      { name: 'email', ok: false, error: 'email down' },
      { name: 'viber', ok: true }
    ]);
  });

  it('does not deliver when every notifier fails', async () => {
    const result = await notifyLead(lead(), [failNotifier('email'), failNotifier('viber')]);
    expect(result.delivered).toBe(false);
    expect(result.results).toHaveLength(2);
    expect(result.results.every((r) => !r.ok)).toBe(true);
  });

  it('does not deliver with no notifiers', async () => {
    const result = await notifyLead(lead(), []);
    expect(result.delivered).toBe(false);
    expect(result.results).toEqual([]);
  });
});

describe('createNotifiers', () => {
  it('returns only the memory notifier in test mode', () => {
    const notifiers = createNotifiers({ testMode: true, email: emailConfig, viber: viberConfig });
    expect(notifiers).toHaveLength(1);
    expect(notifiers[0].name).toBe('memory');
  });

  it('includes email and viber when both are configured', () => {
    const notifiers = createNotifiers({ testMode: false, email: emailConfig, viber: viberConfig });
    expect(notifiers.map((n) => n.name)).toEqual(['email', 'viber']);
  });

  it('filters out missing channels', () => {
    expect(createNotifiers({ testMode: false, email: null, viber: null })).toEqual([]);
    expect(
      createNotifiers({ testMode: false, email: emailConfig, viber: null }).map((n) => n.name)
    ).toEqual(['email']);
  });
});
