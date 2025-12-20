import {cleanHTML, removeStyleAttributes} from './cleaner.js';
import {renderMarkdown} from './renderer.js';
import {getConverter} from './converter.js';

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
const htmlCode = $('code#htmlCode');
const copyBtn = $('button#copyBtn');
const themeToggle = $('button#themeToggle');
const cleanHtmlToggle = $('input#cleanHtmlToggle');

// View Toggle
const viewMarkdownBtn = $('button#viewMarkdownBtn');
const viewRenderedBtn = $('button#viewRenderedBtn');

// Output Elements
const outputs = {
  turndown: {
    code: $('code#outputCodeTurndown'),
    preview: $('div#renderPreviewTurndown'),
    pre: $('pre#outputPreTurndown'),
  },
  'to-markdown': {
    code: $('code#outputCodeToMarkdown'),
    preview: $('div#renderPreviewToMarkdown'),
    pre: $('pre#outputPreToMarkdown'),
  },
  pandoc: {
    code: $('code#outputCodePandoc'),
    preview: $('div#renderPreviewPandoc'),
    pre: $('pre#outputPrePandoc'),
  },
};

let lastProcessedContent = '';
const converters = {};
let currentView = 'markdown'; // 'markdown' or 'rendered'

async function init() {
  loadTheme();
  
  // Initialize all converters
  try {
    const [turndown, toMarkdown, pandoc] = await Promise.all([
      getConverter('turndown'),
      getConverter('to-markdown'),
      getConverter('pandoc')
    ]);
    converters.turndown = turndown;
    converters['to-markdown'] = toMarkdown;
    converters.pandoc = pandoc;
  } catch (e) {
    console.error("Failed to load converters", e);
  }

  setupEventListeners();
  
  // Initial process if there's content (e.g. from reload, though usually empty)
  if (inputArea.innerHTML) {
    lastProcessedContent = inputArea.innerHTML;
    processContent(lastProcessedContent);
  }
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

  viewMarkdownBtn.on('click', () => switchView('markdown'));
  viewRenderedBtn.on('click', () => switchView('rendered'));

  // Add a keydown event listener for scoped select all
  document.on('keydown', handleSelectAll);
}

function switchView(view) {
  currentView = view;
  
  if (view === 'markdown') {
    viewMarkdownBtn.classList.add('active');
    viewRenderedBtn.classList.remove('active');
    
    Object.values(outputs).forEach(out => {
      out.pre.classList.remove('hidden');
      out.preview.classList.add('hidden');
    });
  } else {
    viewRenderedBtn.classList.add('active');
    viewMarkdownBtn.classList.remove('active');
    
    Object.values(outputs).forEach(out => {
      out.pre.classList.add('hidden');
      out.preview.classList.remove('hidden');
    });
    
    // Render previews
    updateRenderedPreviews();
  }
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
  const shouldClean = cleanHtmlToggle.checked;
  const contentToConvert = shouldClean ? cleanHTML(html) : removeStyleAttributes(html);

  // Update HTML Preview
  htmlCode.textContent = formatHTML(contentToConvert);
  if (window.Prism) {
    window.Prism.highlightElement(htmlCode);
  }

  // Run all converters
  for (const [name, converter] of Object.entries(converters)) {
    if (converter) {
      try {
        const markdown = converter.convert(contentToConvert);
        outputs[name].code.textContent = markdown;
        if (window.Prism) {
          window.Prism.highlightElement(outputs[name].code);
        }
      } catch (err) {
        console.error(`Converter ${name} failed:`, err);
        outputs[name].code.textContent = `Error converting with ${name}: ${err.message}`;
      }
    }
  }

  if (currentView === 'rendered') {
    updateRenderedPreviews();
  }
}

async function updateRenderedPreviews() {
  for (const [name, out] of Object.entries(outputs)) {
    const markdown = out.code.textContent || '';
    await renderMarkdown(markdown, out.preview);
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
  const selectedRadio = $('input[name="converter"]:checked');
  const selectedName = selectedRadio ? selectedRadio.value : 'turndown';
  
  const textToCopy = outputs[selectedName].code.textContent;
  
  // For the "Rich HTML", we could either copy the source HTML 
  // OR the rendered HTML from the markdown. 
  // Given the button says "Rich HTML and text Markdown", usually this means 
  // putting the Rendered HTML (from markdown) into the clipboard so pasting into GDocs etc works.
  // But wait, the user might want the *Cleaned* HTML?
  // Usually "Rich HTML" in clipboard means the rendered representation.
  // Let's render it on the fly if needed or grab from preview.
  
  // Let's generate the HTML to copy from the markdown to ensure it matches the markdown.
  // We can reuse renderMarkdown logic but we need the string.
  // Actually renderMarkdown puts it in an element. 
  
  // Let's grab the HTML from the preview div if we can, or render it if it's empty.
  let htmlToCopy;
  
  // We can use the renderer to get the HTML string. 
  // Since renderMarkdown takes an element, let's just make a temp one if needed.
  const tempDiv = document.createElement('div');
  await renderMarkdown(textToCopy, tempDiv);
  htmlToCopy = tempDiv.innerHTML;

  try {
    const items = {
      'text/plain': new Blob([textToCopy], {type: 'text/plain'}),
      'text/html': new Blob([htmlToCopy], {type: 'text/html'}),
    };
    const cpItem = new ClipboardItem(items);
    await navigator.clipboard.write([cpItem]);

    // Visual feedback
    const originalText = copyBtn.innerHTML;
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied (${selectedName})!`;
    copyBtn.classList.add('success');

    setTimeout(() => {
      copyBtn.innerHTML = originalText;
      copyBtn.classList.remove('success');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    copyBtn.textContent = 'Copy failed';
    setTimeout(() => {
       copyBtn.innerHTML = originalText;
    }, 2000);
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
