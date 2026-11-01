# PR: nome "TV Complexo das Favelas" (direção A, empilhado)

Branch `feat/nome-complexo-das-favelas`, base `master`. Nada foi commitado, publicado ou mergeado.
Skill usada: UI UX Pro Max. A direção de design é a **A (Empilhado)**, nas versões clara e escura, conforme `missions/tv-complexo-renomear-favelas/design/`. O logo PNG não foi alterado.

## O que mudou

### Nome em todo o site
- Toda ocorrência de "TV Complexo" agora é **"TV Complexo das Favelas"**. Isso inclui os textos visíveis (Sobre, Privacidade, Vídeos, Notícias, admin, autor padrão, rótulo de vídeo manual, Instagram/SocialFeed), os `<title>` e as meta descriptions de todas as páginas, `og:site_name`, `og:image:alt`, as `keywords`, o schema.org (`NewsMediaOrganization` e o `publisher` do `VideoObject`, via `SITE_NOME`), o texto de compartilhamento do Canal 24h, os títulos do player, os `alt` e os `aria-label` do logo no topo e no rodapé, o README e o `docs/n8n-setup.md`.
- O sitemap e o robots não citam o nome, só URLs. Por isso não mudaram.
- **Não mudaram (de propósito):** os handles e URLs (`@tvcomplexo`, `@tvcomplexofc`, `tv-complexo.vercel.app`), os e-mails, o `name` do `package.json` e o User-Agent do cron. São identificadores, não o nome exibido. `docs/qa-evidencias` também ficou intacto, porque é histórico.
- `lib/mascara.js`: a exceção de nome próprio passou a ser "TV Complexo das Favelas", para o nome do canal não ser mascarado como se fosse nome de pessoa nas denúncias.

### Open Graph / Twitter
- Nova imagem `public/og-tv-complexo-das-favelas.jpg`, em **1200×630 de verdade**. A antiga tinha 640×640, mas a meta tag declarava 1200×630, e ela só mostrava "TV COMPLEXO". A nova segue a direção A clara: logo na placa, "TV COMPLEXO" em Anton e "DAS FAVELAS" no bloco rosa, com a foto `bg-favela.png` (vista noturna, sem nenhuma pessoa identificável). O arquivo antigo continua em `public/` para não quebrar prévias que já estão em cache.
- Card do Twitter/X (`summary_large_image`) adicionado no layout e em `metadataDaPagina`, espelhando o OG.
- `/noticias/[id]` passou a usar a imagem OG padrão e o `siteName`.

### Manifest PWA
- `name: "TV Complexo das Favelas"`.
- `short_name: "TV Complexo"`. **Justificativa:** o `short_name` é o rótulo embaixo do ícone na tela inicial. O Android (launcher) e o iOS cortam esse rótulo por volta de 12 caracteres, e o nome completo tem 23, então apareceria como "TV Complexo das…" ou "TV Compl…". "TV Complexo" tem 11 caracteres, cabe inteiro e é o começo exato do nome oficial. É a única abreviação do site, permitida pelo BRIEF. Na UI o nome nunca é abreviado, e o `name` completo aparece na tela de instalação e na troca de apps.

### Layout (direção A)
- **Topo / Canal 24h (`BarraNavegacao`, usada no `CanalTopo` e no `Header`):** a placa do logo ganhou embaixo uma fita "DAS FAVELAS" em Anton, recuada até o "TV" e inclinada -2°. A fita é rosa #FF3D8B com tinta (5,66:1), porque o cabeçalho real é amarelo e uma fita amarela sumiria. No estado **ao vivo** o topo fica rosa e a fita vira amarela (13,38:1). O tamanho é `clamp(17px, 13px + .9vw, 22px)`: 17 px no celular, cerca de 20 px em 768 e 22 px no desktop.
- **Placeholder do player do Canal 24h** (sem vídeo embutível): o logo ganhou a fita rosa "DAS FAVELAS", dimensionada em `cqi` para acompanhar a largura do player.
- **Rodapé (versão escura):** logo e, embaixo, "DAS FAVELAS" em amarelo sobre tinta (13,38:1), recuado até o "TV". Os tamanhos usam clamp: logo `clamp(30px, 22px + 1.1vw, 38px)` e texto `clamp(30px, 23px + 1vw, 40px)`.
- **Tela de instalar app (`InstalarApp`):** antes do botão aparece o nome do app como ele fica instalado, empilhado: "TV COMPLEXO" (`clamp(26px…44px)`) e "DAS FAVELAS" no bloco rosa inclinado -1,5° (`clamp(44px…80px)`). Quando falta espaço, a quebra cai entre "DAS" e "FAVELAS". O texto sai de `SITE_NOME_LINHAS` (`lib/site.ts`), sem string duplicada.
- O nome completo continua no `aria-label` do link ("TV Complexo das Favelas, início") e no `alt`. A fita é `aria-hidden`, para o leitor de tela não ler o nome duas vezes.

### Testes
- `__tests__/seo.test.js`: nome no título, no `siteName`, na nova imagem OG e no card do Twitter. Novos casos: `SITE_NOME`, o schema.org, o manifest (`short_name` ≤ 12 e prefixo do nome) e a divisão do nome empilhado.
- `__tests__/barra-navegacao.test.js`: o `aria-label` novo, e o link do logo agora tem o texto "das Favelas".

## Verificação

| Comando | Resultado |
|---|---|
| `npm run build` | ✅ compilou, 22/22 páginas |
| `npm test` | ✅ 18 arquivos, 854 testes passando |
| `npm run lint` | ❌ **5 erros e 8 avisos, todos já existentes no `master`** (conferido num worktree limpo do `master`: os mesmos 13 problemas). São erros `react-hooks/set-state-in-effect` e de uso antes da declaração em `app/admin/noticias`, `app/admin/videos`, `CommentSection`, `app/videos/page.js:27` e `InstagramReel`, em linhas que este PR não toca. Esta branch não criou nenhum problema novo. A correção mexe na lógica dessas telas e fica fora do escopo (03-ANTI: sem mudança além do nome). Fica como proposta de PR separado. |
| `rg -i "tv complexo"` (sem `docs/qa-evidencias`) | só `app/manifest.js:6: short_name: 'TV Complexo'` (justificado acima) |

**Corte e sobreposição:** testado com Playwright (Chrome local) em 360, 390, 768 e 1440 px nas páginas Início, Vídeos, Sobre, Privacidade, Denúncias e Notícias. Em todas, `scrollWidth == clientWidth` (sem rolagem lateral) e nenhum elemento `[data-nome]` sai da tela ou estoura a caixa. Também conferi visualmente o estado ao vivo (`/?demo=live`) e o passo a passo de instalar aberto.

**Prints antes e depois:** ficam em `missions/tv-complexo-renomear-favelas/evidencias/frontend/{antes,depois}/`, com o nome `<página>-<largura>-light.png`, mais `inicio-live-*`, `videos-topo-*` e `instalar-aberto-*`. A variante escura do OG está em `og-variante-escura.jpg`. O site não tem tema escuro: a versão "escura" da direção A é a do rodapé, que é a superfície escura.

**Lighthouse:** não rodei, porque ele não está instalado e a regra é não instalar nada. Fica para o QA rodar no Preview (SEO e acessibilidade, antes e depois). As mudanças de a11y e SEO são aditivas: alt e aria atualizados, contraste ≥ 5,66:1 nos elementos novos, card do Twitter e OG com as dimensões corretas.

## Pontos para o revisor
- Notícias e vídeos já gravados no banco com `autor = 'TV Complexo'` continuam assim. O código só muda o padrão dos registros novos. Se for preciso, um `UPDATE` resolve, mas é decisão de dados e fica fora deste PR.
- Ficaram redundâncias de texto que eu não mexi, porque mudar texto além do nome está fora do escopo: o título "TV Complexo das Favelas — A Real da Favela" e a descrição de vídeo "…na TV Complexo das Favelas, a TV comunitária das favelas do Rio". Sugestão para o Estevam decidir.
