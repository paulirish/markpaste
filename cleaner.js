import { cleanHTML as browserCleanHTML, removeStyleAttributes as browserRemoveStyleAttributes } from './cleaner-browser.js';

const isBrowser = typeof window !== 'undefined';

export async function cleanHTML(html) {
  if (isBrowser) {
    return browserCleanHTML(html);
  } else {
    const { cleanHTML: nodeCleanHTML } = await import('./cleaner-node.js');
    return nodeCleanHTML(html);
  }
}

export async function removeStyleAttributes(html) {
  if (isBrowser) {
    return browserRemoveStyleAttributes(html);
  } else {
    const { removeStyleAttributes: nodeRemoveStyleAttributes } = await import('./cleaner-node.js');
    return nodeRemoveStyleAttributes(html);
  }
}
