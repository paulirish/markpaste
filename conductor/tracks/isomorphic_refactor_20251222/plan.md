# Plan: Isomorphic Core Refactor

## Phase 1: Environment & Dependencies [checkpoint: e6fcff7]
- [x] Task: Install dependencies (`linkedom`, `turndown`, `turndown-plugin-gfm`, `to-markdown`, `@types/node`). 96cf1d4
- [x] Task: Update `package.json` scripts to include `test:node` using native Node.js runner (`node --test`). 96cf1d4
- [x] Task: Create `tests/node/` directory and a basic "hello world" test to verify runner setup. 6c3703d
- [x] Task: Conductor - User Manual Verification 'Phase 1: Environment & Dependencies' (Protocol in workflow.md) e6fcff7

## Phase 2: Refactoring Core Modules (Cleaner & Converter) [checkpoint: ab37835]
- [x] Task: Refactor `cleaner.js` to be environment-agnostic. ab37835
    - [x] Create `tests/node/cleaner.test.js` (Red phase).
    - [x] Implement conditional loading: use `linkedom` in Node, native `DOMParser` in browser.
    - [x] Verify `pnpm test` (Playwright) still passes for browser.
- [x] Task: Refactor `converter.js` to use imports. ab37835
    - [x] Create `tests/node/converter.test.js` (Red phase).
    - [x] Replace global/CDN loader logic with dynamic/static imports of installed packages.
    - [x] Ensure browser still loads these (likely using ESM paths to `node_modules` or import maps).
- [x] Task: Conductor - User Manual Verification 'Phase 2: Refactoring Core Modules' (Protocol in workflow.md) ab37835

## Phase 3: Isomorphic WASM (Pandoc)
- [x] Task: Abstract the WASM file loader in `pandoc-built/index.js`. 7b2f0b2
    - [x] Create `tests/node/pandoc.test.js` (Red phase).
    - [x] Implement a `loadWasm` helper: uses `fs.readFile` (Node) or `fetch` (Browser).
    - [x] Ensure `@bjorn3/browser_wasi_shim` works in Node context.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Isomorphic WASM' (Protocol in workflow.md)

## Phase 4: Library Entry Point & Final Verification
- [ ] Task: Create `index.js` (Library Entry Point).
    - [ ] Export `convert` and `cleanHTML` functions clearly.
- [ ] Task: Run full regression suite.
    - [ ] `npm run test:node` (All Node tests).
    - [ ] `pnpm test` (All Browser Playwright tests).
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Library Entry Point & Final Verification' (Protocol in workflow.md)
