/**
 * converter.js
 * Handles conversion from HTML to Markdown.
 * Dynamically loads and uses different conversion libraries.
 */

async function getTurndownConverter() {
  if (!window.TurndownService) {
    // Basic script loader
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/turndown/dist/turndown.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/turndown-plugin-gfm/dist/turndown-plugin-gfm.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  const turndownService = new window.TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });

  if (window.turndownPluginGfm) {
    turndownService.use(window.turndownPluginGfm.gfm);
  }

  return {
    convert: html => turndownService.turndown(html),
  };
}

async function getToMarkdownConverter() {
  if (!window.toMarkdown) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/to-markdown/dist/to-markdown.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return {
    convert: html => window.toMarkdown(html),
  };
}

async function getPandocConverter() {
  const pandocModule = await import('./pandoc-built/index.js');
  return {
    convert: html => {
      const args = '--from html --to gfm --no-highlight --wrap=preserve';
      const markdown = pandocModule.pandoc(args, html);
      return markdown;
    },
  };
}

const converters = {
  turndown: getTurndownConverter,
  'to-markdown': getToMarkdownConverter,
  pandoc: getPandocConverter,
};

export async function getConverter(name) {
  if (!converters[name]) {
    throw new Error(`Unknown converter: ${name}`);
  }
  return converters[name]();
}
