import { NextResponse } from 'next/server';
import { sincronizarVideosYoutube } from '@/lib/youtube-cron';

/**
 * Cron Job — Busca novos vídeos do YouTube via RSS
 *
 * Vercel: chamado pelo Vercel Cron (vercel.json), todo dia às 08:00 UTC.
 * Cloudflare: o handler `scheduled` do Worker (cloudflare/worker.js) chama esta rota no mesmo horário.
 * A lógica fica em lib/youtube-cron.js.
 *
 * Variáveis de ambiente necessárias:
 * - YOUTUBE_CHANNEL_ID: ID do canal (ex: UCxxxxxxxxxx)
 * - CRON_SECRET: secret para proteger o endpoint contra chamadas externas
 */

export async function GET(request) {
    try {
        // Proteger o endpoint com CRON_SECRET (obrigatório)
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = request.headers.get('authorization');
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { status, corpo } = await sincronizarVideosYoutube();
        return NextResponse.json(corpo, { status });
    } catch (error) {
        console.error('[YouTube Cron] Erro:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar cron do YouTube' },
            { status: 500 }
        );
    }
}
