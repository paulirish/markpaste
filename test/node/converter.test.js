import {test} from 'node:test';
import assert from 'node:assert';
import {getConverter} from '../../src/converter.js';

test('converter: turndown should convert HTML to Markdown', async () => {
  const converter = await getConverter('turndown');
  const html = '<h1>Hello</h1>';
  const markdown = await converter.convert(html);
  assert.strictEqual(markdown.trim(), '# Hello');
});

test('converter: pandoc should convert HTML to Markdown', async () => {
  const converter = await getConverter('pandoc');
  const html = '<h1>Hello</h1>';
  const markdown = await converter.convert(html);
  assert.strictEqual(markdown.includes('Hello'), true);
  assert.strictEqual(markdown.includes('#'), true);
});

test('converter: unknown converter should throw error', async () => {
  await assert.rejects(
    async () => {
      await getConverter('non-existent');
    },
    {
      message: 'Unknown converter: non-existent. Available converters: turndown, pandoc',
    }
  );
});
