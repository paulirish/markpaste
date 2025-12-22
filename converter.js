/**
 * converter.js
 * Handles conversion from HTML to Markdown.
 * Dynamically loads and uses different conversion libraries.
 */

const isBrowser = typeof window !== 'undefined';

async function getTurndownConverter() {
  let TurndownService, turndownPluginGfm;
  if (isBrowser) {
    const turndownMod = await import('turndown');
    TurndownService = turndownMod.default;
    const gfmMod = await import('turndown-plugin-gfm');
    turndownPluginGfm = gfmMod.gfm;
  } else {
    TurndownService = (await import('turndown')).default;
    turndownPluginGfm = (await import('turndown-plugin-gfm')).gfm;
  }

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });

  if (turndownPluginGfm) {
    turndownService.use(turndownPluginGfm);
  }

  return {
    convert: html => turndownService.turndown(html),
  };
}

async function getToMarkdownConverter() {
  let toMarkdown;
  if (isBrowser) {
    const mod = await import('to-markdown');
    toMarkdown = mod.default || window.toMarkdown;
  } else {
    toMarkdown = (await import('to-markdown')).default;
  }
  
  return {
    convert: html => toMarkdown(html),
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
    dispose: () => {
      pandocModule.dispose();
    }
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
