import { test, expect } from '@playwright/test';

test('should load the page without errors or 404s', async ({ page }) => {
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];

  // Track failed network requests
  page.on('requestfailed', request => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`);
  });

  // Track 4xx/5xx responses
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.url()}: ${response.status()}`);
    }
  });

  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });

  await page.goto('http://127.0.0.1:8081/index.html');

  // Verify no network failures
  expect(failedRequests, `Found failed network requests: ${failedRequests.join(', ')}`).toHaveLength(0);

  // Verify no console errors
  expect(consoleErrors, `Found console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);

  // Basic check that the page rendered
  await expect(page.locator('h1')).toHaveText('MarkPaste');
});
