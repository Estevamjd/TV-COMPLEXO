import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let caminho = '/';
delete process.env.DATABASE_URL;
vi.mock('next/navigation', () => ({ usePathname: () => caminho }));
vi.mock('@/lib/db', () => ({ default: { query: vi.fn(() => { throw new Error('não deveria consultar o banco'); }) } }));

const { default: HomePage } = await import('@/app/page');
const { default: Header } = await import('@/components/Header');
const { NAV_ITENS } = await import('@/lib/navegacao');

/** Trecho da barra do topo: da placa do logo até o botão "Enviar denúncia". */
function barra(html) {
    const ini = html.lastIndexOf('<div', html.indexOf('aria-label="TV Complexo, início"'));
    const fim = html.indexOf('Enviar denúncia</a>', ini) + 'Enviar denúncia</a>'.length;
    expect(ini).toBeGreaterThanOrEqual(0);
    expect(fim).toBeGreaterThan(ini + 'Enviar denúncia</a>'.length);
    return html.slice(ini, fim);
}

/** Links da barra, em ordem: href, texto e classes (sem o destaque da página atual). */
function composicao(trecho) {
    return [...trecho.matchAll(/<a([^>]*)>(.*?)<\/a>/g)].map(([, attrs, texto]) => ({
        href: attrs.match(/href="([^"]*)"/)[1],
        classe: attrs.match(/class="([^"]*)"/)?.[1] ?? '',
        atual: attrs.includes('aria-current="page"'),
        texto: texto.replace(/<[^>]+>/g, ''),
    }));
}

const esperado = [
    { href: '/', texto: '' }, // placa do logo
    ...NAV_ITENS.filter(i => !i.cta).map(i => ({ href: i.href, texto: i.label })),
    { href: '/denuncias/enviar', texto: 'Enviar denúncia' },
];

describe('barra do topo igual na Início e nas páginas internas', () => {
    it('Início e página interna têm a mesma composição completa, incluindo "Enviar denúncia" destacado', async () => {
        caminho = '/';
        const home = barra(renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({}) })));
        caminho = '/videos';
        const interna = barra(renderToStaticMarkup(createElement(Header)));

        const semAtual = t => t.replace(/ aria-current="page"/g, '');
        expect(semAtual(home)).toBe(semAtual(interna));

        for (const trecho of [home, interna]) {
            const links = composicao(trecho);
            expect(links.map(({ href, texto }) => ({ href, texto }))).toEqual(esperado);
            const cta = links.at(-1);
            expect(cta.classe).toContain('site-header-cta');
            expect(cta.classe).toMatch(/(^|_)btn(_|$)/); // botão cheio (s.btn), não link de texto
        }
    });

    it('cada uma destaca só a própria página', async () => {
        const atuais = trecho => composicao(trecho).filter(l => l.atual).map(l => l.href);
        caminho = '/';
        expect(atuais(barra(renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({}) }))))).toEqual(['/']);
        caminho = '/denuncias/enviar';
        expect(atuais(barra(renderToStaticMarkup(createElement(Header))))).toEqual(['/denuncias/enviar']);
    });
});
