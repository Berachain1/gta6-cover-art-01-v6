// A minimal static server for app/ (Node 22, standard library only),
// so the entry can be tried locally with no build step:
// `node serve.ts` serves app/ on http://localhost:8080. It sends the
// MIME types an offline web app needs, refuses any path that escapes
// app/, and otherwise does nothing clever: a development convenience,
// not a web server for the internet.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const portFlag = argv.indexOf('--port');
const asked = -1 === portFlag ? 8080 : Number(argv[portFlag + 1]);
const port = Number.isInteger(asked) && 0 < asked && 65536 > asked ? asked : 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".bin": "application/octet-stream",
  ".wasm": "application/wasm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
};

function mimeFor(name) {
  return MIME[extname(name).toLowerCase()] ?? 'application/octet-stream';
}

createServer((request, response) => {
  const reqUrl = new URL(request.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(reqUrl.pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname = pathname + 'index.html';
  const file = resolve(join(appRoot, normalize(pathname)));
  if (file !== appRoot && !file.startsWith(appRoot + sep)) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size;
  try {
    const info = statSync(file);
    if (false === info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  response.writeHead(200, {
    'content-type': mimeFor(file),
    'content-length': size,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`serving app/ at http://localhost:${port}`);
});
