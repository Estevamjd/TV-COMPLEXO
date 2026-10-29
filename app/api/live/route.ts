import { NextResponse } from 'next/server';

/**
 * GET /api/live — o @tvcomplexofc está ao vivo agora?
 *
 * Só leitura, sem banco. Usa a YouTube Data API com custo baixo:
 * playlistItems.list (1 unidade) nos uploads do canal + videos.list (1 unidade)
 * para ver se algum está "live". Cache de 2 min: ~720 checagens × 2 = ~1.440
 * unidades/dia (≈14% da cota de 10.000). Não depende do cron diário.
 *
 * Variáveis (só servidor): YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID.
 * Sem elas a rota responde { live: false } e a home fica no canal 24h.
 */

export const revalidate = 120;

const API = 'https://www.googleapis.com/youtube/v3';

type LiveStatus = { live: false } | { live: true; videoId: string; titulo: string; inicio: string | null };

async function buscarLive(): Promise<LiveStatus> {
    const chave = process.env.YOUTUBE_API_KEY;
    const canal = process.env.YOUTUBE_CHANNEL_ID;
    if (!chave || !canal || !canal.startsWith('UC')) return { live: false };

    const uploads = 'UU' + canal.slice(2);
    const itens = await fetch(
        `${API}/playlistItems?part=contentDetails&maxResults=5&playlistId=${encodeURIComponent(uploads)}&key=${encodeURIComponent(chave)}`
    );
    if (!itens.ok) return { live: false };
    const ids: string[] = ((await itens.json()).items ?? [])
        .map((i: { contentDetails?: { videoId?: string } }) => i.contentDetails?.videoId)
        .filter(Boolean);
    if (ids.length === 0) return { live: false };

    const videos = await fetch(
        `${API}/videos?part=snippet,liveStreamingDetails&id=${ids.join(',')}&key=${encodeURIComponent(chave)}`
    );
    if (!videos.ok) return { live: false };
    const aoVivo = ((await videos.json()).items ?? []).find(
        (v: { snippet?: { liveBroadcastContent?: string; channelId?: string } }) =>
            v.snippet?.liveBroadcastContent === 'live' && v.snippet?.channelId === canal,
    );
    if (!aoVivo) return { live: false };

    return {
        live: true,
        videoId: aoVivo.id,
        titulo: aoVivo.snippet.title,
        inicio: aoVivo.liveStreamingDetails?.actualStartTime ?? null,
    };
}

export async function GET() {
    let status: LiveStatus = { live: false };
    try {
        status = await buscarLive();
    } catch {
        // falha na API = fica no canal 24h, sem erro para o público
    }
    return NextResponse.json(status, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
    });
}
