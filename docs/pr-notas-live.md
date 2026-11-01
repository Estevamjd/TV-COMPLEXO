# PR (rascunho): tira o Canal 24h, põe a live automática na Início e troca o topo (Adesivo)

Branch `feat/live-e-topo`, criada a partir de `feat/nome-complexo-das-favelas` (`461fb49`, PR #14). Missão `tv-complexo-live-e-topo`, **itens 1, 2 e 3** do `01-frontend-claudecode.md`.
Ainda **não houve** commit, push, deploy nem merge. O banco (item 4b) não foi mexido. Skill usada: UI UX Pro Max.

## Item 1: Canal 24h removido

- **Saíram:** `lib/canal24h.ts`, `lib/canal24h.json`, `lib/video-reserva.ts` (vídeo de reserva do topo, que só existia para o canal), a rota `app/api/hora` (relógio do canal) e os testes ligados a eles (`canal24h`, `video-reserva`, `canal-topo-autoplay` e `canal-topo-live`).
- **Topo (`CanalTopo.js`):** acabaram o relógio, a sincronização com a IFrame API, o vídeo mais recente/reserva tocando em loop, o "Liga a TV!", o carimbo "Canal 24h sem parar", os textos "Canal 24h · agora…" e "A seguir…" e o botão "Ver a grade".
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
3. **Sem live, o topo não tem mais player.** Até o PR #14, o topo tocava o vídeo mais recente (ou a reserva) em loop, que era o "canal sem parar" visto na prática. Li "sem live = home igual à de hoje, sem bloco vazio, sem peso no carregamento" como a Início **sem o canal 24h**: barra, faixa e depois as seções de sempre (Reels, vídeos, notícias, grade, chamadas). O `h1` continua lá para leitor de tela ("TV Complexo das Favelas: a real da favela").

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

## Simulação para prints (só dev/teste)

```bash
LIVE_MOCK_VIDEO_ID=<id de 11 caracteres de um vídeo que esteja AO VIVO agora> npm run dev
```

- Simula a live sem chamar a API. O título fica "Live de teste (simulação)" e `/api/live` responde `no-store`.
- **Fica desligada** sem a variável, com um ID inválido e sempre que `VERCEL_ENV=production`. Não configure essa variável na Vercel.
- Se o ID não for de uma live no ar, o player do YouTube mostra "Vídeo indisponível". Isso aconteceu nos meus prints de conferência, porque usei um ID antigo.
- Para testar a detecção **de verdade** num canal de teste ao vivo: `YOUTUBE_API_KEY=… YOUTUBE_CHANNEL_ID=UC…(canal ao vivo) npm run dev`. Canal real fora do ar = Início sem player.

## Verificação

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

## Cortes sugeridos (NÃO aplicados; dependem do OK do Estevam via Chief/Partner)

1. **Tirar `/api/live`.** A Início consulta `lib/live.ts` direto no servidor, então a rota só serve para QA/curl. Tirar diminui a superfície pública.
2. **Tirar `LIVE_YOUTUBE_AUTO`.** Ter ou não ter `YOUTUBE_API_KEY` já liga e desliga. Fica uma variável a menos para configurar errado.
3. **Tirar o botão "Compartilhar" da live.** Não está no BRIEF. Ficou porque já existia no estado ao vivo.
4. **Tirar o carimbo "No ar ao vivo".** O selo AO VIVO já cumpre o critério, e no celular o carimbo cobre o canto do player.
5. **Tirar a faixa animada e o botão "Pausar a faixa" quando não há live.** O topo fica mais limpo. Combina com a decisão do item 3 (topo novo).
6. **(Acréscimo opcional, não corte)** Checar `/api/live` a cada 2 min só com a aba visível, para mostrar a live que começar depois que a página abriu e esconder quando ela acabar. Custa um pedido leve periódico em todas as visitas.
7. **Redirects:** ficar só com `/canal24h`, já que nenhum desses endereços existiu de verdade. Ou tirar os três.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
