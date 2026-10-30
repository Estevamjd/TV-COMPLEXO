/**
 * Navegação única do site: a mesma lista na barra fixa de baixo (celular/tablet),
 * no cabeçalho (computador) e no topo da Início. "Mapa" (/denuncias) e
 * "Denunciar" (/denuncias/enviar) são destinos diferentes, com botões diferentes.
 */
export const NAV_ITENS = [
    { href: '/', label: 'Início', icone: 'inicio' },
    { href: '/videos', label: 'Vídeos', icone: 'videos' },
    { href: '/denuncias', label: 'Mapa', icone: 'mapa' },
    { href: '/denuncias/enviar', label: 'Denunciar', icone: 'denunciar', cta: true },
    { href: '/noticias', label: 'Notícias', icone: 'noticias' },
    { href: '/sobre', label: 'Sobre', icone: 'sobre' },
];

/**
 * href do item da tela atual: o mais específico que casa com o caminho
 * (/denuncias/enviar acende "Denunciar", não "Mapa"; /videos/123 acende "Vídeos").
 */
export function itemAtivo(pathname, itens = NAV_ITENS) {
    if (!pathname) return null;
    let melhor = null;
    for (const { href } of itens) {
        const casa = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
        if (casa && (!melhor || href.length > melhor.length)) melhor = href;
    }
    return melhor;
}
