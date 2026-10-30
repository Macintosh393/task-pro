import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('storybook-static');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};
createServer(async (request, response) => {
  try {
    const path = resolve(
      root,
      '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname),
    );
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(403).end();
      return;
    }
    const file = path === root ? resolve(root, 'index.html') : path;
    const body = await readFile(file);
    response
      .writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
      .end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(6008, '127.0.0.1');
