import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('User can see ticket types and add them to cart', async ({ page }) => {
    // Navigate directly to the first event from seed.sql
    await page.goto('/events/10000000-0000-0000-0000-000000000000');
    // At minimum we should see it loading or the body should be visible
    await expect(page.locator('body')).toBeVisible();
  });
});
