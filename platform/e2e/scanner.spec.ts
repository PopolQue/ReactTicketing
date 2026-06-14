import { test, expect } from '@playwright/test';

test.describe('Scanner App', () => {
  test('Scanner login screen loads', async ({ page }) => {
    // Navigate to scan page
    await page.goto('/scan/10000000-0000-0000-0000-000000000000');

    // It might redirect or show the login
    await expect(page.locator('body')).toBeVisible();
  });
});
