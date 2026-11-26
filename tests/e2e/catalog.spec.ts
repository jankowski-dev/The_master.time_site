import { test, expect } from '@playwright/test';

test('catalog lists all six services', async ({ page }) => {
  await page.goto('/uslugi');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Услуги');
  await expect(page.locator('[data-service-card]')).toHaveCount(6);
});

test('category page sells santehnika', async ({ page }) => {
  await page.goto('/uslugi/santehnika');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Сантехника в Гродно');
  await expect(page.getByText('Замена смесителя')).toBeVisible();
  await expect(page.getByText('40 BYN').first()).toBeVisible();
  await expect(page.locator('a[href="/kalkulyator?category=santehnika"]').first()).toBeVisible();

  const breadcrumbs = page.getByRole('navigation', { name: 'Хлебные крошки' });
  await expect(breadcrumbs).toContainText('Главная');
  await expect(breadcrumbs).toContainText('Услуги');
  await expect(breadcrumbs).toContainText('Сантехника');

  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)).toMatchObject({ '@type': 'Service' });
});

test('unknown category returns 404', async ({ request }) => {
  const res = await request.get('/uslugi/unknown');
  expect(res.status()).toBe(404);
});
