import { cleanHTML } from './cleaner.js';
import { convertToMarkdown } from './converter.js';

// DOM Elements
const inputArea = document.getElementById('input-area');
const outputPre = document.getElementById('output-pre');
const outputCode = document.getElementById('output-code');
const htmlPreview = document.getElementById('html-preview');
const htmlCode = document.getElementById('html-code');
const copyBtn = document.getElementById('copy-btn');
const themeToggle = document.getElementById('theme-toggle');
const cleanHtmlToggle = document.getElementById('clean-html-toggle');

// State
let lastProcessedContent = '';

// Initialize
function init() {
    setupEventListeners();
    loadTheme();
}

function setupEventListeners() {
    // Paste Event
    inputArea.addEventListener('paste', handlePaste);
    
    // Input Input (for manual typing/editing)
    inputArea.addEventListener('input', () => {
        // For manual input, we treat it as the content to process
        // But we don't clear it like paste
        processContent(inputArea.innerHTML);
    });

    // Copy Button
    copyBtn.addEventListener('click', copyToClipboard);

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Clean HTML Toggle
    cleanHtmlToggle.addEventListener('change', () => {
        // Re-process the last content to update the view
        if (lastProcessedContent) {
            processContent(lastProcessedContent);
        }
    });
}

function handlePaste(e) {
    e.preventDefault();
    
    // Get pasted data via clipboard API
    const clipboardData = e.clipboardData || window.clipboardData;
    const pastedHtml = clipboardData.getData('text/html');
    const pastedText = clipboardData.getData('text/plain');

    // Prefer HTML if available, otherwise text
    const content = pastedHtml || pastedText;

    // Store for re-processing (e.g. toggle change)
    lastProcessedContent = content;

    // Process content immediately
    processContent(content);
    
    // Reset input area to empty state
    inputArea.innerHTML = '';
    
    // Optional: Show a temporary "Pasted!" message or visual cue in the input area
    inputArea.setAttribute('placeholder', 'Pasted! Ready for more...');
    setTimeout(() => {
        inputArea.setAttribute('placeholder', 'Paste your rich text here...');
    }, 2000);
}

function processContent(html) {
    // 1. Clean HTML
    const cleaned = cleanHTML(html);
    
    // 2. Convert to Markdown (Always use cleaned HTML for markdown conversion as per app purpose)
    const markdown = convertToMarkdown(cleaned);

    // 3. Update Outputs
    outputCode.textContent = markdown;
    
    // HTML Preview: Show cleaned or raw based on toggle
    if (cleanHtmlToggle.checked) {
        htmlCode.textContent = formatHTML(cleaned);
    } else {
        htmlCode.textContent = formatHTML(html);
    }

    // 4. Highlight
    if (window.Prism) {
        Prism.highlightElement(outputCode);
        Prism.highlightElement(htmlCode);
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
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        
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
        // Check system preference
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

// Run
init();
