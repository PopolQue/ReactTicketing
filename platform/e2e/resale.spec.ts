import { test, expect } from '@playwright/test';

test('resale market page smoke test', async ({ page }) => {
  // Mock Supabase events fetch
  await page.route('**/rest/v1/resale_listings?*', async (route) => {
    const json = [
      {
        id: 'resale-1',
        asking_price_cents: 2500,
        tickets: {
          ticket_types: { name: 'General Admission' },
          events: { name: 'Sold Out Secret Rave', city: 'London' }
        }
      }
    ];
    await route.fulfill({ json });
  });

  // Navigate to the resale page
  await page.goto('/resale');

  // We should see the Secondary Market header
  await expect(page.locator('h1').filter({ hasText: /Secondary Market/ })).toBeVisible();

  // We should see the mocked event card
  await expect(page.getByText('Sold Out Secret Rave')).toBeVisible();
  await expect(page.getByText('€25.00')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Ticket' })).toBeVisible();
});
