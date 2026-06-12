# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: resale.spec.ts >> resale market page smoke test
- Location: e2e/resale.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1').filter({ hasText: /Secondary Market/ })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h1').filter({ hasText: /Secondary Market/ })

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('resale market page smoke test', async ({ page }) => {
  4  |   // Navigate to the homepage first, then click link to test client-side routing
  5  |   await page.goto('/');
  6  |   await page.getByRole('link', { name: 'Secondary Market' }).click();
  7  | 
  8  |   // We should see the Secondary Market header
> 9  |   await expect(page.locator('h1').filter({ hasText: /Secondary Market/ })).toBeVisible();
     |                                                                            ^ Error: expect(locator).toBeVisible() failed
  10 | 
  11 |   // We should see some explanatory text about the resale market
  12 |   await expect(page.getByText(/Securely buy tickets from other fans/i)).toBeVisible();
  13 | });
  14 | 
```