import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
const css = await readFile(new URL('../history-preview.css', import.meta.url), 'utf8');
test('archive CSS compiles for the supported browser baseline without warnings', async () => {
 const result = await transform(css, { loader: 'css', target: ['chrome110','firefox110','safari16'] });
 assert.deepEqual(result.warnings, []);
});
test('reading remains visible and media has a fallback without remote CSS dependencies', () => {
 assert.doesNotMatch(css, /@import|url\(https?:/);
 assert.doesNotMatch(css, /opacity:\s*0\s*[;}]/);
 assert.match(css, /prefers-reduced-motion/);
 assert.match(css, /:focus-visible/);
});
