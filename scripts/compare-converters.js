#!/usr/bin/env node

import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { getConverter } from '../src/converter.js';
import { cleanHTML } from '../src/cleaner.js';

const testCases = [
  {
    name: 'Basic text',
    html: '<p>Hello <b>world</b> and <i>everyone</i>!</p>'
  },
  {
    name: 'Headings',
    html: '<h1>Main Heading</h1><h2>Sub Heading</h2><h3>Third level</h3>'
  },
  {
    name: 'Lists',
    html: '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li><li>Second</li></ol>'
  },
  {
    name: 'Links',
    html: '<p>Check out <a href="https://example.com">this link</a>.</p>'
  },
  {
    name: 'Code',
    html: '<p>Use  <code>console.log()</code> to debug.</p><pre><code>function hello() {\n  console.log("world");\n}</code></pre>'
  },
  {
    name: 'Tables',
    html: `
      <table>
        <thead>
          <tr><th>Col 1</th><th>Col 2</th></tr>
        </thead>
        <tbody>
          <tr><td>Data 1</td><td>Data 2</td></tr>
        </tbody>
      </table>
    `
  },
  {
    name: 'Tricky Span',
    html: `
      <p>The<span> </span>
      <code class="w3-codespan">debugger</code>
      <span> </span>keyword stops the execution of JavaScript.</p>
    `
  },
  {
    name: 'Nested formatting',
    html: '<p><b>Bold and <i>italic and <u>underlined</u></i></b></p>'
  },
  {
    name: 'Images',
    html: '<img src="https://example.com/image.png" alt="An image" title="Image title">'
  },
  {
    name: 'Blockquotes',
    html: '<blockquote><p>This is a quote.</p><footer>— Someone</footer></blockquote>'
  },
  {
    name: 'Horizontal Rule',
    html: '<p>Before</p><hr><p>After</p>'
  },
  {
    name: 'Task Lists',
    html: '<ul><li>[ ] Todo</li><li>[x] Done</li></ul>'
  }
];

async function runComparison() {
  const turndown = await getConverter('turndown');
  const pandoc = await getConverter('pandoc');

  console.log('Comparing Turndown vs Pandoc...\n');

  for (const tc of testCases) {
    console.log(`Test Case: ${tc.name}`);
    
    const cleaned = await cleanHTML(tc.html);
    const tOut = (await turndown.convert(cleaned)).trim();
    const pOut = (await pandoc.convert(cleaned)).trim();

    if (tOut === pOut) {
      console.log('  ✅ Match');
    } else {
      console.log('  ❌ Mismatch - Diffing...');
      
      const tmpDir = path.join(os.tmpdir(), 'markpaste-comp');
      if (!existsSync(tmpDir)) mkdirSync(tmpDir);

      const tFile = path.join(tmpDir, 'turndown.md');
      const pFile = path.join(tmpDir, 'pandoc.md');

      writeFileSync(tFile, tOut + '\n');
      writeFileSync(pFile, pOut + '\n');

      // Use git diff --no-index | delta
      const diffCmd = `git --no-pager diff --no-index --color=always ${tFile} ${pFile} | delta`;
      const result = spawnSync('sh', ['-c', diffCmd], { encoding: 'utf8', stdio: 'inherit' });

      // cleanup
      unlinkSync(tFile);
      unlinkSync(pFile);
    }
    console.log('-'.repeat(40));
  }

  // Cleanup pandoc worker if necessary
  if (pandoc.dispose) pandoc.dispose();
}

runComparison().catch(err => {
  console.error(err);
  process.exit(1);
});
