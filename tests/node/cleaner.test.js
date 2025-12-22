import { test } from 'node:test';
import assert from 'node:assert';
import { cleanHTML, removeStyleAttributes } from '../../cleaner.js';

test('cleaner: cleanHTML should remove disallowed tags', async () => {
  const html = '<div><p>Hello</p><script>alert(1)</script><span>World</span></div>';
  const cleaned = await cleanHTML(html);
  
  // Linkedom might use uppercase for tags
  assert.strictEqual(cleaned.toLowerCase().includes('<p>hello</p>'), true);
  assert.strictEqual(cleaned.toLowerCase().includes('world'), true);
  assert.strictEqual(cleaned.toLowerCase().includes('<script>'), false);
  assert.strictEqual(cleaned.toLowerCase().includes('<div>'), false); // div is unwrapped
});

test('cleaner: cleanHTML should handle MDN specific cases', async () => {
  const html = `
    <div>
      <button class="mdn-copy-button">Copy</button>
      <a href="https://developer.mozilla.org/en-US/play?id=123">Play</a>
      <a href="https://example.com">Normal</a>
    </div>
  `;
  const cleaned = await cleanHTML(html);
  
  assert.strictEqual(cleaned.includes('Copy'), false);
  assert.strictEqual(cleaned.includes('Play'), false);
  assert.strictEqual(cleaned.includes('Normal'), true);
});

test('cleaner: removeStyleAttributes should strip style attributes', async () => {
  const html = '<p style="color: red;">Hello</p>';
  const stripped = await removeStyleAttributes(html);
  
  assert.strictEqual(stripped.toLowerCase().includes('style="color: red;"'), false);
  assert.strictEqual(stripped.toLowerCase().includes('<p>hello</p>'), true);
});
