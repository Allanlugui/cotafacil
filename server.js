// Servidor local CotaFácil — zero dependências (Node >= 18).
// Serve os arquivos estáticos + monta /api/quote.js no mesmo processo,
// reutilizando a função da Vercel sem precisar de `vercel dev`.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);

// Carrega .env manualmente (sem dotenv) para não exigir npm install.
function loadDotEnv() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadDotEnv();

const quoteHandler = require('./api/quote.js');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') pathname = '/index.html';
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  // Paridade com a Vercel: estáticos vivem em public/; raiz como fallback.
  const candidates = [path.join(ROOT, 'public', rel), path.join(ROOT, rel)];
  const file = candidates.find((f) => f.startsWith(ROOT) && fs.existsSync(f) && !fs.statSync(f).isDirectory());
  if (!file) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/quote') {
    // Shim mínimo da API Vercel/Express em cima de http puro.
    const mockReq = { method: req.method, query: Object.fromEntries(url.searchParams.entries()) };
    const mockRes = {
      status(code) {
        res.statusCode = code;
        return { json: (obj) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(obj));
        }};
      },
    };
    try {
      await quoteHandler(mockReq, mockRes);
    } catch (e) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: String(e?.message || e) }));
    }
    return;
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n  CotaFácil local: http://localhost:${PORT}`);
  console.log(`  API teste:     http://localhost:${PORT}/api/quote?product=notebook&limit=3`);
  const k = String(process.env.SERPAPI_KEY || '');
  const keyOk = k && !/sua_chave|your_|changeme|placeholder|xxx/i.test(k);
  console.log(keyOk ? '  SERPAPI_KEY: configurada' : '  SERPAPI_KEY: ausente (rodando em modo demonstração)');
  console.log('  Encerrar: Ctrl+C\n');
});
