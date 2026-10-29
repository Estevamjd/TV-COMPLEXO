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

## Correção P1/P2 — progresso parcial (WIP, NÃO commitado no feat/home-urbano)
Implementação: Codex CLI (gpt-6.1-sol), porque Claude Code está limitado até 16:20 BRT. Pasta `correcao-p1p2-wip/`.
- **Rodada 1** (`rodada1-fix.diff`): /api/live usa `search.list` (channelId, eventType=live, type=video) + `videos.list`; erro → 503 `no-store`, fetch sem cache; cliente preserva live/player em erro. Vitest LOCAL (fora do sandbox): **748/748** (11 suítes); `next build` passou sem DATABASE_URL.
- **Uso da API na rodada 1:** por requisição sem cache = 1 search.list (100 un.) + 1 videos.list (1 un.). Cache de sucesso: `s-maxage=120, stale-while-revalidate=60` (só CDN). Cache de erro: nenhum (503 no-store). Estimativa: até 720 buscas/dia ≈ 72.000–72.720 un./dia.
- **Re-review independente rodada 1** (`review-rodada1.md`): **REQUEST CHANGES** — P1 cota (720 buscas/dia > 10.000 un. e > bucket de 100 search.list/dia; GET público sem limite global); P2 `actualEndTime` não verificado (live encerrada ainda marcada ativa).
- **Rodada 2 em andamento**: cache de servidor compartilhado com TTL de busca ≥ 900 s (≤ 96 search.list/dia), deduplicação de concorrência, revalidação de live conhecida via videos.list (1 un.) ~120 s, checagem de actualEndTime/liveBroadcastContent, mantém último estado confirmado em erro. Nenhuma chave, acesso ou OAuth novo.

## Vercel (registro, nada alterado)
- O push deste branch de evidências gerou automaticamente a preview `dpl_TgcjyLTKTGiGPYcnHazRJiUJHZ9b` (READY, target null = preview, não produção). Não foi criada por nós manualmente; não alteramos configuração.
- Confraria `4cdf31a` (branch qa/evidencias-2026-10-29-wip): deploy automático ficou "blocked" (autor do commit não vinculado). Esperado; não alteramos a Vercel.

## Correção P1/P2 — atualização 14:20 BRT (ainda WIP, NADA enviado ao feat/home-urbano)
**Correção do modelo de cota** (docs oficiais, atualizados em 15/10/2026): search.list tem bucket **próprio de 100 chamadas/dia, custo 1**; videos.list e os outros endpoints dividem **10.000 unidades/dia**; reset à meia-noite do Pacífico; requisições com erro também contam. A conta de "72.000 unidades" da rodada 1 usava o modelo antigo e está **descartada**. Rodada 1 pelo modelo atual: até 720 search.list/dia, contra um bucket de 100.

| rodada | o que mudou | Vitest LOCAL (fora do sandbox, sem DATABASE_URL, base f9e05db + WIP) | review independente do Codex |
|---|---|---|---|
| 1 | search eventType=live, 503 no-store | 748/748, build OK | REQUEST CHANGES (cota, actualEndTime) |
| 2 | unstable_cache TTL 960 s, dedup, videos.list 120 s, actualEndTime | 755/755, build OK | REQUEST CHANGES: limite/dedup só por processo; falha permitia retentativa imediata |
| 3 | backoff nas falhas (search ≥300 s, videos ≥120 s, até 960 s); teto por processo (40 search e 600 videos por dia, erros contam, reset no horário do Pacífico) | 758/758, build OK | REQUEST CHANGES P2: liveBroadcastContent ausente ou channelId divergente derrubava a live confirmada |
| 4 (parcial) | detecção automática DESLIGADA por padrão (só com LIVE_YOUTUBE_AUTO='1', que não existe na Vercel) → `{live:false, demo:true}`; aviso na tela "Demonstração: detecção automática de live desligada" | 766/766 (11 suítes) | **não feito**: o Codex atingiu o limite de uso às 13:52 BRT, libera às 14:57 BRT |

**Uso da API / cache (código atual):** com a flag ausente, **zero chamadas** ao YouTube. Com a flag ligada: descoberta = 1 search.list, live conhecida = 1 videos.list a cada 120 s; sucesso 120 s; erro sem cache (503 no-store) mais backoff; tetos **por processo**.

**BLOQUEIO, detecção automática:** um limite GLOBAL entre instâncias da Vercel precisa de armazenamento atômico compartilhado (KV, Redis ou DB). Não é permitido sem o Estevam. Limites em RAM não valem entre reinícios, cold starts nem várias instâncias. Intervalo longo **não** resolve a cota. **A integração real NÃO está aprovada.**

**Comparação com o DoD (mudança de escopo):** o DoD previa detectar a live automaticamente. A entrega passa a ser **modo demonstração**: sem live real nem manual, com aviso na tela. A detecção real depende do store global, da chave da YouTube e de uma live real para validar.

**Pendências da rodada 4:** confirmar a correção do P2 da rodada 3, criar o teste do aviso na tela com demo:true, e fazer a review independente final. Sem APPROVE, não há push no feat/home-urbano.
Arquivos: `rodada2-fix.diff`, `rodada3-fix.diff`, `rodada4-parcial-com-testes.diff` (inclui os testes novos), `review-rodada2.md`, `review-rodada3.md`.
