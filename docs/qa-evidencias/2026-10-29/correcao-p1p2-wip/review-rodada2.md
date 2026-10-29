**REQUEST CHANGES**

- **[P1] Cota e deduplicação não são globais.** [route.ts:77](/tmp/tv8/app/api/live/route.ts:77) e [route.ts:28](/tmp/tv8/app/api/live/route.ts:28). `estados` e `pendente` existem por processo. Duas instâncias com cache vazio podem executar `search.list` simultaneamente; compartilhar o Data Cache não fornece exclusão mútua. Os detalhes também são consultados por instância, invalidando o teto estimado de 720 chamadas/dia. É necessário controle compartilhado com reserva atômica de orçamento e deduplicação entre instâncias, com margem para ambos os limites.

- **[P1] Falhas permitem consumo sem limite de tentativas.** [route.ts:82](/tmp/tv8/app/api/live/route.ts:82). Quando a consulta falha, `expira` não avança e `pendente` é liberada. Cada requisição seguinte pode chamar o YouTube novamente, inclusive em uma única instância. Como o endpoint é público, isso permite amplificar consumo durante falhas e esgotar a cota. Separar o estado da live do controle de tentativas: manter 503 `no-store`, mas aplicar intervalo de retentativa e orçamento global também às chamadas malsucedidas. [O YouTube contabiliza inclusive requisições inválidas](https://developers.google.com/youtube/data/getting-started).

Os testes cobrem encerramento por `actualEndTime`/`liveBroadcastContent`, preservação da live no cliente e erros sem cache negativo. Porém, [live.test.ts:5](/tmp/tv8/__tests__/live.test.ts:5) simula o cache em memória, e a concorrência exercita apenas uma instância do módulo. Faltam cenários de múltiplas instâncias, falhas repetidas e orçamento diário; o teste da linha 138 inclusive espera retentativa imediata.

Sem arquivos alterados e sem executar Vitest. HEAD confirmado como `f9e05db`.
