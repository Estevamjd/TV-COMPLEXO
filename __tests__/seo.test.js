import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db', () => ({ default: { query: vi.fn() } }));

import db from '@/lib/db';
import { SITE_URL, urlAbsoluta, metadataDaPagina, resumir } from '@/lib/site';
import { serializarJsonLd, jsonLdOrganizacao, jsonLdVideo } from '@/lib/json-ld';
import robots from '@/app/robots';
import sitemap, * as sitemapModulo from '@/app/sitemap';

describe('SITE_URL', () => {
    it('é o domínio público fixo, https e sem barra final', () => {
        expect(SITE_URL).toBe('https://tv-complexo.vercel.app');
        expect(SITE_URL).not.toMatch(/\/$/);
    });

    it('não depende de VERCEL_URL nem de NEXT_PUBLIC_SITE_URL', async () => {
        vi.stubEnv('VERCEL_URL', 'tv-complexo-abc123-preview.vercel.app');
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://outro.example');
        vi.resetModules();
        const mod = await import('@/lib/site');
        expect(mod.SITE_URL).toBe('https://tv-complexo.vercel.app');
        vi.unstubAllEnvs();
    });

    it('urlAbsoluta monta caminhos e preserva URL absoluta', () => {
        expect(urlAbsoluta('/')).toBe(SITE_URL);
        expect(urlAbsoluta('/videos')).toBe(`${SITE_URL}/videos`);
        expect(urlAbsoluta('sobre')).toBe(`${SITE_URL}/sobre`);
        expect(urlAbsoluta('https://i.ytimg.com/x.jpg')).toBe('https://i.ytimg.com/x.jpg');
    });
});

describe('metadataDaPagina', () => {
    it('canonical, og:url e og:image apontam para SITE_URL', () => {
        const m = metadataDaPagina({ titulo: 'Vídeos | TV Complexo', descricao: 'd', caminho: '/videos' });
        expect(m.title).toBe('Vídeos | TV Complexo');
        expect(m.alternates.canonical).toBe(`${SITE_URL}/videos`);
        expect(m.openGraph.url).toBe(`${SITE_URL}/videos`);
        expect(m.openGraph.images[0].url).toBe(`${SITE_URL}/og-tv-complexo.jpg`);
        expect(m.openGraph.siteName).toBe('TV Complexo');
        expect(m.openGraph.locale).toBe('pt_BR');
    });

    it('usa a imagem própria quando informada', () => {
        const m = metadataDaPagina({ titulo: 't', descricao: 'd', caminho: '/videos/1', imagem: 'https://i.ytimg.com/vi/x/hqdefault.jpg' });
        expect(m.openGraph.images[0].url).toBe('https://i.ytimg.com/vi/x/hqdefault.jpg');
    });

    it('resumir tira HTML e corta em palavra inteira', () => {
        expect(resumir('<p>Olá   mundo</p>')).toBe('Olá mundo');
        const r = resumir('palavra '.repeat(50), 30);
        expect(r.length).toBeLessThanOrEqual(30);
        expect(r.endsWith('…')).toBe(true);
        expect(resumir(null)).toBe('');
    });
});

describe('robots', () => {
    it('aponta o sitemap para SITE_URL e bloqueia /admin/ e /api/', () => {
        const r = robots();
        expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
        expect(r.host).toBe(SITE_URL);
        expect(r.rules[0].disallow).toEqual(['/admin/', '/api/']);
    });
});

describe('sitemap', () => {
    beforeEach(() => { vi.mocked(db.query).mockReset(); });
    afterEach(() => vi.unstubAllEnvs());

    it('sem DATABASE_URL devolve só as páginas fixas, todas em SITE_URL, sem tocar no banco', async () => {
        vi.stubEnv('DATABASE_URL', '');
        const itens = await sitemap();
        expect(itens.map(i => i.url)).toEqual([
            SITE_URL,
            `${SITE_URL}/videos`,
            `${SITE_URL}/noticias`,
            `${SITE_URL}/denuncias`,
            `${SITE_URL}/denuncias/enviar`,
            `${SITE_URL}/sobre`,
            `${SITE_URL}/privacidade`,
        ]);
        expect(db.query).not.toHaveBeenCalled();
    });

    it('com banco inclui vídeos e notícias no domínio fixo', async () => {
        vi.stubEnv('DATABASE_URL', 'postgres://teste');
        vi.mocked(db.query)
            .mockResolvedValueOnce({ rows: [{ id: 'v1', created_at: '2026-10-01T00:00:00Z' }] })
            .mockResolvedValueOnce({ rows: [{ id: 'n1', created_at: '2026-10-02T00:00:00Z' }] });
        const urls = (await sitemap()).map(i => i.url);
        expect(urls).toContain(`${SITE_URL}/videos/v1`);
        expect(urls).toContain(`${SITE_URL}/noticias/n1`);
        expect(urls.every(u => u.startsWith(SITE_URL))).toBe(true);
    });

    it('se o banco falhar, devolve as páginas fixas', async () => {
        vi.stubEnv('DATABASE_URL', 'postgres://teste');
        vi.mocked(db.query).mockImplementation(async () => { throw new Error('fora do ar'); });
        expect(await sitemap()).toHaveLength(7);
    });

    it('regenera no runtime (revalidate > 0 ou dynamic), não congela o que o build gerou', () => {
        const { revalidate, dynamic } = sitemapModulo;
        const revalida = typeof revalidate === 'number' && revalidate > 0;
        expect(revalida || dynamic === 'force-dynamic').toBe(true);
    });
});

describe('JSON-LD', () => {
    it('serializarJsonLd escapa < para não fechar o <script>', () => {
        const out = serializarJsonLd({ name: '</script><script>alert(1)</script>' });
        expect(out).not.toContain('<');
        expect(out).toContain('\\u003c/script>');
        expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
    });

    it('Organization da home é NewsMediaOrganization em SITE_URL', () => {
        const org = jsonLdOrganizacao();
        expect(org['@context']).toBe('https://schema.org');
        expect(org['@type']).toBe('NewsMediaOrganization');
        expect(org.url).toBe(SITE_URL);
        expect(org.logo).toBe(`${SITE_URL}/logo.png`);
    });

    it('VideoObject completo com os campos do registro', () => {
        const v = jsonLdVideo({
            id: 'abc',
            titulo: 'Baile <b>',
            descricao: 'Descrição do vídeo',
            url_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            published_at: '2026-10-20T12:00:00Z',
            created_at: '2026-10-21T12:00:00Z',
        });
        expect(v).toMatchObject({
            '@type': 'VideoObject',
            name: 'Baile <b>',
            url: `${SITE_URL}/videos/abc`,
            description: 'Descrição do vídeo',
            thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
            uploadDate: '2026-10-20T12:00:00.000Z',
            embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        });
        expect(serializarJsonLd(v)).not.toContain('<');
    });

    it('VideoObject omite campos ausentes (sem inventar)', () => {
        const v = jsonLdVideo({
            id: 'x',
            titulo: 'Post do Instagram',
            descricao: '',
            url_video: 'https://www.instagram.com/p/abc/',
            thumbnail: null,
            published_at: null,
            created_at: '2026-10-21T12:00:00Z',
        });
        expect(v).not.toHaveProperty('description');
        expect(v).not.toHaveProperty('thumbnailUrl');
        expect(v).not.toHaveProperty('embedUrl');
        expect(v.uploadDate).toBe('2026-10-21T12:00:00.000Z');
    });
});
