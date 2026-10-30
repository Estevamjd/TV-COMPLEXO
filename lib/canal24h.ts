/**
 * Canal 24h: a playlist própria do @tvcomplexofc tocada "como TV".
 * A posição sai do relógio: (agora - epoch) mod duração total. Não há servidor
 * de vídeo; cada navegador calcula o mesmo vídeo e o mesmo segundo.
 */
import playlist from './canal24h.json';

export interface VideoCanal {
    youtubeId: string;
    titulo: string;
    duracaoSeg: number;
    placeholder?: boolean;
}

export interface PosicaoCanal {
    atual: VideoCanal;
    proximo: VideoCanal;
    /** segundos já tocados do vídeo atual */
    offsetSeg: number;
    inicioMs: number;
    fimMs: number;
}

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

export const PLAYLIST: VideoCanal[] = playlist.videos;
export const EPOCH_MS = Date.parse(playlist.epoch);

/** Só embute o player quando o ID é real (não marcado como placeholder). */
export function podeEmbutir(video: Pick<VideoCanal, 'youtubeId' | 'placeholder'> | null | undefined): boolean {
    return !!video && !video.placeholder && ID_YOUTUBE.test(video.youtubeId);
}

export function posicaoCanal(agoraMs: number, videos: VideoCanal[] = PLAYLIST, epochMs: number = EPOCH_MS): PosicaoCanal | null {
    const validos = videos.filter(v => v.duracaoSeg > 0);
    if (validos.length === 0 || !Number.isFinite(epochMs)) return null;

    const totalMs = validos.reduce((s, v) => s + v.duracaoSeg * 1000, 0);
    // mod que funciona também antes do epoch (resultado sempre >= 0)
    const pos = (((agoraMs - epochMs) % totalMs) + totalMs) % totalMs;

    let acumulado = 0;
    for (let i = 0; i < validos.length; i++) {
        const dur = validos[i].duracaoSeg * 1000;
        if (pos < acumulado + dur) {
            const dentro = pos - acumulado;
            return {
                atual: validos[i],
                proximo: validos[(i + 1) % validos.length],
                offsetSeg: Math.floor(dentro / 1000),
                inicioMs: agoraMs - dentro,
                fimMs: agoraMs - dentro + dur,
            };
        }
        acumulado += dur;
    }
    return null;
}

/** "18:40" no horário de Brasília. */
export function horaBrasilia(ms: number): string {
    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
    }).format(new Date(ms));
}
