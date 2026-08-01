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

  test('should clean and convert math blocks and math inline elements', async ({page}) => {
    const html = `
      <div class="math-block animating" data-math="P(\\text{Unknown} \\mid \\mathbf{x}) = 1 - \\exp(x)">
        <span class="katex-display"><span class="katex">KaTeX visual elements</span></span>
      </div>
      <p>Here is <span class="math-inline" data-math="d(\\mathbf{x}, \\boldsymbol{\\mu}_k) = 2"><span class="katex">KaTeX inline</span></span> inside paragraph.</p>
    `;

    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#outputCodeTurndown');
    
    // Check block math output
    await expect(outputCode).toContainText('$$');
    await expect(outputCode).toContainText('P(\\text{Unknown} \\mid \\mathbf{x}) = 1 - \\exp(x)');
    
    // Check inline math output
    await expect(outputCode).toContainText('$d(\\mathbf{x}, \\boldsymbol{\\mu}_k) = 2$');
    
    // Ensure KaTeX fallback/visual texts are not included
    await expect(outputCode).not.toContainText('KaTeX visual elements');
    await expect(outputCode).not.toContainText('KaTeX inline');
  });
});

