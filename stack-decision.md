
## fix/seo-dominio-canonico (30/10/2026) — quem fez cada parte
- Código (SITE_URL única em lib/site.ts, títulos/descrições por página, labels, JSON-LD, revalidate do sitemap): Claude Code (opus), local.
- Revisão independente: sessão Codex somente leitura. r1 REQUEST_CHANGES (sitemap sem revalidação), r2 APPROVE.
- QA (vitest, typecheck, build e next start sem DATABASE_URL, curl de HTML/robots/sitemap): Grok Bot executor, local.
- Domínio: tvcomplexo.com.br às 01:47 BRT ainda mostrava o site antigo, por isso SITE_URL = https://tv-complexo.vercel.app.
