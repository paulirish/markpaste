## Project Overview

MarkPaste is a web-based utility for converting rich text to Markdown. The core technologies are HTML, CSS, and JavaScript, with Playwright for testing. The application's logic is contained in `app.js`, `cleaner.js`, and `converter.js`.

## File Structure

The key files in the project are:

* `index.html`
* `style.css`
* `app.js`: The main JavaScript file containing the application's logic.
* `cleaner.js`: Contains the logic for cleaning the HTML.
* `converter.js`: Contains the logic for converting HTML to Markdown.
* `tests/pasting.spec.ts`: The Playwright test file.
* `package.json`: The project's manifest file. PNPM is the preferred package manager
