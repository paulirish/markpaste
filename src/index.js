/**
 * index.js
 * MarkPaste Library Entry Point (Node.js)
 */

import {cleanHTML, removeStyleAttributes} from './cleaner.js';
import {getConverter} from './converter.js';

/**
 * Converts HTML to Markdown using the specified converter.
 * @param {string} input The HTML (or Markdown) string to convert.
 * @param {Object} options Configuration options.
 * @param {string} [options.converter='turndown'] The converter to use ('turndown', 'pandoc').
 * @param {boolean} [options.clean=true] Whether to clean the HTML before conversion.
 * @param {boolean} [options.isMarkdown] Force treatment as markdown (skipping conversion).
 * @returns {Promise<string>} The resulting Markdown string.
 */
export async function convert(input, options = {}) {
  const {converter: converterName = 'turndown', clean = true, isMarkdown: forcedIsMarkdown} = options;

  const isMarkdown = forcedIsMarkdown !== undefined ? forcedIsMarkdown : isProbablyMarkdown(input);

  if (isMarkdown) {
    return input;
  }

  const cleanedHtml = clean ? await cleanHTML(input) : await removeStyleAttributes(input);
  const converter = await getConverter(converterName);

  return converter.convert(cleanedHtml);
}

/**
 * Heuristic to detect if a string is likely Markdown instead of HTML.
 * @param {string} text
 * @param {boolean} [hasHtmlFlavor=false] If we know for a fact there was an HTML flavor (e.g. from clipboard)
 * @returns {boolean}
 */
export function isProbablyMarkdown(text, hasHtmlFlavor = false) {
  if (hasHtmlFlavor) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) return false;
  return true;
}

export {cleanHTML, removeStyleAttributes, getConverter};
