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

  // Handle Math Blocks: e.g. <div class="math-block" data-math="P(x) = y">
  turndownService.addRule('mathBlock', {
    filter: function (node) {
      if (!node.getAttribute || !node.getAttribute('data-math')) return false;
      const className = node.getAttribute('class') || '';
      if (/math-inline/i.test(className)) return false;
      if (/math-block/i.test(className)) return true;
      const tag = node.nodeName.toUpperCase();
      return ['DIV', 'P', 'SECTION', 'BLOCKQUOTE'].includes(tag);
    },
    replacement: function (content, node) {
      const math = (node.getAttribute('data-math') || '').trim();
      return '\n\n$$\n' + math + '\n$$\n\n';
    },
  });

  // Handle Math Inline: e.g. <span class="math-inline" data-math="a + b">
  turndownService.addRule('mathInline', {
    filter: function (node) {
      if (!node.getAttribute || !node.getAttribute('data-math')) return false;
      const className = node.getAttribute('class') || '';
      if (/math-block/i.test(className)) return false;
      if (/math-inline/i.test(className)) return true;
      const tag = node.nodeName.toUpperCase();
      return !['DIV', 'P', 'SECTION', 'BLOCKQUOTE'].includes(tag);
    },
    replacement: function (content, node) {
      const math = (node.getAttribute('data-math') || '').trim();
      return '$' + math + '$';
    },
  });

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
    },
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
