/**
 * cleaner.js
 * Implements HTML cleaning logic similar to paste-html-subset.
 */

const ALLOWED_TAGS = [
    'P', 'STRONG', 'B', 'EM', 'I', 'BLOCKQUOTE', 'CODE', 'PRE',
    'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'UL', 'OL', 'LI', 'DL', 'DT', 'DD', 'BR', 'HR'
];

const ALLOWED_ATTRIBUTES = {
    'A': ['href', 'title', 'target'],
    'IMG': ['src', 'alt', 'title', 'width', 'height'] // Optional, but good to have
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
        if (sourceNode.textContent.trim()) {
            targetParent.appendChild(document.createTextNode(sourceNode.textContent));
        }
        return;
    }

    // Handle element nodes
    if (sourceNode.nodeType === Node.ELEMENT_NODE) {
        const tagName = sourceNode.tagName;

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
            // If tag is not allowed, unwrap it (process children and append to current parent)
            // Special case: if it's a block element being unwrapped into an inline context, 
            // we might want to add a space or break, but for now simple unwrapping.
            Array.from(sourceNode.childNodes).forEach(child => {
                processNode(child, targetParent);
            });
        }
    }
}
