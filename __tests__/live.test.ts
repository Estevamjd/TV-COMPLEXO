import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANAL_PADRAO, limparCacheLive, statusDaLive } from '@/lib/live';
import { GET } from '@/app/api/live/route';

const fetchMock = vi.fn();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const CANAL = 'UCabcdefghijklmnopqrstuv';
const uploads = (...ids: string[]) => ({ items: ids.map(videoId => ({ contentDetails: { videoId } })) });
const video = (id: string, conteudo: string, extra: Record<string, unknown> = {}) => ({
    id,
    snippet: { channelId: CANAL, title: `Vídeo ${id}`, liveBroadcastContent: conteudo },
    liveStreamingDetails: conteudo === 'none' ? undefined : { actualStartTime: '2026-11-01T18:00:00Z' },
    ...extra,
});
const ID_LIVE = 'liveAgora01';
const ID_VOD = 'videoAntigo';

beforeEach(() => {
    limparCacheLive();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T19:00:00Z'));
    vi.stubEnv('YOUTUBE_API_KEY', 'chave-teste');
    vi.stubEnv('YOUTUBE_CHANNEL_ID', CANAL);
    vi.stubEnv('LIVE_YOUTUBE_AUTO', '');
    vi.stubEnv('LIVE_MOCK_VIDEO_ID', '');
    vi.stubEnv('VERCEL_ENV', '');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function respostas(listaUploads: unknown, listaVideos?: unknown) {
    fetchMock.mockResolvedValueOnce(json(listaUploads));
    if (listaVideos !== undefined) fetchMock.mockResolvedValueOnce(json(listaVideos));
}
const caminhos = () => fetchMock.mock.calls.map(([url]) => new URL(url).pathname);

describe('detecção da live (lib/live.ts)', () => {
    it('COM live: acha a live entre os uploads recentes usando só chamadas de 1 unidade', async () => {
        respostas(uploads(ID_VOD, ID_LIVE), { items: [video(ID_VOD, 'none'), video(ID_LIVE, 'live')] });
        expect(await statusDaLive()).toEqual({
            live: true, videoId: ID_LIVE, titulo: `Vídeo ${ID_LIVE}`, inicio: '2026-11-01T18:00:00Z',
        });
        expect(caminhos()).toEqual(['/youtube/v3/playlistItems', '/youtube/v3/videos']);
        const lista = new URL(fetchMock.mock.calls[0][0]);
        expect(lista.searchParams.get('playlistId')).toBe('UUabcdefghijklmnopqrstuv'); // uploads = UC → UU
        const videos = new URL(fetchMock.mock.calls[1][0]);
        expect(videos.searchParams.get('id')).toBe(`${ID_VOD},${ID_LIVE}`);
        expect(videos.searchParams.get('part')).toBe('snippet,liveStreamingDetails');
    });

    it('SEM live: uploads sem transmissão no ar = sem live', async () => {
        respostas(uploads(ID_VOD, ID_LIVE), { items: [video(ID_VOD, 'none'), video(ID_LIVE, 'upcoming')] });
        expect(await statusDaLive()).toEqual({ live: false });
    });

    it('nunca usa search.list (100 unidades)', async () => {
        respostas(uploads(ID_LIVE), { items: [video(ID_LIVE, 'live')] });
        await statusDaLive();
        for (const [url] of fetchMock.mock.calls) expect(new URL(url).pathname).not.toContain('/search');
    });

    it('live encerrada (actualEndTime) ou de outro canal não conta', async () => {
        respostas(uploads(ID_LIVE, ID_VOD), { items: [
            video(ID_LIVE, 'live', { liveStreamingDetails: { actualEndTime: '2026-11-01T18:30:00Z' } }),
            { ...video(ID_VOD, 'live'), snippet: { channelId: 'UCoutrooutrooutrooutroou', title: 'x', liveBroadcastContent: 'live' } },
        ] });
        expect(await statusDaLive()).toEqual({ live: false });
    });

    it('canal sem uploads: uma chamada só', async () => {
        respostas({ items: [] });
        expect(await statusDaLive()).toEqual({ live: false });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['HTTP 403 (cota estourada)', () => fetchMock.mockResolvedValueOnce(json({ error: {} }, 403))],
        ['exceção de rede/timeout', () => fetchMock.mockRejectedValueOnce(new Error('timeout'))],
        ['resposta sem items', () => fetchMock.mockResolvedValueOnce(json({ error: {} }))],
    ])('falha silenciosa: %s = sem live, sem lançar erro', async (_nome, preparar) => {
        preparar();
        await expect(statusDaLive()).resolves.toEqual({ live: false });
    });

    it('sem YOUTUBE_API_KEY ou com LIVE_YOUTUBE_AUTO=0: sem live e sem chamar o YouTube', async () => {
        vi.stubEnv('YOUTUBE_API_KEY', '');
        expect(await statusDaLive()).toEqual({ live: false });
        vi.stubEnv('YOUTUBE_API_KEY', 'chave-teste');
        vi.stubEnv('LIVE_YOUTUBE_AUTO', '0');
        expect(await statusDaLive()).toEqual({ live: false });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('YOUTUBE_CHANNEL_ID ausente ou inválido: usa o canal @tvcomplexofc', async () => {
        for (const valor of ['', 'canal-errado']) {
            limparCacheLive();
            fetchMock.mockReset();
            vi.stubEnv('YOUTUBE_CHANNEL_ID', valor);
            respostas({ items: [] });
            await statusDaLive();
            expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('playlistId')).toBe(`UU${CANAL_PADRAO.slice(2)}`);
        }
    });

    it('cache de 60 s (inclusive de falha) e deduplica consultas simultâneas', async () => {
        fetchMock.mockImplementation(async () => json({ error: {} }, 403));
        await Promise.all(Array.from({ length: 20 }, () => statusDaLive()));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(59_000);
        await statusDaLive();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1_000);
        fetchMock.mockReset();
        respostas(uploads(ID_LIVE), { items: [video(ID_LIVE, 'live')] });
        expect(await statusDaLive()).toMatchObject({ live: true, videoId: ID_LIVE });
    });

    it('LIVE_MOCK_VIDEO_ID simula live sem chamar a API, mas nunca em produção na Vercel', async () => {
        vi.stubEnv('LIVE_MOCK_VIDEO_ID', 'jfKfPfyJRdk');
        expect(await statusDaLive()).toEqual({
            live: true, videoId: 'jfKfPfyJRdk', titulo: 'Live de teste (simulação)', inicio: null, simulada: true,
        });
        expect(fetchMock).not.toHaveBeenCalled();
        vi.stubEnv('VERCEL_ENV', 'production');
        respostas({ items: [] });
        expect(await statusDaLive()).toEqual({ live: false });
    });

    it('LIVE_MOCK_VIDEO_ID inválido é ignorado', async () => {
        vi.stubEnv('LIVE_MOCK_VIDEO_ID', '"><script>');
        respostas({ items: [] });
        expect(await statusDaLive()).toEqual({ live: false });
    });
});

describe('GET /api/live', () => {
    it('COM live: devolve o vídeo e cacheia 60 s na borda', async () => {
        respostas(uploads(ID_LIVE), { items: [video(ID_LIVE, 'live')] });
        const r = await GET();
        expect(r.status).toBe(200);
        expect(await r.json()).toMatchObject({ live: true, videoId: ID_LIVE });
        expect(r.headers.get('Cache-Control')).toContain('s-maxage=60');
    });

    it('SEM live ou com falha: 200 { live: false }, sem erro', async () => {
        fetchMock.mockRejectedValueOnce(new Error('rede'));
        const r = await GET();
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ live: false });
    });

    it('live simulada não é cacheada', async () => {
        vi.stubEnv('LIVE_MOCK_VIDEO_ID', 'jfKfPfyJRdk');
        const r = await GET();
        expect(r.headers.get('Cache-Control')).toBe('no-store');
    });
});
