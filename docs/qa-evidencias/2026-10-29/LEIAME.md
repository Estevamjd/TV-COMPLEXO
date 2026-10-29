# QA rerun PR #8 — 29/10/2026

**Head testado:** `f9e05db` (feat/home-urbano, PR #8 draft). Tudo LOCAL, sem DATABASE_URL, sem banco real, nada medido na Vercel.

- `LOCAL-tests.log`: vitest **736/736** passaram (9 suítes).
- `LOCAL-build.log`: `next build` passou.
- `LOCAL-lint.log`: ESLint 12 problemas (4 erros, 8 avisos) — pendência registrada, fora do DoD desta correção.
- Lighthouse mobile LOCAL (horários BRT, UTC-3): 12:22:28 perf 97 · 12:22:41 perf 95 · 12:22:53 perf 96 (a11y 100, BP 100). Relatórios `LOCAL-lh-mobile-run*.report.*`.
- `codex-review-head-f9e05db.md`: revisão Codex (estática) **REQUEST CHANGES** — P1: /api/live só olha os 5 últimos uploads e pode perder live no ar; P2: erro da API vira `{live:false}` cacheável e encerra live na tela.

**Veredito do head f9e05db: REPROVADO** até corrigir P1/P2 e passar por nova revisão independente.
Pendências do dono: chave da YouTube API, live real para validar, playlist, grade, fotos.

## ESLint: base origin/master × f9e05db (comparação LOCAL, 29/10 12:45 BRT)
Os 12 problemas são **idênticos** na base `origin/master` e no `f9e05db` (mesmo arquivo + regra): nenhum foi introduzido pelo PR #8.
- Erros (4): `app/admin/noticias/page.js` e `app/admin/videos/page.js` (react-hooks/set-state-in-effect), `app/noticias/[id]/CommentSection.js` (set-state-in-effect), `app/videos/page.js` (react-hooks/immutability).
- Avisos (8): admin/videos e denuncias/enviar (no-img-element), denuncias/enviar (incompatible-library), CommentSection, videos/page, TikTokFeed, TikTokVideo (exhaustive-deps), lib/db.ts (no-anonymous-default-export).
- Caminho da demo: home (`app/page.js`) e `/api/live` **sem** problemas de lint. Porém a home linka para `/videos` ("ver tudo" e menu) e para `/noticias/[id]` (CommentSection): esses 2 arquivos com erro pré-existente **ficam a um clique da demo**. Admin e denúncias não estão no caminho da demo.
- O comparativo do novo head (pós-correção P1/P2) é registrado na seção da correção.

## "DB query error" no build
O build roda sem `DATABASE_URL` (proposital: nunca usar o banco real em teste local). A mensagem `DB query error:` no build é **limite do teste local**, não prova de que a integração com o banco funciona — a integração com Neon NÃO foi validada aqui.
Impacto no fluxo da demo: a home é `force-dynamic` e envolve a consulta em try/catch (renderiza sem as listas do banco, sem quebrar). `/videos` e `/noticias/[id]` dependem do banco em runtime e não foram exercitados com dados reais: falha nelas em runtime não está descartada. `/api/live` não usa o banco.
