import {test} from 'node:test';
import assert from 'node:assert';
import {getConverter} from '../../src/converter.js';

test('converter: turndown should convert HTML to Markdown', async () => {
  const converter = await getConverter('turndown');
  const html = '<h1>Hello</h1>';
  const markdown = converter.convert(html);
  assert.strictEqual(markdown.trim(), '# Hello');
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

test('converter: turndown should convert math-block and math-inline correctly', async () => {
  const converter = await getConverter('turndown');
  
  // Math block
  const blockHtml = '<div class="math-block animating" data-math="P(\\text{Unknown} \\mid \\mathbf{x}) = 1">xxx</div>';
  const blockMarkdown = converter.convert(blockHtml);
  assert.strictEqual(blockMarkdown.trim(), '$$\nP(\\text{Unknown} \\mid \\mathbf{x}) = 1\n$$');
  
  // Math inline
  const inlineHtml = '<span class="math-inline" data-math="d(\\mathbf{x}, \\boldsymbol{\\mu}_k) = 2">xxx</span>';
  const inlineMarkdown = converter.convert(inlineHtml);
  assert.strictEqual(inlineMarkdown.trim(), '$d(\\mathbf{x}, \\boldsymbol{\\mu}_k) = 2$');
});

