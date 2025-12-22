import { processNode } from './cleaner-core.js';

export function cleanHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sourceBody = doc.body;

  const targetBody = document.createElement('body');
  
  const processFn = (src, tgt) => processNode(src, tgt, document, Node, processFn);
  processFn(sourceBody, targetBody);

  return targetBody.innerHTML;
}

export function removeStyleAttributes(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  const allElements = body.querySelectorAll('*');
  for (let i = 0; i < allElements.length; i++) {
    allElements[i].removeAttribute('style');
  }
  return body.innerHTML;
}