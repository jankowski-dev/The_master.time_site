import { test, expect } from '@playwright/test';

test('calculates 68–92 BYN', async ({ page }) => {
  await page.goto('/kalkulyator');
  await page.getByRole('radio', { name: 'Сантехника' }).check();
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByRole('radio', { name: 'Замена смесителя' }).check();
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByRole('radio', { name: 'В течение 2 часов' }).check();
  await page.getByRole('radio', { name: 'За городом до 20 км' }).check();
  await expect(page.getByText('68–92 BYN')).toBeVisible();
});

test('beyond 20 km asks to call', async ({ page }) => {
  await page.goto('/kalkulyator?category=santehnika&task=zamena-smesitelya&urgency=asap&location=beyond');
  await expect(page.getByText('Уточним по телефону')).toBeVisible();
});

test('opens lead form with prefilled estimate', async ({ page }) => {
  await page.goto('/kalkulyator?category=santehnika&task=zamena-smesitelya&urgency=asap&location=out_of_town');
  await page.getByRole('button', { name: 'Вызвать мастера' }).click();
  const dialog = page.locator('#lead-form-dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('input[name="taskId"]')).toHaveValue('zamena-smesitelya');
  await expect(dialog.locator('input[name="estimateFrom"]')).toHaveValue('68');
});

test('updates URL query params without reloading', async ({ page }) => {
  await page.goto('/kalkulyator');
  await page.getByRole('radio', { name: 'Сантехника' }).check();
  await expect(page).toHaveURL(/category=santehnika/);
  await page.getByRole('button', { name: 'Далее' }).click();
  await page.getByRole('radio', { name: 'Замена смесителя' }).check();
  await expect(page).toHaveURL(/task=zamena-smesitelya/);
});

test('static price breakdown shows a single-currency range', async ({ page }) => {
  await page.goto('/kalkulyator');
  const breakdown = page.locator('#how-price-works');
  await expect(breakdown).toContainText('40–60 BYN');
  await expect(breakdown).not.toContainText('40 BYN–60 BYN');
});

test('calculator page has no horizontal overflow', async ({ page }) => {
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/kalkulyator');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
  }
});
