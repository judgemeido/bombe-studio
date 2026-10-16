import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { context } from 'esbuild';
import { options } from './build.mjs';

const root = await realpath(dirname(fileURLToPath(import.meta.url)));
process.chdir(root);
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
// Publish each successful rebuild atomically and retain hashed chunks already
// referenced by an open page. An edit must not break its later lazy import.
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
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.map': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  try {
    const requested = decodeURIComponent((req.url || '/').split('?')[0]);
    const parts = requested.split(/[\\/]/).filter(Boolean);
    if (parts.some(p => p === '..' || p.startsWith('.')) || !['index.html', 'styles.css', 'dist'].includes(parts[0] || 'index.html')) { res.writeHead(403).end('Forbidden'); return; }
    if (parts[0] === 'dist') {
      const output = outputs.get(resolve(root, '.' + requested));
      if (!output) { res.writeHead(404).end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': mime[extname(requested)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : output); return;
    }
    const path = await realpath(resolve(root, '.' + (requested === '/' ? '/index.html' : requested)));
    const fromRoot = relative(root, path);
    if (fromRoot.startsWith('..') || isAbsolute(fromRoot) || !(await stat(path)).isFile()) { res.writeHead(403).end('Forbidden'); return; }
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(req.method === 'HEAD' ? undefined : await readFile(path));
  } catch { res.writeHead(404).end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Product preview: http://127.0.0.1:${port}`));
async function stop() { server.close(); await ctx.dispose(); }
process.once('SIGINT', stop); process.once('SIGTERM', stop);
server.on('error', async error => { console.error(error.message); await ctx.dispose(); process.exitCode = 1; });
