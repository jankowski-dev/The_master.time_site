import { test, expect } from '@playwright/test';

test('header and footer render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /The Master Time/i }).first()).toBeVisible();
  await expect(page.locator('a[href="tel:+375257076793"]').first()).toBeVisible();
  await expect(page.locator('footer a[href="/politika-konfidencialnosti"]')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
});

test('services dropdown lists categories', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const dropdown = page
    .getByRole('navigation', { name: 'Основная навигация' })
    .locator('details.nav-dropdown');
  await dropdown.locator('summary').click();
  await expect(dropdown.getByRole('link', { name: 'Сантехника' })).toBeVisible();
});

test('mobile menu toggles', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /меню/i });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('sticky CTA is mobile only', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.locator('[data-sticky-cta]')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.locator('[data-sticky-cta]')).toBeHidden();
});

test('no horizontal overflow', async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  }
});

test('primary cta is visible on tablet', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/');

  const phone = page.locator('a.site-header__phone');
  const cta = page.locator('.site-header a.btn[href="/kalkulyator"]');

  const phoneVisible = await phone.isVisible();
  const ctaVisible = await cta.isVisible();
  expect(phoneVisible || ctaVisible).toBe(true);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(overflow).toBe(false);
});
