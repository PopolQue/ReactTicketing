import { test, expect } from '@playwright/test';

test('resale market page smoke test', async ({ page }) => {
  await page.goto('/resale');

  await expect(page.locator('h1').filter({ hasText: /Secondary Market/ })).toBeVisible();

  await expect(page.getByText(/Securely buy tickets from other fans/i)).toBeVisible();
});
