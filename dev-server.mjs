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
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.vtt': 'text/vtt; charset=utf-8' };
const publicFiles = new Set(['index.html', 'styles.css', 'lab.css', 'challenge.css', 'mission.css', 'history-preview.html', 'history-preview.css']);
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
    const isMissionAsset = parts[0] === 'assets' && parts[1] === 'mission' && parts.length > 2 && ['.mp4', '.vtt', '.jpg', '.webp'].includes(extension);
    if (!publicFiles.has(normalized) && !isHistoryAsset && !isMissionAsset) { res.writeHead(403).end('Forbidden'); return; }
    const path = await realpath(resolve(root, normalized));
    const fromRoot = relative(root, path);
    if (fromRoot.startsWith('..') || isAbsolute(fromRoot) || !(await stat(path)).isFile()) { res.writeHead(403).end('Forbidden'); return; }
    // A symlink inside assets/history must not expose another directory in root.
    if (isHistoryAsset || isMissionAsset) {
      const assetRoot = await realpath(resolve(root, isHistoryAsset ? 'assets/history' : 'assets/mission'));
      const fromAssets = relative(assetRoot, path);
      if (fromAssets.startsWith('..') || isAbsolute(fromAssets)) { res.writeHead(403).end('Forbidden'); return; }
    }
    if (isMissionAsset && extension === '.mp4') {
      const bytes = await readFile(path), size = bytes.length;
      const headers = { 'Content-Type': mime[extension], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const start = match?.[1] ? Number(match[1]) : Math.max(0, size - Number(match?.[2] || 0));
        const end = match?.[1] && match?.[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
        if (!match || (!match[1] && !match[2]) || start >= size || start > end) { res.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end(); return; }
        res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
        res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start, end + 1)); return;
      }
      res.writeHead(200, { ...headers, 'Content-Length': size }); res.end(req.method === 'HEAD' ? undefined : bytes); return;
    }
    res.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : normalized === 'index.html' ? renderHome({ appHtml: await readFile(path, 'utf8'), historyHtml: await readFile(resolve(root, 'history-preview.html'), 'utf8') }) : await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Product preview: http://127.0.0.1:${port}`));
async function stop() { server.close(); await ctx.dispose(); }
process.once('SIGINT', stop); process.once('SIGTERM', stop);
server.on('error', async error => { console.error(error.message); await ctx.dispose(); process.exitCode = 1; });
