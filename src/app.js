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

const {$, $$ } = window;

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
const convertersPromise = (async () => {
  const names = ['turndown', 'to-markdown', 'pandoc'];
  for (const name of names) {
    try {
      converters[name] = await getConverter(name);
    } catch (e) {
      console.error(`Failed to load converter: ${name}`, e);
    }
  }
})();

let currentView = 'markdown'; // 'markdown' or 'rendered'

async function init() {

  setupEventListeners();

  loadTheme();

  // Initialize all converters
  await convertersPromise;

  // Initial process if there's content (e.g. from reload, though usually empty)
  if (inputArea.innerHTML) {
    lastProcessedContent = inputArea.innerHTML;
    processContent(lastProcessedContent);
  }
}

let idleDetectorInitialized = false;

async function startIdleDetector() {
  if (idleDetectorInitialized) return;
  idleDetectorInitialized = true;

  // Setup Idle Detection
  if ('IdleDetector' in window) {
    try {
      const controller = new AbortController();
      const signal = controller.signal;

      const idleDetector = new IdleDetector();
      idleDetector.addEventListener('change', () => {
        const userState = idleDetector.userState;
        const screenState = idleDetector.screenState;
        console.log(`Idle change: ${userState}, ${screenState}`);

        if (userState === 'idle') {
          // Unload pandoc if it exists
          if (converters.pandoc) {
             console.log('User is idle. Unloading pandoc module to free memory.');
             if (converters.pandoc.dispose) {
               converters.pandoc.dispose();
             }
             delete converters.pandoc;
          }
        }
      });

      // 10 minutes = 600,000 ms
      idleDetector.start({
        threshold: 600000,
        signal,
      }).catch(err => {
         console.warn('Idle detection start failed:', err);
      });

    } catch (err) {
      console.warn('Idle detection setup failed:', err);
    }
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

async function handlePaste(e) {
  e.preventDefault();

  const clipboardData = e.clipboardData;
  const pastedHtml = clipboardData.getData('text/html');
  const pastedText = clipboardData.getData('text/plain');

  await convertersPromise;

  const content = pastedHtml || pastedText;
  lastProcessedContent = content;
  processContent(content);

  // Reset scroll position for all pre elements
  $$('pre').forEach(pre => pre.scrollTop = 0);

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
  startIdleDetector();

  const selectedRadio = $('input[name="converter"]:checked');
  const selectedName = selectedRadio ? selectedRadio.value : 'turndown';

  const textToCopy = outputs[selectedName].code.textContent;

  // Let's grab the HTML from the preview div if we can, or render it if it's empty.
  let htmlToCopy;

  const tempDiv = document.createElement('div');
  await renderMarkdown(textToCopy, tempDiv);
  htmlToCopy = tempDiv.innerHTML;

  // Store original text for restoration
  const originalText = copyBtn.textContent;

  try {
    const items = {
      'text/plain': new Blob([textToCopy], {type: 'text/plain'})
    };
    if (htmlToCopy) {
      items['text/html'] = new Blob([htmlToCopy], {type: 'text/html'});
    }
    const cpItem = new ClipboardItem(items);
    await navigator.clipboard.write([cpItem]);

    // Visual feedback
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

init();
