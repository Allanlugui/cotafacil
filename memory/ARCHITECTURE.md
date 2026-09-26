# CotaFácil — ARCHITECTURE (verificada no código)

```
browser (index.html + app.js + styles.css)
  │  GET /api/quote?product&location&limit&prioritizeShipping
  ▼
server.js (local, Node puro) ──OU── Vercel (prod)
  │  require ./api/quote.js
  ▼
api/quote.js → SerpApi google_shopping (gl=br, hl=pt-br) → dedup → scores → JSON {source, results[]}
  │  sem chave → demoResults[3]
  ▼
frontend: sort (score/price/rating) → render cards → export (xlsx/pdf/csv/print, via CDN)
```

- Rotas locais: `/` → `index.html`, `/api/quote`, `/health`.
- Contratos: `SERPAPI_KEY` env; limite 1–30; `vercel.json` `maxDuration:20` p/ `api/quote.js`.
