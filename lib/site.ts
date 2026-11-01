export const SITE_URL_PADRAO = 'https://tv-complexo.vercel.app';

/**
 * Endereço público único do site: canonical, sitemap, robots, og:url e og:image saem daqui.
 *
 * Vem de NEXT_PUBLIC_SITE_URL (ex.: o domínio próprio na Cloudflare), definida no build.
 * Sem ela, ou com valor inválido, fica o endereço da Vercel. Nunca usa VERCEL_URL: ela aponta
 * para a URL da prévia (protegida por login), e era isso que ia para o Google e o WhatsApp.
 */
export function siteUrlDoAmbiente(valor = process.env.NEXT_PUBLIC_SITE_URL): string {
    const bruto = valor?.trim();
    if (!bruto) return SITE_URL_PADRAO;
    try {
        const url = new URL(bruto);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return SITE_URL_PADRAO;
        if (url.search || url.hash || url.username || url.password) return SITE_URL_PADRAO;
        return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
    } catch {
        return SITE_URL_PADRAO;
    }
}

export const SITE_URL = siteUrlDoAmbiente();

export const SITE_NOME = 'TV Complexo das Favelas';
/** O nome em duas linhas (direção A, empilhado): a quebra fica antes de "das Favelas". Nunca abreviar. */
export const SITE_NOME_LINHAS = SITE_NOME.split(/ (?=das )/);
export const DESCRICAO_PADRAO = 'A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.';
export const OG_IMAGEM = { url: '/og-tv-complexo-das-favelas.jpg', width: 1200, height: 630, alt: 'TV Complexo das Favelas' };

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
        twitter: {
            card: 'summary_large_image',
            title: titulo,
            description: descricao,
            images: [imagem ? urlAbsoluta(imagem) : urlAbsoluta(OG_IMAGEM.url)],
        },
    };
}

/** Resumo para meta description: sem HTML, espaços normalizados, até `max` caracteres. */
export function resumir(texto: string | null | undefined, max = 160): string {
    const limpo = String(texto ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (limpo.length <= max) return limpo;
    return `${limpo.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}
