import { test, expect } from '@playwright/test';

test('home sells the service', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Мастер на час в Гродно');
  await expect(page.locator('[data-service-card]')).toHaveCount(6);
  await expect(page.getByText('Замена смесителя')).toBeVisible();
  await expect(page.getByText('40 BYN').first()).toBeVisible();
  await expect(page.locator('a[href="/kalkulyator"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://ig.me/m/the_master.time"]').first()).toBeVisible();
  await expect(page.locator('a[href^="viber://chat"]').first()).toBeVisible();
});

test('faq opens', async ({ page }) => {
  await page.goto('/');
  const faq = page.getByText('Сколько стоит выезд?');
  await faq.click();
  await expect(page.getByText(/выезд/i).first()).toBeVisible();
});

test('home has json-ld and no overflow', async ({ page }) => {
  await page.goto('/');
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)).toMatchObject({ '@type': 'LocalBusiness' });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
