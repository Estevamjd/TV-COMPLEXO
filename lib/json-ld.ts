import { SITE_URL, SITE_NOME, DESCRICAO_PADRAO, urlAbsoluta, resumir } from '@/lib/site';
import { toEmbedUrl } from '@/lib/video-utils';

/**
 * JSON para <script type="application/ld+json">. Escapa `<` (e os separadores de linha
 * U+2028/U+2029) para um título com "</script>" não fechar a tag.
 */
export function serializarJsonLd(dados: unknown): string {
    return JSON.stringify(dados)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

export function jsonLdOrganizacao() {
    return {
        '@context': 'https://schema.org',
        '@type': 'NewsMediaOrganization',
        name: SITE_NOME,
        url: SITE_URL,
        logo: urlAbsoluta('/logo.png'),
        description: DESCRICAO_PADRAO,
        sameAs: [
            'https://www.youtube.com/@tvcomplexofc',
            'https://www.instagram.com/tvcomplexo/',
            'https://www.tiktok.com/@tvcomplexo',
        ],
    };
}

interface VideoDados {
    id: string;
    titulo?: string | null;
    descricao?: string | null;
    url_video?: string | null;
    thumbnail?: string | null;
    published_at?: string | Date | null;
    created_at?: string | Date | null;
}

function dataIso(valor: string | Date | null | undefined): string | undefined {
    if (!valor) return undefined;
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** VideoObject só com o que existe no registro: campo vazio fica de fora. */
export function jsonLdVideo(video: VideoDados) {
    const dados: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: video.titulo,
        url: urlAbsoluta(`/videos/${video.id}`),
        description: resumir(video.descricao, 500) || undefined,
        thumbnailUrl: video.thumbnail && /^https:\/\//.test(video.thumbnail) ? video.thumbnail : undefined,
        uploadDate: dataIso(video.published_at) ?? dataIso(video.created_at),
        embedUrl: (video.url_video && toEmbedUrl(video.url_video)) || undefined,
        publisher: { '@type': 'NewsMediaOrganization', name: SITE_NOME, url: SITE_URL },
    };
    for (const k of Object.keys(dados)) if (dados[k] === undefined || dados[k] === null || dados[k] === '') delete dados[k];
    return dados;
}
