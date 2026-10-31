/**
 * Vídeo de reserva do topo da Início: toca (mudo, em loop) quando não há live,
 * nem canal 24h com vídeo real (lib/canal24h.json), nem vídeo do YouTube como
 * o mais recente do banco. Vídeo público do @tvcomplexofc (autor confirmado via oEmbed).
 * Fica fora do canal24h.json de propósito: não entra no relógio nem na grade.
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
