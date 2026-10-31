import { afterEach, describe, expect, it, vi } from 'vitest';
import { isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Mesmo esquema de canal-topo-live: estados e efeitos controlados, sem DOM ou rede.
// Ordem dos estados: 2 live, 3 tocando, 4 aviso, 8 som. Efeito 4 = autoplay.
const hooks = vi.hoisted(() => ({ estados: [], efeitos: [], cursor: 0 }));
vi.mock('react', async importOriginal => ({
    ...await importOriginal(),
    useState(inicial) {
        const i = hooks.cursor++;
        if (i >= hooks.estados.length) hooks.estados.push(typeof inicial === 'function' ? inicial() : inicial);
        return [hooks.estados[i], valor => { hooks.estados[i] = typeof valor === 'function' ? valor(hooks.estados[i]) : valor; }];
    },
    useRef: valor => ({ current: valor }),
    useEffect: efeito => hooks.efeitos.push(efeito),
}));
vi.mock('next/image', () => ({ default: () => null }));
vi.mock('next/link', () => ({ default: () => null }));
const { default: CanalTopo, urlEmbed } = await import('@/components/home-urbano/CanalTopo');

const DESTAQUE = { youtubeId: 'abcDEF12345', titulo: 'Vídeo mais recente' };
const NOCOOKIE = 'https://www.youtube-nocookie.com';

afterEach(() => { hooks.estados = []; hooks.efeitos = []; hooks.cursor = 0; });

function renderizar(props) {
    hooks.cursor = 0;
    hooks.efeitos = [];
    return CanalTopo(props);
}

/** Procura o primeiro elemento host (iframe, button...) que satisfaz o teste. */
function achar(no, teste) {
    if (Array.isArray(no)) {
        for (const filho of no) { const r = achar(filho, teste); if (r) return r; }
        return null;
    }
    if (!isValidElement(no)) return null;
    if (typeof no.type === 'string' && teste(no)) return no;
    return achar(no.props?.children, teste);
}

function parametros(src) {
    return Object.fromEntries(new URL(src).searchParams);
}

describe('urlEmbed', () => {
    it('vídeo único: autoplay mudo, inline, jsapi e loop com playlist do mesmo id', () => {
        const url = urlEmbed({ avulso: true, id: DESTAQUE.youtubeId, start: 0 }, 'https://tvcomplexo.com.br');
        expect(url.startsWith(`${NOCOOKIE}/embed/${DESTAQUE.youtubeId}?`)).toBe(true);
        expect(parametros(url)).toMatchObject({
            autoplay: '1', mute: '1', playsinline: '1', enablejsapi: '1',
            loop: '1', playlist: DESTAQUE.youtubeId, origin: 'https://tvcomplexo.com.br',
        });
    });

    it('live: autoplay mudo com jsapi, sem loop', () => {
        const p = parametros(urlEmbed({ live: true, id: 'liveVideo01', start: 0 }));
        expect(p).toMatchObject({ autoplay: '1', mute: '1', playsinline: '1', enablejsapi: '1' });
        expect(p.loop).toBeUndefined();
        expect(p.playlist).toBeUndefined();
    });

    it('canal 24h: mantém o start do relógio e não usa loop', () => {
        const p = parametros(urlEmbed({ id: 'canal24h001', start: 42 }));
        expect(p).toMatchObject({ autoplay: '1', mute: '1', start: '42', enablejsapi: '1' });
        expect(p.loop).toBeUndefined();
    });
});

describe('autoplay e botão de som', () => {
    const props = { agoraInicial: Date.now(), destaque: DESTAQUE };

    it('sem live e sem canal 24h real, começa sozinho no vídeo mais recente em loop', () => {
        renderizar(props);
        expect(hooks.estados[3]).toBeNull(); // HTML do servidor: pôster
        hooks.efeitos[4]();
        expect(hooks.estados[3]).toEqual({ avulso: true, id: DESTAQUE.youtubeId, start: 0 });

        const html = renderToStaticMarkup(renderizar(props));
        const src = html.match(/<iframe[^>]*src="([^"]+)"/)[1].replaceAll('&amp;', '&');
        expect(parametros(src)).toMatchObject({ autoplay: '1', mute: '1', loop: '1', playlist: DESTAQUE.youtubeId });
        expect(html).toMatch(/<button[^>]*aria-pressed="false"[^>]*>.*Ligar o som<\/button>/);
    });

    it('live detectada tem prioridade no autoplay', () => {
        renderizar(props);
        hooks.estados[2] = { videoId: 'liveVideo01', titulo: 'Ao vivo', inicio: null };
        renderizar(props);
        hooks.efeitos[4]();
        expect(hooks.estados[3]).toEqual({ live: true, id: 'liveVideo01', start: 0 });
    });

    it('liga e desliga o som por postMessage sem trocar o src do iframe', () => {
        renderizar(props);
        hooks.efeitos[4]();
        let arvore = renderizar(props);
        const iframe = achar(arvore, el => el.type === 'iframe');
        const src = iframe.props.src;
        const postMessage = vi.fn();
        iframe.props.ref.current = { contentWindow: { postMessage } };

        const ligar = achar(arvore, el => el.type === 'button' && 'aria-pressed' in el.props);
        expect(ligar.props['aria-pressed']).toBe(false);
        ligar.props.onClick();
        expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), NOCOOKIE);
        expect(hooks.estados[8]).toBe(true);

        arvore = renderizar(props);
        expect(achar(arvore, el => el.type === 'iframe').props.src).toBe(src);
        const html = renderToStaticMarkup(arvore);
        expect(html).toMatch(/<button[^>]*aria-pressed="true"[^>]*>.*Desligar o som<\/button>/);

        const iframe2 = achar(arvore, el => el.type === 'iframe');
        iframe2.props.ref.current = { contentWindow: { postMessage } };
        achar(arvore, el => el.type === 'button' && 'aria-pressed' in el.props).props.onClick();
        expect(postMessage).toHaveBeenLastCalledWith(JSON.stringify({ event: 'command', func: 'mute', args: [] }), NOCOOKIE);
        expect(hooks.estados[8]).toBe(false);
    });

    it('sem live, sem 24h real e sem destaque do YouTube, toca a reserva hTBno4SXUgI mudo e em loop', () => {
        const semDestaque = { agoraInicial: Date.now(), destaque: null };
        renderizar(semDestaque);
        hooks.efeitos[4]();
        expect(hooks.estados[3]).toEqual({ avulso: true, id: 'hTBno4SXUgI', start: 0 });
        const html = renderToStaticMarkup(renderizar(semDestaque));
        const src = html.match(/<iframe[^>]*src="([^"]+)"/)[1].replaceAll('&amp;', '&');
        expect(src.startsWith(`${NOCOOKIE}/embed/hTBno4SXUgI?`)).toBe(true);
        expect(parametros(src)).toMatchObject({
            autoplay: '1', mute: '1', playsinline: '1', loop: '1', playlist: 'hTBno4SXUgI', enablejsapi: '1',
        });
        expect(html).toContain('Ligar o som');
        expect(html).not.toContain('Vídeo mais recente'); // a reserva não se passa por vídeo mais recente
    });

    it('live encerrada volta para a reserva quando não há 24h real nem destaque', async () => {
        vi.useFakeTimers();
        vi.stubGlobal('document', { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() });
        vi.stubGlobal('fetch', vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ live: true, videoId: 'liveVideo01', titulo: 'Ao vivo', inicio: null })))
            .mockResolvedValueOnce(new Response(JSON.stringify({ live: false }))));
        const semDestaque = { agoraInicial: Date.now() };
        try {
            renderizar(semDestaque);
            hooks.efeitos[4](); // autoplay inicial: reserva
            const limpar = hooks.efeitos[2]();
            await vi.advanceTimersByTimeAsync(0); // live detectada: player troca para a live
            expect(hooks.estados[3]).toEqual({ live: true, id: 'liveVideo01', start: 0 });
            await vi.advanceTimersByTimeAsync(120_000); // live acabou: sem 24h real, player zera
            expect(hooks.estados[3]).toBeNull();
            renderizar(semDestaque);
            hooks.efeitos[4](); // autoplay volta para a reserva
            expect(hooks.estados[3]).toEqual({ avulso: true, id: 'hTBno4SXUgI', start: 0 });
            limpar();
        } finally {
            vi.useRealTimers();
            vi.unstubAllGlobals();
        }
    });
});
