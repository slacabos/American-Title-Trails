import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const resolvePath = requestPath => {
  if (requestPath === '/' || requestPath === '') {
    return path.join(publicDir, 'index.html');
  }

  if (requestPath.startsWith('/src/')) {
    return path.join(rootDir, requestPath);
  }

  if (requestPath.startsWith('/public/')) {
    return path.join(rootDir, requestPath);
  }

  return path.join(publicDir, requestPath.replace(/^\//, ''));
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const filePath = resolvePath(decodeURIComponent(url.pathname));
    const normalized = path.normalize(filePath);

    if (!normalized.startsWith(rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    const stat = await fs.promises.stat(normalized);
    if (stat.isDirectory()) {
      const indexPath = path.join(normalized, 'index.html');
      const indexExists = await fs.promises
        .access(indexPath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
      if (indexExists) {
        const data = await fs.promises.readFile(indexPath);
        res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
        res.end(data);
        return;
      }
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Directory access is forbidden');
      return;
    }

    const ext = path.extname(normalized).toLowerCase();
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';
    const data = await fs.promises.readFile(normalized);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File not found');
      return;
    }
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal server error');
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`American Tile Trails server running at http://localhost:${port}`);
});
