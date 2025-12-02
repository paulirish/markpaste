/**
 * converter.js
 * Handles conversion from HTML to Markdown.
 * Uses TurndownService (loaded via CDN in index.html).
 */


export function convertToMarkdown(html) {
  // @ts-ignore
  if (!window.TurndownService) {
    return 'Error: TurndownService not loaded.';
  }

  // @ts-ignore
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });

  // Use GFM plugin if available
  // @ts-ignore
  if (window.turndownPluginGfm) {
    // @ts-ignore
    turndownService.use(window.turndownPluginGfm.gfm);
  }

  return turndownService.turndown(html);
}
