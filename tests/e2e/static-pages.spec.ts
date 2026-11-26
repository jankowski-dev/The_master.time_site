import { test, expect } from '@playwright/test';

const STATIC_PAGES = [
  '/usloviya',
  '/o-mastere',
  '/kontakty',
  '/politika-konfidencialnosti',
  '/spasibo'
] as const;

for (const route of STATIC_PAGES) {
  test(`${route} returns 200 with one H1 and brand in title`, async ({ page, request }) => {
    const res = await request.get(route);
    expect(res.status()).toBe(200);

    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle(/The Master Time/);
  });
}

test('/spasibo is marked noindex', async ({ page }) => {
  await page.goto('/spasibo');
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
});

test('/404 returns 404 status and the not-found copy', async ({ page, request }) => {
  const res = await request.get('/404');
  expect(res.status()).toBe(404);

  await page.goto('/404');
  await expect(page.getByText('Страница не найдена')).toBeVisible();
  await expect(page).toHaveTitle(/The Master Time/);
});

test('/kontakty links tel, viber and instagram direct message', async ({ page }) => {
  await page.goto('/kontakty');
  await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
  await expect(page.locator('a[href^="viber://"]').first()).toBeVisible();
  await expect(page.locator('a[href^="https://ig.me/"]').first()).toBeVisible();
});

test('footer links to the privacy page', async ({ page }) => {
  await page.goto('/usloviya');
  await expect(page.locator('footer a[href="/politika-konfidencialnosti"]')).toBeVisible();
});
