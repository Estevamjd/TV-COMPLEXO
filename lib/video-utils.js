/**
 * Converte URLs de plataformas de vídeo para formato embed.
 * Suporta YouTube, YouTube Shorts, Vimeo.
 * Para outras plataformas (Instagram, TikTok, Facebook), retorna null
 * pois não suportam embed via iframe.
 */
export function toEmbedUrl(url) {
    if (!url) return null;
    const trimmed = url.trim();

    // Já é embed do YouTube
    if (trimmed.includes('youtube.com/embed/')) return trimmed;

    // YouTube watch URL: youtube.com/watch?v=xxx
    const ytWatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

    // YouTube Shorts: youtube.com/shorts/xxx
    const ytShorts = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`;

    // Vimeo: vimeo.com/123456
    const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

    return null;
}

/**
 * Detecta a plataforma a partir da URL.
 */
export function detectPlatform(url) {
    if (!url) return 'manual';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    if (url.includes('vimeo.com')) return 'vimeo';
    return 'manual';
}

/**
 * Verifica se uma URL pode ser embarcada em iframe.
 */
export function isEmbeddable(url) {
    return !!toEmbedUrl(url);
}
