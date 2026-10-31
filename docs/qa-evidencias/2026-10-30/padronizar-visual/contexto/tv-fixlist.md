# Crítica de design — TV Complexo no celular (390px)
Data: 30/10/2026 · Site: https://tv-complexo.vercel.app · Só análise (nada foi alterado no site).
Prints em `prints/` (tela + página inteira de cada rota). Print do Estevam visto: mostra a tela de denúncias no visual escuro antigo.

Rotas achadas pelos links: `/` (início), `/videos`, `/videos/<id>`, `/noticias`, `/denuncias` (mapa + lista), `/denuncias/enviar`, `/sobre`, `/privacidade`. Não existe `/mapa` (dá erro 404): o mapa fica dentro de `/denuncias`.
Obs.: o menu de cima não abre no celular; nas telas antigas o botão "Menu" fica escondido e a navegação é a barra de baixo. Por isso não há print de "menu aberto".

## 1. Diferenças de visual entre as telas
Hoje são **dois sites**:
- **Estilo novo "urbano"** — só a **Início** (`/`): fundo amarelo e creme, letra preta grossa e condensada, letra tipo máquina de escrever nos detalhes, bordas pretas grossas, sombras rosa/azul, selos ("CANAL 24H"), botões quadrados preto/amarelo. Cabeçalho: só logo + botão "App". Sem barra de baixo. Rodapé preto simples com links.
- **Estilo antigo escuro** — **Vídeos, Detalhe do vídeo, Notícias, Denúncias (mapa), Enviar denúncia, Sobre**: fundo preto com foto da favela escurecida, títulos vermelhos com emoji (📺 📰 📢), cartões arredondados cinza-escuro, botões arredondados vermelhos, filtros em "pílula". Cabeçalho preto com logo maior. Barra fixa embaixo (Início, Vídeos, Denúncia, Notícias, Sobre) com botão redondo vermelho no meio.
- Cores: novo = amarelo/preto/rosa/azul; antigo = preto/vermelho. Nenhuma cor em comum além do preto.
- Logo: no novo vem dentro de uma etiqueta preta pequena; no antigo é solto e maior.
- Rodapé: no novo é curto ("Responsável… Privacidade · Painel admin"); no antigo é um bloco grande "TV COMPLEXO / NAVEGAÇÃO" e fica parcialmente atrás da barra de baixo.

## 2. Organização e navegação
- **Menu muda de página para página**: na Início não há menu nem barra de baixo no celular (os links do topo ficam escondidos; só aparecem no rodapé, lá no fim). Nas outras telas há a barra de baixo. Quem entra pela Início não vê como ir para as outras partes.
- **Voltar para a Início** leva para outro visual — parece que saiu do site.
- **"Denúncia" x "Denúncias"**: a barra de baixo diz "DENÚNCIA" e vai direto para o formulário (`/denuncias/enviar`). O mapa (`/denuncias`) não tem atalho na barra; nenhuma aba fica acesa quando se está no mapa. Na Início, "Abrir o mapa" e "Denúncias" levam ao mapa. Mesmo nome para duas coisas diferentes.
- **Não existe "Mapa" com nome próprio**: o mapa está no meio da página Denúncias; `/mapa` dá 404.
- **Barra de baixo cobre conteúdo**: na tela de denúncias cobre a legenda do mapa; em Vídeos cobre o título do vídeo; em Enviar denúncia cobre "Usar minha localização"; o rodapé fica por baixo dela.
- **Mapa por cima do cabeçalho** (print do Estevam): ao rolar, os botões "+ / −" do mapa passam por cima do logo.
- **Mapa prende o dedo**: o mapa ocupa quase a tela toda; ao arrastar em cima dele o usuário mexe o mapa em vez de rolar a página.
- **Início com cara de "não pronto"**: "foto do canal em breve", "Demonstração: detecção automática de live desligada", "Vídeo do canal 1 (exemplo)", "Player ainda não configurado", grade "EM BREVE" em todos os dias. Vídeos de verdade existem em `/videos`, mas a Início mostra caixas vazias.
- **Notícias vazia**: "Nenhuma notícia publicada", mas o item está no menu principal — beco sem saída.
- **Vídeos**: primeiro cartão é um bloco grande "INSTAGRAM" sem conteúdo.
- **"Painel admin"** aparece no rodapé público da Início.
- **Tamanho de toque**: links do rodapé da Início com ~37px de altura (o ideal é 44px ou mais); abas da barra de baixo estão ok (~50px).
- Faixa animada da Início tem botão "Pausar a faixa animada" — bom.

## 3. Lista de correções
| # | Prioridade | Tela | Elemento | Problema | Correção | Status |
|---|---|---|---|---|---|---|
| 1 | P0 | Todas | Visual geral | Início no estilo novo e o resto no antigo: parece dois sites | Escolher um padrão (sugestão: o novo "urbano") e aplicar em Vídeos, Notícias, Denúncias, Enviar denúncia e Sobre (cores, letras, cartões, botões, cabeçalho, rodapé) | aberto |
| 2 | P0 | Todas | Navegação | Início não tem menu no celular; as outras têm barra de baixo | Uma navegação só em todas as telas (mesma barra de baixo ou mesmo cabeçalho com menu), incluindo a Início | aberto |
| 3 | P0 | Início | Bloco principal e "Últimos vídeos"/"Grade" | Textos de demonstração ("exemplo", "player não configurado", "em breve") em produção | Mostrar o vídeo mais recente real e capas reais; esconder a grade até ter programação; tirar avisos de demonstração | aberto |
| 4 | P1 | Barra de baixo | Aba "DENÚNCIA" | Leva ao formulário; o mapa não tem aba e nada fica aceso no mapa | Aba "Denúncias" vai ao mapa/lista (fica acesa lá e em Enviar); botão "Enviar denúncia" fica dentro da página | aberto |
| 5 | P1 | Denúncias, Vídeos, Enviar, rodapés | Barra fixa de baixo | Cobre legenda, títulos, botão de localização e rodapé | Dar espaço no fim da página igual à altura da barra (+ área segura do iPhone) | aberto |
| 6 | P1 | Denúncias | Controles "+ / −" do mapa | Passam por cima do cabeçalho ao rolar (print do Estevam) | Deixar o cabeçalho sempre por cima do mapa | aberto |
| 7 | P1 | Denúncias | Mapa | Ocupa quase toda a tela e prende a rolagem | Mapa mais baixo (~50% da tela) e arrastar com dois dedos, ou botão "ver mapa em tela cheia" | aberto |
| 8 | P1 | Notícias | Página inteira | Vazia ("Nenhuma notícia publicada") | Tirar do menu até ter notícias, ou mostrar vídeos da categoria Notícias com link | aberto |
| 9 | P1 | Rotas | `/mapa` | 404 | Criar `/mapa` levando para `/denuncias` (mapa) | aberto |
| 10 | P2 | Vídeos | Primeiro cartão "INSTAGRAM" | Bloco grande sem conteúdo no topo | Tirar ou trocar por vídeo real; Instagram vai pro rodapé | aberto |
| 11 | P2 | Títulos antigos | Emojis 📺 📰 📢 🎯 | Não combinam com o estilo novo | Trocar por ícones do estilo escolhido | aberto |
| 12 | P2 | Início | Rodapé "Painel admin" | Link interno visível para o público | Tirar do rodapé público | aberto |
| 13 | P2 | Início | Links do rodapé | Área de toque ~37px | Aumentar para 44px ou mais | aberto |
| 14 | P2 | Cabeçalho | Logo | Tamanho e moldura diferentes entre Início e demais | Mesmo logo, mesmo tamanho em todas | aberto |

Total: P0 = 3 · P1 = 6 · P2 = 5.
**Padrão sugerido:** o estilo novo "urbano" (amarelo/preto, letra grossa), que é a cara nova; mas trazendo dele a **barra de baixo** do estilo antigo, que é a melhor parte da navegação no celular.
