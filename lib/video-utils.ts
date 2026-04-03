/**
 * Converte URLs de plataformas de vídeo para formato embed.
 * Suporta YouTube, YouTube Shorts, Vimeo.
 * Para outras plataformas (Instagram, TikTok, Facebook), retorna null
 * pois não suportam embed via iframe.
 */
export function toEmbedUrl(url: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();

    if (trimmed.includes('youtube.com/embed/')) return trimmed;

    const ytWatch = trimmed.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}`;

    const ytShorts = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (ytShorts) return `https://www.youtube.com/embed/${ytShorts[1]}`;

    const vimeo = trimmed.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

    return null;
}

export type Platform = 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'vimeo' | 'manual';

/**
 * Detecta a plataforma a partir da URL.
 */
export function detectPlatform(url: string): Platform {
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
export function isEmbeddable(url: string): boolean {
    return !!toEmbedUrl(url);
}
