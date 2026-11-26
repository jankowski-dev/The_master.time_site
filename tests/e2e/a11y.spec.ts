import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of [
  '/',
  '/uslugi/santehnika',
  '/kalkulyator',
  '/kontakty',
  '/ceny',
  '/politika-konfidencialnosti'
]) {
  test(`a11y ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
