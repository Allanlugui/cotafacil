# CotaFácil — HISTÓRICO

- 2026-09-25 22:18: commit `7182959` — "prepara CotaFacil para rodar localmente e na Vercel" (11 arquivos, 676 inserções).
- 2026-09-26: commit `ec62863` + push `master` (só `memory/`, sem segredos) → auto-deploy Vercel via GitHub. Validação em prod pendente (aguardando URL).
- 2026-09-26: prod quebrou (`document is not defined` em `/var/task/app.cjs:3`) — Vercel executava `app.js` raiz como function. Fix: `git mv` estáticos p/ `public/`, `server.js` serve `public/` primeiro. Local revalidado porta 3111: `/` 200, `/app.js` 200, `/health` ok, `/api/quote` real (40 achados). Commit `9d6d13b` + push.
- 2026-09-26: prod validada (`/` 200, `/app.js` 200, crash resolvido) mas `/api/quote` retorna `source:demo` — falta `SERPAPI_KEY` na Vercel.
