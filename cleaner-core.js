/**
 * cleaner-core.js
 * Common cleaning logic.
 */

export const ALLOWED_TAGS = [
  'P', 'STRONG', 'B', 'EM', 'I', 'BLOCKQUOTE', 'CODE', 'PRE', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'UL', 'OL', 'LI', 'DL', 'DT', 'DD', 'BR', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
];

export const ALLOWED_ATTRIBUTES = {
  A: ['href', 'title', 'target'],
  IMG: ['src', 'alt', 'title', 'width', 'height'],
};

export function processNode(sourceNode, targetParent, documentGlobal, NodeGlobal, processNodeFn) {
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
    if (
      tagName === 'A' &&
      href && href.startsWith('https://developer.mozilla.org/en-US/play')
    ) {
      return;
    }

    if (ALLOWED_TAGS.includes(tagName)) {
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
        processNodeFn(child, newElement);
      });
    } else {
      const DANGEROUS_TAGS = ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'];

      if (!DANGEROUS_TAGS.includes(tagName) || tagName === 'BODY' || tagName === 'HTML') {
        // Unwrap safe-ish tags (like div, span, body, html)
        Array.from(sourceNode.childNodes).forEach(child => {
          processNodeFn(child, targetParent);
        });
      }
    }
  }
}
