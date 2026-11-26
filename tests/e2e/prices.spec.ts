import { test, expect } from '@playwright/test';

const categoryHeadings = [
  'Сантехника',
  'Электрика',
  'Ремонт и отделка',
  'Мебельные работы',
  'Бытовая техника',
  'Мелкие работы'
];

const electricalWorks = ['Замена розетки', 'Установка светильника', 'Монтаж автомата'];

test('price page lists every category and work', async ({ page }) => {
  await page.goto('/ceny');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Цены');
  for (const heading of categoryHeadings) {
    await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }

  await expect(page.locator('[data-category-slug]')).toHaveCount(6);
  await expect(page.locator('[data-work-search]')).toHaveCount(18);
  await expect(page.locator('[data-price-empty]')).toBeHidden();
  await expect(page.locator('[data-price-count]')).toContainText('18');
  await expect(page.locator('a[href="/usloviya"]').first()).toBeVisible();
  await expect(page.locator('a[href="/kalkulyator"]').first()).toBeVisible();
});

test('search narrows the list to a matching work', async ({ page }) => {
  await page.goto('/ceny');

  const search = page.locator('input[data-price-search]');
  await search.fill('смеситель');

  await expect(page.locator('[data-work-search]:visible')).toHaveCount(1);
  await expect(page.locator('[data-work-search]:visible')).toContainText('Замена смесителя');
  await expect(page.locator('[data-category-slug]:visible')).toHaveCount(1);
  await expect(page.locator('[data-price-count]')).toContainText('1');

  await search.fill('');

  await expect(page.locator('[data-work-search]:visible')).toHaveCount(18);
  await expect(page.locator('[data-category-slug]:visible')).toHaveCount(6);
  await expect(page.locator('[data-price-count]')).toContainText('18');
});

test('category filter shows only the selected category', async ({ page }) => {
  await page.goto('/ceny');

  const select = page.locator('select[data-price-category]');
  await select.selectOption({ label: 'Электрика' });

  await expect(page.locator('[data-work-search]:visible')).toHaveCount(3);
  await expect(page.locator('[data-category-slug]:visible')).toHaveCount(1);
  await expect(page.locator('[data-price-count]')).toContainText('3');
  for (const title of electricalWorks) {
    await expect(page.getByText(title)).toBeVisible();
  }

  // `price_filter` is debounced (400ms), so wait past the debounce window.
  await page.waitForTimeout(500);
  const events = await page.evaluate(() =>
    (window as unknown as { dataLayer: Array<{ event: string; category?: string }> }).dataLayer
  );
  const priceFilter = events.find((e) => e.event === 'price_filter');
  expect(priceFilter).toBeDefined();
  expect(priceFilter!.category).toBe('elektrika');

  await page.locator('[data-price-reset]').click();

  await expect(select).toHaveValue('');
  await expect(page.locator('[data-work-search]:visible')).toHaveCount(18);
  await expect(page.locator('[data-price-count]')).toContainText('18');
});

test('empty search shows the empty message', async ({ page }) => {
  await page.goto('/ceny');

  await page.locator('input[data-price-search]').fill('нет такого');

  await expect(page.locator('[data-price-empty]')).toBeVisible();
  await expect(page.locator('[data-work-search]:visible')).toHaveCount(0);
  await expect(page.locator('[data-category-slug]:visible')).toHaveCount(0);
  await expect(page.locator('[data-price-count]')).toContainText('0');
});

test('filtering does not reload the page', async ({ page }) => {
  let navigations = 0;
  page.on('framenavigated', () => {
    navigations += 1;
  });

  await page.goto('/ceny');
  const initialNavigations = navigations;

  await page.locator('input[data-price-search]').fill('смеситель');
  await page.locator('select[data-price-category]').selectOption('');

  await expect(page.locator('[data-work-search]:visible')).toHaveCount(1);
  expect(navigations).toBe(initialNavigations);
});

test('price page has no horizontal overflow', async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/ceny');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  }
});
