
## fix/seo-dominio-canonico (30/10/2026) — quem fez cada parte
- Código (SITE_URL única em lib/site.ts, títulos/descrições por página, labels, JSON-LD, revalidate do sitemap): Claude Code (opus), local.
- Revisão independente: sessão Codex somente leitura. r1 REQUEST_CHANGES (sitemap sem revalidação), r2 APPROVE.
- QA (vitest, typecheck, build e next start sem DATABASE_URL, curl de HTML/robots/sitemap): Grok Bot executor, local.
- Domínio: tvcomplexo.com.br às 01:47 BRT ainda mostrava o site antigo, por isso SITE_URL = https://tv-complexo.vercel.app.

## fix/padronizar-visual (30/10/2026) — quem fez cada parte
- Código (estilo urbano em todas as telas, navegação única com aria-current, /mapa→/denuncias, Início sem textos de exemplo, mapa sem prender rolagem, selo×aviso): Claude Code (opus), local.
- Correção r1 (Denunciar no cabeçalho da Início) e correção de desempenho de /denuncias (altura reservada, leaflet.css local, tiles em canvas): Claude Code (opus), local.
- Revisão independente: Codex CLI gpt-6.1-sol somente leitura. r1 REQUEST_CHANGES, r2 APPROVE, r3 APPROVE (ressalva: canvas tira os tiles da conta do LCP).
- QA (vitest 808/808, tsc, build e next start sem DATABASE_URL, Lighthouse mobile, Playwright 390): Grok Bot executor, local.
