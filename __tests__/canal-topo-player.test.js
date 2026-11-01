import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement, isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Player do topo como no navegador já hidratado: estados controlados, sem DOM ou rede.
// Ordem dos estados: 0 aviso, 1 copiado, 2 faixa parada, 3 som.
const hooks = vi.hoisted(() => ({ estados: [], cursor: 0, hidratado: true }));
vi.mock('react', async importOriginal => ({
    ...await importOriginal(),
    useState(inicial) {
        const i = hooks.cursor++;
        if (i >= hooks.estados.length) hooks.estados.push(typeof inicial === 'function' ? inicial() : inicial);
        return [hooks.estados[i], valor => { hooks.estados[i] = typeof valor === 'function' ? valor(hooks.estados[i]) : valor; }];
    },
    useRef: valor => ({ current: valor }),
    useSyncExternalStore: (_inscrever, cliente, servidor) => (hooks.hidratado ? cliente() : servidor()),
}));
vi.mock('next/link', () => ({ default: props => createElement('a', props) }));
vi.mock('@/components/BarraNavegacao', () => ({ default: () => null }));
const { default: CanalTopo, urlEmbed, urlEmbedDaLive } = await import('@/components/home-urbano/CanalTopo');

const DESTAQUE = { youtubeId: 'abcDEF12345', titulo: 'Vídeo mais recente do canal' };
const LIVE = { live: true, videoId: 'liveVideo01', titulo: 'Ao vivo do Alemão', inicio: null, fonte: 'api', canal: 'UC63_rDkhmAv1bMm55PsyzOw' };
const LIVE_PAGINA = { ...LIVE, fonte: 'pagina' };
const EMBED_CANAL = 'https://www.youtube.com/embed/live_stream';
const NOCOOKIE = 'https://www.youtube-nocookie.com';

afterEach(() => { hooks.estados = []; hooks.cursor = 0; hooks.hidratado = true; });

function renderizar(props) {
    hooks.cursor = 0;
    return CanalTopo(props);
}

/** Primeiro elemento host (iframe, button...) que satisfaz o teste. */
function achar(no, teste) {
    if (Array.isArray(no)) {
        for (const filho of no) { const r = achar(filho, teste); if (r) return r; }
        return null;
    }
    if (!isValidElement(no)) return null;
    if (typeof no.type === 'string' && teste(no)) return no;
    return achar(no.props?.children, teste);
}
const parametros = src => Object.fromEntries(new URL(src).searchParams);
const botaoSom = arvore => achar(arvore, el => el.type === 'button' && 'aria-pressed' in el.props);

describe('urlEmbed', () => {
    it('vídeo em destaque: autoplay mudo, inline, jsapi, tela cheia e loop com playlist do mesmo id', () => {
        const url = urlEmbed(DESTAQUE.youtubeId, { loop: true });
        expect(url.startsWith(`${NOCOOKIE}/embed/${DESTAQUE.youtubeId}?`)).toBe(true);
        expect(parametros(url)).toEqual({
            autoplay: '1', mute: '1', playsinline: '1', rel: '0', enablejsapi: '1', fs: '1', loop: '1', playlist: DESTAQUE.youtubeId,
        });
    });

    it('live: autoplay mudo com jsapi e tela cheia, sem loop', () => {
        const p = parametros(urlEmbed('liveVideo01'));
        expect(p).toMatchObject({ autoplay: '1', mute: '1', playsinline: '1', enablejsapi: '1', fs: '1' });
        expect(p.loop).toBeUndefined();
        expect(p.playlist).toBeUndefined();
    });
});

describe('urlEmbedDaLive', () => {
    it('live sem chave (página /live): embed oficial live_stream do canal, autoplay mudo, fs=1 e jsapi', () => {
        const url = urlEmbedDaLive(LIVE_PAGINA);
        expect(url.startsWith(`${EMBED_CANAL}?`)).toBe(true);
        expect(parametros(url)).toEqual({
            autoplay: '1', mute: '1', playsinline: '1', rel: '0', enablejsapi: '1', fs: '1', channel: 'UC63_rDkhmAv1bMm55PsyzOw',
        });
    });

    it('live da API ou simulada: embed do vídeo', () => {
        expect(urlEmbedDaLive(LIVE)).toBe(urlEmbed(LIVE.videoId));
        expect(urlEmbedDaLive({ ...LIVE, fonte: 'simulada' })).toBe(urlEmbed(LIVE.videoId));
    });
});

describe.each([
    ['sem live (vídeo mais recente)', { live: null, destaque: DESTAQUE }, DESTAQUE.youtubeId, urlEmbed(DESTAQUE.youtubeId, { loop: true }), NOCOOKIE],
    ['com live (API)', { live: LIVE, destaque: DESTAQUE }, LIVE.videoId, urlEmbed(LIVE.videoId), NOCOOKIE],
    ['com live (sem chave, página /live)', { live: LIVE_PAGINA, destaque: DESTAQUE }, LIVE.videoId, urlEmbedDaLive(LIVE_PAGINA), 'https://www.youtube.com'],
])('player do topo %s', (_nome, props, id, srcEsperado, origem) => {
    it('toca sozinho e mudo o vídeo certo, com tela cheia (allowFullScreen, allow="fullscreen", fs=1)', () => {
        const iframe = achar(renderizar(props), el => el.type === 'iframe');
        expect(iframe.props.src).toBe(srcEsperado);
        expect(parametros(iframe.props.src)).toMatchObject({ autoplay: '1', mute: '1', fs: '1' });
        expect(iframe.props.allowFullScreen).toBe(true);
        expect(iframe.props.allow.split(/;\s*/)).toContain('fullscreen');
    });

    it('botão de som pequeno, só ícone, dentro da tela do player; liga e desliga por postMessage sem trocar o src', () => {
        let arvore = renderizar(props);
        const tela = achar(arvore, el => el.type === 'div' && /playerTela/.test(el.props.className));
        const som = botaoSom(tela);
        expect(som).not.toBeNull(); // está sobre o vídeo, não abaixo
        expect(som.props['aria-label']).toBe('Ligar o som');
        expect(som.props['aria-pressed']).toBe(false);
        expect(som.props.className).toMatch(/somPlayer/);
        const html = renderToStaticMarkup(som);
        expect(html).toMatch(/^<button[^>]*><svg[^>]*aria-hidden="true"[^>]*>.*<\/svg><\/button>$/); // sem texto visível

        const iframe = achar(arvore, el => el.type === 'iframe');
        const src = iframe.props.src;
        const postMessage = vi.fn();
        iframe.props.ref.current = { src, contentWindow: { postMessage } };
        som.props.onClick();
        expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), origem);
        expect(hooks.estados[3]).toBe(true);
        expect(hooks.estados[0]).toBe('Som ligado.');

        arvore = renderizar(props);
        expect(achar(arvore, el => el.type === 'iframe').props.src).toBe(src);
        const desligar = botaoSom(arvore);
        expect(desligar.props['aria-label']).toBe('Desligar o som');
        expect(desligar.props['aria-pressed']).toBe(true);
        achar(arvore, el => el.type === 'iframe').props.ref.current = { src, contentWindow: { postMessage } };
        desligar.props.onClick();
        expect(postMessage).toHaveBeenLastCalledWith(JSON.stringify({ event: 'command', func: 'mute', args: [] }), origem);
        expect(hooks.estados[3]).toBe(false);
    });

    it('"Assistir agora" é o botão principal e abre o vídeo exato no YouTube em nova aba', () => {
        const html = renderToStaticMarkup(renderizar(props));
        const link = html.match(/<a[^>]*>(?:(?!<\/a>).)*Assistir agora(?:(?!<\/a>).)*<\/a>/)[0];
        expect(link).toContain(`href="https://www.youtube.com/watch?v=${id}"`);
        expect(link).toContain('target="_blank"');
        expect(link).toContain('rel="noopener noreferrer"');
        expect(link).toMatch(/class="_btn_[^"]*"/);
        expect(link).toContain('(abre o YouTube em nova aba)');
        expect(html).not.toMatch(/Assistir no YouTube|>\s*Ligar o som/);
    });

    it('sem fitas decorativas nos cantos do player', () => {
        const moldura = achar(renderizar(props), el => el.type === 'div' && /playerMoldura/.test(el.props.className));
        expect(renderToStaticMarkup(moldura)).not.toMatch(/_tape_/);
    });
});

describe('sem live, antes da hidratação (HTML do servidor)', () => {
    it('pôster do vídeo mais recente, sem iframe nem botão de som; "Assistir agora" já funciona', () => {
        hooks.hidratado = false;
        const html = renderToStaticMarkup(renderizar({ live: null, destaque: DESTAQUE }));
        expect(html).toContain(`https://i.ytimg.com/vi/${DESTAQUE.youtubeId}/hqdefault.jpg`);
        expect(html).not.toContain('<iframe');
        expect(html).not.toContain('aria-pressed');
        expect(html).toContain(`href="https://www.youtube.com/watch?v=${DESTAQUE.youtubeId}"`);
    });

    it('a live não espera a hidratação: o iframe já vem no HTML do servidor', () => {
        hooks.hidratado = false;
        const html = renderToStaticMarkup(renderizar({ live: LIVE, destaque: DESTAQUE }));
        expect(html).toContain(`${NOCOOKIE}/embed/${LIVE.videoId}?`);
    });
});
