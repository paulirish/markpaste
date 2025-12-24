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

async function getPandocConverter() {
  const pandocModule = await import('./pandoc.js');
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
  pandoc: getPandocConverter,
};

export async function getConverter(name) {
  if (!converters[name]) {
    const available = Object.keys(converters).join(', ');
    throw new Error(`Unknown converter: ${name}. Available converters: ${available}`);
  }
  return converters[name]();
}
