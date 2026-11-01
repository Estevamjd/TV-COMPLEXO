/**
 * Topo da Início sem live: toca (mudo, em loop) o vídeo mais recente do canal pelo RSS
 * (lib/rss-canal.ts). Se o RSS falhar, o vídeo mais recente do banco, se ele for
 * do YouTube. Sem isso (banco vazio, sem DATABASE_URL, mais recente do Instagram), toca o
 * vídeo de reserva: vídeo público do @tvcomplexofc (autor confirmado via oEmbed).
 */
import { idYoutubeDaUrl } from './video-utils';

export const VIDEO_RESERVA_ID = 'hTBno4SXUgI';

type VideoDb = { titulo: string; plataforma?: string | null; external_id?: string | null; url_video?: string | null };

/** ID do YouTube do vídeo cadastrado (external_id do YouTube ou URL); null se for de outra plataforma. */
export function idYoutubeDoVideo(v: VideoDb): string | null {
    if (v.plataforma === 'youtube' && v.external_id && /^[A-Za-z0-9_-]{11}$/.test(v.external_id)) return v.external_id;
    return idYoutubeDaUrl(v.url_video);
}

/**
 * Destaque do topo: o vídeo MAIS RECENTE do banco (lista em ordem decrescente), só se for
 * do YouTube. Se o mais recente for do Instagram (ou não houver vídeo), null: o topo usa a reserva.
 */
export function destaqueDoTopo(videos: VideoDb[]): { youtubeId: string; titulo: string } | null {
    const maisRecente = videos[0];
    const id = maisRecente ? idYoutubeDoVideo(maisRecente) : null;
    return id ? { youtubeId: id, titulo: maisRecente.titulo } : null;
}

export const VIDEO_RESERVA = {
    youtubeId: VIDEO_RESERVA_ID,
    titulo: 'Entrevista com Celso Athayde, da CUFA',
    reserva: true,
} as const;
