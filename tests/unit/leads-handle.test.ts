import { describe, it, expect, vi } from 'vitest';

import { handleLead } from '@/lib/leads/handle';
import { createRateLimiter } from '@/lib/leads/rate-limit';
import type { Lead, LeadNotifier } from '@/lib/leads/types';

function validForm(): FormData {
  const form = new FormData();
  form.set('phone', '+375 29 123-45-67');
  form.set('name', 'Иван');
  form.set('source', 'form');
  form.set('page', '/kalkulyator');
  form.set('consent', '1');
  form.set('startedAt', String(Date.now() - 5000));
  form.set('website', '');
  return form;
}

const okNotifier: LeadNotifier = { name: 'email', send: vi.fn(async () => {}) };
const failNotifier: LeadNotifier = {
  name: 'email',
  send: vi.fn(async () => {
    throw new Error('down');
  })
};

const baseInput = {
  ip: '1.2.3.4',
  referer: '',
  wantsJson: true
};

function deps(notifiers: LeadNotifier[]) {
  return { notifiers, rateLimiter: createRateLimiter({ windowMs: 60_000, max: 100 }) };
}

describe('handleLead', () => {
  it('returns 200 with a leadId for a valid form and a successful notifier', async () => {
    const result = await handleLead({ ...baseInput, formData: validForm() }, deps([okNotifier]));
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true, leadId: expect.any(String) });
  });

  it('returns 400 with fields.phone for an invalid phone', async () => {
    const form = validForm();
    form.delete('phone');
    const result = await handleLead({ ...baseInput, formData: form }, deps([okNotifier]));
    expect(result.status).toBe(400);
    const body = result.body as { error: string; fields: Record<string, string> };
    expect(body.error).toBe('validation');
    expect(body.fields.phone).toBeTruthy();
  });

  it('returns 429 when the rate limit is exceeded', async () => {
    const rateLimiter = createRateLimiter({ windowMs: 60_000, max: 1 });
    const input = { ...baseInput, formData: validForm() };
    const first = await handleLead(input, { notifiers: [okNotifier], rateLimiter });
    expect(first.status).toBe(200);
    const second = await handleLead(input, { notifiers: [okNotifier], rateLimiter });
    expect(second.status).toBe(429);
  });

  it('returns 502 when every notifier fails', async () => {
    const result = await handleLead(
      { ...baseInput, formData: validForm() },
      deps([failNotifier, failNotifier])
    );
    expect(result.status).toBe(502);
    expect(result.body).toEqual({ ok: false, error: 'delivery_failed' });
  });

  it('returns a 303 redirect for native form success', async () => {
    const result = await handleLead(
      { ...baseInput, wantsJson: false, formData: validForm() },
      deps([okNotifier])
    );
    expect(result.status).toBe(303);
    expect(result.redirect).toBe('/spasibo?source=form');
  });

  it('returns 400 HTML with phone and viber links for native form failure', async () => {
    const result = await handleLead(
      { ...baseInput, wantsJson: false, formData: validForm() },
      deps([failNotifier])
    );
    expect(result.status).toBe(400);
    const html = String(result.body);
    expect(html).toContain('tel:+375257076793');
    expect(html).toContain('viber://chat?number=%2B375257076793');
  });

  it('returns 400 with fields.categorySlug for an unknown category', async () => {
    const form = validForm();
    form.set('categorySlug', 'no-such-category');
    const result = await handleLead({ ...baseInput, formData: form }, deps([okNotifier]));
    expect(result.status).toBe(400);
    const body = result.body as { error: string; fields: Record<string, string> };
    expect(body.error).toBe('validation');
    expect(body.fields.categorySlug).toBeTruthy();
  });

  it('returns 400 with fields.taskId for an unknown task', async () => {
    const form = validForm();
    form.set('taskId', 'no-such-task');
    const result = await handleLead({ ...baseInput, formData: form }, deps([okNotifier]));
    expect(result.status).toBe(400);
    const body = result.body as { error: string; fields: Record<string, string> };
    expect(body.error).toBe('validation');
    expect(body.fields.taskId).toBeTruthy();
  });

  it('falls back to the referer when the form page is empty', async () => {
    const form = validForm();
    form.set('page', '');
    const captured: Lead[] = [];
    const captureNotifier: LeadNotifier = {
      name: 'email',
      send: vi.fn(async (lead: Lead) => {
        captured.push(lead);
      })
    };
    const result = await handleLead(
      { ...baseInput, referer: 'https://google.com', formData: form },
      deps([captureNotifier])
    );
    expect(result.status).toBe(200);
    expect(captured[0].page).toBe('https://google.com');
  });
});
