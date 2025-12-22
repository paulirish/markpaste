import { test, expect } from '@playwright/test';

test('debug browser cleaner', async ({ page }) => {
  await page.goto('http://127.0.0.1:8081/index.html');
  
  const result = await page.evaluate(async () => {
    const { cleanHTML } = await import('./cleaner.js');
    const html = '<p>Hello</p>';
    return {
      html,
      cleaned: cleanHTML(html),
      windowDefined: typeof window !== 'undefined',
      documentDefined: typeof document !== 'undefined'
    };
  });
  
  console.log('Browser debug result:', result);
});
