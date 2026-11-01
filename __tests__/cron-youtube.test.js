import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Banco e YouTube mockados; dados fictícios.
vi.mock('@/lib/db', () => ({ default: { query: vi.fn() } }));
vi.mock('next/server', () => ({
    NextResponse: { json: (corpo, init) => new Response(JSON.stringify(corpo), { status: init?.status ?? 200 }) },
}));

import db from '@/lib/db';
import { GET } from '@/app/api/cron/youtube/route';
import { parseYouTubeRSS, sincronizarVideosYoutube } from '@/lib/youtube-cron';

const RSS = `<feed>
<entry><yt:videoId>AAAAAAAAAAA</yt:videoId><title>Vídeo &amp; um</title><link rel="alternate" href="https://www.youtube.com/watch?v=AAAAAAAAAAA"/><published>2026-10-30T10:00:00+00:00</published></entry>
<entry><yt:videoId>BBBBBBBBBBB</yt:videoId><title>Vídeo dois</title><published>2026-10-31T10:00:00+00:00</published></entry>
</feed>`;

const fetchMock = vi.fn();
beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'segredo-ficticio');
    vi.stubEnv('YOUTUBE_CHANNEL_ID', 'UCabcdefghijklmnopqrstuv');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    db.query.mockReset();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const pedido = (auth) => new Request('https://worker.interno/api/cron/youtube', { headers: auth ? { authorization: auth } : {} });

describe('cron do YouTube', () => {
    it('parse do RSS', () => {
        expect(parseYouTubeRSS(RSS).map(v => [v.videoId, v.title])).toEqual([
            ['AAAAAAAAAAA', 'Vídeo & um'],
            ['BBBBBBBBBBB', 'Vídeo dois'],
        ]);
    });

    it.each([undefined, 'Bearer errado'])('rota sem o CRON_SECRET certo (%s): 401 sem chamar nada', async (auth) => {
        const res = await GET(pedido(auth));
        expect(res.status).toBe(401);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rota com CRON_SECRET: importa só os vídeos novos (mesma lógica do Worker)', async () => {
        fetchMock.mockResolvedValueOnce(new Response(RSS));
        db.query.mockResolvedValueOnce({ rows: [{ external_id: 'AAAAAAAAAAA' }] }).mockResolvedValue({ rows: [] });
        const res = await GET(pedido('Bearer segredo-ficticio'));
        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({ total_in_feed: 2, imported: 1, already_existing: 1 });
        expect(db.query).toHaveBeenCalledTimes(2);
        expect(db.query.mock.calls[1][1][7]).toBe('BBBBBBBBBBB');
    });

    it('sem YOUTUBE_CHANNEL_ID: 500; RSS fora do ar: 502', async () => {
        expect((await sincronizarVideosYoutube({ channelId: '' })).status).toBe(500);
        fetchMock.mockResolvedValueOnce(new Response('x', { status: 503 }));
        expect((await sincronizarVideosYoutube()).status).toBe(502);
    });
});
