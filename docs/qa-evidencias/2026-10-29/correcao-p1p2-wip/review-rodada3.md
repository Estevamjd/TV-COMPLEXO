**REQUEST CHANGES**

- **P2 — Resposta inválida pode derrubar uma live confirmada.** Em [route.ts:107](/tmp/tv8/app/api/live/route.ts:107), `liveBroadcastContent` ausente também satisfaz `!== 'live'`, gerando `{ live: false }` cacheável. Além disso, a validação de `channelId` ocorre depois desse retorno. Assim, detalhes incompletos ou de canal incorreto podem substituir o estado confirmado e fazer o player voltar ao canal 24h. Valide canal e campos necessários antes de concluir ausência; respostas inconclusivas devem produzir `503 no-store`, preservando a live. Faltam testes desses casos após uma live confirmada.

Os tetos por processo, reserva síncrona, contagem de erros, reset em Pacific Time, backoff e deduplicação estão coerentes. A documentação explicita honestamente o bloqueio global e a perda dos controles em reinícios. Não identifiquei exposição da chave nas respostas.

Não editei arquivos nem executei Vitest. O resultado externo mencionado não consta no contexto recebido; a avaliação dos testes foi estática.
