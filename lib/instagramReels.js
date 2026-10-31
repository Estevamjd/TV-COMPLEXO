/**
 * Reels públicos do Instagram @tvcomplexo exibidos no site com o embed oficial
 * (iframe do próprio Instagram, sem API, sem chave e sem baixar o vídeo).
 * Para trocar os reels, edite esta lista: o mais novo primeiro.
 */
export const INSTAGRAM_PERFIL = 'https://www.instagram.com/tvcomplexo/';

export const INSTAGRAM_REELS = [
    'https://www.instagram.com/reel/DeRviiXRCAj/',
    'https://www.instagram.com/reel/Dd6eYAcRL18/',
    'https://www.instagram.com/reel/DdsQCkdsRE_/',
    'https://www.instagram.com/reel/DcyrAjzxAXI/',
    'https://www.instagram.com/reel/DcvzLgaxTqk/',
    'https://www.instagram.com/reel/DcL9n7OxfZF/',
    'https://www.instagram.com/reel/DcEST7Ox6kw/',
    'https://www.instagram.com/reel/Db6ESs0xU2q/',
];

/** Quantos reels aparecem no destaque da Início. */
export const REELS_DESTAQUE = 3;

const URL_REEL = /^https:\/\/www\.instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]{6,})\/?$/;

/** ID do reel (shortcode) a partir da URL pública; null se não for um reel/post do Instagram. */
export function idDoReel(url) {
    const m = typeof url === 'string' ? url.match(URL_REEL) : null;
    return m ? m[1] : null;
}

/** Endereço do player oficial do Instagram para o reel. */
export function embedDoReel(id) {
    return `https://www.instagram.com/reel/${id}/embed/`;
}
