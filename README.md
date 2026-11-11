# MarkPaste

Fix whatever's on your clipboard so a normal `Cmd+V` pastes **clean rich text** into Google Docs, Gmail, and Slack, and **Markdown** into editors, GitHub, and prompts. Works both ways (`HTML <-> Markdown`).

Use the **[web app](https://paulirish.github.io/markpaste/)**, trigger **`MarkPaste.app`** from Spotlight/Raycast, or run `npx markpaste`.

## Why?

Copy some text off a webpage, LLM chat, or Google Doc and you're stuck with bad paste options:

- `Cmd+V` into Gmail or Docs drags along inline fonts, background colors, and layout junk.
- `Cmd+Shift+V` (paste without formatting) strips the junk.. along with every link, heading, code block, list, and table.
- Pasting into an editor, GitHub issue, or prompt dumps flat plain text with all links and structure lost.
- Going the other way (copying raw Markdown into Docs or Gmail) pastes literal `##`s and `**asterisks**` instead of formatted text.

Your OS clipboard actually has separate slots for `text/plain` and `text/html`. MarkPaste populates **both** at once:

| If you copied...         | `text/plain` gets                                         | `text/html` gets                                                    |
| :----------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------ |
| **Rich text / web HTML** | Clean GFM Markdown (links, tables, fenced code, `$math$`) | Bare semantic HTML with inline `style`s, fonts, and colors stripped |
| **Plain Markdown**       | Your original Markdown                                    | Rendered semantic HTML                                              |

After that, a regular `Cmd+V` does the right thing everywhere: rich-text apps (**Docs, Gmail, Notion, Slack, Keynote**) pick up `text/html` and render it in the destination doc's native font, while plain-text apps (**VS Code, Obsidian, GitHub, Linear, terminals**) pick up the Markdown from `text/plain`.

### What the HTML cleaner strips

Web clipboards are full of weird DOM cruft. Before converting, `cleanHTML()` strips markup down to an allowlist of semantic tags (`p`, `h1`-`h6`, `a`, `pre`/`code`, `blockquote`, lists, tables):

- Removes all inline `style` attributes and unwraps `<div>`/`<span>` layout soup.
- Unwraps Google Docs' infamous `<b style="font-weight: normal">` and `<i style="font-style: normal">` wrappers (so pasted paragraphs don't mysteriously turn bold).
- Drops stray page chrome like MDN's "Copy" / "Play" buttons, `<script>`/`<style>`/`<meta>` tags, and broken top-level `<ol>` wrappers from DevSite selections.
- Extracts `[data-math]` formulas (e.g. KaTeX blocks) so they survive as `$inline$` and `$$block$$` LaTeX in Markdown.

## Web app

**[paulirish.github.io/markpaste](https://paulirish.github.io/markpaste/)** (100% client-side; nothing leaves your browser)

Paste rich text or Markdown into the top box, then click **Copy Markdown and Rich HTML to clipboard**.

Every paste runs through both **[Turndown](https://github.com/mixmark-io/turndown)** (with GFM) and **[Pandoc](https://pandoc.org/)** (compiled to WebAssembly) side-by-side. Turndown is fast and usually spot-on; when a gnarly table or nested list trips it up, Pandoc's version is right next to it ready to select.

You can also inspect the cleaned HTML directly, toggle tag stripping vs. style-only stripping, and preview the rendered output.

## macOS app (`MarkPaste.app`) & CLI

`MarkPaste.app` is a headless macOS launcher for **Spotlight**, **Raycast**, or **Alfred** (no window opens). Copy anything, trigger `MarkPaste`, and `Cmd+V`: your clipboard is rewritten in-place.

Requires **Node.js >= 24**.

Install via terminal (skips browser Gatekeeper quarantine):

```bash
curl -fL https://github.com/paulirish/markpaste/releases/latest/download/MarkPaste.app.zip -o /tmp/MarkPaste.app.zip \
  && rm -rf /Applications/MarkPaste.app \
  && ditto -xk /tmp/MarkPaste.app.zip /Applications \
  && mdimport /Applications/MarkPaste.app \
  && rm /tmp/MarkPaste.app.zip
```

Or download `MarkPaste.app.zip` from [GitHub Releases](https://github.com/paulirish/markpaste/releases/latest), move `MarkPaste.app` into `/Applications`, and clear quarantine (the app is ad-hoc signed, not notarized):

```bash
xattr -cr /Applications/MarkPaste.app
```

### CLI

Runs the same in-place macOS clipboard conversion from your terminal:

```bash
npx markpaste

# or install globally
pnpm add -g markpaste
markpaste
```

(Pass `--stdio` to read `{"html", "text"}` JSON on stdin and write `{"html", "markdown"}` JSON to stdout without touching the OS clipboard.)

## JS / Node library

Works in Node.js (via `linkedom`) and browsers:

```js
import {convert, cleanHTML} from 'markpaste';

const markdown = await convert(html); // default: Turndown + cleanHTML()
const pandocMd = await convert(html, {converter: 'pandoc'}); // Pandoc via WASM
const rawMd = await convert(html, {clean: false}); // keep non-allowlisted tags, still strip inline styles
const safeHtml = cleanHTML(html); // just the scrubbed semantic HTML
```

## Development

```bash
pnpm install
pnpm start            # web UI at http://localhost:7025
pnpm test             # tsc + node:test + playwright
pnpm run install:app  # build & install MarkPaste.app into /Applications
```

`pandoc.wasm` comes from [haskell-wasm/pandoc-wasm](https://github.com/haskell-wasm/pandoc-wasm) (built via a [fork](https://github.com/paulirish/pandoc-wasm) after upstream's 90-day GitHub Actions artifacts expired).

---

Apache-2.0 · [![npm version](https://img.shields.io/npm/v/markpaste.svg)](https://www.npmjs.com/package/markpaste)
