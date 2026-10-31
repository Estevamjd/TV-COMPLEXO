/**
 * Endereço público único do site: canonical, sitemap, robots, og:url e og:image saem daqui.
 *
 * Fixo no código de propósito: VERCEL_URL aponta para a URL da prévia (protegida por login),
 * e era isso que ia para o Google e para o card do WhatsApp.
 * TODO: trocar para https://tvcomplexo.com.br quando o DNS apontar para a Vercel.
 */
export const SITE_URL = 'https://tv-complexo.vercel.app';

export const SITE_NOME = 'TV Complexo';
export const DESCRICAO_PADRAO = 'A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.';
export const OG_IMAGEM = { url: '/og-tv-complexo.jpg', width: 1200, height: 630, alt: 'TV Complexo' };

/** URL absoluta a partir de um caminho ('/videos') ou de uma URL já absoluta. */
export function urlAbsoluta(caminho = '/'): string {
    if (/^https?:\/\//.test(caminho)) return caminho;
    if (caminho === '/' || caminho === '') return SITE_URL;
    return `${SITE_URL}${caminho.startsWith('/') ? '' : '/'}${caminho}`;
}

interface OpcoesMetadata {
    titulo: string;
    descricao: string;
    caminho: string;
    imagem?: string;
    tipo?: 'website' | 'article' | 'video.other';
}

/**
 * Metadata completa de uma página. O Next não mescla `openGraph` entre layout e página
 * (a página substitui o objeto inteiro), então siteName, locale e imagem vão sempre juntos.
 */
export function metadataDaPagina({ titulo, descricao, caminho, imagem, tipo = 'website' }: OpcoesMetadata) {
    return {
        title: titulo,
        description: descricao,
        alternates: { canonical: urlAbsoluta(caminho) },
        openGraph: {
            title: titulo,
            description: descricao,
            url: urlAbsoluta(caminho),
            siteName: SITE_NOME,
            locale: 'pt_BR',
            type: tipo,
            images: [imagem ? { url: urlAbsoluta(imagem) } : { ...OG_IMAGEM, url: urlAbsoluta(OG_IMAGEM.url) }],
        },
    };
}

/** Resumo para meta description: sem HTML, espaços normalizados, até `max` caracteres. */
export function resumir(texto: string | null | undefined, max = 160): string {
    const limpo = String(texto ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (limpo.length <= max) return limpo;
    return `${limpo.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
