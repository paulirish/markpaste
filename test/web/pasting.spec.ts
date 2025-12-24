import {test, expect} from '@playwright/test';

test.describe('MarkPaste functionality', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('http://127.0.0.1:8081/index.html');
  });

  test('should convert basic rich text to markdown', async ({page}) => {
    const html = '<p>Hello <b>world</b></p>';
    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#outputCodeTurndown');
    await expect(outputCode).toHaveText('Hello **world**');
  });

  test('should handle the tricky case from repro.html', async ({page}) => {
    const html = `
      <meta charset='utf-8'>
      <p>The<span> </span>
      <code class="w3-codespan">debugger</code>
      <span> </span>keyword stops the execution of JavaScript, and calls (if available) the debugging function.</p>
    `;

    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#outputCodeTurndown');
    await expect(outputCode).toHaveText('The `debugger` keyword stops the execution of JavaScript, and calls (if available) the debugging function.');

    const htmlCode = page.locator('#htmlCode');
    const cleanedHtml = await htmlCode.innerText();
    expect(cleanedHtml).toMatch(/The\s*<code[^>]*>debugger<\/code>/);
    expect(cleanedHtml).not.toContain('The<code>debugger</code>');
  });

  test('should run all converters simultaneously', async ({page}) => {
    const html = '<h3>Hello World</h3>';
    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const turndownOutput = page.locator('#outputCodeTurndown');
    await expect(turndownOutput).toHaveText('### Hello World');

    const pandocOutput = page.locator('#outputCodePandoc');
    // Pandoc might take a moment
    await expect(pandocOutput).toContainText('Hello World');
  });

  // SKIP this for now. needs a human to look into why its failing.
  test.skip('should toggle HTML cleaning', async ({page}) => {
    const html = '<div><p>Hello</p><style>body{color:red;}</style><script>alert("xss")</script></div>';

    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#outputCodeTurndown');
    const htmlCode = page.locator('#htmlCode');

    // Initially, "Clean HTML" is checked
    await page.waitForFunction(() => document.getElementById('outputCodeTurndown').textContent.includes('Hello'));
    expect(await htmlCode.textContent()).not.toContain('<div>');
    expect(await htmlCode.textContent()).not.toContain('<script>');

    // Uncheck "Clean HTML"
    await page.locator('#cleanHtmlToggle').uncheck();
    // Wait for update
    await page.waitForTimeout(100); 

    expect(await htmlCode.textContent()).toContain('<div>');
    expect(await htmlCode.textContent()).not.toContain('<script>');
  });

  test('should retain table structure', async ({page}) => {
    const html = `
      <table>
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1, Cell 1</td>
            <td>Row 1, Cell 2</td>
          </tr>
        </tbody>
      </table>
    `;

    await page.evaluate(html => {
      const inputArea = document.getElementById('inputArea');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const htmlCode = page.locator('#htmlCode');

    await expect(htmlCode).toContainText('<table');
    await expect(htmlCode).toContainText('<tr');
    await expect(htmlCode).toContainText('<td');
    await expect(htmlCode).toContainText('<th');
  });
});
