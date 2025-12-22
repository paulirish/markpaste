import { parseHTML } from 'linkedom';
import { processNode } from './cleaner-core.js';

let linkedom;
function getLinkedom() {
  if (!linkedom) {
    linkedom = parseHTML('<html><body></body></html>');
  }
  return linkedom;
}

export function cleanHTML(html) {
  const { document, Node } = getLinkedom();
  const fullHtml = `<!DOCTYPE html><html><body>${html}</body></html>`;
  const doc = parseHTML(fullHtml).document;
  const sourceBody = doc.body;

  const targetBody = document.createElement('body');
  
  const processFn = (src, tgt) => processNode(src, tgt, document, Node, processFn);
  processFn(sourceBody, targetBody);

  return targetBody.innerHTML;
}

export function removeStyleAttributes(html) {
  const fullHtml = `<!DOCTYPE html><html><body>${html}</body></html>`;
  const { document } = parseHTML(fullHtml);
  const body = document.body;
  const allElements = body.querySelectorAll('*');
  for (let i = 0; i < allElements.length; i++) {
    allElements[i].removeAttribute('style');
  }
  return body.innerHTML;
}