import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import toMarkdown from 'to-markdown';

export async function getTurndownConverter() {
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

export async function getToMarkdownConverter() {
  return {
    convert: html => toMarkdown(html),
  };
}

export async function getPandocConverter() {
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
