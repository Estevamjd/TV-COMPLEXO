# Auditoria do TV Complexo (Next.js) em https://tv-complexo.vercel.app, 30/10/2026

Esta auditoria foi só de leitura: nada foi alterado, publicado ou enviado.
**Método:** usei curl em 14 URLs (lista em crawl.txt): a home, as 7 páginas do menu (/videos, /noticias, /denuncias, /denuncias/enviar, /sobre, /privacidade e /admin, que redireciona para /admin/login), 5 páginas de vídeo do sitemap e uma página que não existe, para testar o 404. Também baixei robots.txt e sitemap.xml.
**Evidências:** /workspace/site-audit/evidence/2026-10-30/ (HTML de cada página, crawl.txt, analise.txt, psi.json e home.headers)

## Notas
**Regra:** cada dimensão começa em 10. Cada P0 tira 3 pontos, cada P1 tira 2 e cada P2 tira 1. Só contam os achados daquela dimensão.

| Dimensão | Achados | Conta | Nota |
|---|---|---|---|
| SEO técnico | 1 P0 (S1), 1 P1 (S2) | 10 − 3 − 2 | **5** |
| Conteúdo | 1 P2 (C1) | 10 − 1 | **9** |
| Velocidade | não dá para dar nota | ver abaixo | **não medido** |
| Acessibilidade | 1 P1 (A1) | 10 − 2 | **8** (contraste não medido) |
| Conversão | 1 P2 (V1) | 10 − 1 | **9** |
| Dados estruturados | 1 P1 (D1) | 10 − 2 | **8** |

As contas conferem com a regra.

**Velocidade:** a API pública do PageSpeed devolveu de novo o erro 429 (cota diária esgotada), então LCP, CLS, TBT e as notas do Lighthouse não foram medidos. Pelo curl, o HTML das páginas tem entre 31.902 e 87.063 bytes e as respostas levaram entre 0,53 e 1,97 s. A home veio com `cache-control: private, no-cache, no-store` e `x-vercel-cache: MISS`, ou seja, a página não está sendo guardada em cache.

## P0
- **S1. Canonical, sitemap, robots e Open Graph apontam para uma URL de prévia protegida.** O endereço é `https://tv-complexo-cqckj1wer-hyago1208-5668s-projects.vercel.app` e ele responde com 302, provavelmente pedindo login na Vercel. Na prática, o Google é mandado para um endereço fechado, e a imagem que aparece quando alguém compartilha o link no WhatsApp ou em rede social não carrega. Evidências: https://tv-complexo.vercel.app/ (canonical, og:url e og:image), https://tv-complexo.vercel.app/sitemap.xml, https://tv-complexo.vercel.app/robots.txt e https://tv-complexo.vercel.app/privacidade (canonical).

## P1
- **S2. A mesma meta description aparece em todas as páginas, menos /privacidade.** Além disso, 6 páginas usam o mesmo título genérico "TV Complexo — A Real da Favela": home, /videos, /noticias, /denuncias, /denuncias/enviar e /sobre. Os vídeos têm título próprio, mas a descrição é a genérica. Evidências: https://tv-complexo.vercel.app/videos e https://tv-complexo.vercel.app/videos/215bee8d-2ffc-4fd0-88f7-574d36824833
- **A1. Alguns campos não têm label nem aria-label, só placeholder.** São a busca de vídeos e os campos usuário e senha do admin. O formulário de denúncia está certo: 7 campos e 7 labels. Evidências: https://tv-complexo.vercel.app/videos e https://tv-complexo.vercel.app/admin/login
- **D1. Nenhuma das 14 páginas tem JSON-LD.** Faltam Organization/NewsMediaOrganization na home e VideoObject nas páginas de vídeo. Evidências: https://tv-complexo.vercel.app/ e https://tv-complexo.vercel.app/videos/192ac6c3-be0d-4f93-ad06-d80bfc36fc88

## P2
- **C1. O H1 da home é "Liga a TV!".** Ele não diz o que é o site nem o lugar (TV Complexo, Complexo do Alemão / Rio). Evidência: https://tv-complexo.vercel.app/
- **V1. Há dois e-mails de contato diferentes.** O rodapé usa [REDACTED-EMAIL] e a página de privacidade também mostra [REDACTED-EMAIL]. Convém confirmar qual é o oficial. Evidência: https://tv-complexo.vercel.app/privacidade

## Pontos positivos (medidos)
- O site tem `lang="pt-BR"`, HTTPS com HSTS, um H1 por página, 10 tags Open Graph e texto alt em todas as imagens encontradas.
- O 404 responde corretamente, com status 404 e noindex.
- O robots.txt bloqueia /admin/ e /api/.
- O WhatsApp (wa.me/5521966030258) e o e-mail aparecem em todas as páginas.

## Não medido
- Notas e métricas do Lighthouse/PageSpeed, por causa do erro 429.
- Contraste de cores, porque precisa de navegador.
- O envio real dos formulários, que não testei para não enviar nada.
- O conteúdo que é carregado só por JavaScript, porque o curl lê apenas o HTML que vem do servidor.
- O destino final do 302 da URL de prévia, que não segui.
