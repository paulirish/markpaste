import { test } from 'node:test';
import assert from 'node:assert';
import { convert } from '../../src/markpaste.js';

test('library: convert should use turndown by default', async () => {
  const html = '<h1>Hello</h1>';
  const markdown = await convert(html);
  assert.strictEqual(markdown.trim(), '# Hello');
});

test('library: convert should support pandoc', async () => {
  const html = '<p>Hello <b>World</b></p>';
  const markdown = await convert(html, { converter: 'pandoc' });
  assert.strictEqual(markdown.includes('Hello'), true);
  assert.strictEqual(markdown.includes('World'), true);
});

test('library: convert should support disabling cleaning', async () => {
  const html = '<div style="color: red;"><p>Hello</p></div>';
  // If clean is false, it uses removeStyleAttributes which unwraps but might keep some structure
  const markdown = await convert(html, { clean: false });
  assert.strictEqual(markdown.includes('Hello'), true);
});
