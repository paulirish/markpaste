import {cleanHTML} from './cleaner.js';
import {convertToMarkdown} from './converter.js';


const inputArea = document.getElementById('input-area');
const outputPre = document.getElementById('output-pre');
const outputCode = document.getElementById('output-code');
const htmlPreview = document.getElementById('html-preview');
const htmlCode = document.getElementById('html-code');
const copyBtn = document.getElementById('copy-btn');
const themeToggle = document.getElementById('theme-toggle');
const cleanHtmlToggle = /** @type {HTMLInputElement} */ (document.getElementById('clean-html-toggle'));

let lastProcessedContent = '';

function init() {
  setupEventListeners();
  loadTheme();
}

function setupEventListeners() {
  inputArea.addEventListener('paste', handlePaste);

  inputArea.addEventListener('input', () => {
    processContent(inputArea.innerHTML);
  });

  copyBtn.addEventListener('click', copyToClipboard);

  themeToggle.addEventListener('click', toggleTheme);

  cleanHtmlToggle.addEventListener('change', () => {
    if (lastProcessedContent) {
      processContent(lastProcessedContent);
    }
  });

  // Add a keydown event listener for scoped select all
  document.addEventListener('keydown', handleSelectAll);
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
  const cleaned = cleanHTML(html);

  const markdown = convertToMarkdown(cleanHtmlToggle.checked ? cleaned : html);

  outputCode.textContent = markdown;

  if (cleanHtmlToggle.checked) {
    htmlCode.textContent = formatHTML(cleaned);
  } else {
    htmlCode.textContent = formatHTML(html);
  }

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
    copyBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
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
