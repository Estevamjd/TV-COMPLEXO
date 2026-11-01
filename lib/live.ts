/**
 * Detecção da live do @tvcomplexofc. SÓ SERVIDOR: lê YOUTUBE_API_KEY e nunca vai para o navegador.
 *
 * Método (missão tv-complexo-live-e-topo, stack-decision.md):
 *  1. playlistItems.list da playlist de uploads do canal (UC… → UU…): 1 unidade de cota.
 *  2. videos.list dos vídeos mais recentes, olhando snippet.liveBroadcastContent: 1 unidade.
 * Nunca usa search.list (100 unidades). Resultado (com ou sem live, inclusive falha) fica
 * em cache por 60 s em memória, com consultas simultâneas deduplicadas; o fetch também usa
 * o cache de dados do Next (revalidate 60 s). Teto: 2 unidades/min por instância (~2.880/dia),
 * dentro da cota grátis de 10.000/dia.
 * Qualquer falha (sem chave, cota estourada, rede, resposta estranha, demora) = sem live:
 * a home fica como sempre, sem erro na tela.
 *
 * Variáveis (só servidor):
 *  - YOUTUBE_API_KEY: chave da YouTube Data API. Sem ela, nunca há live.
 *  - YOUTUBE_CHANNEL_ID: canal (padrão UC63_rDkhmAv1bMm55PsyzOw, @tvcomplexofc).
 *  - LIVE_YOUTUBE_AUTO='0': desliga a detecção (interruptor de emergência). Vazio = ligada.
 *  - LIVE_MOCK_VIDEO_ID: SÓ PARA TESTE/PRINTS. Simula live com esse vídeo, sem chamar a API.
 *    Ignorada quando VERCEL_ENV=production.
 */

export const CANAL_PADRAO = 'UC63_rDkhmAv1bMm55PsyzOw';
export const CACHE_MS = 60_000;
const API = 'https://www.googleapis.com/youtube/v3';
const LIMITE_MS = 2500;
const RECENTES = '10';
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const ID_CANAL = /^UC[A-Za-z0-9_-]{22}$/;

export type LiveStatus =
    | { live: false }
    | { live: true; videoId: string; titulo: string; inicio: string | null; simulada?: true };

const SEM_LIVE: LiveStatus = { live: false };

let cache: { status: LiveStatus; expira: number; chave: string } | null = null;
let pendente: { promessa: Promise<LiveStatus>; chave: string } | null = null;

/** Só para os testes: zera o cache em memória. */
export function limparCacheLive() {
    cache = null;
    pendente = null;
}

function canalConfigurado(): string {
    const canal = process.env.YOUTUBE_CHANNEL_ID?.trim();
    return canal && ID_CANAL.test(canal) ? canal : CANAL_PADRAO;
}

/** Live simulada (LIVE_MOCK_VIDEO_ID), nunca em produção na Vercel. */
function liveSimulada(): LiveStatus | null {
    const id = process.env.LIVE_MOCK_VIDEO_ID?.trim();
    if (!id || process.env.VERCEL_ENV === 'production' || !ID_VIDEO.test(id)) return null;
    return { live: true, videoId: id, titulo: 'Live de teste (simulação)', inicio: null, simulada: true };
}

async function consultar(recurso: string, parametros: Record<string, string>) {
    const resposta = await fetch(`${API}/${recurso}?${new URLSearchParams(parametros)}`, {
        next: { revalidate: CACHE_MS / 1000 },
        signal: AbortSignal.timeout(LIMITE_MS),
    } as RequestInit);
    if (!resposta.ok) throw new Error('YouTube indisponível');
    const dados = await resposta.json();
    if (!Array.isArray(dados?.items)) throw new Error('Resposta inválida do YouTube');
    return dados.items as unknown[];
}

type Video = {
    id?: unknown;
    snippet?: { channelId?: unknown; title?: unknown; liveBroadcastContent?: unknown };
    liveStreamingDetails?: { actualStartTime?: unknown; actualEndTime?: unknown };
};

async function consultarYoutube(chave: string, canal: string): Promise<LiveStatus> {
    const itens = await consultar('playlistItems', {
        part: 'contentDetails', playlistId: `UU${canal.slice(2)}`, maxResults: RECENTES, key: chave,
    });
    const ids = itens
        .map(i => (i as { contentDetails?: { videoId?: unknown } })?.contentDetails?.videoId)
        .filter((id): id is string => typeof id === 'string' && ID_VIDEO.test(id));
    if (ids.length === 0) return SEM_LIVE;

    const videos = (await consultar('videos', {
        part: 'snippet,liveStreamingDetails', id: ids.join(','), key: chave,
    })) as Video[];
    const live = videos.find(v =>
        typeof v?.id === 'string' && ids.includes(v.id)
        && v.snippet?.channelId === canal
        && v.snippet.liveBroadcastContent === 'live'
        && !v.liveStreamingDetails?.actualEndTime);
    if (!live) return SEM_LIVE;
    const inicio = live.liveStreamingDetails?.actualStartTime;
    return {
        live: true,
        videoId: live.id as string,
        titulo: typeof live.snippet?.title === 'string' && live.snippet.title.trim() ? live.snippet.title : 'Ao vivo',
        inicio: typeof inicio === 'string' && Number.isFinite(Date.parse(inicio)) ? inicio : null,
    };
}

/** Status da live para a home e para /api/live. Nunca lança erro. */
export async function statusDaLive(): Promise<LiveStatus> {
    const simulada = liveSimulada();
    if (simulada) return simulada;
    if (process.env.LIVE_YOUTUBE_AUTO === '0') return SEM_LIVE;
    const chaveApi = process.env.YOUTUBE_API_KEY?.trim();
    if (!chaveApi) return SEM_LIVE;

    const canal = canalConfigurado();
    const chave = JSON.stringify([chaveApi, canal]);
    if (cache && cache.chave === chave && Date.now() < cache.expira) return cache.status;
    if (pendente && pendente.chave === chave) return pendente.promessa;

    const promessa = consultarYoutube(chaveApi, canal)
        .catch(() => SEM_LIVE)
        .then(status => {
            cache = { status, expira: Date.now() + CACHE_MS, chave };
            return status;
        })
        .finally(() => { if (pendente?.promessa === promessa) pendente = null; });
    pendente = { promessa, chave };
    return promessa;
}
