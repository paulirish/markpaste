import {describe, test} from 'node:test';
import assert from 'node:assert';
import {execSync, spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const CLIP_TOOL = path.join(REPO_ROOT, 'bin/markpaste');
const UTF8_ENV = {...process.env, LANG: 'en_US.UTF-8', LC_CTYPE: 'UTF-8'};

/** @returns {string} */
function readClipboardHtml() {
  const htmlData = execSync('osascript -e "get (the clipboard as «class HTML»)"', {encoding: 'utf8'}).trim();
  const match = htmlData.match(/«data HTML([0-9A-F]*)»/i);
  if (!match || !match[1]) {
    assert.fail(`Could not extract HTML hex from clipboard: ${htmlData}`);
  }
  return Buffer.from(match[1], 'hex').toString('utf8');
}

/** @param {string} html */
function writeClipboardHtml(html) {
  const htmlHex = Buffer.from(html, 'utf8').toString('hex');
  const script = `set the clipboard to {«class HTML»:«data HTML${htmlHex}»}`;
  const res = spawnSync('osascript', ['-e', script], {encoding: 'utf8'});
  assert.strictEqual(res.status, 0, res.stderr);
}

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
    const resultHtml = readClipboardHtml();
    assert.strictEqual(resultHtml.toLowerCase().includes('<h1>test</h1>'), true);
    assert.strictEqual(resultHtml.toLowerCase().includes('<b>bold</b>'), true);
  });

  test('markpaste cli: markdown to html conversion', async () => {
    const markdownInput = '# MD Test\n\n- item 1';

    // 1. Set clipboard to plain text only (no HTML flavor)
    execSync('pbcopy', {input: markdownInput});

    // 2. Run markpaste
    execSync(`"${CLIP_TOOL}"`, {encoding: 'utf8'});

    // 3. Verify HTML flavor (should be rendered HTML)
    const resultHtml = readClipboardHtml();
    assert.strictEqual(resultHtml.toLowerCase().includes('<h1>md test</h1>'), true);
    assert.strictEqual(resultHtml.toLowerCase().includes('<li>item 1</li>'), true);

    // 4. Verify Plain Text flavor (should be original markdown)
    const plainText = execSync('osascript -e "get (the clipboard as string)"', {encoding: 'utf8'}).trim();
    assert.strictEqual(plainText, markdownInput);
  });

  test('markpaste cli: preserves non-ASCII plain text when launched without LANG (Spotlight env)', async () => {
    const markdownInput = '# MD Test\n\nI hope you’re feeling 100° better — really!';

    execSync('pbcopy', {input: markdownInput, env: UTF8_ENV});

    // Simulate Spotlight / launchd environment where LANG and LC_* are unset
    execSync(`"${CLIP_TOOL}"`, {
      encoding: 'utf8',
      env: {PATH: process.env.PATH, HOME: process.env.HOME, USER: process.env.USER},
    });

    const plainText = execSync('pbpaste', {encoding: 'utf8', env: UTF8_ENV}).trim();
    assert.strictEqual(plainText, markdownInput);
  });

  test('markpaste cli: --stdio converts HTML and Markdown via JSON', () => {
    const htmlResult = JSON.parse(
      execSync(`"${CLIP_TOOL}" --stdio`, {
        input: JSON.stringify({html: '<h1>Hi</h1><p><b>Bold</b> — 100°</p>', text: null}),
        encoding: 'utf8',
      })
    );
    assert.strictEqual(htmlResult.markdown, '# Hi\n\n**Bold** — 100°');
    assert.strictEqual(htmlResult.html.toLowerCase().includes('<b>bold</b>'), true);

    const mdResult = JSON.parse(
      execSync(`"${CLIP_TOOL}" --stdio`, {
        input: JSON.stringify({html: null, text: '# Hi\n\n* item — you’re 100°'}),
        encoding: 'utf8',
      })
    );
    assert.strictEqual(mdResult.markdown, '# Hi\n\n* item — you’re 100°');
    assert.strictEqual(mdResult.html.includes('<h1>Hi</h1>'), true);
    assert.strictEqual(mdResult.html.includes('<li>item — you’re 100°</li>'), true);
  });

  describe('MarkPaste.app bundle', () => {
    const appDir = path.join(REPO_ROOT, 'dist/MarkPaste.app');
    const appBin = path.join(appDir, 'Contents/MacOS/mp');
    const spotlightEnv = {
      PATH: process.env.CI ? `/usr/bin:/bin:${path.dirname(process.execPath)}` : '/usr/bin:/bin',
      HOME: process.env.HOME,
      USER: process.env.USER,
      ...(process.env.CI ? {MP_NO_DIALOG: '1'} : {}),
    };

    test('builds valid universal signed bundle matching package.json version', () => {
      execSync('./scripts/build-app.sh', {cwd: REPO_ROOT, encoding: 'utf8'});
      execSync(`codesign --verify --deep --strict "${appDir}"`, {encoding: 'utf8'});

      const archs = execSync(`lipo -info "${appBin}"`, {encoding: 'utf8'});
      assert.strictEqual(archs.includes('x86_64'), true);
      assert.strictEqual(archs.includes('arm64'), true);

      const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
      const plistVersion = execSync(`/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "${appDir}/Contents/Info.plist"`, {
        encoding: 'utf8',
      }).trim();
      assert.strictEqual(plistVersion, pkg.version);
    });

    test('converts HTML clipboard to Markdown and cleaned HTML under Spotlight env', () => {
      writeClipboardHtml('<h2>Hello</h2><p><b>Bold</b> — you’re 100°</p>');
      execSync(`"${appBin}"`, {env: spotlightEnv, encoding: 'utf8'});

      const plainText = execSync('pbpaste', {encoding: 'utf8', env: UTF8_ENV}).trim();
      assert.strictEqual(plainText, '## Hello\n\n**Bold** — you’re 100°');

      const resultHtml = readClipboardHtml();
      assert.strictEqual(resultHtml.toLowerCase().includes('<h2>hello</h2>'), true);
      assert.strictEqual(resultHtml.toLowerCase().includes('<b>bold</b>'), true);
    });

    test('converts plain Markdown clipboard to HTML while preserving UTF-8 under Spotlight env', () => {
      const markdownInput = '# App Test\n\nI hope you’re 100° 🎉';
      execSync('pbcopy', {input: markdownInput, env: UTF8_ENV});
      execSync(`"${appBin}"`, {env: spotlightEnv, encoding: 'utf8'});

      const resultHtml = readClipboardHtml();
      assert.strictEqual(resultHtml.includes('<h1>App Test</h1>'), true);
      assert.strictEqual(resultHtml.includes('I hope you’re 100° 🎉'), true);

      const plainText = execSync('pbpaste', {encoding: 'utf8', env: UTF8_ENV}).trim();
      assert.strictEqual(plainText, markdownInput);
    });

    test('exits non-zero with clear error on empty clipboard', () => {
      execSync('pbcopy', {input: '   \n\t ', env: UTF8_ENV});
      const res = spawnSync(appBin, [], {
        env: {...spotlightEnv, MP_NO_DIALOG: '1'},
        encoding: 'utf8',
      });
      assert.notStrictEqual(res.status, 0);
      assert.strictEqual(res.stderr.includes('No content found in clipboard.'), true);
    });
  });
} else {
  test('markpaste cli: skipped on non-macOS', () => {
    // Pass
  });
}
