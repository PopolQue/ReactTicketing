import { test, expect } from '@playwright/test';

test('resale market page smoke test', async ({ page }) => {
  // Navigate to the homepage first, then click link to test client-side routing
  await page.goto('/');
  await page.getByRole('link', { name: 'Secondary Market' }).click();

  // We should see the Secondary Market header
  await expect(page.locator('h1').filter({ hasText: /Secondary Market/ })).toBeVisible();

  // We should see some explanatory text about the resale market
  await expect(page.getByText(/Securely buy tickets from other fans/i)).toBeVisible();
});
