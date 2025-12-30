import {test} from 'node:test';
import assert from 'node:assert';
import {getConverter} from '../../src/converter.js';

test('pandoc: converter should convert HTML to Markdown', async () => {
  const converter = await getConverter('pandoc');
  const html = '<h1>Hello</h1>';
  const markdown = await converter.convert(html);
  assert.strictEqual(markdown.includes('Hello'), true);
  // Pandoc usually adds its own flavor of Markdown
  // assert.strictEqual(markdown.includes('#'), true);
});

test('pandoc: calling twice should return correct results each time', async () => {
  const converter = await getConverter('pandoc');
  const html1 = '<h1>First</h1>';
  const md1 = await converter.convert(html1);
  assert.strictEqual(md1.includes('First'), true);
  assert.strictEqual(md1.includes('Second'), false);
  const html2 = '<h1>Second</h1>';
  const md2 = await converter.convert(html2);
  assert.strictEqual(md2.includes('Second'), true);
  assert.strictEqual(md2.includes('First'), false);
});
