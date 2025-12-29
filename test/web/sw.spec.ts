import {test, expect} from '@playwright/test';

test('should register service worker', async ({page}) => {
  await page.goto('http://127.0.0.1:8081/index.html');

  // Wait for the service worker to be registered
  const isRegistered = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    // Wait a bit for registration to complete if it hasn't already
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    if (registration) return true;

    // Fallback check
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.length > 0;
  });

  expect(isRegistered).toBe(true);
});
