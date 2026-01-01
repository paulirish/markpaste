import {test} from 'node:test';
import assert from 'node:assert';
import {convert} from '../../src/index.js';

test('library: convert should use turndown by default', async () => {
  const html = '<h1>Hello</h1>';
  const markdown = await convert(html);
  assert.strictEqual(markdown.trim(), '# Hello');
});

test('library: convert should support pandoc', async () => {
  const html = '<p>Hello <b>World</b></p>';
  const markdown = await convert(html, {converter: 'pandoc'});
  assert.strictEqual(markdown.includes('Hello'), true);
  assert.strictEqual(markdown.includes('World'), true);
});

test('library: convert should support disabling cleaning', async () => {
  const html = '<div style="color: red;"><p>Hello</p></div>';
  // If clean is false, it uses removeStyleAttributes which unwraps but might keep some structure
  const markdown = await convert(html, {clean: false});
  assert.strictEqual(markdown.includes('Hello'), true);
});

test('library: convert should short-circuit if markdown is detected', async () => {
  const markdownInput = '# Already Markdown\n\n- item';
  const result = await convert(markdownInput);
  assert.strictEqual(result, markdownInput);
});

test('library: convert should NOT short-circuit if isMarkdown: false is passed', async () => {
  const input = '# Not Markdown'; // Looks like MD, but we force it not to be
  const result = await convert(input, {isMarkdown: false});
  // Turndown escapes # if it's not a real header
  assert.strictEqual(result.trim(), '\\# Not Markdown');
});
