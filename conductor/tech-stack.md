# Tech Stack

## Core Technologies
- **Vanilla JavaScript (ES Modules):** Leveraged for application logic and DOM manipulation without the overhead of heavy frameworks.
- **HTML5 & CSS3:** Used for structural layout and responsive styling, adhering to modern web standards.

## Runtime & Environment
- **Isomorphic (Browser & Node.js):** Core logic is environment-agnostic. Uses native DOM APIs in the browser and `linkedom` for DOM emulation in Node.js.
- **WASI (WebAssembly System Interface):** Utilized via `@bjorn3/browser_wasi_shim` for running Pandoc within both browser and Node contexts.

## Dependencies & Libraries
- **Marked:** A high-speed Markdown parser and compiler for rendering/processing Markdown.
- **PrismJS:** Used for robust syntax highlighting in the HTML and Markdown preview panes.
- **Turndown:** Standard NPM package used for core HTML-to-Markdown conversion.
- **linkedom:** Light-weight DOM implementation for Node.js environments.

## Development & Tooling
- **pnpm:** The chosen package manager for efficient dependency management.
- **Statikk:** A simple, efficient static file server for local development.
- **Prettier:** Ensures consistent code formatting across the project.
- **Playwright:** Provides comprehensive end-to-end testing coverage for the Browser.
- **Node.js Test Runner:** Native `node --test` used for fast unit testing of isomorphic modules.
- **TypeScript (Types-only):** The project uses TypeScript for type definitions (`.d.ts`) to improve developer experience and catch errors, even though the source is JavaScript.