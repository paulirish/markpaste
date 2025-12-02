# MarkPaste

MarkPaste is a web-based tool that converts rich text pasted from the clipboard into Markdown. It provides a simple and efficient way to clean up and convert content for use in Markdown-based editors.

## Features

- **Rich Text to Markdown:** Paste rich text from any source and instantly get clean Markdown.
- **HTML Preview:** See the intermediate HTML that's generated from your rich text.
- **HTML Cleaning:** Option to clean up the HTML before converting to Markdown, removing unnecessary tags and attributes.
- **Syntax Highlighting:** Both the HTML and Markdown outputs are highlighted for readability.
- **Copy to Clipboard:** Easily copy the generated Markdown to your clipboard.
- **Light/Dark Mode:** Toggles between light and dark themes to suit your preference.

## How to Use

1. **Paste:** Copy rich text from a webpage, document, or any other source.
2. **Paste into MarkPaste:** Paste the content into the input area on the left.
3. **Get Markdown:** The Markdown output will appear in the right-hand panel.
4. **Copy:** Click the "Copy to Clipboard" button to copy the Markdown.

## Development

To run MarkPaste locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/markpaste.git
   cd markpaste
   ```

2. **Install dependencies:**
   This project uses `pnpm` as the package manager.

   ```bash
   pnpm install
   ```

3. **Start the development server:**

   ```bash
   pnpm start
   ```

   This will start a local server, and you can access the application at `http://localhost:7025`.

### Testing

The project uses Playwright for end-to-end testing. To run the tests:

```bash
pnpm test
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or feature requests.

## License

This project is licensed under the ISC License.
