# CotaFácil — PROBLEMAS

- P-01: Sem testes automatizados, sem lint/typecheck. Validação até aqui só manual via `/health` + `/api/quote`.
- P-02: Chave real em `.env` local — risco de commit acidental (mitigado por `.gitignore`, mas sem hook de verificação).
- P-03: Exportação depende de CDN (SheetJS/jsPDF). Sem internet no frontend, quebra — README sugere hospedar local, não implementado.
- P-04: `minPrice/maxPrice` com `Math.min(...[])` → `Infinity` se nenhum preço válido; `normalizeInverse` trata `!isFinite` mas fluxo com zero preços não testado.
- P-05: Memória global `F:/dev/memory/cotafacil/` inexistente; Serena sem sessão recuperada.
- P-06 (RESOLVIDO 2026-09-26): Vercel executava `app.js` raiz como function (`/var/task/app.cjs:3` → `document is not defined`). Causa: JS de browser na raiz. Fix: estáticos em `public/`, functions só em `api/`.
