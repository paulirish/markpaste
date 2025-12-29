/**
 * cleaner.js
 * Implements HTML cleaning logic similar to paste-html-subset.
 */

// Environment detection and DOM setup
let parseHTMLGlobal, documentGlobal, NodeGlobal;

if (typeof window !== 'undefined') {
  parseHTMLGlobal = html => {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  };
  documentGlobal = window.document;
  NodeGlobal = window.Node;
} else {
  // We are in Node.js
  const {parseHTML} = await import('linkedom');
  parseHTMLGlobal = html => {
    const fullHtml = `<!DOCTYPE html><html><body>${html}</body></html>`;
    return parseHTML(fullHtml).document;
  };
  const linkedom = parseHTML('<html><body></body></html>');
  documentGlobal = linkedom.document;
  NodeGlobal = linkedom.Node;
}

const ALLOWED_TAGS = [
  'P',
  'STRONG',
  'B',
  'EM',
  'I',
  'BLOCKQUOTE',
  'CODE',
  'PRE',
  'A',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'UL',
  'OL',
  'LI',
  'DL',
  'DT',
  'DD',
  'BR',
  'HR',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TH',
  'TD',
];

const ALLOWED_ATTRIBUTES = {
  A: ['href', 'title', 'target'],
  IMG: ['src', 'alt', 'title', 'width', 'height'],
};

export function cleanHTML(html) {
  const doc = parseHTMLGlobal(html);
  const sourceBody = doc.body;

  // Create a new document for the cleaned output
  let targetBody;
  if (documentGlobal.implementation && documentGlobal.implementation.createHTMLDocument) {
    const cleanDoc = documentGlobal.implementation.createHTMLDocument('clean');
    targetBody = cleanDoc.body;
  } else {
    // Fallback for linkedom or other environments
    targetBody = documentGlobal.createElement('body');
  }

  // Process the input body
  processNode(sourceBody, targetBody);

  return targetBody.innerHTML;
}

function processNode(sourceNode, targetParent) {
  // Handle text nodes
  if (sourceNode.nodeType === NodeGlobal.TEXT_NODE) {
    if (sourceNode.textContent) {
      targetParent.appendChild(documentGlobal.createTextNode(sourceNode.textContent));
    }
    return;
  }

  // Handle element nodes
  if (sourceNode.nodeType === NodeGlobal.ELEMENT_NODE) {
    const tagName = sourceNode.tagName.toUpperCase();

    // MDN specific cleaning: remove copy button and play links
    if (sourceNode.classList && sourceNode.classList.contains('mdn-copy-button')) {
      return;
    }

    const href = sourceNode.getAttribute('href');
    if (tagName === 'A' && href && href.startsWith('https://developer.mozilla.org/en-US/play')) {
      return;
    }

    if (ALLOWED_TAGS.includes(tagName)) {
      // Special case: UL/OL without LI children (often a bug in clipboard content)
      // This tweak should only happen when this element is the FIRST element in the received DOM.
      if (tagName === 'UL' || tagName === 'OL') {
        const parent = sourceNode.parentNode;
        const isFirstElementInBody =
          parent && parent.tagName === 'BODY' && Array.from(parent.children).find(c => !['META', 'STYLE'].includes(c.tagName.toUpperCase())) === sourceNode;

        if (isFirstElementInBody) {
          const hasLiChild = Array.from(sourceNode.childNodes).some(
            child => child.nodeType === NodeGlobal.ELEMENT_NODE && child.tagName.toUpperCase() === 'LI'
          );
          if (!hasLiChild) {
            // Unwrap: process children directly into targetParent
            Array.from(sourceNode.childNodes).forEach(child => {
              processNode(child, targetParent);
            });
            return;
          }
        }
      }

      const newElement = documentGlobal.createElement(tagName);

      // Copy allowed attributes
      if (ALLOWED_ATTRIBUTES[tagName]) {
        ALLOWED_ATTRIBUTES[tagName].forEach(attr => {
          if (sourceNode.hasAttribute(attr)) {
            newElement.setAttribute(attr, sourceNode.getAttribute(attr));
          }
        });
      }

      targetParent.appendChild(newElement);

      // Process children
      Array.from(sourceNode.childNodes).forEach(child => {
        processNode(child, newElement);
      });
    } else {
      const DANGEROUS_TAGS = ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'];

      if (!DANGEROUS_TAGS.includes(tagName) || tagName === 'BODY' || tagName === 'HTML') {
        // Unwrap safe-ish tags (like div, span, body, html)
        Array.from(sourceNode.childNodes).forEach(child => {
          processNode(child, targetParent);
        });
      }
    }
  }
}

export function removeStyleAttributes(html) {
  const doc = parseHTMLGlobal(html);
  const body = doc.body;
  const allElements = body.querySelectorAll('*');
  for (let i = 0; i < allElements.length; i++) {
    allElements[i].removeAttribute('style');
  }
  return body.innerHTML;
}
