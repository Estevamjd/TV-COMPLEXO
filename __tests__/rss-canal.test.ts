import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CACHE_RSS_MS, analisarRss, limparCacheRss, videoMaisRecenteDoCanal } from '@/lib/rss-canal';

const RSS = readFileSync(path.join(__dirname, 'fixtures', 'youtube-rss.xml'), 'utf8');
const fetchMock = vi.fn();

beforeEach(() => {
    limparCacheRss();
    vi.useFakeTimers();
    vi.stubEnv('YOUTUBE_CHANNEL_ID', '');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('vídeo mais recente pelo RSS do canal (lib/rss-canal.ts)', () => {
    it('lê o feed do @tvcomplexofc e devolve a primeira entrada (a mais nova)', async () => {
        fetchMock.mockResolvedValueOnce(new Response(RSS));
        expect(await videoMaisRecenteDoCanal()).toEqual({ youtubeId: 'rssRecente1', titulo: 'Mutirão na Grota & feira de domingo' });
        expect(fetchMock.mock.calls[0][0]).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UC63_rDkhmAv1bMm55PsyzOw');
        expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    it('cache de 10 min com consultas simultâneas deduplicadas', async () => {
        fetchMock.mockImplementation(async () => new Response(RSS));
        await Promise.all(Array.from({ length: 10 }, () => videoMaisRecenteDoCanal()));
        await vi.advanceTimersByTimeAsync(CACHE_RSS_MS - 1000);
        await videoMaisRecenteDoCanal();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1000);
        await videoMaisRecenteDoCanal();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
        ['HTTP 404', () => fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }))],
        ['rede fora', () => fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))],
        ['timeout', () => fetchMock.mockRejectedValueOnce(new DOMException('demorou', 'TimeoutError'))],
        ['XML sem entradas', () => fetchMock.mockResolvedValueOnce(new Response('<feed></feed>'))],
    ])('falha (%s) = null, sem lançar erro; tenta de novo em 1 min', async (_nome, preparar) => {
        preparar();
        await expect(videoMaisRecenteDoCanal()).resolves.toBeNull();
        fetchMock.mockResolvedValue(new Response(RSS));
        await vi.advanceTimersByTimeAsync(60_000);
        expect(await videoMaisRecenteDoCanal()).toMatchObject({ youtubeId: 'rssRecente1' });
    });

    it('ignora entrada sem videoId válido', () => {
        expect(analisarRss('<feed><entry><yt:videoId>"><script></yt:videoId><title>x</title></entry></feed>')).toBeNull();
    });
});
