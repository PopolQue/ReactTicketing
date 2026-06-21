import { test, expect } from '@playwright/test';

test('marketplace smoke test', async ({ page }) => {
  await page.goto('/discover');

  await expect(
    page.locator('h1').filter({ hasText: /Discover Your Next Experience/ })
  ).toBeVisible();

  const searchInput = page.getByPlaceholder('Search by event name, city, or venue...');
  await expect(searchInput).toBeVisible();
});
