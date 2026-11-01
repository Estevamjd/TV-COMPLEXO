import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Sem banco: a Início não pode consultar nada nem mostrar texto de exemplo.
delete process.env.DATABASE_URL;
// Sem chave do YouTube, sem simulação e sem rede: a página /live e o RSS falham = sem live,
// e o topo cai no vídeo de reserva.
delete process.env.YOUTUBE_API_KEY;
delete process.env.LIVE_MOCK_VIDEO_ID;
vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('sem rede no teste'); }));
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/lib/db', () => ({ default: { query: vi.fn(() => { throw new Error('não deveria consultar o banco'); }) } }));

const { default: HomePage } = await import('@/app/page');
const { default: db } = await import('@/lib/db');

let html = '';
beforeAll(async () => {
    html = renderToStaticMarkup(await HomePage());
});

describe('Início sem dados (sem DATABASE_URL)', () => {
    it('renderiza o topo sem consultar o banco', () => {
        expect(html).toContain('topo-titulo');
        expect(db.query).not.toHaveBeenCalled();
    });

    it.each([
        /exemplo/i,
        /Player ainda não configurado/i,
        /em breve/i,
        /Demonstração — vídeos/i,
        /Vídeo do canal \d/i,
    ])('não mostra %s', (padrao) => {
        expect(html).not.toMatch(padrao);
    });

    it('sem live e sem banco, o topo usa o vídeo de reserva (pôster no HTML do servidor, iframe só depois da hidratação)', () => {
        const topo = html.slice(html.indexOf('id="topo"'), html.indexOf('</section>', html.indexOf('id="topo"')));
        expect(topo).toContain('id="topo-titulo"');
        expect(topo).toContain('https://i.ytimg.com/vi/hTBno4SXUgI/hqdefault.jpg');
        expect(topo).not.toContain('<iframe');
        expect(html).not.toMatch(/AO VIVO|Assistir no YouTube/);
    });

    it('esconde as seções sem conteúdo (vídeos, notícias, grade)', () => {
        expect(html).not.toContain('id="videos-titulo"');
        expect(html).not.toContain('id="noticias-titulo"');
        expect(html).not.toContain('id="grade"');
        expect(html).not.toContain('href="#grade"');
    });

    it('mostra o destaque de reels (lista fixa, sem banco) com 3 reels ainda sem iframe', () => {
        const reels = html.slice(html.indexOf('id="reels"'), html.indexOf('</section>', html.indexOf('id="reels"')));
        expect(reels).toContain('id="reels-titulo"');
        expect((reels.match(/Ver no Instagram/g) ?? []).length).toBe(3);
        expect(reels).not.toContain('<iframe');
    });

    it('não tem link para o painel admin no público', () => {
        expect(html).not.toContain('href="/admin"');
    });
});
