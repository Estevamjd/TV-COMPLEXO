import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Os dois estados da Início, com a detecção (lib/live.ts) controlada pelo teste.
delete process.env.DATABASE_URL;
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/lib/db', () => ({ default: { query: vi.fn() } }));
const live = vi.hoisted(() => ({ status: { live: false } }));
vi.mock('@/lib/live', () => ({ statusDaLive: vi.fn(async () => live.status) }));

const { default: HomePage } = await import('@/app/page');

async function renderizar() {
    return renderToStaticMarkup(await HomePage());
}
const topoDe = html => html.slice(html.indexOf('id="topo"'), html.indexOf('</section>', html.indexOf('id="topo"')));

describe('Início: live do YouTube', () => {
    beforeEach(() => { live.status = { live: false }; });

    it('COM live: player no HTML do servidor em autoplay mudo, selo AO VIVO, "Ligar o som" e "Assistir no YouTube" abaixo do player', async () => {
        live.status = { live: true, videoId: 'liveAgora01', titulo: 'Baile na laje, ao vivo', inicio: '2026-11-01T21:00:00Z' };
        const topo = topoDe(await renderizar());
        expect(topo).toContain('data-state="live"');

        const src = topo.match(/<iframe[^>]*src="([^"]+)"/)[1].replaceAll('&amp;', '&');
        const url = new URL(src);
        expect(url.origin + url.pathname).toBe('https://www.youtube-nocookie.com/embed/liveAgora01');
        expect(url.searchParams.get('autoplay')).toBe('1');
        expect(url.searchParams.get('mute')).toBe('1');
        expect(url.searchParams.get('playsinline')).toBe('1');

        expect(topo).toContain('>AO VIVO</span> desde 18:00');
        expect(topo).toMatch(/<button[^>]*aria-pressed="false"[^>]*>.*Ligar o som<\/button>/);
        expect(topo).toMatch(/<a[^>]*href="https:\/\/www.youtube.com\/watch\?v=liveAgora01"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>.*Assistir no YouTube/);
        expect(topo).toContain('Baile na laje, ao vivo');
        // ordem no HTML: player, depois os botões (ficam abaixo dele)
        expect(topo.indexOf('<iframe')).toBeLessThan(topo.indexOf('Ligar o som'));
        expect(topo.indexOf('Ligar o som')).toBeLessThan(topo.indexOf('Assistir no YouTube'));
    });

    it('SEM live: topo sem player, sem selo e sem bloco vazio; o resto da Início igual', async () => {
        const html = await renderizar();
        const topo = topoDe(html);
        expect(topo).toContain('data-state="normal"');
        expect(topo).not.toContain('<iframe');
        expect(topo).not.toContain('heroGrid');
        expect(html).not.toMatch(/AO VIVO|Ligar o som|Assistir no YouTube|Tá<br\/>no ar/);
        expect(html).toContain('id="reels"');
        expect(html).toContain('Abrir o mapa');
    });

    it('nenhum resto do Canal 24h na Início', async () => {
        for (const status of [{ live: false }, { live: true, videoId: 'liveAgora01', titulo: 'Live', inicio: null }]) {
            live.status = status;
            const html = await renderizar();
            expect(html).not.toMatch(/24 ?h|sem parar|canal24|Liga<br\/>a TV/i);
        }
    });
});
