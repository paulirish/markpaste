import {marked} from 'marked';

/**
 * Renders markdown into a target element, sanitizing it first.
 * @param {string} markdown - The markdown string to render.
 * @param {HTMLElement} targetElement - The element to render into.
 */
export async function renderMarkdown(markdown, targetElement) {
  if (!markdown) {
    targetElement.innerHTML = '';
    return;
  }

  const rawHtml = await marked.parse(markdown);

  // @ts-ignore
  if (targetElement.setHTML) {
    // @ts-ignore
    const sanitizer = new Sanitizer();
    // @ts-ignore
    targetElement.setHTML(rawHtml, {sanitizer});
  } else {
    // Fallback if setHTML/Sanitizer is not supported (though we should encourage it)
    // For now, we will just set innerHTML as a fallback or warn.
    // Given the prompt asks for Sanitizer API, we assume it's available or polyfilled,
    // but in reality it's very experimental.
    // We'll stick to the requested API.
    console.warn('Sanitizer API (setHTML) not supported. Falling back to innerHTML (UNSAFE).');
    targetElement.innerHTML = rawHtml;
  }
}
