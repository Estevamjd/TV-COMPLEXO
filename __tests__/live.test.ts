import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { CANAL_PADRAO, USER_AGENT_NAVEGADOR, analisarPaginaLive, limparCacheLive, statusDaLive } from '@/lib/live';
import { GET } from '@/app/api/live/route';

const fixture = (nome: string) => readFileSync(path.join(__dirname, 'fixtures', nome), 'utf8');

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

describe('detecção da live COM YOUTUBE_API_KEY (API tem precedência)', () => {
    it('COM live: acha a live entre os uploads recentes usando só chamadas de 1 unidade', async () => {
        respostas(uploads(ID_VOD, ID_LIVE), { items: [video(ID_VOD, 'none'), video(ID_LIVE, 'live')] });
        expect(await statusDaLive()).toEqual({
            live: true, videoId: ID_LIVE, titulo: `Vídeo ${ID_LIVE}`, inicio: '2026-11-01T18:00:00Z', fonte: 'api', canal: CANAL,
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

    it('com chave, a página /live nunca é lida (nem quando a API falha: falha = sem live)', async () => {
        fetchMock.mockResolvedValueOnce(json({ error: {} }, 403));
        expect(await statusDaLive()).toEqual({ live: false });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(new URL(fetchMock.mock.calls[0][0]).hostname).toBe('www.googleapis.com');
    });

    it('LIVE_YOUTUBE_AUTO=0: sem live e sem chamar o YouTube (com ou sem chave)', async () => {
        vi.stubEnv('LIVE_YOUTUBE_AUTO', '0');
        expect(await statusDaLive()).toEqual({ live: false });
        vi.stubEnv('YOUTUBE_API_KEY', '');
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

    it('LIVE_MOCK_VIDEO_ID simula live sem chamar o YouTube (prévia/teste), mas é ignorada com VERCEL_ENV=production', async () => {
        vi.stubEnv('LIVE_MOCK_VIDEO_ID', 'jfKfPfyJRdk');
        for (const ambiente of ['', 'preview', 'development']) {
            vi.stubEnv('VERCEL_ENV', ambiente);
            expect(await statusDaLive()).toEqual({
                live: true, videoId: 'jfKfPfyJRdk', titulo: 'Live de teste (simulação)', inicio: null, fonte: 'simulada', canal: CANAL,
            });
        }
        expect(fetchMock).not.toHaveBeenCalled();
        vi.stubEnv('VERCEL_ENV', 'production');
        respostas({ items: [] });
        expect(await statusDaLive()).toEqual({ live: false });
        expect(fetchMock).toHaveBeenCalledTimes(1); // detecção de verdade, não a simulação
    });

    it('LIVE_MOCK_VIDEO_ID em produção também é ignorada sem chave (vale a página /live)', async () => {
        vi.stubEnv('LIVE_MOCK_VIDEO_ID', 'jfKfPfyJRdk');
        vi.stubEnv('VERCEL_ENV', 'production');
        vi.stubEnv('YOUTUBE_API_KEY', '');
        fetchMock.mockResolvedValueOnce(new Response(fixture('youtube-live-offline.html')));
        expect(await statusDaLive()).toEqual({ live: false });
        expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe(`/channel/${CANAL}/live`);
    });

    it('LIVE_MOCK_VIDEO_ID inválido é ignorado', async () => {
        vi.stubEnv('LIVE_MOCK_VIDEO_ID', '"><script>');
        respostas({ items: [] });
        expect(await statusDaLive()).toEqual({ live: false });
    });
});

describe('detecção da live SEM chave (página /channel/<canal>/live)', () => {
    const CANAL_REAL = CANAL_PADRAO; // as fixtures são do @tvcomplexofc
    const pagina = (html: string, init: ResponseInit = {}) => new Response(html, { status: 200, ...init });

    beforeEach(() => {
        vi.stubEnv('YOUTUBE_API_KEY', '');
        vi.stubEnv('YOUTUBE_CHANNEL_ID', '');
    });

    it('página ao vivo (fixture): canonical watch?v= + "isLive":true = live, sem chave e sem API', async () => {
        fetchMock.mockResolvedValueOnce(pagina(fixture('youtube-live-no-ar.html')));
        expect(await statusDaLive()).toEqual({
            live: true, videoId: 'liveAgora01', titulo: 'Baile na laje & roda de conversa, ao vivo',
            inicio: '2026-11-01T18:00:00.000Z', fonte: 'pagina', canal: CANAL_REAL,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe(`https://www.youtube.com/channel/${CANAL_REAL}/live`);
        expect(init.headers['User-Agent']).toBe(USER_AGENT_NAVEGADOR);
        expect(init.headers['User-Agent']).toMatch(/^Mozilla\/5\.0 .*Chrome\/\d+/);
        expect(init.redirect).toBe('manual'); // nunca segue redirect (consentimento/bloqueio)
        expect(init.signal).toBeInstanceOf(AbortSignal); // timeout de 2,5 s
    });

    it.each([
        ['live agendada (isUpcoming, upcomingEventData, LIVE_STREAM_OFFLINE)', 'youtube-live-agendada.html'],
        ['canal fora do ar (canonical do canal, sem watch?v=)', 'youtube-live-offline.html'],
        ['página de consentimento (consent.youtube.com)', 'youtube-consentimento.html'],
    ])('%s = sem live', async (_nome, arquivo) => {
        fetchMock.mockResolvedValueOnce(pagina(fixture(arquivo)));
        expect(await statusDaLive()).toEqual({ live: false });
    });

    it('os dois sinais precisam concordar: só canonical, só "isLive":true ou de outro canal = sem live', () => {
        const aoVivo = fixture('youtube-live-no-ar.html');
        expect(analisarPaginaLive(aoVivo, CANAL_REAL)).toMatchObject({ live: true });
        expect(analisarPaginaLive(aoVivo.replace('"isLive":true', '"isLive":false'), CANAL_REAL)).toEqual({ live: false });
        expect(analisarPaginaLive(aoVivo.replace(/<link rel="canonical"[^>]*>/, ''), CANAL_REAL)).toEqual({ live: false });
        expect(analisarPaginaLive(aoVivo.replace('watch?v=liveAgora01', 'channel/UC63_rDkhmAv1bMm55PsyzOw'), CANAL_REAL)).toEqual({ live: false });
        expect(analisarPaginaLive(aoVivo, 'UCoutrooutrooutrooutroou')).toEqual({ live: false });
    });

    it.each([
        ['"isUpcoming":true', (s: string) => s.replace('"isLive":true', '"isLive":true,"isUpcoming":true')],
        ['upcomingEventData', (s: string) => s.replace('</body>', '<script>{"upcomingEventData":{}}</script></body>')],
        ['LIVE_STREAM_OFFLINE', (s: string) => s.replace('</body>', '<script>{"status":"LIVE_STREAM_OFFLINE"}</script></body>')],
        ['captcha', (s: string) => s.replace('</body>', '<div id="captcha-form"></div></body>')],
        ['"unusual traffic"', (s: string) => s.replace('</body>', '<p>Our systems have detected unusual traffic from your computer network.</p></body>')],
    ])('qualquer sinal de dúvida (%s) junto da live = sem live', (_nome, mexer: (s: string) => string) => {
        expect(analisarPaginaLive(mexer(fixture('youtube-live-no-ar.html')), CANAL_REAL)).toEqual({ live: false });
    });

    it.each([
        ['redirect (302 para consent.youtube.com)', () => fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: 'https://consent.youtube.com/m?continue=x' } }))],
        ['HTTP 429 (bloqueio)', () => fetchMock.mockResolvedValueOnce(new Response('', { status: 429 }))],
        ['HTTP 500', () => fetchMock.mockResolvedValueOnce(new Response('erro', { status: 500 }))],
        ['rede fora', () => fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))],
        ['timeout (2,5 s)', () => fetchMock.mockRejectedValueOnce(new DOMException('demorou', 'TimeoutError'))],
        ['página vazia/estranha', () => fetchMock.mockResolvedValueOnce(pagina('<html></html>'))],
    ])('falha da página: %s = sem live, sem lançar erro', async (_nome, preparar) => {
        preparar();
        await expect(statusDaLive()).resolves.toEqual({ live: false });
    });

    describe('páginas REAIS do YouTube (01/11, reduzidas mas fiéis, com o reCAPTCHA v3 invisível)', () => {
        const LOFI = 'UCSJ4gkVC6NrvII8umztf0Ow';
        const aoVivoReal = () => fixture('youtube-real-live-lofigirl.html');
        const offlineReal = () => fixture('youtube-real-offline-tvcomplexo.html');

        it('as fixtures trazem o que derrubava a live: RECAPTCHA_V3_SITEKEY e .grecaptcha-badge', () => {
            for (const html of [aoVivoReal(), offlineReal()]) {
                expect(html).toContain('"RECAPTCHA_V3_SITEKEY":');
                expect(html).toContain('.grecaptcha-badge{visibility:hidden}');
            }
        });

        it('regressão: live real no ar (Lofi Girl) = live, mesmo com "captcha" no HTML normal', async () => {
            vi.stubEnv('YOUTUBE_CHANNEL_ID', LOFI);
            fetchMock.mockResolvedValueOnce(pagina(aoVivoReal()));
            expect(await statusDaLive()).toEqual({
                live: true, videoId: '0sfDth4lMLc', titulo: '24/7 halloween ambience 🎃 spooky lofi to get chills to',
                inicio: null, fonte: 'pagina', canal: LOFI,
            });
            expect(fetchMock.mock.calls[0][0]).toBe(`https://www.youtube.com/channel/${LOFI}/live`);
        });

        it('canal real fora do ar (@tvcomplexofc) = sem live', async () => {
            fetchMock.mockResolvedValueOnce(pagina(offlineReal()));
            expect(await statusDaLive()).toEqual({ live: false });
        });

        it('a live real pedida para outro canal (o padrão) = sem live', () => {
            expect(analisarPaginaLive(aoVivoReal(), CANAL_REAL)).toEqual({ live: false });
        });

        it.each([
            ['página /sorry/ do Google', '<form action="https://www.google.com/sorry/index" method="post"></form>'],
            ['"unusual traffic"', '<p>Our systems have detected unusual traffic from your computer network.</p>'],
            ['"tráfego incomum"', '<p>Nossos sistemas detectaram tráfego incomum em sua rede de computadores.</p>'],
            ['formulário id="captcha-form"', '<form id="captcha-form" action="index" method="post"></form>'],
            ['widget de desafio class="g-recaptcha"', '<div id="recaptcha" class="g-recaptcha" data-sitekey="x"></div>'],
        ])('bloqueio específico (%s) junto da live real = sem live', (_nome, trecho) => {
            const html = aoVivoReal().replace('</body>', `${trecho}</body>`);
            expect(analisarPaginaLive(html, LOFI)).toEqual({ live: false });
        });
    });

    it('cache de 60 s: a página é lida uma vez por janela (inclusive com falha)', async () => {
        fetchMock.mockImplementation(async () => pagina(fixture('youtube-live-offline.html')));
        await Promise.all(Array.from({ length: 20 }, () => statusDaLive()));
        await vi.advanceTimersByTimeAsync(59_000);
        await statusDaLive();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1_000);
        fetchMock.mockImplementation(async () => pagina(fixture('youtube-live-no-ar.html')));
        expect(await statusDaLive()).toMatchObject({ live: true, videoId: 'liveAgora01' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});

describe('R15-2: a Início e /api/live compartilham UM cache', () => {
    // No Next, a Início e /api/live são bundles diferentes, cada um com a sua cópia de lib/live.ts.
    // vi.resetModules() + import de novo simula isso: o cache tem de sobreviver à cópia nova.
    async function copiaNovaDoModulo() {
        vi.resetModules();
        return import('@/lib/live');
    }

    it.each([
        ['sem chave: página /live', () => {
            vi.stubEnv('YOUTUBE_API_KEY', '');
            vi.stubEnv('YOUTUBE_CHANNEL_ID', '');
            fetchMock.mockImplementation(async () => new Response(fixture('youtube-live-no-ar.html')));
        }, 1],
        ['com chave: API (playlistItems + videos)', () => {
            fetchMock.mockImplementation(async (url: string) => new URL(url).pathname.endsWith('/playlistItems')
                ? json(uploads(ID_LIVE)) : json({ items: [video(ID_LIVE, 'live')] }));
        }, 2],
    ])('%s: uma leitura só para a Início + /api/live na mesma janela', async (_nome, preparar, chamadasPorLeitura) => {
        preparar();
        const daInicio = await copiaNovaDoModulo();
        const { GET: daRota } = await import('@/app/api/live/route');
        const [inicio, rota] = await Promise.all([daInicio.statusDaLive(), daRota()]);
        expect(inicio).toMatchObject({ live: true });
        expect(await rota.json()).toEqual(inicio);
        const outraCopia = await copiaNovaDoModulo();
        expect(await outraCopia.statusDaLive()).toEqual(inicio);
        expect(fetchMock).toHaveBeenCalledTimes(chamadasPorLeitura); // uma leitura, não duas
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
