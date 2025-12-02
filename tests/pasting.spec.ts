import {test, expect} from '@playwright/test';

test.describe('MarkPaste functionality', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('http://127.0.0.1:8080/index.html');
  });

  test('should convert basic rich text to markdown', async ({page}) => {
    const html = '<p>Hello <b>world</b></p>';
    await page.evaluate(html => {
      const inputArea = document.getElementById('input-area');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#output-code');
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
      const inputArea = document.getElementById('input-area');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#output-code');
    await expect(outputCode).toHaveText('The `debugger` keyword stops the execution of JavaScript, and calls (if available) the debugging function.');

    const htmlCode = page.locator('#html-code');
    const cleanedHtml = await htmlCode.innerText();
    expect(cleanedHtml).toMatch(/The\s*<code[^>]*>debugger<\/code>/);
    expect(cleanedHtml).not.toContain('The<code>debugger</code>');
  });

  test.skip('should toggle HTML cleaning', async ({page}) => {
    const html = '<div><p>Hello</p><style>body{color:red;}</style><script>alert("xss")</script></div>';

    await page.evaluate(html => {
      const inputArea = document.getElementById('input-area');
      inputArea.innerHTML = html;
      inputArea.dispatchEvent(new Event('input', {bubbles: true}));
    }, html);

    const outputCode = page.locator('#output-code');
    const htmlCode = page.locator('#html-code');

    // Initially, "Clean HTML" is checked
    await expect(outputCode).toHaveText('Hello');
    expect(await htmlCode.innerHTML()).not.toContain('<div>');
    expect(await htmlCode.innerText()).not.toContain('<script>');

    // Uncheck "Clean HTML"
    await page.locator('#clean-html-toggle').uncheck();

    await expect(outputCode).toHaveText('Hello');

    expect(await htmlCode.innerHTML()).toContain('<div>');
    expect(await htmlCode.innerHTML()).not.toContain('<script>');
  });
});
