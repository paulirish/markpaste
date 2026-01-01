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
const loadingOverlay = $('div#loadingOverlay');

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
  pandoc: {
    code: $('code#outputCodePandoc'),
    preview: $('div#renderPreviewPandoc'),
    pre: $('pre#outputPrePandoc'),
  },
};

let lastProcessedContent = '';
const converters = {};
const convertersPromise = (async () => {
  const names = ['turndown', 'pandoc'];
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
    await processContent(lastProcessedContent);
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

  inputArea.on('input', async () => {
    lastProcessedContent = inputArea.innerHTML;
    if (lastProcessedContent.length > 10000) {
      showLoading();
      setTimeout(async () => {
        try {
          await processContent(lastProcessedContent);
        } finally {
          hideLoading();
        }
      }, 10);
    } else {
      await processContent(lastProcessedContent);
    }
  });

  copyBtn.on('click', copyToClipboard);

  themeToggle.on('click', toggleTheme);

  cleanHtmlToggle.on('change', async () => {
    if (lastProcessedContent) {
      if (lastProcessedContent.length > 5000) {
        showLoading();
        setTimeout(async () => {
          try {
            await processContent(lastProcessedContent);
          } finally {
            hideLoading();
          }
        }, 10);
      } else {
        await processContent(lastProcessedContent);
      }
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

function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

async function handlePaste(e) {
  e.preventDefault();

  const clipboardData = e.clipboardData;
  const pastedHtml = clipboardData.getData('text/html');
  const pastedText = clipboardData.getData('text/plain');

  showLoading();

  await convertersPromise;

  const isMarkdown = isProbablyMarkdown(pastedText, !!pastedHtml);
  const content = isMarkdown ? pastedText : (pastedHtml || pastedText);
  lastProcessedContent = content;

  // Use setTimeout to allow UI to update before blocking the thread with conversion
  setTimeout(async () => {
    try {
      await processContent(content, isMarkdown);
    } finally {
      hideLoading();
    }

    // Reset scroll position for all pre elements
    $$('pre').forEach(pre => pre.scrollTop = 0);
  }, 10);

  inputArea.innerHTML = '';
  inputArea.setAttribute('placeholder', 'Pasted! Ready for more...');
  setTimeout(() => {
    inputArea.setAttribute('placeholder', 'Paste your rich text here...');
  }, 2000);
}

function isProbablyMarkdown(text, hasHtml) {
  if (hasHtml) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith('<')) return false;
  return true;
}

async function processContent(content, isMarkdown = null) {
  let htmlToShow;
  let markdownResults;

  if (isMarkdown === null) {
    isMarkdown = isProbablyMarkdown(content, false);
  }

  if (isMarkdown) {
    // If it's markdown, the "results" are just the content itself.
    markdownResults = {
      turndown: content,
      pandoc: content,
    };
    // For the HTML preview, we render the markdown.
    const tempDiv = document.createElement('div');
    await renderMarkdown(content, tempDiv);
    htmlToShow = tempDiv.innerHTML;
  } else {
    const shouldClean = cleanHtmlToggle.checked;
    const contentToConvert = shouldClean ? cleanHTML(content) : removeStyleAttributes(content);
    htmlToShow = contentToConvert;
    markdownResults = runConverters(contentToConvert);
  }

  // Update HTML Preview
  htmlCode.textContent = formatHTML(htmlToShow);
  if (window.Prism) {
    window.Prism.highlightElement(htmlCode);
  }

  // Update UI with results
  for (const [name, markdown] of Object.entries(markdownResults)) {
    if (outputs[name]) {
      outputs[name].code.textContent = markdown;
      if (window.Prism) {
        window.Prism.highlightElement(outputs[name].code);
      }
    }
  }

  // Fire and forget the diff check
  if (!isMarkdown) {
    checkDiffs(markdownResults);
  }

  if (currentView === 'rendered') {
    updateRenderedPreviews();
  }
}

function runConverters(htmlContent) {
  const results = {};
  for (const [name, converter] of Object.entries(converters)) {
    if (converter) {
      try {
        results[name] = converter.convert(htmlContent);
      } catch (err) {
        console.error(`Converter ${name} failed:`, err);
        results[name] = `Error converting with ${name}: ${err.message}`;
      }
    }
  }
  return results;
}

async function checkDiffs(results) {
  // We need both to be present and not error messages
  if (!results.turndown || !results.pandoc) return;
  if (results.turndown.startsWith('Error converting') || results.pandoc.startsWith('Error converting')) return;

  const tDiv = document.createElement('div');
  const pDiv = document.createElement('div');

  await renderMarkdown(results.turndown, tDiv);
  await renderMarkdown(results.pandoc, pDiv);

  const turndownHtml = tDiv.innerHTML;
  const pandocHtml = pDiv.innerHTML;
  tDiv.innerHTML = pDiv.innerHTML = '';

  if (turndownHtml !== pandocHtml) {
    let firstDiff = 0;
    const maxLength = Math.max(turndownHtml.length, pandocHtml.length);
    while (firstDiff < maxLength && turndownHtml[firstDiff] === pandocHtml[firstDiff]) {
      firstDiff++;
    }

    console.group('Converter Diff Discrepancy');
    console.log(`First difference at index ${firstDiff}:`);
    console.log(`  Turndown: "...${turndownHtml.substring(firstDiff, firstDiff + 40)}..."`);
    console.log(`  Pandoc:   "...${pandocHtml.substring(firstDiff, firstDiff + 40)}..."`);
    console.groupEnd();
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
