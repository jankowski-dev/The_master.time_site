import { test, expect } from '@playwright/test';

async function jsonLdTypes(page: import('@playwright/test').Page): Promise<string[]> {
  const nodes = await page.locator('script[type="application/ld+json"]').allTextContents();
  return nodes.map((text) => JSON.parse(text)['@type'] as string);
}

test.describe('SEO structured data', () => {
  test('home exposes title, description, canonical and LocalBusiness JSON-LD', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/The Master Time/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://localhost:4321/'
    );
    expect(await jsonLdTypes(page)).toContain('LocalBusiness');
  });

  test('category page exposes Service JSON-LD', async ({ page }) => {
    await page.goto('/uslugi/santehnika');
    expect(await jsonLdTypes(page)).toContain('Service');
  });
});

test.describe('sitemap and robots', () => {
  test('sitemap index lists the real sitemap containing service routes', async ({ request }) => {
    const index = await request.get('/sitemap-index.xml');
    expect(index.status()).toBe(200);
    expect(await index.text()).toContain('sitemap-0.xml');

    const sitemap = await request.get('/sitemap-0.xml');
    expect(sitemap.status()).toBe(200);
    const body = await sitemap.text();
    expect(body).toContain('/uslugi/santehnika');
    expect(body).not.toContain('/spasibo');
    expect(body).not.toContain('/zayavka');
    expect(body).not.toContain('/politika-konfidencialnosti');
  });

  test('robots.txt references the sitemap and blocks private routes', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Sitemap:');
    expect(body).toContain('Disallow: /spasibo');
    expect(body).toContain('Disallow: /zayavka');
  });
});

test.describe('consent banner and analytics', () => {
  test('gates analytics behind consent and tracks clicks after accept', async ({ page }) => {
    // Tracking fires on the click handler; prevent the links' default action so
    // external/`tel:` navigation does not tear the page down before we assert.
    await page.addInitScript(() => {
      document.addEventListener(
        'click',
        (event) => {
          const target = event.target as Element | null;
          if (target?.closest?.('[data-track]')) event.preventDefault();
        },
        true
      );
    });

    // Never hit the real analytics hosts: the assertion checks the injected
    // script tags/localStorage/dataLayer, not the network.
    await page.route(/mc\.yandex\.ru|googletagmanager\.com|google-analytics\.com/, (route) =>
      route.abort()
    );

    await page.goto('/');

    const banner = page.locator('#consent-banner');
    await expect(banner).toBeVisible();
    await expect(page.locator('script[src*="mc.yandex"]')).toHaveCount(0);

    await page.locator('[data-consent-accept]').click();

    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('tmt_consent'))).toBe('accepted');
    await expect(page.locator('script[src*="mc.yandex"]')).toHaveCount(1);

    await page.locator('[data-track-event="phone_click"]').first().click();
    await page.locator('[data-track-event="instagram_click"]').first().click();
    await page.locator('[data-track-event="viber_click"]').first().click();

    const events = await page.evaluate(() =>
      (window as unknown as { dataLayer: Array<{ event: string }> }).dataLayer.map((e) => e.event)
    );
    expect(events).toContain('phone_click');
    expect(events).toContain('instagram_click');
    expect(events).toContain('viber_click');

    await page.reload();
    await expect(page.locator('#consent-banner')).toBeHidden();
  });

  test('declining consent keeps analytics scripts out', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-consent-decline]').click();
    await expect(page.locator('#consent-banner')).toBeHidden();
    await expect(page.locator('script[src*="mc.yandex"]')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('tmt_consent'))).toBe('declined');
  });
});

test.describe('lead attribution', () => {
  test('captures UTM params from the URL and sends them with the lead', async ({ page }) => {
    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      (window as unknown as Record<string, unknown>).__capturedLead = null;
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('/api/lead')) {
          const body = init?.body;
          if (body instanceof FormData) {
            (window as unknown as Record<string, unknown>).__capturedLead = {
              attribution: body.get('attribution')
            };
          }
        }
        return originalFetch(input, init);
      };
    });

    await page.route('**/api/lead', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, leadId: 'e2e' })
      })
    );

    await page.goto('/?utm_source=test&utm_medium=cpc');
    await page.locator('[data-open-lead-form]').first().click();
    const dialog = page.locator('#lead-form-dialog');

    await dialog.locator('input[name="phone"]').fill('+375 29 123-45-67');
    await dialog.locator('input[name="consent"]').check();
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByText('Заявка принята')).toBeVisible();

    const captured = (await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__capturedLead
    )) as { attribution: string };

    expect(JSON.parse(captured.attribution)).toMatchObject({
      utmSource: 'test',
      utmMedium: 'cpc'
    });
  });
});
