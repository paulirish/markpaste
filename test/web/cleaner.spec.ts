import {test, expect} from '@playwright/test';

test.describe('Cleaner functionality', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('http://127.0.0.1:7025/index.html');
  });

  test('should remove MDN copy button and play links', async ({page}) => {
    const html = `
      <div>
        <p>Example code:</p>
        <button class="mdn-copy-button">Copy</button>
        <pre><code>console.log('hello');</code></pre>
        <a href="https://developer.mozilla.org/en-US/play?id=123">Play in MDN</a>
        <a href="https://example.com">Normal Link</a>
      </div>
    `;

    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#outputCodeTurndown');

    await expect(outputCode).not.toContainText('Copy');
    await expect(outputCode).not.toContainText('Play in MDN');
    await expect(outputCode).toContainText('Normal Link');
    await expect(outputCode).toContainText("console.log('hello');");
  });
});
