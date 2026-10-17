import { renderHome } from './page-shell.mjs';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFile, readFile, writeFile, cp } from 'node:fs/promises';
export const options = {
  entryPoints: { bootstrap: 'src/bootstrap.js', historyPreview: 'src/history-preview.js' }, bundle: true, outdir: 'dist', format: 'esm', splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  target: ['chrome110', 'firefox110', 'safari16'], minify: false,
  sourcemap: true, legalComments: 'eof', logLevel: 'info',
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build(options);
  await writeFile('dist/index.html', renderHome({ appHtml: await readFile('index.html', 'utf8'), historyHtml: await readFile('history-preview.html', 'utf8') }).replace('src="dist/bootstrap.js"', 'src="bootstrap.js"'));
  await writeFile('dist/history-preview.html', (await readFile('history-preview.html', 'utf8')).replace('src="dist/historyPreview.js"', 'src="historyPreview.js"'));
  await copyFile('history-preview.css', 'dist/history-preview.css');
  await cp('assets/history', 'dist/assets/history', { recursive: true });
  await copyFile('styles.css', 'dist/styles.css');
  await copyFile('lab.css', 'dist/lab.css');
  await copyFile('challenge.css', 'dist/challenge.css');
  await copyFile('THIRD_PARTY_NOTICES.txt', 'dist/THIRD_PARTY_NOTICES.txt');
}
