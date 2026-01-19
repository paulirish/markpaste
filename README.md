# MarkPaste

[![npm version](https://img.shields.io/npm/v/markpaste.svg)](https://www.npmjs.com/package/markpaste)

MarkPaste is an isomorphic tool that converts rich text to Markdown. It works seamlessly in both the **browser** as a web application and in **Node.js** as a library.

## Features

- **Isomorphic Core:** The same robust conversion logic runs in modern browsers and Node.js.
- **Rich Text to Markdown:** Convert rich text from any source into clean, readable Markdown.
- **Multiple Converters:** Choose between [Turndown](https://github.com/mixmark-io/turndown) for standard conversion or [Pandoc (via WASM)](https://pandoc.org/) for advanced features.
- **HTML Cleaning:** Optional sanitization to strip unnecessary tags and attributes while preserving structure.
- **Web UI:** A polished, responsive interface with live HTML preview, syntax highlighting, and dark mode.

## Usage

### Web Application

1. **Open the app:** Run locally or host the `index.html`.
2. **Paste:** Copy rich text from a webpage or document and paste it into the input area.
3. **Get Markdown:** View the generated Markdown from multiple converters simultaneously.
4. **Copy:** Click to copy the Markdown to your clipboard.

### Node.js Library

MarkPaste can be used programmatically in Node.js environments. It uses `linkedom` to provide a lightweight DOM implementation for the conversion logic.

```javascript
import {convert} from './src/index.js';

const html = '<h1>Hello World</h1><p>This is <b>bold</b> text.</p>';

// Basic usage (defaults to Turndown)
const markdown = await convert(html);
console.log(markdown);

// Using Pandoc
const pandocMarkdown = await convert(html, {converter: 'pandoc'});
console.log(pandocMarkdown);

// Disabling HTML cleaning
const rawMarkdown = await convert(html, {clean: false});
```

## Development

To run MarkPaste locally:

1. **Clone & Install:**

   ```bash
   git clone https://github.com/paulirish/markpaste.git
   cd markpaste
   pnpm install
   ```

2. **Start the Web UI:**
   ```bash
   pnpm start
   ```
   Access the application at `http://localhost:7025`.

### Testing

The project uses a dual-testing strategy:

- **Node.js tests:** Unit tests for isomorphic modules (`pnpm test:node`).
- **Playwright tests:** End-to-end browser testing (`pnpm test:web`).

Run all tests with:

```bash
pnpm test
```

## Pandoc WASM

The `pandoc.wasm` and `pandoc.js` files used in this project originate from the [haskell-wasm/pandoc-wasm](https://github.com/haskell-wasm/pandoc-wasm) project. Since GitHub Actions artifacts are cleaned up after ~90 days and the upstream repository hadn't run its CI recently, a [fork](https://github.com/paulirish/pandoc-wasm) was created to generate fresh build artifacts. The files in this project were obtained from that fork's GitHub Actions build artifacts.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for details.
