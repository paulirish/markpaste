import {cleanHTML, removeStyleAttributes} from './cleaner.js';
import {renderMarkdown} from './renderer.js';

/* bling.js + guaranteed and typed. Brand new in Nov 2025. */
/**
 * Guaranteed context.querySelector. Always returns an element or throws if nothing matches query.
 * @template {string} T
 * @param {T} query
 * @param {ParentNode=} context
 * @return {import('typed-query-selector/parser.js').ParseSelector<T, Element>}
 */
window.$ = function (query, context) {
  const result = (context || document).querySelector(query);
  if (result === null) {
    throw new Error(`query ${query} not found`);
  }
  return /** @type {import('typed-query-selector/parser.js').ParseSelector<T, Element>} */ (result);
};
/**
 * @template {string} T
 * @param {T} query
 * @param {ParentNode=} context
 * @return {NodeListOf<import('typed-query-selector/parser.js').ParseSelector<T, Element>>}
 */
window.$$ = (query, context) => (context || document).querySelectorAll(query);

Node.prototype.on = window.on = function (name, fn) {
  this.addEventListener(name, fn);
};
// @ts-ignore
NodeList.prototype.__proto__ = Array.prototype;
NodeList.prototype.on = function (name, fn) {
  this.forEach(elem => elem.on(name, fn));
};
// Bling'ed out.

const {$} = window;
const {$$} = window;

const inputArea = $('div#inputArea');
const outputCode = $('code#outputCode');
const htmlCode = $('code#htmlCode');
const copyBtn = $('button#copyBtn');
const themeToggle = $('button#themeToggle');
const cleanHtmlToggle = $('input#cleanHtmlToggle');
const converterSelector = $('fieldset#converterSelector');
const markdownTooltip = $('#markdown-tooltip');

// Setup Popover/Tooltip behavior
converterSelector.setAttribute('interestfor', 'markdown-tooltip');

let lastProcessedContent = '';
let converter;

async function init() {
  setupEventListeners();
  loadTheme();
  await updateConverter();
  processContent(inputArea.innerHTML);
}

function setupEventListeners() {
  inputArea.on('paste', handlePaste);

  inputArea.on('input', () => {
    lastProcessedContent = inputArea.innerHTML;
    processContent(lastProcessedContent);
  });

  copyBtn.on('click', copyToClipboard);

  themeToggle.on('click', toggleTheme);

  cleanHtmlToggle.on('change', () => {
    if (lastProcessedContent) {
      processContent(lastProcessedContent);
    }
  });

  converterSelector.on('change', async () => {
    await updateConverter();
    processContent(lastProcessedContent);
  });

  markdownTooltip.on('interest', async () => {
     const markdown = outputCode.textContent || '';
     await renderMarkdown(markdown, /** @type {HTMLElement} */ (markdownTooltip));
  });


  // Add a keydown event listener for scoped select all
  document.on('keydown', handleSelectAll);
}

async function updateConverter() {
  outputCode.textContent = 'Converting...';
  const selectedConverter = $('input[name="converter"]:checked').value;
  const {getConverter} = await import('./converter.js');
  converter = await getConverter(selectedConverter);
}

function handleSelectAll(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
    const activeElement = document.activeElement;
    if (activeElement) {
      const editorContainer = activeElement.closest('.editor-container');
      if (editorContainer) {
        e.preventDefault();
        const range = document.createRange();
        range.selectNodeContents(editorContainer);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
  }
}

function handlePaste(e) {
  e.preventDefault();

  const clipboardData = e.clipboardData;
  const pastedHtml = clipboardData.getData('text/html');
  const pastedText = clipboardData.getData('text/plain');

  const content = pastedHtml || pastedText;
  lastProcessedContent = content;
  processContent(content);

  inputArea.innerHTML = '';
  inputArea.setAttribute('placeholder', 'Pasted! Ready for more...');
  setTimeout(() => {
    inputArea.setAttribute('placeholder', 'Paste your rich text here...');
  }, 2000);
}

function processContent(html) {
  const selectedConverter = $('input[name="converter"]:checked').value;
  const shouldClean = cleanHtmlToggle.checked;

  const contentToConvert = shouldClean ? cleanHTML(html) : removeStyleAttributes(html);
  const markdown = converter.convert(contentToConvert);

  outputCode.textContent = markdown;
  console.log('DOM set to:', JSON.stringify(outputCode.textContent));

  htmlCode.textContent = formatHTML(contentToConvert);

  if (window.Prism) {
    window.Prism.highlightElement(outputCode);
    window.Prism.highlightElement(htmlCode);
  }
}

function formatHTML(html) {
  // Simple formatter for the HTML preview
  if (!html) return '';

  let formatted = '';
  const reg = /(>)(<)(\/*)/g;
  const xml = html.replace(reg, '$1\r\n$2$3');
  let pad = 0;

  xml.split('\r\n').forEach(node => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad != 0) {
        pad -= 1;
      }
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    let padding = '';
    for (let i = 0; i < pad; i++) {
      padding += '  ';
    }

    formatted += padding + node + '\r\n';
    pad += indent;
  });

  return formatted;
}

async function copyToClipboard() {
  const textToCopy = outputCode.textContent;
  const htmlToCopy = htmlCode.textContent;

  try {
    const items = {
      'text/plain': new Blob([textToCopy], {type: 'text/plain'}),
      'text/html': new Blob([htmlToCopy], {type: 'text/html'}),
    };
    const cpItem = new ClipboardItem(items);
    await navigator.clipboard.write([cpItem]);

    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Rich HTML and text Markdown both copied!`;
    copyBtn.classList.add('success');

    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.classList.remove('success');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

// Theme Management
function loadTheme() {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

init();
