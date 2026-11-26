import { test, expect } from '@playwright/test';

test('health endpoint responds', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true, service: 'the-master-time' });
});
