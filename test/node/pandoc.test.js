import { test } from 'node:test';
import assert from 'node:assert';
import { getConverter } from '../../src/converter.js';

test('pandoc: converter should convert HTML to Markdown', async () => {
  const converter = await getConverter('pandoc');
  const html = '<h1>Hello</h1>';
  const markdown = converter.convert(html);
  
  assert.strictEqual(markdown.includes('Hello'), true);
  // Pandoc usually adds its own flavor of Markdown
  assert.strictEqual(markdown.includes('#'), true);
});
