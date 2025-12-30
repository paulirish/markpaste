/**
 * markpaste.js
 * MarkPaste Library Entry Point
 */

import {cleanHTML, removeStyleAttributes} from './cleaner.js';
import {getConverter} from './converter.js';

/**
 * Converts HTML to Markdown using the specified converter.
 * @param {string} html The HTML string to convert.
 * @param {Object} options Configuration options.
 * @param {string} [options.converter='turndown'] The converter to use ('turndown', 'pandoc').
 * @param {boolean} [options.clean=true] Whether to clean the HTML before conversion.
 * @returns {Promise<string>} The resulting Markdown string.
 */
export async function convert(html, options = {}) {
  const {converter: converterName = 'turndown', clean = true} = options;

  const cleanedHtml = clean ? cleanHTML(html) : removeStyleAttributes(html);
  const converter = await getConverter(converterName);

  return await converter.convert(cleanedHtml);
}

export {cleanHTML, removeStyleAttributes, getConverter};
