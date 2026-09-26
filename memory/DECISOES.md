# CotaFácil — DECISÕES (extraídas do código, 2026-09-26)

- D-01: Backend sem dependências (`server.js` usa só `node:http/fs/path/url`, Node >= 18). Shim `/api/quote` reutiliza `api/quote.js` da Vercel.
- D-02: `SERPAPI_KEY` via env; placeholder detectado por regex (`sua_chave|your_|changeme|placeholder|xxx`) → fallback demo.
- D-03: Ranking índice ponderado: preço 45%, avaliação 25%, reputação 10%, entrega 10%, pós-venda 10% (com ajuste quando `prioritizeShipping=true`: entrega 14%, pós-venda 6%).
- D-04: Pós-venda conservador: sem campo oficial no Shopping API; só bônus por sinais textuais (garantia/troca/devolução/SAC), nunca nota alta inventada.
- D-05: Exportação 100% client-side (SheetJS + jsPDF via CDN); CSV com BOM + `;`; PDF jsPDF manual; print via `window.open`.
- D-06: Limite 1–30, padrão 20. Dedup por `source|title`. Ordenações: score / price / rating.
- D-07: Layout canônico Vercel — estáticos em `public/` (`index.html`, `app.js`, `styles.css`), functions só em `api/`. `server.js` local serve `public/` primeiro, raiz como fallback.
