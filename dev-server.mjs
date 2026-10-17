import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { context } from 'esbuild';
import { renderHome } from './page-shell.mjs';
import { options } from './build.mjs';

const root = await realpath(dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
// Retain previous hashed chunks so an already-open page can still lazy-import.
const outputs = new Map();
const ctx = await context({
  ...options, write: false,
  plugins: [{ name: 'preview-output', setup(build) {
    build.onEnd(result => {
      if (!result.errors.length) for (const file of result.outputFiles || []) outputs.set(resolve(file.path), file.contents);
    });
  } }],
});
await ctx.rebuild();
await ctx.watch();
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const publicFiles = new Set(['index.html', 'styles.css', 'lab.css', 'challenge.css', 'history-preview.html', 'history-preview.css']);
const imageExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp']);
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  try {
    const requested = decodeURIComponent((req.url || '/').split('?')[0]);
    const parts = requested.split(/[\\/]/).filter(Boolean);
    if (!requested.startsWith('/') || requested.includes('\0') || parts.some(p => p === '..' || p.startsWith('.'))) { res.writeHead(403).end('Forbidden'); return; }
    const normalized = parts.join('/') || 'index.html';
    const extension = extname(normalized).toLowerCase();
    if (parts[0] === 'dist') {
      if (!['.js', '.map'].includes(extension)) { res.writeHead(403).end('Forbidden'); return; }
      const output = outputs.get(resolve(root, normalized));
      if (!output) { res.writeHead(404).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime[extension], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : output); return;
    }
    const isHistoryAsset = parts[0] === 'assets' && parts[1] === 'history' && parts.length > 2 && imageExtensions.has(extension);
    if (!publicFiles.has(normalized) && !isHistoryAsset) { res.writeHead(403).end('Forbidden'); return; }
    const path = await realpath(resolve(root, normalized));
    const fromRoot = relative(root, path);
    if (fromRoot.startsWith('..') || isAbsolute(fromRoot) || !(await stat(path)).isFile()) { res.writeHead(403).end('Forbidden'); return; }
    // A symlink inside assets/history must not expose another directory in root.
    if (isHistoryAsset) {
      const assetRoot = await realpath(resolve(root, 'assets/history'));
      const fromAssets = relative(assetRoot, path);
      if (fromAssets.startsWith('..') || isAbsolute(fromAssets)) { res.writeHead(403).end('Forbidden'); return; }
    }
    res.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : normalized === 'index.html' ? renderHome({ appHtml: await readFile(path, 'utf8'), historyHtml: await readFile(resolve(root, 'history-preview.html'), 'utf8') }) : await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Product preview: http://127.0.0.1:${port}`));
async function stop() { server.close(); await ctx.dispose(); }
process.once('SIGINT', stop); process.once('SIGTERM', stop);
server.on('error', async error => { console.error(error.message); await ctx.dispose(); process.exitCode = 1; });
