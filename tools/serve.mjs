// node tools/serve.mjs [folder] [port]   a tiny static server for trying a build locally
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || 'dist'),
  port = +process.argv[3] || 8080,
  types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };
http
  .createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]),
      file = path.join(dir, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end('not found');
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log('serving', dir, 'on http://localhost:' + port));
