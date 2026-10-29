Corrigido, sem commit/push.

- `app/api/live/route.ts`: busca live ativa com `search.list`, `channelId`, `eventType=live` e `type=video`. Mantém o contrato de sucesso; falhas retornam `503` com `Cache-Control: no-store` e fetch sem cache.
- `components/home-urbano/CanalTopo.js`: preserva live/player em erro ou resposta inválida e tenta novamente no próximo ciclo.
- `__tests__/live.test.ts` e `__tests__/canal-topo-live.test.js`: cobrem os cenários solicitados.

`npx vitest run`: **11 arquivos e 748 testes aprovados**. `git diff --check` passou.

Não executei `next dev/start`, não usei `DATABASE_URL` nem alterei `.env`. A busca ativa custa 100 unidades por consulta, conforme a [documentação do YouTube](https://developers.google.com/youtube/data/reference/rest/v3/search/list).
