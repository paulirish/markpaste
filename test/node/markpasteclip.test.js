import { test } from 'node:test';
import assert from 'node:assert';
import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIP_TOOL = path.resolve(__dirname, '../../src/markpasteclip');

// This test only works on macOS
if (os.platform() === 'darwin') {
  test('markpasteclip: round-trip conversion', async () => {
    const testContent = '<h1>Test</h1><p><b>Bold</b></p>';
    
    // 1. Set initial clipboard state
    const htmlHex = Buffer.from(testContent, 'utf8').toString('hex');
    const setScript = `set the clipboard to {«class HTML»:«data HTML${htmlHex}», text:"${testContent}"}`;
    spawnSync('osascript', ['-e', setScript]);

    // 2. Run markpasteclip
    execSync(`"${CLIP_TOOL}"`, { encoding: 'utf8' });

    // 3. Verify Plain Text flavor (should be Markdown)
    const plainText = execSync('osascript -e "get (the clipboard as string)"', { encoding: 'utf8' }).trim();
    assert.strictEqual(plainText.includes('# Test'), true);
    assert.strictEqual(plainText.includes('**Bold**'), true);

    // 4. Verify HTML flavor (should be cleaned HTML)
    const htmlData = execSync('osascript -e "get (the clipboard as «class HTML»)"', { encoding: 'utf8' }).trim();
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
} else {
  test('markpasteclip: skipped on non-macOS', () => {
    // Pass
  });
}
