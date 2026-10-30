import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Sem banco: a Início não pode consultar nada nem mostrar texto de exemplo.
delete process.env.DATABASE_URL;
vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('@/lib/db', () => ({ default: { query: vi.fn(() => { throw new Error('não deveria consultar o banco'); }) } }));

const { default: HomePage } = await import('@/app/page');
const { default: db } = await import('@/lib/db');

let html = '';
beforeAll(async () => {
    html = renderToStaticMarkup(await HomePage({ searchParams: Promise.resolve({}) }));
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

    it('esconde as seções sem conteúdo (vídeos, notícias, grade)', () => {
        expect(html).not.toContain('id="videos-titulo"');
        expect(html).not.toContain('id="noticias-titulo"');
        expect(html).not.toContain('id="grade"');
        expect(html).not.toContain('href="#grade"');
    });

    it('não tem link para o painel admin no público', () => {
        expect(html).not.toContain('href="/admin"');
    });
});
