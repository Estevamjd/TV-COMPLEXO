# /api/live: modo demonstração (29/10/2026)
- Padrão: a detecção automática fica DESLIGADA. A rota responde `{live:false, demo:true}` e faz zero chamadas ao YouTube. A home mostra "Demonstração: detecção automática de live desligada".
- Só `LIVE_YOUTUBE_AUTO='1'` liga a detecção. Essa variável não está configurada na Vercel.
- Uma resposta incompleta ou de outro canal nunca encerra uma live confirmada: a rota responde 503 no-store e mantém o estado.
- **BLOQUEADO:** a integração real precisa de um limite global de cota com estado compartilhado (KV/Redis/DB), e isso não foi autorizado. Os limites atuais valem só por processo.
- **Mudança de escopo vs DoD:** o aceite "selo da live em até 5 min com live real" não está cumprido nesta entrega.
