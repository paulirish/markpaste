import { getTurndownConverter as getTurndownBrowser, getToMarkdownConverter as getToMarkdownBrowser, getPandocConverter as getPandocBrowser } from './converter-browser.js';

const isBrowser = typeof window !== 'undefined';

async function getTurndownConverter() {
  if (isBrowser) {
    return getTurndownBrowser();
  } else {
    const TurndownService = (await import('turndown')).default;
    const { gfm } = await import('turndown-plugin-gfm');
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
    });
    if (gfm) {
      turndownService.use(gfm);
    }
    return {
      convert: html => turndownService.turndown(html),
    };
  }
}

async function getToMarkdownConverter() {
  if (isBrowser) {
    return getToMarkdownBrowser();
  } else {
    const toMarkdown = (await import('to-markdown')).default;
    return {
      convert: html => toMarkdown(html),
    };
  }
}

async function getPandocConverter() {
  if (isBrowser) {
    return getPandocBrowser();
  } else {
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