import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Executa o efeito real do componente com estados controlados, sem DOM (mesmo padrão de canal-topo-live).
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

const { INSTAGRAM_REELS, REELS_DESTAQUE, idDoReel, embedDoReel } = await import('@/lib/instagramReels');
const { default: InstagramReel } = await import('@/components/InstagramReel');
const { default: ReelsInstagram } = await import('@/components/ReelsInstagram');
const { default: nextConfig } = await import('@/next.config.mjs');

const URL = 'https://www.instagram.com/reel/DeRviiXRCAj/';

afterEach(() => { vi.unstubAllGlobals(); hooks.estados = []; hooks.efeitos = []; hooks.cursor = 0; });

/** Renderiza de novo com o estado atual (como o React faria depois do setState). */
function renderizar(props) {
    hooks.cursor = 0;
    hooks.efeitos = [];
    return renderToStaticMarkup(createElement(() => InstagramReel(props)));
}

describe('lista de reels (lib/instagramReels)', () => {
    it('tem os 8 reels do @tvcomplexo, todos com ID válido', () => {
        expect(INSTAGRAM_REELS).toHaveLength(8);
        for (const url of INSTAGRAM_REELS) {
            expect(url).toMatch(/^https:\/\/www\.instagram\.com\/reel\/[A-Za-z0-9_-]+\/$/);
            expect(idDoReel(url)).toMatch(/^[A-Za-z0-9_-]{6,}$/);
        }
    });

    it('não tem URL nem ID duplicado', () => {
        expect(new Set(INSTAGRAM_REELS).size).toBe(INSTAGRAM_REELS.length);
        expect(new Set(INSTAGRAM_REELS.map(idDoReel)).size).toBe(INSTAGRAM_REELS.length);
    });

    it('destaque da Início = 3 primeiros', () => {
        expect(REELS_DESTAQUE).toBe(3);
    });

    it('recusa endereço que não é reel/post do Instagram', () => {
        expect(idDoReel('https://evil.example/reel/DeRviiXRCAj/')).toBeNull();
        expect(idDoReel('https://www.instagram.com/tvcomplexo/')).toBeNull();
        expect(idDoReel('https://www.instagram.com/reel/abc"onload=x/')).toBeNull();
        expect(idDoReel(undefined)).toBeNull();
    });

    it('monta o endereço do embed oficial', () => {
        expect(embedDoReel('DeRviiXRCAj')).toBe('https://www.instagram.com/reel/DeRviiXRCAj/embed/');
    });
});

describe('<InstagramReel>', () => {
    it('antes de aparecer na tela mostra só o lugar reservado com "Ver no Instagram"', () => {
        const observados = [];
        vi.stubGlobal('IntersectionObserver', class {
            constructor(cb) { this.cb = cb; }
            observe(el) { observados.push(el); }
            disconnect() {}
        });
        const html = renderizar({ url: URL, numero: 1 });
        expect(html).not.toContain('<iframe');
        expect(html).toMatch(/<a href="https:\/\/www\.instagram\.com\/reel\/DeRviiXRCAj\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>Ver no Instagram/);
        expect(html).toContain('aria-label="Reel 1 do Instagram @tvcomplexo"');
    });

    it('monta o iframe /embed/ quando o IntersectionObserver avisa que entrou na tela', () => {
        let observador;
        const disconnect = vi.fn();
        vi.stubGlobal('IntersectionObserver', class {
            constructor(cb, opcoes) { this.cb = cb; this.opcoes = opcoes; observador = this; }
            observe() {}
            disconnect() { disconnect(); }
        });
        const props = { url: URL, numero: 2 };
        renderizar(props);
        hooks.efeitos[0]();

        // fora da tela: continua sem iframe
        observador.cb([{ isIntersecting: false }]);
        expect(renderizar(props)).not.toContain('<iframe');

        observador.cb([{ isIntersecting: true }]);
        expect(disconnect).toHaveBeenCalled();
        const html = renderizar(props);
        expect(html).toContain('src="https://www.instagram.com/reel/DeRviiXRCAj/embed/"');
        expect(html).toContain('title="Reel 2 do Instagram @tvcomplexo"');
        expect(html).toContain('allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"');
        expect(html).toContain('allowFullScreen');
        expect(html).toContain('loading="lazy"');
        expect(html).not.toContain('Ver no Instagram');
    });

    it('sem IntersectionObserver, monta o iframe direto', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const props = { url: URL, numero: 1 };
        renderizar(props);
        hooks.efeitos[0]();
        expect(renderizar(props)).toContain('src="https://www.instagram.com/reel/DeRviiXRCAj/embed/"');
    });

    it('URL inválida não renderiza nada', () => {
        expect(renderizar({ url: 'https://evil.example/x', numero: 1 })).toBe('');
    });
});

describe('<ReelsInstagram>', () => {
    const itens = html => (html.match(/<li /g) ?? []).length;

    it('destaque: 3 reels, título acessível e link para /videos', () => {
        const html = renderToStaticMarkup(createElement(ReelsInstagram, { limite: REELS_DESTAQUE, verTudo: true }));
        expect(html).toContain('aria-labelledby="reels-titulo"');
        expect(html).toMatch(/<h2 id="reels-titulo"[^>]*>Reels<\/h2>/);
        expect(html).toContain('href="/videos#reels"');
        expect(itens(html)).toBe(3);
    });

    it('lista completa: todos os reels', () => {
        const html = renderToStaticMarkup(createElement(ReelsInstagram));
        expect(itens(html)).toBe(INSTAGRAM_REELS.length);
        for (const url of INSTAGRAM_REELS) expect(html).toContain(`href="${url}"`);
    });
});

describe('CSP', () => {
    it('frame-src libera o embed do Instagram sem perder os outros players', async () => {
        const regras = await nextConfig.headers();
        const csp = regras.find(r => r.source === '/:path*').headers.find(h => h.key === 'Content-Security-Policy').value;
        const frameSrc = csp.split('; ').find(d => d.startsWith('frame-src '));
        expect(frameSrc.split(' ')).toEqual(expect.arrayContaining(['https://www.instagram.com', 'https://www.youtube.com', 'https://www.tiktok.com']));
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("object-src 'none'");
    });
});
