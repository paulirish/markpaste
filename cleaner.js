/**
 * cleaner.js
 * Implements HTML cleaning logic similar to paste-html-subset.
 */

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
];

const ALLOWED_ATTRIBUTES = {
  A: ['href', 'title', 'target'],
  IMG: ['src', 'alt', 'title', 'width', 'height'], // Optional, but good to have
};

export function cleanHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Create a new document for the cleaned output
  const cleanDoc = document.implementation.createHTMLDocument('clean');
  const body = cleanDoc.body;

  // Process the input body
  processNode(doc.body, body);

  return body.innerHTML;
}

function processNode(sourceNode, targetParent) {
  // Handle text nodes
  if (sourceNode.nodeType === Node.TEXT_NODE) {
    if (sourceNode.textContent) {
      targetParent.appendChild(document.createTextNode(sourceNode.textContent));
    }
    return;
  }

  // Handle element nodes
  if (sourceNode.nodeType === Node.ELEMENT_NODE) {
    const tagName = sourceNode.tagName.toUpperCase();

    if (ALLOWED_TAGS.includes(tagName)) {
      const newElement = document.createElement(tagName);

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
      // If tag is not allowed, check if we should unwrap it or drop it.
      // For safety, we should drop dangerous tags like SCRIPT, STYLE, IFRAME, OBJECT, EMBED, etc.
      // But for "paste-html-subset" behavior, we usually unwrap structural tags (div, span)
      // and drop dangerous ones.

      const DANGEROUS_TAGS = ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META'];

      if (!DANGEROUS_TAGS.includes(tagName)) {
        // Unwrap safe-ish tags (like div, span)
        Array.from(sourceNode.childNodes).forEach(child => {
          processNode(child, targetParent);
        });
      }
      // If dangerous, do nothing (drop it and its children)
    }
  }
}

export function removeStyleAttributes(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const allElements = doc.body.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    allElements[i].removeAttribute('style');
  }
  return doc.body.innerHTML;
}
