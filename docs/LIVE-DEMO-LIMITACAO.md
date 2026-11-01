> **Substituído em 01/11/2026 (missão tv-complexo-live-e-topo):** a detecção agora usa só chamadas de 1 unidade (`playlistItems` + `videos`), com cache de 60 s, e fica ligada quando há `YOUTUBE_API_KEY` (`LIVE_YOUTUBE_AUTO=0` desliga). Ver `lib/live.ts`, o README e `docs/pr-notas-live.md`. O texto abaixo é histórico.

# /api/live: modo demonstração (29/10/2026)
- Padrão: a detecção automática fica DESLIGADA. A rota responde `{live:false, demo:true}` e faz zero chamadas ao YouTube. A home mostra "Demonstração: detecção automática de live desligada".
- Só `LIVE_YOUTUBE_AUTO='1'` liga a detecção. Essa variável não está configurada na Vercel.
- Uma resposta incompleta ou de outro canal nunca encerra uma live confirmada: a rota responde 503 no-store e mantém o estado.
- **BLOQUEADO:** a integração real precisa de um limite global de cota com estado compartilhado (KV/Redis/DB), e isso não foi autorizado. Os limites atuais valem só por processo.
- **Mudança de escopo vs DoD:** o aceite "selo da live em até 5 min com live real" não está cumprido nesta entrega.
