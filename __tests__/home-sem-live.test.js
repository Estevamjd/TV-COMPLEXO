import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';

// Sem live, a Início mostra o vídeo mais recente no topo (como na base 461fb49), vindo do RSS
// do canal. lib/live.ts e lib/rss-canal.ts de verdade (sem mock); só o fetch é controlado.
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
const banco = vi.hoisted(() => ({ videos: [] }));
vi.mock('@/lib/db', () => ({
    default: { query: vi.fn(async sql => ({ rows: /FROM videos/.test(sql) ? banco.videos : [] })) },
}));

const { default: HomePage } = await import('@/app/page');
const { limparCacheLive } = await import('@/lib/live');
const { limparCacheRss } = await import('@/lib/rss-canal');

const fixture = nome => readFileSync(path.join(__dirname, 'fixtures', nome), 'utf8');
const MAIS_RECENTE_DB = { id: 7, titulo: 'Mutirão do banco', plataforma: 'youtube', external_id: 'maisRecen01', url_video: 'https://youtu.be/maisRecen01', thumbnail: null, created_at: '2026-10-31' };
const ANTIGO = { id: 6, titulo: 'Vídeo antigo', plataforma: 'youtube', external_id: 'videoAntig1', url_video: null, thumbnail: null, created_at: '2026-10-01' };
const topoDe = html => html.slice(html.indexOf('id="topo"'), html.indexOf('</section>', html.indexOf('id="topo"')));

/** fetch por endereço: RSS, página /live e API do YouTube, cada um com a sua resposta. */
function youtube({ rss = () => new Response(fixture('youtube-rss.xml')), pagina, api } = {}) {
    const fetchMock = vi.fn(async url => {
        const u = new URL(url);
        if (u.pathname === '/feeds/videos.xml') return rss();
        if (u.pathname.endsWith('/live')) return pagina();
        if (u.hostname === 'www.googleapis.com') return api(u);
        throw new Error(`fetch inesperado: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

async function topo() {
    return topoDe(renderToStaticMarkup(await HomePage()));
}

function esperaVideoMaisRecente(t, id = 'rssRecente1', titulo = 'Mutirão na Grota &amp; feira de domingo') {
    expect(t).toContain('data-state="normal"');
    expect(t).toContain('Liga<br/>a TV!');
    expect(t).toContain('>Vídeo mais recente</p>');
    expect(t).toContain(titulo);
    // pôster no HTML do servidor; o player entra sozinho depois da hidratação
    expect(t).toContain(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
    expect(t).toMatch(new RegExp(`<a[^>]*href="https://www.youtube.com/watch\\?v=${id}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>.*Assistir agora`));
    expect(t).not.toMatch(/AO VIVO|Tá<br\/>no ar|videoAntig1|live_stream/);
    expect(t).not.toMatch(/24 ?h|sem parar|canal24/i);
}

beforeEach(() => {
    limparCacheLive();
    limparCacheRss();
    banco.videos = [MAIS_RECENTE_DB, ANTIGO];
    vi.stubEnv('DATABASE_URL', 'postgres://teste');
    vi.stubEnv('YOUTUBE_API_KEY', '');
    vi.stubEnv('YOUTUBE_CHANNEL_ID', '');
    vi.stubEnv('LIVE_YOUTUBE_AUTO', '');
    vi.stubEnv('LIVE_MOCK_VIDEO_ID', '');
    vi.stubEnv('VERCEL_ENV', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Início sem live (sem chave): topo com o vídeo mais recente do RSS', () => {
    it.each([
        ['canal fora do ar', () => new Response(fixture('youtube-live-offline.html'))],
        ['live só agendada', () => new Response(fixture('youtube-live-agendada.html'))],
        ['página de consentimento', () => new Response(fixture('youtube-consentimento.html'))],
        ['redirect', () => new Response(null, { status: 302, headers: { Location: 'https://consent.youtube.com/' } })],
        ['página fora (500)', () => new Response('', { status: 500 })],
        ['rede fora', () => Promise.reject(new TypeError('fetch failed'))],
        ['timeout', () => Promise.reject(new DOMException('demorou', 'TimeoutError'))],
    ])('%s', async (_nome, pagina) => {
        youtube({ pagina });
        esperaVideoMaisRecente(await topo());
    });

    it('página ao vivo (fixture): a Início vira live, com o embed live_stream do canal', async () => {
        youtube({ pagina: () => new Response(fixture('youtube-live-no-ar.html')) });
        const t = await topo();
        expect(t).toContain('data-state="live"');
        expect(t).toContain('https://www.youtube.com/embed/live_stream?');
        expect(t).toContain('channel=UC63_rDkhmAv1bMm55PsyzOw');
        expect(t).toContain('href="https://www.youtube.com/watch?v=liveAgora01"');
    });
});

describe('Início com YOUTUBE_API_KEY: a API tem precedência', () => {
    beforeEach(() => { vi.stubEnv('YOUTUBE_API_KEY', 'chave-teste'); });

    it('sem live na API: vídeo mais recente do RSS, e a página /live não é lida', async () => {
        const fetchMock = youtube({
            pagina: () => new Response(fixture('youtube-live-no-ar.html')),
            api: u => new Response(JSON.stringify(u.pathname.endsWith('/playlistItems')
                ? { items: [{ contentDetails: { videoId: 'rssRecente1' } }] }
                : { items: [{ id: 'rssRecente1', snippet: { channelId: 'UC63_rDkhmAv1bMm55PsyzOw', liveBroadcastContent: 'none' } }] })),
        });
        esperaVideoMaisRecente(await topo());
        expect(fetchMock.mock.calls.some(([url]) => new URL(url).pathname.endsWith('/live'))).toBe(false);
    });

    it.each([
        ['cota estourada (403)', () => new Response(JSON.stringify({ error: { errors: [{ reason: 'quotaExceeded' }] } }), { status: 403 })],
        ['erro do servidor (500)', () => new Response('erro', { status: 500 })],
        ['rede fora', () => Promise.reject(new TypeError('fetch failed'))],
        ['resposta estranha', () => new Response('não é json')],
    ])('falha da API (%s): vídeo mais recente', async (_nome, api) => {
        youtube({ api, pagina: () => new Response(fixture('youtube-live-no-ar.html')) });
        esperaVideoMaisRecente(await topo());
    });
});

describe('RSS fora: comportamento anterior (banco, depois vídeo de reserva)', () => {
    const pagina = () => new Response(fixture('youtube-live-offline.html'));

    it.each([
        ['RSS 404', () => new Response('', { status: 404 })],
        ['RSS com rede fora', () => Promise.reject(new TypeError('fetch failed'))],
    ])('%s: vídeo mais recente do banco', async (_nome, rss) => {
        youtube({ rss, pagina });
        esperaVideoMaisRecente(await topo(), 'maisRecen01', 'Mutirão do banco');
    });

    it('RSS fora e mais recente do banco é do Instagram: vídeo de reserva, sem se passar por "mais recente"', async () => {
        youtube({ rss: () => new Response('', { status: 503 }), pagina });
        banco.videos = [{ ...MAIS_RECENTE_DB, plataforma: 'instagram', external_id: 'C1a2b3c4d5e', url_video: 'https://www.instagram.com/reel/C1a2b3c4d5e/' }, ANTIGO];
        const t = await topo();
        expect(t).toContain('https://i.ytimg.com/vi/hTBno4SXUgI/hqdefault.jpg');
        expect(t).toContain('href="https://www.youtube.com/watch?v=hTBno4SXUgI"');
        expect(t).toContain('>Vídeo em destaque</p>');
        expect(t).not.toContain('Vídeo mais recente');
    });
});
