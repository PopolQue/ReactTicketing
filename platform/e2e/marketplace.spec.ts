import { test, expect } from '@playwright/test';

test('marketplace smoke test', async ({ page }) => {
  // Navigate to the app
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  await page.goto('/discover');

  // We should see the Marketplace header
  await expect(page.locator('h2').filter({ hasText: /Marketplace/ })).toBeVisible();

  // We should see the Search Bar
  const searchInput = page.getByPlaceholder('Search by event name, city, or venue...');
  await expect(searchInput).toBeVisible();

  // We should see "Discover Your Next Experience"
  await expect(page.getByText('Discover Your Next Experience')).toBeVisible();
});
