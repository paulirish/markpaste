## Project Overview

MarkPaste is a web-based utility for converting rich text to Markdown. The core technologies are HTML, CSS, and JavaScript, with Playwright for testing.

## File Structure

- Browser source files:
  - `index.html`
  - `src/style.css`
  - `src/app.js`: The main browser JS containing the application's logic.

- Node and web compatible library code:
  - `src/cleaner.js`: The logic for cleaning the HTML.
  - `src/converter.js`: The logic for converting HTML to Markdown.

- `src/markpaste.js`: The library entry point. (for node or bundling)

- Also:
  - `test/web/`: Playwright tests for core application functionality.
  - `test/node/`: Node.js unit tests for library logic.
  - `third_party/`: External assets like `pandoc.wasm`.
  - `package.json`: The project's manifest file. PNPM is the preferred package manager.

## Testing

The project uses a tiered testing approach:

- `pnpm test`: Runs a typecheck and then both Node.js unit tests (`pnpm test:node`) and Playwright web tests (`pnpm test:web test/web/*`)
