# QA rerun PR #8 — 29/10/2026

**Head testado:** `f9e05db` (feat/home-urbano, PR #8 draft). Tudo LOCAL, sem DATABASE_URL, sem banco real, nada medido na Vercel.

- `LOCAL-tests.log`: vitest **736/736** passaram (9 suítes).
- `LOCAL-build.log`: `next build` passou.
- `LOCAL-lint.log`: ESLint 12 problemas (4 erros, 8 avisos) — pendência registrada, fora do DoD desta correção.
- Lighthouse mobile LOCAL (horários BRT, UTC-3): 12:22:28 perf 97 · 12:22:41 perf 95 · 12:22:53 perf 96 (a11y 100, BP 100). Relatórios `LOCAL-lh-mobile-run*.report.*`.
- `codex-review-head-f9e05db.md`: revisão Codex (estática) **REQUEST CHANGES** — P1: /api/live só olha os 5 últimos uploads e pode perder live no ar; P2: erro da API vira `{live:false}` cacheável e encerra live na tela.

**Veredito do head f9e05db: REPROVADO** até corrigir P1/P2 e passar por nova revisão independente.
Pendências do dono: chave da YouTube API, live real para validar, playlist, grade, fotos.
