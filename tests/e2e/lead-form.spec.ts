import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';

const PHOTO_FIXTURE = fileURLToPath(new URL('./fixtures/photo.png', import.meta.url));

// Captures the multipart FormData the client posts so the test can assert on
// the normalized phone, source, attribution and the compressed photo files.
const captureInitScript = () => {
  const stored = {
    utmSource: 'instagram',
    utmMedium: 'social',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000
  };
  try {
    localStorage.setItem('tmt_attribution', JSON.stringify(stored));
  } catch {
    // storage unavailable — the assertion below simply won't check attribution
  }
  const originalFetch = window.fetch.bind(window);
  (window as unknown as Record<string, unknown>).__capturedLead = null;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
    if (url.includes('/api/lead')) {
      const body = init?.body;
      if (body instanceof FormData) {
        const photos = body
          .getAll('photos')
          .filter((file): file is File => typeof file !== 'string')
          .map((file) => ({ name: file.name, type: file.type, size: file.size }));
        (window as unknown as Record<string, unknown>).__capturedLead = {
          phone: body.get('phone'),
          source: body.get('source'),
          page: body.get('page'),
          attribution: body.get('attribution'),
          consent: body.get('consent'),
          website: body.get('website'),
          startedAt: body.get('startedAt'),
          photos
        };
      }
    }
    return originalFetch(input, init);
  };
};

test('home CTA opens the lead form dialog', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-lead-form]').first().click();
  const dialog = page.locator('#lead-form-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[name="phone"]')).toBeVisible();

  const events = await page.evaluate(() =>
    (window as unknown as { dataLayer: Array<{ event: string }> }).dataLayer.map((e) => e.event)
  );
  expect(events).toContain('lead_form_open');
});

test('validates required phone and consent before submitting', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-lead-form]').first().click();
  const dialog = page.locator('#lead-form-dialog');

  await dialog.locator('button[type="submit"]').click();
  await expect(dialog.getByText('Укажите корректный номер телефона')).toBeVisible();
  await expect(dialog.getByText('Необходимо согласие на обработку данных')).toBeVisible();

  await dialog.locator('input[name="phone"]').fill('+375 11 123-45-67');
  await dialog.locator('input[name="consent"]').check();
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog.getByText('Укажите корректный номер телефона')).toBeVisible();
});

test('submits a valid lead and shows the success state', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-open-lead-form]').first().click();
  const dialog = page.locator('#lead-form-dialog');

  await dialog.locator('input[name="phone"]').fill('+375 29 123-45-67');
  await dialog.locator('input[name="consent"]').check();

  // The form stamps `startedAt` on page load and the server rejects submissions
  // younger than 3 seconds, so wait past the anti-bot window.
  await page.waitForTimeout(3500);

  await dialog.locator('button[type="submit"]').click();
  await expect(dialog.getByText('Заявка принята')).toBeVisible();
  await expect(dialog.locator('input[name="phone"]')).toBeHidden();
});

test('sends normalized phone, attribution and compressed photos', async ({ page }) => {
  // The source fixture is larger than the 2 MB compression trigger, so the
  // submitted file must be smaller (compression actually ran).
  expect(statSync(PHOTO_FIXTURE).size).toBeGreaterThan(2 * 1024 * 1024);

  await page.addInitScript(captureInitScript);
  await page.route('**/api/lead', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, leadId: 'e2e' })
    })
  );

  await page.goto('/');
  await page.locator('[data-open-lead-form]').first().click();
  const dialog = page.locator('#lead-form-dialog');

  await dialog.locator('input[name="phone"]').fill('+375 29 123-45-67');
  await dialog.locator('input[name="photos"]').setInputFiles(PHOTO_FIXTURE);
  await expect(dialog.locator('[data-photo-count]')).toContainText('1');

  // The compressed photo is already stored on the file input before submit:
  // assert it was resized to <= 1600 px and re-encoded as JPEG <= 2 MB.
  const compressed = await page.evaluate(async () => {
    const input = document.querySelector<HTMLInputElement>(
      '#lead-form-dialog input[name="photos"]'
    );
    const file = input?.files?.[0];
    if (!file) return null;
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height, type: file.type, size: file.size };
    bitmap.close();
    return dims;
  });
  expect(compressed).not.toBeNull();
  expect(compressed!.type).toBe('image/jpeg');
  expect(compressed!.width).toBeLessThanOrEqual(1600);
  expect(compressed!.height).toBeLessThanOrEqual(1600);
  expect(compressed!.size).toBeLessThanOrEqual(2 * 1024 * 1024);

  await dialog.locator('input[name="consent"]').check();
  await dialog.locator('button[type="submit"]').click();

  await expect(dialog.getByText('Заявка принята')).toBeVisible();

  const captured = (await page.evaluate(
    () => (window as unknown as Record<string, unknown>).__capturedLead
  )) as {
    phone: string;
    source: string;
    page: string;
    attribution: string;
    consent: string;
    website: string;
    startedAt: string;
    photos: Array<{ name: string; type: string; size: number }>;
  };

  expect(captured.phone).toBe('+375291234567');
  expect(captured.source).toBe('form');
  expect(captured.website).toBe('');
  expect(captured.consent).toBe('1');
  expect(JSON.parse(captured.attribution)).toMatchObject({ utmSource: 'instagram' });
  expect(captured.photos).toHaveLength(1);
  expect(captured.photos[0].type).toBe('image/jpeg');
  expect(captured.photos[0].size).toBeLessThanOrEqual(2 * 1024 * 1024);
});

test('shows phone and Viber contacts when the server errors', async ({ page }) => {
  await page.route('**/api/lead', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'delivery_failed' })
    })
  );

  await page.goto('/');
  await page.locator('[data-open-lead-form]').first().click();
  const dialog = page.locator('#lead-form-dialog');

  await dialog.locator('input[name="phone"]').fill('+375 29 123-45-67');
  await dialog.locator('input[name="consent"]').check();
  await dialog.locator('button[type="submit"]').click();

  await expect(dialog.locator('a[href="tel:+375257076793"]')).toBeVisible();
  await expect(dialog.locator('a[href^="viber://chat"]')).toBeVisible();
  // Data is preserved so the user can retry.
  await expect(dialog.locator('input[name="phone"]')).toHaveValue('+375 29 123-45-67');
});

test('no-JS fallback posts natively and redirects to /spasibo', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/zayavka');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Оставить заявку');
  await page.locator('input[name="phone"]').fill('+375 29 123-45-67');
  await page.locator('input[name="consent"]').check();
  await Promise.all([
    page.waitForURL('**/spasibo**'),
    page.locator('form[data-lead-form] button[type="submit"]').click()
  ]);
  expect(page.url()).toContain('/spasibo');

  await context.close();
});
