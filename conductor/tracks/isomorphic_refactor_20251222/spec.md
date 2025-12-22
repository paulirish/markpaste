# Spec: Isomorphic Core Refactor

## Goal
Transform MarkPaste from a browser-only application into an isomorphic library that can be used in both web browsers and Node.js environments. This will allow the cleaning and conversion logic to be used in server-side scripts, LLM pipelines, and CLIs.

## Requirements
- **Environment Agnostic Logic:** The core cleaning (`cleaner.js`) and conversion (`converter.js`) logic must not depend on global browser objects like `window` or `document` directly.
- **DOM Abstraction:** Use a pluggable DOM implementation. In the browser, it uses the native DOM. In Node.js, it should support `jsdom` or `linkedom`.
- **WASM Portability:** Ensure the WASM loading mechanism for Pandoc (if used) or other components works in both `fetch`-based (browser) and `fs`-based (Node.js) environments.
- **Node.js Entry Point:** Provide a `main` or `exports` entry point in `package.json` that allows `import { clean, convert } from 'markpaste'`.
- **Test Coverage:** Ensure existing browser tests still pass and add new Node.js-based unit tests for the core logic.

## Proposed Architecture
1. **`core/` Directory:** Move environment-agnostic logic here.
   - `core/cleaner.js`: Functions that accept a DOM `Document` or `Element` and return cleaned HTML.
   - `core/converter.js`: Functions that handle the HTML-to-Markdown conversion.
2. **`index.js` (Library Entry):** Detects environment and exports the core functions, providing the necessary DOM shims for Node.js.
3. **`app.js` (Browser UI):** Remains as the UI layer, importing from the core modules and handling DOM events and display.
