import { test, expect } from '@playwright/test';

test('check body color', async ({ page }) => {
  await page.goto('/');
  const bgColor = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
  const styleText = await page.evaluate(() => {
    const styles = Array.from(document.querySelectorAll('style'));
    return styles.map(s => s.textContent).join('\n');
  });
  const scripts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('script')).map(s => s.src || s.innerHTML);
  });
  console.log('SCRIPTS:', scripts);
});
