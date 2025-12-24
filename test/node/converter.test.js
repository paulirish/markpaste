import { test } from 'node:test';
import assert from 'node:assert';
import { getConverter } from '../../src/converter.js';

test('converter: turndown should convert HTML to Markdown', async () => {
  const converter = await getConverter('turndown');
  const html = '<h1>Hello</h1>';
  const markdown = converter.convert(html);
  assert.strictEqual(markdown.trim(), '# Hello');
});

test('converter: to-markdown should convert HTML to Markdown', async () => {
  const converter = await getConverter('to-markdown');
  const html = '<h1>Hello</h1>';
  const markdown = converter.convert(html);
  // to-markdown might output differently but should contain the text
  assert.strictEqual(markdown.includes('Hello'), true);
});

test('converter: unknown converter should throw error', async () => {
  await assert.rejects(async () => {
    await getConverter('non-existent');
  }, {
    message: 'Unknown converter: non-existent. Available converters: turndown, to-markdown, pandoc'
  });
});
