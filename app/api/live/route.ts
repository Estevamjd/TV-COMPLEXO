import { NextResponse } from 'next/server';
import { CACHE_MS, statusDaLive } from '@/lib/live';

/**
 * GET /api/live — somente leitura, sem banco. Mesmo status que a home usa (lib/live.ts):
 * { live: false } ou { live: true, videoId, titulo, inicio }. Falha no YouTube = { live: false }.
 * Live simulada (LIVE_MOCK_VIDEO_ID) não é cacheada na borda.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
    const status = await statusDaLive();
    const simulada = status.live && status.simulada;
    return NextResponse.json(status, {
        headers: {
            'Cache-Control': simulada ? 'no-store' : `public, s-maxage=${CACHE_MS / 1000}, stale-while-revalidate=30`,
        },
    });
}
