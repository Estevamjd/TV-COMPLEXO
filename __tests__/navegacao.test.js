import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let caminho = '/';
vi.mock('next/navigation', () => ({ usePathname: () => caminho }));

const { default: BottomNav } = await import('@/components/BottomNav');
const { default: NavPrincipal } = await import('@/components/NavPrincipal');
const { NAV_ITENS, itemAtivo } = await import('@/lib/navegacao');

/** hrefs dos links marcados com aria-current="page" no HTML. */
function atuais(html) {
    return [...html.matchAll(/<a[^>]*>/g)]
        .map(m => m[0])
        .filter(tag => tag.includes('aria-current="page"'))
        .map(tag => tag.match(/href="([^"]*)"/)[1]);
}

describe('navegação única (barra de baixo + cabeçalho)', () => {
    beforeEach(() => { caminho = '/'; });

    it.each([
        ['/', '/'],
        ['/videos', '/videos'],
        ['/videos/abc-123', '/videos'],
        ['/denuncias', '/denuncias'],
        ['/denuncias/enviar', '/denuncias/enviar'],
        ['/noticias', '/noticias'],
        ['/noticias/42', '/noticias'],
        ['/sobre', '/sobre'],
    ])('em %s só o botão %s fica com aria-current="page"', (path, esperado) => {
        caminho = path;
        expect(atuais(renderToStaticMarkup(createElement(BottomNav)))).toEqual([esperado]);
    });

    it('barra de baixo aparece também na Início, com todos os itens', () => {
        caminho = '/';
        const html = renderToStaticMarkup(createElement(BottomNav));
        for (const item of NAV_ITENS) expect(html).toContain(`href="${item.href}"`);
    });

    it('mapa (/denuncias) e enviar denúncia (/denuncias/enviar) são botões distintos', () => {
        const mapa = NAV_ITENS.find(i => i.href === '/denuncias');
        const enviar = NAV_ITENS.find(i => i.href === '/denuncias/enviar');
        expect(mapa).toBeTruthy();
        expect(enviar).toBeTruthy();
        expect(mapa.label).not.toBe(enviar.label);
    });

    it('página fora do menu (privacidade) não acende nenhum botão; admin não mostra a barra', () => {
        caminho = '/privacidade';
        expect(atuais(renderToStaticMarkup(createElement(BottomNav)))).toEqual([]);
        caminho = '/admin';
        expect(renderToStaticMarkup(createElement(BottomNav))).toBe('');
    });

    it('cabeçalho usa a mesma lista e o mesmo destaque', () => {
        caminho = '/videos/xyz';
        const html = renderToStaticMarkup(createElement(NavPrincipal));
        expect(atuais(html)).toEqual(['/videos']);
        expect(html).toContain('href="/denuncias"');
    });

    it('itemAtivo escolhe o item mais específico', () => {
        expect(itemAtivo('/denuncias/enviar')).toBe('/denuncias/enviar');
        expect(itemAtivo('/denuncias/123')).toBe('/denuncias');
        expect(itemAtivo('/videosx')).toBeNull();
        expect(itemAtivo(null)).toBeNull();
    });
});
