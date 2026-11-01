import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Os dois estados da Início, com a detecção (lib/live.ts) controlada pelo teste.
delete process.env.DATABASE_URL;
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/lib/db', () => ({ default: { query: vi.fn() } }));
const live = vi.hoisted(() => ({ status: { live: false } }));
vi.mock('@/lib/live', () => ({ statusDaLive: vi.fn(async () => live.status) }));
// RSS fora (null): o topo sem live cai no banco (vazio aqui) e depois no vídeo de reserva
vi.mock('@/lib/rss-canal', () => ({ videoMaisRecenteDoCanal: vi.fn(async () => null) }));

const { default: HomePage } = await import('@/app/page');

async function renderizar() {
    return renderToStaticMarkup(await HomePage());
}
const topoDe = html => html.slice(html.indexOf('id="topo"'), html.indexOf('</section>', html.indexOf('id="topo"')));

describe('Início: live do YouTube', () => {
    beforeEach(() => { live.status = { live: false }; });

    it('COM live: player no HTML do servidor em autoplay mudo com tela cheia, selo AO VIVO, som sobre o vídeo e "Assistir agora" abaixo', async () => {
        live.status = { live: true, videoId: 'liveAgora01', titulo: 'Baile na laje, ao vivo', inicio: '2026-11-01T21:00:00Z' };
        const topo = topoDe(await renderizar());
        expect(topo).toContain('data-state="live"');

        const iframe = topo.match(/<iframe[^>]*>/)[0];
        const url = new URL(iframe.match(/src="([^"]+)"/)[1].replaceAll('&amp;', '&'));
        expect(url.origin + url.pathname).toBe('https://www.youtube.com/embed/liveAgora01');
        expect(Object.fromEntries(url.searchParams)).toMatchObject({ autoplay: '1', mute: '1', playsinline: '1', fs: '1' });
        expect(url.searchParams.get('loop')).toBeNull();
        expect(iframe).toMatch(/allowFullScreen=""/);
        expect(iframe).toMatch(/allow="[^"]*fullscreen/);

        expect(topo).toContain('>AO VIVO</span> desde 18:00');
        // som: botão pequeno só com ícone, dentro da tela do player, logo depois do iframe
        expect(topo).toMatch(/<\/iframe><button type="button" class="[^"]*somPlayer[^"]*" aria-pressed="false" aria-label="Ligar o som"><svg[^>]*aria-hidden="true">/);
        expect(topo).not.toMatch(/>\s*Ligar o som/);
        expect(topo).toMatch(/<a[^>]*href="https:\/\/www.youtube.com\/watch\?v=liveAgora01"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>.*Assistir agora/);
        expect(topo).not.toContain('Assistir no YouTube');
        expect(topo).toContain('Baile na laje, ao vivo');
        expect(topo.indexOf('<iframe')).toBeLessThan(topo.indexOf('Assistir agora'));
        // sem as fitas decorativas nos cantos do player
        expect(topo).not.toMatch(/_tape_/);
    });

    it('SEM live: o topo volta ao vídeo mais recente (aqui a reserva, banco vazio), sem selo AO VIVO; o resto da Início igual', async () => {
        const html = await renderizar();
        const topo = topoDe(html);
        expect(topo).toContain('data-state="normal"');
        expect(topo).toContain('Liga<br/>a TV!');
        expect(topo).toContain('https://i.ytimg.com/vi/hTBno4SXUgI/hqdefault.jpg');
        expect(topo).toContain('href="https://www.youtube.com/watch?v=hTBno4SXUgI"');
        expect(topo).not.toMatch(/_tape_/);
        expect(html).not.toMatch(/AO VIVO|Assistir no YouTube|Tá<br\/>no ar/);
        expect(html).toContain('id="reels"');
        expect(html).toContain('Abrir o mapa');
    });

    it('COM live detectada sem chave (página /live): player = embed/<videoId> detectado (sem live_stream); "Assistir agora" = watch?v= detectado', async () => {
        live.status = { live: true, videoId: 'liveAgora01', titulo: 'Live', inicio: null, fonte: 'pagina', canal: 'UC63_rDkhmAv1bMm55PsyzOw' };
        const topo = topoDe(await renderizar());
        const url = new URL(topo.match(/<iframe[^>]*src="([^"]+)"/)[1].replaceAll('&amp;', '&'));
        expect(url.origin + url.pathname).toBe('https://www.youtube.com/embed/liveAgora01');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            autoplay: '1', mute: '1', playsinline: '1', rel: '0', enablejsapi: '1', fs: '1',
        });
        expect(topo).not.toMatch(/live_stream|channel=/);
        expect(topo).toMatch(/<iframe[^>]*allowFullScreen=""/);
        expect(topo).toMatch(/<button[^>]*aria-label="Ligar o som"/);
        expect(topo).toMatch(/<a[^>]*href="https:\/\/www.youtube.com\/watch\?v=liveAgora01"[^>]*target="_blank"[^>]*>.*Assistir agora/);
    });

    it('?demo=live continua removido: o parâmetro não muda nada', async () => {
        const html = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({ demo: 'live' }) }));
        expect(topoDe(html)).toContain('data-state="normal"');
        expect(html).not.toMatch(/demonstra|demo/i);
    });

    it('nenhum resto do Canal 24h na Início', async () => {
        for (const status of [{ live: false }, { live: true, videoId: 'liveAgora01', titulo: 'Live', inicio: null }]) {
            live.status = status;
            const html = await renderizar();
            expect(html).not.toMatch(/24 ?h|sem parar|canal24|Ver a grade/i);
        }
    });
});
