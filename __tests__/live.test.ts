import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
let GET: typeof import('@/app/api/live/route').GET;
const fetchMock = vi.fn();
const json = (body: unknown) => new Response(JSON.stringify(body));

beforeEach(async () => {
    vi.resetModules();
    ({ GET } = await import('@/app/api/live/route'));
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T07:00:00Z'));
    vi.stubEnv('LIVE_YOUTUBE_AUTO', '1');
    vi.stubEnv('YOUTUBE_API_KEY', 'teste');
    vi.stubEnv('YOUTUBE_CHANNEL_ID', 'UCteste');
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

async function esperarIndisponivel() {
    const r = await GET();
    expect(r.status).toBe(503);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(await r.json()).not.toHaveProperty('live');
    for (const [, options] of fetchMock.mock.calls) expect(options).toEqual({ cache: 'no-store' });
}

describe('/api/live', () => {
    it.each([undefined, '', '0', 'true'])('desliga upstream sem opt-in explícito (%s)', async flag => {
        vi.stubEnv('LIVE_YOUTUBE_AUTO', flag);
        const r = await GET();
        expect(r.status).toBe(200);
        expect(r.headers.get('Cache-Control')).toBe('no-store');
        expect(await r.json()).toEqual({ live: false, demo: true, motivo: 'deteccao-automatica-desligada' });
        expect(fetchMock).not.toHaveBeenCalled();
    });
    it('encontra live pela busca de transmissões ativas e mantém o contrato', async () => {
        fetchMock.mockResolvedValueOnce(json({ items: [{ id: { videoId: 'live-antiga' }, snippet: { channelId: 'UCteste', title: 'No ar' } }] }))
            .mockResolvedValueOnce(json({ items: [{ id: 'live-antiga', snippet: { liveBroadcastContent: 'live', channelId: 'UCteste' }, liveStreamingDetails: { actualStartTime: '2026-10-29T10:00:00Z' } }] }));
        const r = await GET();
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ live: true, videoId: 'live-antiga', titulo: 'No ar', inicio: '2026-10-29T10:00:00Z' });
        const url = new URL(fetchMock.mock.calls[0][0]);
        expect(url.pathname).toBe('/youtube/v3/search');
        for (const [key, value] of Object.entries({ channelId: 'UCteste', eventType: 'live', type: 'video' })) {
            expect(url.searchParams.get(key)).toBe(value);
        }
        for (const [, options] of fetchMock.mock.calls) expect(options).toEqual({ cache: 'no-store' });
        expect(r.headers.get('Cache-Control')).toContain('s-maxage=120');
    });
    it('retorna ausência confirmada cacheável quando a busca está vazia', async () => {
        fetchMock.mockResolvedValueOnce(json({ items: [] }));
        const r = await GET();
        expect(r.status).toBe(200);
        expect(await r.json()).toEqual({ live: false });
        expect(r.headers.get('Cache-Control')).toContain('s-maxage=120');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    it.each([403, 500])('não cacheia erro HTTP %s', async status => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status }));
        await esperarIndisponivel();
    });
    it('não cacheia exceção de rede', async () => {
        fetchMock.mockRejectedValueOnce(new Error('rede'));
        await esperarIndisponivel();
    });
    it('não cacheia erro na consulta de detalhes', async () => {
        fetchMock.mockResolvedValueOnce(json({ items: [{ id: { videoId: 'live' }, snippet: { channelId: 'UCteste', title: 'Live' } }] }))
            .mockResolvedValueOnce(new Response(null, { status: 503 }));
        await esperarIndisponivel();
    });
    it('não considera resposta inválida como ausência confirmada', async () => {
        fetchMock.mockResolvedValueOnce(json({ error: {} }));
        await esperarIndisponivel();
    });
    it.each(['YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID'])('não cacheia configuração ausente: %s', async nome => {
        vi.stubEnv(nome, '');
        await esperarIndisponivel();
        expect(fetchMock).not.toHaveBeenCalled();
    });
    const busca = { items: [{ id: { videoId: 'id-live' }, snippet: { channelId: 'UCteste', title: 'Live' } }] };
    const detalhes = (fim = false) => ({ items: [{ id: 'id-live', snippet: { channelId: 'UCteste', liveBroadcastContent: 'live' }, liveStreamingDetails: fim ? { actualEndTime: '2026-10-29T12:00:00Z' } : {} }] });

    it.each([
        { items: [] },
        { items: [null] },
        { items: [{}] },
        {},
    ])('preserva live confirmada quando o item está ausente ou vazio: %j', async resposta => {
        fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(detalhes()));
        const confirmado = await (await GET()).json();
        expect(confirmado).toMatchObject({ live: true });
        await vi.advanceTimersByTimeAsync(120_000);
        fetchMock.mockResolvedValueOnce(json(resposta));
        await esperarIndisponivel();
        await esperarIndisponivel();
        expect(fetchMock).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(120_000);
        fetchMock.mockResolvedValueOnce(json(detalhes()));
        expect(await (await GET()).json()).toEqual(confirmado);
        expect(fetchMock).toHaveBeenCalledTimes(4);
        expect(new URL(fetchMock.mock.calls.at(-1)![0]).pathname).toBe('/youtube/v3/videos');
    });

    it.each([
        { channelId: 'UCteste' },
        { channelId: 'UCteste', liveBroadcastContent: 'invalido' },
        { channelId: 'UCoutro', liveBroadcastContent: 'none' },
        { channelId: 'UCoutro', liveBroadcastContent: 'live' },
    ])('preserva live confirmada quando detalhes são inconclusivos: %j', async snippet => {
        fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(detalhes()));
        expect(await (await GET()).json()).toMatchObject({ live: true });
        await vi.advanceTimersByTimeAsync(120_000);
        fetchMock.mockResolvedValueOnce(json({ items: [{ id: 'id-live', snippet, liveStreamingDetails: { actualEndTime: '2026-10-29T12:00:00Z' } }] }));
        await esperarIndisponivel();
        await esperarIndisponivel();
        expect(fetchMock).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(120_000);
        fetchMock.mockResolvedValueOnce(json(detalhes()));
        expect(await (await GET()).json()).toMatchObject({ live: true });
        expect(new URL(fetchMock.mock.calls.at(-1)![0]).pathname).toBe('/youtube/v3/videos');
    });

    it('confirma fim nos detalhes mesmo com snippet ainda live', async () => {
        fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(detalhes(true)));
        expect(await (await GET()).json()).toEqual({ live: false });
    });
    it('rejeita snippet que não indica live', async () => {
        const dados = detalhes();
        dados.items[0].snippet.liveBroadcastContent = 'none';
        fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(dados));
        expect(await (await GET()).json()).toEqual({ live: false });
    });
    it('deduplica consultas concorrentes e respeita TTL de pelo menos 900s da busca vazia', async () => {
        fetchMock.mockImplementation(async () => json({ items: [] }));
        await Promise.all(Array.from({ length: 20 }, () => GET()));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(899_000);
        await GET();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(120_000);
        await GET();
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
    it('revalida live conhecida somente com videos.list, inclusive após 900s', async () => {
        fetchMock.mockResolvedValueOnce(json(busca)).mockImplementation(async () => json(detalhes()));
        await GET();
        await GET();
        expect(fetchMock).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(120_000);
        await Promise.all([GET(), GET()]);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(900_000);
        await GET();
        expect(fetchMock).toHaveBeenCalledTimes(4);
        for (const [url] of fetchMock.mock.calls.slice(1)) {
            expect(new URL(url).pathname).toBe('/youtube/v3/videos');
            expect(new URL(url).searchParams.get('part')).toBe('snippet,liveStreamingDetails');
        }
    });
    it('não cacheia falha de detalhes nem perde live conhecida e permite nova tentativa', async () => {
        fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(detalhes()));
        await GET();
        await vi.advanceTimersByTimeAsync(120_000);
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
        await esperarIndisponivel();
        await esperarIndisponivel();
        expect(fetchMock).toHaveBeenCalledTimes(3);
        await vi.advanceTimersByTimeAsync(120_000);
        fetchMock.mockResolvedValueOnce(json(detalhes()));
        expect(await (await GET()).json()).toMatchObject({ live: true });
        expect(fetchMock).toHaveBeenCalledTimes(4);
    });
    it.each([
        ['search', [300, 600, 960, 960]],
        ['videos', [120, 240, 480, 960, 960]],
    ] as const)('aplica backoff às falhas de %s', async (recurso, intervalos) => {
        if (recurso === 'videos') {
            fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(detalhes()));
            await GET();
            await vi.advanceTimersByTimeAsync(120_000);
        }
        fetchMock.mockRejectedValue(new Error('rede'));
        for (const segundos of intervalos) {
            await esperarIndisponivel();
            const chamadas = fetchMock.mock.calls.length;
            await Promise.all(Array.from({ length: 20 }, () => esperarIndisponivel()));
            await vi.advanceTimersByTimeAsync(segundos * 1000 - 1);
            await esperarIndisponivel();
            expect(fetchMock).toHaveBeenCalledTimes(chamadas);
            await vi.advanceTimersByTimeAsync(1);
        }
        if (recurso === 'videos') {
            fetchMock.mockResolvedValueOnce(json(detalhes()));
            expect(await (await GET()).json()).toMatchObject({ live: true });
            expect(new URL(fetchMock.mock.calls.at(-1)![0]).pathname).toContain('/videos');
        } else {
            fetchMock.mockResolvedValueOnce(json({ items: [] }));
            expect(await (await GET()).json()).toEqual({ live: false });
        }
    });

    it.each(['search', 'videos'])('limita orçamento diário de %s e reseta à meia-noite Pacific', async recurso => {
        const teto = recurso === 'search' ? 40 : 600;
        const intervalo = recurso === 'search' ? 960_000 : 120_000;
        if (recurso === 'videos') {
            fetchMock.mockResolvedValueOnce(json(busca));
        }
        fetchMock.mockImplementation(async () => json(recurso === 'search' ? { items: [] } : detalhes()));
        for (let i = 0; i < teto; i++) {
            expect((await GET()).status).toBe(200);
            await vi.advanceTimersByTimeAsync(intervalo);
        }
        const chamadas = fetchMock.mock.calls.length;
        await esperarIndisponivel();
        expect(fetchMock).toHaveBeenCalledTimes(chamadas);
        // UTC já mudou de dia, mas Pacific ainda é 29/10 (PDT).
        vi.setSystemTime(new Date('2026-10-30T06:59:59Z'));
        await esperarIndisponivel();
        expect(fetchMock).toHaveBeenCalledTimes(chamadas);
        vi.setSystemTime(new Date('2026-10-30T07:00:00Z'));
        expect((await GET()).status).toBe(200);
        expect(fetchMock).toHaveBeenCalledTimes(chamadas + 1);
    });

    it('conta erros no teto e reiniciar módulo zera orçamento e estado local', async () => {
        fetchMock.mockRejectedValue(new Error('rede'));
        for (let i = 0; i < 40; i++) {
            await esperarIndisponivel();
            await vi.advanceTimersByTimeAsync(960_000);
        }
        await esperarIndisponivel();
        expect(fetchMock).toHaveBeenCalledTimes(40);
        vi.resetModules();
        ({ GET } = await import('@/app/api/live/route'));
        fetchMock.mockResolvedValueOnce(json(busca)).mockResolvedValueOnce(json(detalhes()));
        expect(await (await GET()).json()).toMatchObject({ live: true });
        expect(fetchMock).toHaveBeenCalledTimes(42);
        vi.resetModules();
        ({ GET } = await import('@/app/api/live/route'));
        fetchMock.mockResolvedValueOnce(json({ items: [] }));
        expect(await (await GET()).json()).toEqual({ live: false });
        expect(fetchMock).toHaveBeenCalledTimes(43);
    });
});
