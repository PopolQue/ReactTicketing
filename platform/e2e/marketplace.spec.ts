import { test, expect } from '@playwright/test';

test('marketplace smoke test with mocked supabase', async ({ page }) => {
  // Mock Supabase events fetch
  await page.route('**/rest/v1/events?*', async (route) => {
    const json = [
      {
        id: '123',
        name: 'Underground Techno Rave',
        start_date: new Date().toISOString(),
        venue: 'Secret Warehouse',
        city: 'Berlin',
        published: true,
        organizer_profiles: { company_name: 'Berghain Collective' },
      }
    ];
    await route.fulfill({ json });
  });

  // Navigate to the app
  await page.goto('/');

  // We should see the Marketplace header
  await expect(page.locator('h2').filter({ hasText: /Marketplace/ })).toBeVisible();

  // We should see the Search Bar
  const searchInput = page.getByPlaceholder('Search by event name, city, or venue...');
  await expect(searchInput).toBeVisible();

  // We should see the mocked event card
  await expect(page.getByText('Underground Techno Rave')).toBeVisible();
  await expect(page.getByText('Berghain Collective')).toBeVisible();
});
