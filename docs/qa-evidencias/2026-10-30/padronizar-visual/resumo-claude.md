# TV Complexo — padronização visual (ramo fix/padronizar-visual) — 30/10/2026

Nada foi commitado. Prints "depois" em /tmp/tvpad-prints/ (390x844 e 1440, tela e página inteira; medidas em medidas.json).
Conferido com `next start` sem DATABASE_URL + Playwright (Chrome /usr/bin/google-chrome).

## Itens pedidos
1. **Estilo urbano em todas as telas** (P0 #1, P2 #11, #14). Os tokens do urbano.module.css agora valem no `:root` (globals.css), e os tokens antigos `--color-*` apontam para a paleta urbana, então os estilos inline das páginas acompanham. Botões, cartões, selos, formulários, filtros, estado vazio, título de página (faixa amarela + Anton), comentários e compartilhar foram redesenhados. As fontes do urbano (next/font) ficaram no `<html>`; só a Anton é pré-carregada. Páginas: Vídeos, detalhe do vídeo, Notícias, detalhe da notícia, Denúncias (mapa), Enviar denúncia, Sobre e Privacidade. Tirei os emojis dos títulos, filtros, cards e selos. Cabeçalho e rodapé são os mesmos da Início (mesma placa do logo, mesmo tamanho). A Início não foi redesenhada. Os mapas usam tiles em cinza no lugar dos escuros.
   - O painel admin **continua no tema escuro**: app/admin/admin-tema.css é uma cópia gerada das regras antigas, com escopo `.admin-tema`, e só carrega no admin. Conferi /admin/login.
   - Sobre: os contatos de exemplo ("contato@tvcomplexo.com.br", "(21) 99999-0000") viraram os reais do rodapé antigo (tvcomplexofc@gmail.com, WhatsApp (21) 96603-0258).
2. **Uma navegação só** (P0 #2, P1 #4). lib/navegacao.js tem uma lista única: Início, Vídeos, **Mapa** (/denuncias), **Denunciar** (/denuncias/enviar, botão rosa), Notícias e Sobre. Ela alimenta a barra fixa de baixo (agora também na Início, até 1023px) e os links do cabeçalho (≥1024px, na Início e nas outras páginas). O item da tela atual fica destacado com `aria-current="page"`, e vale o item mais específico (/denuncias/enviar acende "Denunciar", não "Mapa"). `/mapa` → `/denuncias` com redirect 308 em next.config.mjs. O botão "Menu" foi **removido**: no celular a barra de baixo já tem todos os itens.
3. **Início com dados reais** (P0 #3). "Últimos vídeos" usa só a tabela `videos` (mesma fonte de /videos); sem vídeo, a seção some (acabou o fallback da playlist "exemplo"). O topo do canal 24h, enquanto a playlist do canal24h.json for placeholder, mostra e toca o vídeo mais recente do YouTube cadastrado. Sem nenhum, mostra a placa com o logo e "Assistir no YouTube". Saíram "Vídeo do canal X (exemplo)", "Player ainda não configurado", "Demonstração — vídeos de exemplo" e "foto do canal em breve". A grade some quando não tem nenhum programa (nada de "EM BREVE"), e o botão "Ver a grade" vira "Todos os vídeos". Também saiu "Painel admin" do rodapé público (P2 #12).
   - O código da live não foi mexido (detecção, /api/live, LIVE_YOUTUBE_AUTO, modo ?demo=live). Por isso o aviso "Demonstração: detecção automática de live desligada" **continua** aparecendo enquanto a rota responder demo.
4. **Espaço da barra fixa** (P1 #5). Abaixo de 1024px, o body tem `padding-bottom: calc(64px + env(safe-area-inset-bottom))`, a mesma altura da barra. Medido em todas as rotas a 390px: barra 64px e padding 64px. O toast fica acima da barra.
5. **Mapa sob o cabeçalho** (P1 #6). `.map-container` ganhou `isolation: isolate; z-index: 0` e o cabeçalho `z-index: 1100`. A 1440, rolando até o zoom ficar atrás do cabeçalho (que é sticky), o ponto do "+" pertence ao cabeçalho.
6. **Mapa não prende a rolagem** (P1 #7). A altura é `clamp(280px, 50vh, 420px)` no celular e 500px no computador. `scrollWheelZoom` fica desligado sempre. No toque (pointer: coarse), arrastar e pinçar começam desligados (touch-action auto) e o botão "Mexer no mapa"/"Travar o mapa" (aria-pressed) liga e desliga os gestos. Conferido no Playwright.
7. **Notícias vazia** (P1 #8). Continua no menu, agora com um estado vazio de verdade: "Ainda não tem notícia publicada" + "Ver os vídeos" + "Mandar pauta no WhatsApp". Notícias e Denúncias sem DATABASE_URL mostram a página vazia em vez da tela de erro. Com banco configurado, um erro continua indo para a tela de erro.

P2 também feitos: #10 o card sem capa (ex.: "INSTAGRAM") virou listras discretas + ícone, sem o bloco colorido gigante. #13 os links do rodapé têm no mínimo 44px de altura.
Correções que apareceram no caminho: /videos não quebra mais quando a API dá erro (lista vazia), não tem mais `<main>` dentro de `<main>` no detalhe do vídeo, e o resumo da notícia, que era amarelo, ficou legível no fundo claro.

## Selo "Canal 24h" × aviso de demonstração
**Apliquei a correção**, com o CSS idêntico ao do ramo fix/selo-aviso-demo (`git diff d8424c0 FETCH_HEAD`): `.demoNota { max-width: calc(100% - 128px) }` e `.demoNota { max-width: none }` a partir de 1024px. Aqui ainda não tinha. Medido a 390px: aviso x 16–246, selo x 252–380, sem sobreposição.

## Testes e verificações
- `npx vitest run`: **806 testes passando em 14 arquivos** (antes eram 784). **22 novos**:
  - __tests__/navegacao.test.js (13): aria-current por rota, barra também na Início, Mapa ≠ Denunciar, admin sem barra, cabeçalho com a mesma lista.
  - __tests__/redirect-mapa.test.js (1): /mapa → /denuncias permanente.
  - __tests__/home-sem-dados.test.js (8): sem DATABASE_URL a Início não consulta o banco (db mockado) nem mostra "exemplo", "Player ainda não configurado", "em breve", "Vídeo do canal N"; esconde vídeos, notícias e grade; não tem link /admin.
  - Nenhum teste escreve no banco. O vitest.config.js agora também transforma JSX em app/*.js.
- `npx tsc --noEmit`: ok.
- `next build` sem DATABASE_URL: ok.
- eslint: 4 erros, os mesmos que já existiam no HEAD (admin/noticias, admin/videos, CommentSection, videos/page fetchVideos). Nenhum erro novo.
- next start sem DATABASE_URL: todas as rotas respondem 200, /mapa 308 → /denuncias, sem rolagem horizontal a 390 e 1440.

## Para decidir
- O aviso de demonstração da live continua no topo (pediram para não mexer no código da live).
- A playlist do canal24h.json ainda é placeholder; o topo usa o vídeo mais recente do banco até ela ser preenchida.
- O cabeçalho é fixo (sticky) só a partir de 1024px; no celular ele rola junto (a navegação fica na barra de baixo).
