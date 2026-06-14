import { test, expect } from '@playwright/test';

test.describe('Authentication Loop', () => {
  test('User can navigate to auth page and see login form', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('.glass-panel')).toBeVisible();
    await expect(page.getByText(/Log in/i).first()).toBeVisible();
  });
});
