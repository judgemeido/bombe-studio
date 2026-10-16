import { build } from 'esbuild';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFile, readFile, writeFile } from 'node:fs/promises';
export const options = {
  entryPoints: { app: 'src/main.js' }, bundle: true, outdir: 'dist', format: 'esm', splitting: true,
  chunkNames: 'chunks/[name]-[hash]',
  target: ['chrome110', 'firefox110', 'safari16'], minify: false,
  sourcemap: true, legalComments: 'eof', logLevel: 'info',
};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build(options);
  await writeFile('dist/index.html', (await readFile('index.html', 'utf8')).replace('src="dist/app.js"', 'src="app.js"'));
  await copyFile('styles.css', 'dist/styles.css');
  await copyFile('THIRD_PARTY_NOTICES.txt', 'dist/THIRD_PARTY_NOTICES.txt');
}
