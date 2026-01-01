# Specification: Isomorphic Core Refactor

## Overview

This track involves refactoring the MarkPaste core logic to be isomorphic (runnable in both Browser and Node.js environments). The goal is to provide a programmatic Node.js API while maintaining existing browser functionality.

## Functional Requirements

- **Programmatic API**: Export a clean API for Node.js users (e.g., `convert(html, options)`).
- **Environment Agnostic Core**: Logic in `cleaner.js` and `converter.js` must detect and adapt to the environment.
- **DOM Emulation**: Use `linkedom` in Node.js to provide necessary DOM APIs (`DOMParser`, `Node`, etc.) for HTML cleaning.
- **Isomorphic WASM**: Refactor `pandoc-built/index.js` to load the Pandoc WASM transparently using `fetch` in browsers and `fs` in Node.js.
- **Dependency Management**: Transition from CDN-loaded scripts to standard NPM packages (`turndown`, `to-markdown`).

## Non-Functional Requirements

- **Maintain Performance**: Ensure the use of `linkedom` keeps the Node.js footprint light.
- **Transparency**: Users should not need to manually initialize WASM or DOM shims when using the programmatic API.

## Acceptance Criteria

- [ ] A Node.js script can import `markpaste` and convert HTML to Markdown.
- [ ] The existing browser UI continues to function without regression.
- [ ] Pandoc (WASM) works correctly in both environments.
- [ ] Unit tests pass in a Node.js environment (using native `node --test` runner).

## Out of Scope

- Creating a CLI (Command Line Interface).
- Creating an HTTP Server wrapper.
- Changing the visual design of the browser app.
