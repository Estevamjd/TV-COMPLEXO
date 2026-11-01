# PR (rascunho): tira o Canal 24h, põe a live automática na Início e troca o topo (Adesivo)

Branch `feat/live-e-topo`, criada a partir de `feat/nome-complexo-das-favelas` (`461fb49`, PR #14). Missão `tv-complexo-live-e-topo`, **itens 1, 2 e 3** do `01-frontend-claudecode.md`, mais a **rodada pós-QA (A a J)**, que ainda não foi commitada (ver a seção no fim).
Ainda **não houve** commit, push, deploy nem merge. O banco (item 4b) não foi mexido. Skill usada: UI UX Pro Max.

## Item 1: Canal 24h removido

- **Saíram:** `lib/canal24h.ts`, `lib/canal24h.json`, a rota `app/api/hora` (relógio do canal) e os testes ligados a eles (`canal24h`, `canal-topo-autoplay` e `canal-topo-live`). `lib/video-reserva.ts` também saiu no commit `5673642`, mas **voltou na rodada A–J** (é o último recurso do topo sem live).
- **Topo (`CanalTopo.js`):** acabaram o relógio, a sincronização com a IFrame API, o carimbo "Canal 24h sem parar", os textos "Canal 24h · agora…" e "A seguir…" e o botão "Ver a grade". (O vídeo mais recente em loop e o "Liga a TV!" também tinham saído, e **voltaram na rodada A–J**.)
- **Faixa animada:** antes dizia "CANAL 24H ● O FATO, VISTO DE PERTO"; agora diz "O FATO, VISTO DE PERTO ● A REAL DA FAVELA". O botão de pausar a faixa continua.
- **Grade (`GradeSemana.js`):** "Agora: canal 24h" no dia de hoje virou "Em breve" (igual aos outros dias). "Agora" só aparece quando tem programa no ar.
- **SEO da Início:** o título e a descrição não falam mais em "Canal 24h". Título: "TV Complexo das Favelas — A Real da Favela | TV comunitária do Complexo do Alemão".
- **Redirect:** o canal **nunca teve rota própria**, porque morava no topo da Início. Mesmo assim, para ninguém cair em 404, `/canal24h`, `/canal-24h` e `/24h` mandam para `/` (308), em `next.config.mjs`.
- **Manifest/sitemap:** não tinham atalho nem URL do canal, então não mudaram.
- **`rg -i "24 ?h|sem parar|canal24"`** (fora de `docs/` e do `package-lock.json`) só encontra:
  - o redirect e os testes dele;
  - o teste que garante que a Início não tem resto do canal;
  - `app/api/auth/route.js`, linhas 65 e 73: é a validade de 24 h do login do admin, sem relação com o canal. Ficou como estava.
- `docs/qa-evidencias` e `docs/pr-notas.md` continuam citando o canal porque são histórico e não foram alterados.

## Item 2: live automática na Início

> Esta seção descreve o commit `5673642` (só o caminho com chave). A rodada A–J, no fim, acrescentou a detecção **sem chave**, o RSS, o cache único e mudou o topo sem live. Onde as duas divergem, vale a rodada A–J.

Segui o `stack-decision.md` da missão:

- **Detecção só no servidor**, em `lib/live.ts`:
  - `playlistItems.list` na playlist de uploads (`UC…` → `UU…`, 10 vídeos mais recentes): 1 unidade;
  - `videos.list` com `snippet,liveBroadcastContent` desses vídeos: 1 unidade;
  - **nunca** `search.list`.
- **Cache:** 60 s em memória, com consultas simultâneas deduplicadas. O `fetch` também usa o cache de dados do Next (`revalidate: 60`), que é compartilhado entre instâncias na Vercel. No pior caso são cerca de 2.880 unidades por dia por instância, dentro da cota grátis de 10.000.
- **Validações:** só conta live do próprio canal, com `liveBroadcastContent === 'live'` e sem `actualEndTime`.
- **Fallback silencioso:** se faltar a chave, a cota estourar, a rede falhar, a resposta vier estranha ou passar de 2,5 s, o resultado é `{ live: false }`. Nada de erro na tela, e a falha também fica 60 s em cache, para não martelar a API.
- **Como a Início usa:** `app/page.js` chama `statusDaLive()` junto com as consultas ao banco. Com live, o HTML **já sai do servidor com o player**, então ele começa a tocar antes da hidratação e não há salto de layout. Sem live, o topo é só a barra de navegação: sem iframe, sem pôster, sem polling e sem nenhum pedido extra no navegador.
- **Com live:**
  - topo rosa com "Tá no ar!";
  - player `youtube-nocookie` com `autoplay=1&mute=1&playsinline=1`;
  - logo abaixo do player: o botão grande **"Ligar o som"** (56 px, `aria-pressed`, aviso para leitor de tela; usa unMute/mute por postMessage, sem recarregar) e **"Assistir no YouTube"** (`youtube.com/watch?v=<id da live>`, nova aba, `noopener`);
  - selo **AO VIVO** com o horário de início, carimbo "No ar ao vivo" e "Compartilhar" (que já existia na live).
- **`/api/live`:** reaproveitada. Agora devolve o mesmo status da Início, sempre 200, com `s-maxage=60`.
- **Variáveis** (só servidor, documentadas no README e no `.env.example` com placeholders):
  - `YOUTUBE_API_KEY`;
  - `YOUTUBE_CHANNEL_ID` (se faltar ou for inválido, usa `UC63_rDkhmAv1bMm55PsyzOw`);
  - `LIVE_YOUTUBE_AUTO`;
  - `LIVE_MOCK_VIDEO_ID`.
- Nenhuma chave entrou no código nem no repo.

### Mudanças de comportamento que precisam de OK antes do deploy

1. **`LIVE_YOUTUBE_AUTO` mudou de sentido.** Antes era opt-in (`'1'` ligava) porque o `search.list` gastava muita cota. Com as chamadas de 1 unidade, a detecção **liga sozinha quando existe `YOUTUBE_API_KEY`**, e `LIVE_YOUTUBE_AUTO=0` vira o interruptor de emergência. Isso atende ao "detecção automática, sem mexer em código". **Antes do deploy, confira na Vercel** se `YOUTUBE_API_KEY` está configurada em Production/Preview. Sem ela, a Início nunca mostra live.
2. **`?demo=live` saiu.** Era um modo visual aberto a qualquer visitante. No lugar entrou `LIVE_MOCK_VIDEO_ID`, que é uma variável de servidor.
3. ~~**Sem live, o topo não tem mais player.**~~ **Revertido na rodada A–J (item A):** sem live, o topo volta a tocar o vídeo mais recente. Até o PR #14, o topo tocava o vídeo mais recente (ou a reserva) em loop, que era o "canal sem parar" visto na prática. Li "sem live = home igual à de hoje, sem bloco vazio, sem peso no carregamento" como a Início **sem o canal 24h**: barra, faixa e depois as seções de sempre (Reels, vídeos, notícias, grade, chamadas). O `h1` continua lá para leitor de tela ("TV Complexo das Favelas: a real da favela").

## Item 3: topo novo, opção 2 "Adesivo" (escolha do Estevam)

Segui `design/OPCOES.md` (opção 2), `design/contraste.md` e os prints `2-adesivo-*`.

- **O que mudou:** logo e "DAS FAVELAS" agora formam **um adesivo só**. Em cima fica a parte preta com o logo; embaixo, a faixa rosa com "DAS FAVELAS" em Anton preto, centralizada. Borda de 3 px, sombra rosa sólida (a mesma linguagem do player) e inclinação de -2°.
  - **Computador (≥ 1024 px):** logo com 32 px de altura, nome em 28 px, sombra de 7 px.
  - **Celular e tablet (< 1024 px, incluindo 768):** logo com 24 px, nome em 20 px, sombra de 5 px.
- **Onde:** a mesma barra (`BarraNavegacao`) serve a Início e as páginas internas, então o adesivo aparece igual nas duas. O rodapé continua com a versão escura de antes (fora do escopo do topo).
- **Ao vivo:** o topo fica rosa, então a faixa vira **amarela** e a sombra vira **preta**, igual à moldura do player na live. Sem isso, o rosa sumiria no fundo rosa.
- **Logo:** o PNG é o mesmo (`logo-header-cropped.png`), sem recorte nem troca. O nome aparece sempre completo: "TV COMPLEXO" (no logo) + "DAS FAVELAS".
- **Contraste** (valores de `contraste.md`):
  - faixa sem live: preto sobre `#FF3D8B`, **5,66:1**;
  - faixa ao vivo: preto sobre amarelo, **13,38:1**;
  - menu e botão: sem mudança.
- **Foco no teclado:** anel preto de 4 px, afastado 6 px do adesivo para não se misturar com a sombra. Fica com 13,38:1 sobre o amarelo e 5,66:1 sobre o rosa.
- **Hover:** o adesivo sobe 2 px e a sombra cresce, como nos botões. Com `prefers-reduced-motion`, não há transição.
- **Respiro do "Tá no ar!":** o adesivo ficou mais alto que a placa antiga, e o acento do "TÁ" chegava a 2 ou 3 px da sombra. Aumentei a margem de cima do título da live (`.grito`: de 4 para 16 px no celular e de 20 para 36 px no computador).
- **Arquivos:**
  - `components/BarraNavegacao.js`: só foi acrescentada a classe `adesivo` ao link da marca. A marcação continua a mesma.
  - `components/home-urbano/urbano.module.css`: bloco `.adesivo`, tamanhos de computador, `prefers-reduced-motion` e margem do `.grito`.
  - `__tests__/barra-navegacao.test.js`: teste novo. Confere que a Início e as páginas internas usam o adesivo, com o logo de sempre e "das Favelas" por extenso. Conferi que ele falha se a classe for removida.

### Divergências dos mockups (de propósito)

- **Tema escuro:** o site público não tem tema escuro (nem `prefers-color-scheme`, nem chave de tema). Criar um só para o topo deixaria o resto da página claro, então não criei. A cor da borda está numa variável, `--adesivo-borda`, que hoje é a tinta. Se um tema escuro entrar, basta trocá-la para creme `#F4EFE4`, como no mockup escuro. O preto do adesivo e a faixa rosa já funcionam sobre `#161412`.
- **Botão MENU no celular:** não entrou. O site usa a barra de baixo (BottomNav) para navegar no celular, e o MENU dos mockups era só para preencher o print.
- **Menu em 15 px:** ficou em 16 px, como já estava. Mantive o mínimo de 16 px para texto.

### Conferência do item 3

- Fiz a conferência com Playwright e `next start`, em dois servidores: sem live, e com live simulada por `LIVE_MOCK_VIDEO_ID`. Olhei a Início sem live, a Início com live e `/videos` (página interna), em 360, 390, 768 e 1440 px.
- **Resultado: 12 de 12 sem problema.** Em todas:
  - sem rolagem lateral;
  - adesivo, com a sombra, inteiro dentro da tela;
  - "DAS FAVELAS" sem corte;
  - nada encostando no adesivo dentro da barra.
- Distância entre a sombra e o título "Tá no ar!": 22,5 px no celular e 47,7 px no 1440.
- Esses prints são só de conferência e não entraram no repo.

## Simulação para prints (só prévia/teste)

```bash
VERCEL_ENV=preview LIVE_MOCK_VIDEO_ID=<id de 11 caracteres de um vídeo que esteja AO VIVO agora> npm run dev
```

- Simula a live sem chamar a API. O título fica "Live de teste (simulação)" e `/api/live` responde `no-store`.
- **Só liga com `VERCEL_ENV=preview`** (rodada R2). Fica desligada sem a variável, com um ID inválido e com `VERCEL_ENV` igual a `production`, `development` ou não definido. Por isso, localmente é preciso passar `VERCEL_ENV=preview` junto, como no comando acima. Na Vercel, se for usar, configure só no ambiente Preview, nunca em Production.
- Se o ID não for de uma live no ar, o player do YouTube mostra "Vídeo indisponível". Isso aconteceu nos meus prints de conferência, porque usei um ID antigo.
- Para testar a detecção **de verdade** num canal de teste ao vivo, sem chave: `YOUTUBE_CHANNEL_ID=UC…(canal ao vivo) npm run dev`. Pela API (opcional): acrescente `YOUTUBE_API_KEY=…`. Canal real fora do ar = Início com o vídeo mais recente.

## Verificação

- *(Números do commit `5673642`; os da rodada A–J estão no fim.)*
- `npm test`: **16 arquivos, 803 testes passando** (802 dos itens 1 e 2 + 1 do item 3).
  - `__tests__/live.test.ts`, reescrito. **Com live:** acha a live e usa só `playlistItems` + `videos`. **Sem live:** uploads sem transmissão no ar dão `{live:false}`. Também cobre: nunca usa `search`; ignora live encerrada ou de outro canal; falhas 403, rede e resposta inválida viram sem live; funciona sem chave e com `AUTO=0`; usa o canal padrão; cache de 60 s com deduplicação; a simulação liga e é bloqueada em produção; ID de simulação inválido é ignorado; e os casos de `/api/live`.
  - `__tests__/home-live.test.js`, novo. Com live: o iframe vem com autoplay mudo e há AO VIVO, "Ligar o som" e "Assistir no YouTube" (com o link certo), nessa ordem, depois do player. Sem live: nada de player, selo ou bloco do herói, e o resto da Início igual. Também garante que nenhum texto do Canal 24h aparece na Início.
  - `__tests__/redirect-canal-antigo.test.js`, novo: os redirects.
  - `__tests__/home-sem-dados.test.js`: atualizado (o topo sem live não tem player).
- `npm run build`: passa.
- `npm run lint`: **5 erros e 8 avisos, os mesmos da base** (InstagramReel, TikTokFeed, TikTokVideo, `lib/db.ts` e páginas antigas). Nenhum é dos arquivos novos ou alterados. `tsc --noEmit` passa.
- gitleaks (árvore de trabalho): só aponta `.next/` (chaves de preview que o Next gera no build, ignoradas pelo git). Nada no código.
- **Conferência visual** (Playwright, `next start`, com e sem simulação) em 1440, 768, 390 e 360: sem rolagem lateral nem corte. No 1440, o carimbo "No ar" foi ajustado para não encostar em "Enviar denúncia". Esses prints não são os oficiais e não entraram no repo.
- **Não rodei:** Lighthouse antes/depois e os prints oficiais de todas as páginas (ficam para o fechamento/QA). Também não houve teste com live real, porque não tenho chave aqui.

## Riscos conhecidos

- O YouTube pode demorar alguns minutos para pôr uma live recém-aberta na playlist de uploads. Somando o cache de 60 s, a live pode aparecer na Início com uns minutos de atraso.
- Só olho os 10 uploads mais recentes. Uma live agendada há muito tempo, com mais de 10 vídeos publicados depois dela, não seria vista. É raro, e dá para subir para 50 sem custo de cota.
- Quem já está com a Início aberta não vê a live que começar depois (precisa recarregar). E quando a live acaba, o player mostra a tela de fim do próprio YouTube. Escolhi assim para não pesar quando não há live (ver a proposta 6).

## Rodada pós-QA, itens A a J (NÃO commitada)

Base: o `stack-decision.md` revisado (sem chave por enquanto; detecção pela página `/live`, decisão do Chief de 01/11 16:23) e os achados R15-1 e R15-2 do `QA.md`. Skill usada: UI UX Pro Max. Nada instalado. Sem commit, push, deploy ou merge.

### A) Sem live, o topo volta a ser o da base `461fb49`
- Sem live (inclusive sem chave, falha, timeout ou dúvida): "Liga a TV!", o vídeo mais recente tocando sozinho, mudo e em loop, com "Vídeo mais recente", o título e "Do canal @tvcomplexofc no YouTube.". Sem nenhum texto de 24h/sem parar/Canal 24h.
- **De onde vem o vídeo:** do RSS público do canal (`https://www.youtube.com/feeds/videos.xml?channel_id=UC63_rDkhmAv1bMm55PsyzOw`), no servidor, em `lib/rss-canal.ts`. Primeira `<entry>` do feed, timeout de 2,5 s, cache de 10 min (falha fica só 1 min), consultas simultâneas deduplicadas.
- **Se o RSS falhar:** o comportamento anterior, em `lib/video-reserva.ts` (restaurado): o mais recente do banco, se for do YouTube; senão, o vídeo de reserva (`hTBno4SXUgI`, "Vídeo em destaque").
- O HTML do servidor traz o pôster; o iframe entra depois da hidratação (como na base). A live continua com o iframe já no HTML do servidor.

### B) `?demo=live` continua removido; `LIVE_MOCK_VIDEO_ID` só para prévia/teste
- Não há leitura de `searchParams` na Início. Teste: `/?demo=live` renderiza igual ao normal e não tem "demo" no HTML.
- **Atualizado na rodada R2:** `LIVE_MOCK_VIDEO_ID` **só vale com `VERCEL_ENV=preview`**. É ignorada em `production`, em `development` e quando `VERCEL_ENV` não está definido (antes, só `production` bloqueava). Testado nos 4 casos. Documentado no README, no `.env.example` e no topo de `lib/live.ts`. **Nunca configure essa variável em Production.**

### C) Som: botão pequeno, só ícone, dentro do player
- `.somPlayer`: 44×44 px (48 no computador), canto de cima à esquerda do vídeo, longe da barra de controles e do botão de tela cheia do YouTube, que ficam embaixo.
- `aria-label` "Ligar o som" / "Desligar o som" e `aria-pressed`; o SVG é `aria-hidden`. Aviso para leitor de tela ("Som ligado."), unMute/mute por postMessage sem recarregar o iframe, na origem do próprio iframe (nocookie ou youtube.com).
- Cores: amarelo sobre tinta (13,38:1); ligado, tinta sobre rosa (5,66:1). Foco visível (contorno amarelo com anel de tinta).

### D) "Assistir agora" é o botão principal
- Abre o vídeo exato no YouTube (`watch?v=<id>`, da live ou do vídeo mais recente), `target="_blank"`, `rel="noopener noreferrer"` e texto para leitor de tela "(abre o YouTube em nova aba)". Na live é o botão grande (56 px). "Assistir no YouTube" e o "Ligar o som" com texto saíram.

### E) Fitas decorativas do player removidas
- Os dois `.tape` dos cantos do player saíram do JSX. A classe `.tape` continua no CSS porque é usada nos pôsteres da fileira de vídeos (`app/page.js`). O adesivo do topo continua.

### F) Tela cheia
- `allowFullScreen` e `allow="…; fullscreen"` no iframe, e `fs=1` em todos os embeds (vídeo avulso e live).

### G) Player da live: `embed/<videoId>` (substituído na rodada R2)
- ~~Quando a live vem da página `/live`, o player é `embed/live_stream?channel=…`.~~ Saiu na rodada R2.
- Agora toda live (API, página `/live` ou simulação) usa `https://www.youtube.com/embed/<videoId>` com o `videoId` detectado e `autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&fs=1`. `embed/live_stream?channel=` não é mais usado. "Assistir agora" aponta para o `watch?v=` do mesmo vídeo.
- O vídeo avulso (sem live) continua em `youtube-nocookie.com/embed/<id>` com loop.
- O status da live ganhou `fonte` (`api`, `pagina` ou `simulada`) e `canal`, também em `/api/live`.

### H) Detecção sem chave pela página `/live`
- `GET https://www.youtube.com/channel/<canal>/live` no servidor, User-Agent de Chrome estável no Windows, `Accept-Language: pt-BR`, `redirect: 'manual'`, timeout de 2,5 s, cache de 60 s.
- **Live somente** com `<link rel="canonical" href="https://www.youtube.com/watch?v=ID">` **e** `"isLive":true`. Acrescentei uma terceira trava, mais restritiva: a página precisa citar `"channelId":"<o próprio canal>"`. Só pode tirar live, nunca criar.
- **Sem live** se houver `"isUpcoming":true`, `upcomingEventData`, `LIVE_STREAM_OFFLINE`, `consent.youtube.com`/`consent.google.`, `/sorry/`, "unusual traffic"/"tráfego incomum", `id="captcha-form"` ou `class="g-recaptcha"` (formulário de desafio); se a resposta não for 200 (redirect, 429, 500…); se tiver sido redirecionada para fora de `www.youtube.com`; ou se faltar qualquer sinal. Nada tenta contornar consentimento ou bot.
- **`isUpcoming`:** rejeito `"isUpcoming":true`, e não a simples presença da palavra, porque uma página de live pode trazer `"isUpcoming":false`. `upcomingEventData` e `LIVE_STREAM_OFFLINE` rejeitam por presença, como pedido.
- Título vem de `<meta name="title">` e o horário de início de `"startTimestamp"` (se existir).
- **Com `YOUTUBE_API_KEY`, a API tem precedência** e a página nunca é lida, nem quando a API falha (falha = sem live). `LIVE_YOUTUBE_AUTO=0` desliga os dois caminhos.
- **Conferência no YouTube real** (01/11, canal fora do ar): `/live` respondeu 200 com canonical do canal (sem `watch?v=`) e sem `"isLive":true`, e `statusDaLive()` deu `{ live: false }`. O RSS respondeu com o vídeo mais recente. **Live real não foi testada** (o canal não estava ao vivo); as fixtures de live, agendada e consentimento são **sintéticas**, montadas no formato da página (`__tests__/fixtures/`).
- **Achado com página real (01/11): a regra `/captcha/i` derrubava toda live.** A página `/live` normal do YouTube sempre traz `"RECAPTCHA_V3_SITEKEY"` e `.grecaptcha-badge` (reCAPTCHA invisível), então a live no ar do Lofi Girl (`UCSJ4gkVC6NrvII8umztf0Ow`) dava `{live:false}`. Corrigido: bloqueio só por sinal específico de desafio (lista acima), dúvida continua = sem live. Regressão com reduções fiéis das páginas reais em `__tests__/fixtures/youtube-real-live-lofigirl.html` (live, `0sfDth4lMLc`) e `youtube-real-offline-tvcomplexo.html` (sem live); conferido também nas páginas completas. O teste de regressão falha se `/captcha/i` voltar.

### I) R15-1: contraste do carimbo "No ar / ao vivo"
- Antes: `#E3170A` sobre o fundo semitransparente do carimbo, que no rosa vira ~`#FAF4EC`: **4,37:1** (22 px normal, mínimo 4,5). Sobre o vídeo escuro, o fundo .92 podia cair para ~`#E6E3DD` (3,73:1).
- Agora: fundo do carimbo **opaco** (`--paper` `#FAF7F0`) e cor nova só para o carimbo ao vivo, `--live-ink: #C8140A`. **Razão: 5,51:1** (WCAG 2.x, luminância relativa: L(#C8140A) = 0,1356, L(#FAF7F0) = 0,9302, (0,9302+0,05)/(0,1356+0,05) = 5,51). Vale em qualquer largura, inclusive 390 px, porque o fundo não depende mais do que fica atrás.
- Sem live, o carimbo azul `#2B3BFF` sobre `#FAF7F0` fica em 6,19:1. O vermelho `--live` da faixa e do selo AO VIVO (branco sobre `#E3170A`) não mudou.

### J) R15-2: um cache só para a Início e `/api/live`
- Causa: no Next, a Início e `/api/live` são bundles diferentes, e cada um tinha a sua cópia do cache em memória de `lib/live.ts`.
- Correção: o cache (e a promessa pendente) agora fica em `globalThis[Symbol.for('tv-complexo.live')]`, compartilhado por todas as cópias do módulo no mesmo processo. O RSS usa o mesmo esquema.
- Os `fetch` da API, da página e do RSS agora são `cache: 'no-store'`: o cache é só o nosso. A página `/live` tem ~1 MB e não caberia bem no data cache do Next. Isso também evita o problema do QA de uma resposta ruim ficar presa no data cache.
- **Teste que prova:** `__tests__/live.test.ts`, "R15-2". Recarrega o módulo com `vi.resetModules()` (simula o segundo bundle) e chama a Início e o `GET` de `/api/live`. Resultado: **1** fetch da página sem chave e **2** com chave (playlistItems + videos), não o dobro. Conferi que o teste **falha** se o cache voltar a ser por módulo.
- Teto: por instância, uma leitura da página `/live` por minuto (sem chave) ou 2 unidades/min (com chave). Várias instâncias serverless continuam somando, cada uma com o seu cache.

### Arquivos desta rodada
- `lib/live.ts`: caminho sem chave (página `/live`), `fonte`/`canal` no status, cache em `globalThis`, `no-store`.
- `lib/rss-canal.ts` (novo): vídeo mais recente pelo RSS.
- `lib/video-reserva.ts` (restaurado): mais recente do banco + reserva, quando o RSS falha.
- `app/page.js`: busca o RSS junto com a live e o banco; `destaque = RSS ?? banco ?? reserva`.
- `app/api/live/route.ts`: `no-store` só para a simulada (agora por `fonte`).
- `components/home-urbano/CanalTopo.js`: topo sem live da base, som só ícone dentro do player, "Assistir agora", sem fitas, tela cheia, `embed/<videoId>` para a live (R2).
- `components/home-urbano/urbano.module.css`: `.somPlayer`, pôster, `--live-ink`, fundo opaco do carimbo.
- `README.md`, `.env.example`: variáveis e o caminho sem chave.
- Testes: `live.test.ts` (reescrito em parte: página `/live`, precedência da API, mock em produção, R15-2), `rss-canal.test.ts`, `home-sem-live.test.js`, `canal-topo-player.test.js`, `video-reserva.test.js` (novos), `home-live.test.js` e `home-sem-dados.test.js` (atualizados). Fixtures sintéticas em `__tests__/fixtures/`.

### Verificação da rodada
- `npm test`: **20 arquivos, 906 testes passando.** Cobre: sem live, sem chave, falha da API e falha/timeout/redirect da página = vídeo mais recente; página ao vivo (fixture) = live (na R2: com `embed/<videoId>`); agendada, offline e consentimento = sem live; os dois sinais precisam concordar; precedência da API com chave; mock ignorado em produção (na R2: só vale em `preview`); `?demo=live` sem efeito; C a F; cache único (R15-2); RSS e cair no banco/reserva.
- `npm run build` (com `env -i`): passa. `tsc --noEmit`: passa.
- `npm run lint`: **5 erros e 8 avisos, os mesmos da base**, nenhum nos arquivos desta rodada.
- **Não rodei:** prints, axe e Lighthouse desta rodada (ficam para o QA, inclusive conferir o R15-1 no navegador em 390 px); live real; chave real.

### Riscos novos
- **A página `/live` não é oficial.** Se o YouTube mudar o HTML, o efeito é a Início deixar de mostrar a live (falha segura), nunca mostrar live falsa. O YouTube também pode passar a responder com consentimento ou bloqueio para IPs da Vercel; nesse caso, idem.
- **Falso negativo possível:** se a página de uma live no ar trouxer `upcomingEventData` de outro vídeo (ex.: lista lateral), a live não é detectada. Foi aceito pela regra "qualquer dúvida = sem live".
- **RSS:** uma live agendada ou um Short podem ser a primeira entrada do feed, e aí o topo sem live mostra esse item. Uma live agendada no player aparece como "aguardando". O RSS não diz o tipo do vídeo; se incomodar, dá para pular entradas com o mesmo ID de uma live agendada.
- ~~**`live_stream` × vídeo detectado:** player e "Assistir agora" podiam divergir.~~ Resolvido na R2: os dois usam o mesmo `videoId`. Risco que fica: se a live acabar e outra começar dentro da janela de 60 s do cache, o player mostra a tela de fim da anterior até o próximo carregamento.

## Rodada R2

### R2-2) Live com `videoId`: player em `https://www.youtube.com/embed/<videoId>`
- `urlEmbedDaLive(live)` em `components/home-urbano/CanalTopo.js` agora devolve sempre `https://www.youtube.com/embed/<videoId>?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&fs=1`, para API, página `/live` e simulação. `urlEmbedLiveDoCanal` (`live_stream?channel=`) saiu.
- Mantidos: início mudo (`mute=1`), botão de som só com ícone e `aria-label` "Ligar o som"/"Desligar o som" (postMessage na origem `https://www.youtube.com`), `allowFullScreen` + `allow="…; fullscreen"` + `fs=1`, e "Assistir agora" no `watch?v=` do mesmo vídeo.
- Testes: `canal-topo-player.test.js` (URL exata nas 3 fontes, sem `live_stream`/`channel=`; player, som, tela cheia e "Assistir agora" com live da API, da página e simulada), `home-live.test.js` e `home-sem-live.test.js` (HTML da Início com live sem chave: `embed/liveAgora01`, sem `live_stream` nem `channel=`).

### R2-1) `LIVE_MOCK_VIDEO_ID` só em `VERCEL_ENV=preview`
- `lib/live.ts`: a simulação só liga com `VERCEL_ENV === 'preview'`. Ignorada em `production`, `development` e sem `VERCEL_ENV`.
- Testes em `live.test.ts`: os 4 casos (preview simula sem chamar o YouTube; production, development e indefinido fazem a detecção de verdade), mais o caso sem chave em produção e o `no-store` de `/api/live` (agora com `preview`).
- README e `.env.example` atualizados.

## Cortes sugeridos (NÃO aplicados; dependem do OK do Estevam via Chief/Partner)

1. **Tirar `/api/live`.** A Início consulta `lib/live.ts` direto no servidor, então a rota só serve para QA/curl. Tirar diminui a superfície pública.
2. ~~**Tirar `LIVE_YOUTUBE_AUTO`.**~~ Não vale mais: sem chave a detecção pela página `/live` liga sozinha, e `LIVE_YOUTUBE_AUTO=0` é o único jeito de desligá-la sem deploy.
3. **Tirar o botão "Compartilhar" da live.** Não está no BRIEF. Ficou porque já existia no estado ao vivo.
4. **Tirar o carimbo "No ar ao vivo".** O selo AO VIVO já cumpre o critério, e no celular o carimbo cobre o canto do player.
5. **Tirar a faixa animada e o botão "Pausar a faixa" quando não há live.** O topo fica mais limpo. Combina com a decisão do item 3 (topo novo).
6. **(Acréscimo opcional, não corte)** Checar `/api/live` a cada 2 min só com a aba visível, para mostrar a live que começar depois que a página abriu e esconder quando ela acabar. Custa um pedido leve periódico em todas as visitas.
7. **Redirects:** ficar só com `/canal24h`, já que nenhum desses endereços existiu de verdade. Ou tirar os três.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
