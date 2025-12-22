# Plan: Isomorphic Core Refactor

## Phase 1: Audit and Dependency Prep
- [ ] Task: Audit `cleaner.js` and `converter.js` for direct global `document`/`window` usage.
- [ ] Task: Research and select a lightweight DOM shim for Node.js (e.g., `linkedom`). keep it  as minimal as we can.. 
- [ ] Task: Install Node.js specific dev-dependencies (e.g., `linkedom`).   Use nodejs native test runner for node unit tests. Set up those scripts.
- [ ] Task: Conductor - User Manual Verification 'Audit and Dependency Prep' (Protocol in workflow.md)

## Phase 2: Core Logic Decoupling
- [ ] Task: Refactor `cleaner.js` to accept a `Document` object as an argument instead of using global `document`.
- [ ] Task: Refactor `converter.js` to be environment-agnostic.
- [ ] Task: Create an abstraction for WASM loading that handles both Browser (URL/fetch) and Node (Path/fs).
- [ ] Task: Conductor - User Manual Verification 'Core Logic Decoupling' (Protocol in workflow.md)

## Phase 3: Node.js Entry Point and Isomorphic Bridge
- [ ] Task: Create `index.js` as the main entry point.
- [ ] Task: Implement environment detection in `index.js` to provide `linkedom` shims when running in Node.
- [ ] Task: Update `package.json` with `exports` field and necessary scripts.
- [ ] Task: Conductor - User Manual Verification 'Node.js Entry Point and Isomorphic Bridge' (Protocol in workflow.md)

## Phase 4: Verification and Browser Alignment
- [ ] Task: Update `app.js` to use the new refactored core modules.
- [ ] Task: Run existing Playwright tests to ensure no regressions in the browser.
- [ ] Task: Create a basic Node.js test script to verify the library entry point works.
- [ ] Task: Conductor - User Manual Verification 'Verification and Browser Alignment' (Protocol in workflow.md)
