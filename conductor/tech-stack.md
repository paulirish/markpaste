# Tech Stack

## Core Technologies
- **Vanilla JavaScript (ES Modules):** Leveraged for application logic and DOM manipulation without the overhead of heavy frameworks.
- **HTML5 & CSS3:** Used for structural layout and responsive styling, adhering to modern web standards.

## Runtime & Environment
- **Browser-Only:** All processing is performed client-side to ensure maximum privacy and performance.
- **WASI (WebAssembly System Interface):** Utilized via `@bjorn3/browser_wasi_shim` for potentially running complex tools (like Pandoc) within the browser environment.

## Dependencies & Libraries
- **Marked:** A high-speed Markdown parser and compiler for rendering/processing Markdown.
- **PrismJS:** Used for robust syntax highlighting in the HTML and Markdown preview panes.
- **Turndown (Inferred):** Likely used for the core HTML-to-Markdown conversion (based on devDependencies).

## Development & Tooling
- **pnpm:** The chosen package manager for efficient dependency management.
- **Statikk:** A simple, efficient static file server for local development.
- **Prettier:** Ensures consistent code formatting across the project.
- **Playwright:** Provides comprehensive end-to-end testing coverage.
- **TypeScript (Types-only):** The project uses TypeScript for type definitions (`.d.ts`) to improve developer experience and catch errors, even though the source is JavaScript.
