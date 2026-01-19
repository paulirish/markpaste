import {test, expect} from '@playwright/test';

test('should load the page without errors or 404s', async ({page}) => {
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

  await page.goto('http://127.0.0.1:7025/index.html');

  // Verify no network failures
  expect(failedRequests, `Found failed network requests: ${failedRequests.join(', ')}`).toHaveLength(0);

  // Verify no console errors
  expect(consoleErrors, `Found console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);

  // Basic check that the page rendered
  await expect(page.locator('h1')).toHaveText('MarkPaste');
});

test('should paste HTML and update all 2 markdown outputs', async ({page}) => {
  await page.goto('http://127.0.0.1:7025/index.html');

  const inputArea = page.locator('#inputArea');
  const testHtml = '<h1>Test Title</h1><p>Hello <strong>world</strong></p>';

  // Simulate paste event
  await page.evaluate(html => {
    const el = document.querySelector('#inputArea');
    if (!el) return;
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/html', html);
    const event = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    });
    el.dispatchEvent(event);
  }, testHtml);

  // Expected markdown (approximate, since different converters might vary slightly)
  // Turndown: # Test Title\n\nHello **world**
  // Pandoc: # Test Title\n\nHello **world**

  const outputTurndown = page.locator('#outputCodeTurndown');
  const outputPandoc = page.locator('#outputCodePandoc');

  // Wait for all outputs to contain expected content
  await expect(outputTurndown).toContainText('# Test Title');
  await expect(outputTurndown).toContainText('Hello **world**');

  await expect(outputPandoc).toContainText('# Test Title');
  await expect(outputPandoc).toContainText('Hello **world**');
});
