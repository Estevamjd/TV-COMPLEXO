import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { suavizarPlaceholders } from '@/lib/exibicao';
import { mascararTextoPublico } from '@/lib/mascara';
import ReportCard from '@/components/ReportCard';
import HomeNews from '@/components/HomeNews';

vi.mock('@/lib/db', () => ({ default: { query: vi.fn() } }));
vi.mock('@/lib/auth', () => ({ isAuthenticated: vi.fn() }));
vi.mock('@/lib/audit', () => ({ auditLog: vi.fn() }));

import db from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';
import { GET } from '@/app/api/denuncias/route';

const original = 'João da Silva teve diabetes. Ligue (21) 98888-7777 ou pessoa@example.com, CPF 123.456.789-00.';
const row = { id: 'teste', nome: 'Maria Silva', publicar_nome: true, comunidade: original,
    local_problema: original, descricao: original, status: 'aprovada', tipo: 'outros' };

describe('exibição pública', () => {
    it('suaviza todos os marcadores, preservando outros colchetes e texto', () => {
        expect(suavizarPlaceholders('[nome] [condição de saúde] [telefone] [e-mail] [CPF] [aviso]'))
            .toBe('••• ••• ••• ••• ••• [aviso]');
        expect(suavizarPlaceholders(null)).toBe('');
        expect(suavizarPlaceholders(undefined)).toBe('');
        expect(suavizarPlaceholders('Texto comum')).toBe('Texto comum');
        expect(suavizarPlaceholders('[nome] e [nome]')).toBe('••• e •••');
    });

    it('suaviza o card após a máscara nos três campos livres', () => {
        const texto = mascararTextoPublico(original);
        const html = renderToStaticMarkup(createElement(ReportCard, { denuncia: {
            ...row, comunidade: texto, local_problema: texto, descricao: texto,
        } }));
        expect(html).toContain('•••');
        expect(html).not.toMatch(/\[(nome|condição de saúde|telefone|e-mail|CPF)\]/);
        expect(html).not.toContain('João');
    });

    it('suaviza a resposta pública após mascarar e preserva o original no admin', async () => {
        db.query.mockResolvedValue({ rows: [row] });
        isAuthenticated.mockResolvedValue(false);
        const response = await GET(new Request('http://localhost/api/denuncias'));
        expect(response.status).toBe(200);
        const [publico] = await response.json();
        for (const campo of ['comunidade', 'local_problema', 'descricao']) {
            expect(publico[campo]).toBe(suavizarPlaceholders(mascararTextoPublico(original)));
            expect(publico[campo]).toContain('•••');
        }
        expect(publico.autor).toBe('Maria');
        expect(publico).not.toHaveProperty('nome');
        isAuthenticated.mockResolvedValue(true);
        const admin = await GET(new Request('http://localhost/api/denuncias'));
        expect((await admin.json())[0].descricao).toBe(original);
        expect(row.descricao).toBe(original);
    });
});

describe('notícias na home', () => {
    it('omite toda a seção vazia', () => {
        expect(renderToStaticMarkup(createElement(HomeNews, { noticiasRecentes: [] }))).toBe('');
    });
    it('exibe título, link e notícia quando há conteúdo', () => {
        const html = renderToStaticMarkup(createElement(HomeNews, { noticiasRecentes: [
            { id: '1', titulo: 'Notícia da comunidade', resumo: 'Resumo', categoria: 'geral' },
        ] }));
        expect(html).toContain('📰 Notícias');
        expect(html).toContain('href="/noticias"');
        expect(html).toContain('Notícia da comunidade');
    });
});
