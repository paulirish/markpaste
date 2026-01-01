import {test} from 'node:test';
import assert from 'node:assert';
import {execSync, spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIP_TOOL = path.resolve(__dirname, '../../bin/markpaste');

// This test only works on macOS
if (os.platform() === 'darwin') {
  test('markpaste cli: round-trip conversion', async () => {
    const testContent = '<h1>Test</h1><p><b>Bold</b></p>';

    // 1. Set initial clipboard state
    const htmlHex = Buffer.from(testContent, 'utf8').toString('hex');
    const setScript = `set the clipboard to {«class HTML»:«data HTML${htmlHex}», text:"${testContent}"}`;
    spawnSync('osascript', ['-e', setScript]);

    // 2. Run markpaste
    execSync(`"${CLIP_TOOL}"`, {encoding: 'utf8'});

    // 3. Verify Plain Text flavor (should be Markdown)
    const plainText = execSync('osascript -e "get (the clipboard as string)"', {encoding: 'utf8'}).trim();
    assert.strictEqual(plainText.includes('# Test'), true);
    assert.strictEqual(plainText.includes('**Bold**'), true);

    // 4. Verify HTML flavor (should be cleaned HTML)
    const htmlData = execSync('osascript -e "get (the clipboard as «class HTML»)"', {encoding: 'utf8'}).trim();
    assert.strictEqual(htmlData.includes('«data HTML'), true);

    // Extract hex and convert back to string
    const match = htmlData.match(/«data HTML([0-9A-F]*)»/i);
    if (match && match[1]) {
      const resultHtml = Buffer.from(match[1], 'hex').toString('utf8');
      assert.strictEqual(resultHtml.toLowerCase().includes('<h1>test</h1>'), true);
      assert.strictEqual(resultHtml.toLowerCase().includes('<b>bold</b>'), true);
    } else {
      assert.fail('Could not extract HTML hex from clipboard');
    }
  });

  test('markpaste cli: markdown to html conversion', async () => {
    const markdownInput = '# MD Test\n\n- item 1';

    // 1. Set clipboard to plain text only (no HTML flavor)
    execSync('pbcopy', {input: markdownInput});
    // Verify no HTML flavor exists (or at least we want to simulate that state)
    // Actually pbcopy only sets text flavor, so this is perfect.

    // 2. Run markpaste
    execSync(`"${CLIP_TOOL}"`, {encoding: 'utf8'});

    // 3. Verify HTML flavor (should be rendered HTML)
    const htmlData = execSync('osascript -e "get (the clipboard as «class HTML»)"', {encoding: 'utf8'}).trim();
    assert.strictEqual(htmlData.includes('«data HTML'), true);

    const match = htmlData.match(/«data HTML([0-9A-F]*)»/i);
    const resultHtml = Buffer.from(match[1], 'hex').toString('utf8');
    assert.strictEqual(resultHtml.toLowerCase().includes('<h1>md test</h1>'), true);
    assert.strictEqual(resultHtml.toLowerCase().includes('<li>item 1</li>'), true);

    // 4. Verify Plain Text flavor (should be original markdown)
    const plainText = execSync('osascript -e "get (the clipboard as string)"', {encoding: 'utf8'}).trim();
    assert.strictEqual(plainText, markdownInput);
  });
} else {
  test('markpaste cli: skipped on non-macOS', () => {
    // Pass
  });
}
