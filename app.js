import { cleanHTML } from './cleaner.js';
import { convertToMarkdown } from './converter.js';

// DOM Elements
const inputArea = document.getElementById('input-area');
const outputArea = document.getElementById('output-area');
const htmlPreview = document.getElementById('html-preview');
const clearBtn = document.getElementById('clear-btn');
const copyBtn = document.getElementById('copy-btn');
const themeToggle = document.getElementById('theme-toggle');
const toggleBtns = document.querySelectorAll('.toggle-btn');

// State
let currentView = 'markdown'; // 'markdown' or 'html'

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
        processContent(inputArea.innerHTML);
    });

    // Clear Button
    clearBtn.addEventListener('click', () => {
        inputArea.innerHTML = '';
        outputArea.value = '';
        htmlPreview.textContent = '';
    });

    // Copy Button
    copyBtn.addEventListener('click', copyToClipboard);

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // View Toggles
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            updateOutputView();
        });
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

    // Insert into input area (sanitized/cleaned version will be processed)
    // We insert the raw HTML first to let the user see what they pasted, 
    // but we might want to clean it immediately. 
    // Let's clean it immediately for the input view to match "paste-html-subset" behavior.
    
    const cleaned = cleanHTML(content);
    document.execCommand('insertHTML', false, cleaned);
    
    // Trigger processing
    processContent(inputArea.innerHTML);
}

function processContent(html) {
    // 1. Clean HTML (already done on paste, but good to ensure consistency)
    const cleaned = cleanHTML(html);
    
    // 2. Convert to Markdown
    const markdown = convertToMarkdown(cleaned);

    // 3. Update Outputs
    outputArea.value = markdown;
    htmlPreview.textContent = formatHTML(cleaned);
}

function updateOutputView() {
    if (currentView === 'markdown') {
        outputArea.classList.remove('hidden');
        htmlPreview.classList.add('hidden');
    } else {
        outputArea.classList.add('hidden');
        htmlPreview.classList.remove('hidden');
    }
}

function formatHTML(html) {
    // Simple formatter for the HTML preview
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
    const textToCopy = currentView === 'markdown' ? outputArea.value : htmlPreview.textContent;
    
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
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Run
init();
