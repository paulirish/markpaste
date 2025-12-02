/**
 * converter.js
 * Handles conversion from HTML to Markdown.
 * Uses TurndownService (loaded via CDN in index.html).
 */


export function convertToMarkdown(html) {
  if (!window.TurndownService) {
    return 'Error: TurndownService not loaded.';
  }

  const turndownService = new window.TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });

  // Use GFM plugin if available
  if (window.turndownPluginGfm) {
    turndownService.use(window.turndownPluginGfm.gfm);
  }

  return turndownService.turndown(html);
}
