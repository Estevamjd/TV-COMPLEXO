import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Nenhum serviço real é chamado: Blob, Neon e pg ficam mockados. Dados fictícios.
const { blobPut, neonQuery, neonFactory, poolQuery, PoolMock } = vi.hoisted(() => {
    const neonQuery = vi.fn(async () => ({ rows: [{ ok: 1 }], rowCount: 1 }));
    const poolQuery = vi.fn(async () => ({ rows: [{ ok: 2 }], rowCount: 1 }));
    return {
        blobPut: vi.fn(async (caminho) => ({ url: `https://exemplo.public.blob.vercel-storage.com/${caminho}-sufixo` })),
        neonQuery,
        neonFactory: vi.fn(() => ({ query: neonQuery })),
        poolQuery,
        PoolMock: vi.fn(function Pool() { this.query = poolQuery; }),
    };
});
vi.mock('@vercel/blob', () => ({ put: (...args) => blobPut(...args) }));
vi.mock('@neondatabase/serverless', () => ({ neon: (...args) => neonFactory(...args) }));
vi.mock('pg', () => ({ default: { Pool: PoolMock } }));

import { rateLimit } from '@/lib/rate-limit';
import { rodandoNoWorker, ambienteDoDeploy } from '@/lib/runtime';
import { salvarImagemPublica, urlPublicaR2 } from '@/lib/armazenamento';
import db from '@/lib/db';

beforeEach(() => {
    vi.stubEnv('CLOUDFLARE_WORKER', '');
    vi.stubEnv('R2_PUBLIC_URL', '');
    vi.stubEnv('DATABASE_URL', 'postgres://usuario:senha@host-ficticio/banco');
    blobPut.mockClear();
    neonFactory.mockClear();
    neonQuery.mockClear();
    poolQuery.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

function pedido(cabecalhos) {
    return { headers: { get: (k) => cabecalhos[k.toLowerCase()] ?? null } };
}

describe('runtime', () => {
    it('Node (testes/Vercel) não é Worker; CLOUDFLARE_WORKER=1 liga o modo Worker', () => {
        expect(rodandoNoWorker()).toBe(false);
        vi.stubEnv('CLOUDFLARE_WORKER', '1');
        expect(rodandoNoWorker()).toBe(true);
    });

    it('detecta o Worker pelo navigator.userAgent', () => {
        vi.stubGlobal('navigator', { userAgent: 'Cloudflare-Workers' });
        expect(rodandoNoWorker()).toBe(true);
        vi.unstubAllGlobals();
    });

    it('APP_ENV tem precedência sobre VERCEL_ENV', () => {
        vi.stubEnv('APP_ENV', '');
        vi.stubEnv('VERCEL_ENV', 'preview');
        expect(ambienteDoDeploy()).toBe('preview');
        vi.stubEnv('APP_ENV', 'production');
        expect(ambienteDoDeploy()).toBe('production');
    });
});

describe('rate limit: IP do cliente', () => {
    const opcoes = (namespace) => ({ namespace, maxRequests: 1 });

    it('no Worker usa CF-Connecting-IP primeiro', () => {
        vi.stubEnv('CLOUDFLARE_WORKER', '1');
        // Mesmo x-real-ip, IPs da Cloudflare diferentes = clientes diferentes.
        expect(rateLimit(pedido({ 'cf-connecting-ip': '203.0.113.1', 'x-real-ip': '10.9.9.9' }), opcoes('cf-1')).allowed).toBe(true);
        expect(rateLimit(pedido({ 'cf-connecting-ip': '203.0.113.2', 'x-real-ip': '10.9.9.9' }), opcoes('cf-1')).allowed).toBe(true);
        expect(rateLimit(pedido({ 'cf-connecting-ip': '203.0.113.1', 'x-real-ip': '10.9.9.8' }), opcoes('cf-1')).allowed).toBe(false);
    });

    it('no Worker sem CF-Connecting-IP cai para x-real-ip / x-forwarded-for', () => {
        vi.stubEnv('CLOUDFLARE_WORKER', '1');
        expect(rateLimit(pedido({ 'x-forwarded-for': '198.51.100.7, 10.0.0.1' }), opcoes('cf-2')).allowed).toBe(true);
        expect(rateLimit(pedido({ 'x-forwarded-for': '198.51.100.7' }), opcoes('cf-2')).allowed).toBe(false);
    });

    it('fora do Worker ignora CF-Connecting-IP (o cliente poderia forjar)', () => {
        expect(rateLimit(pedido({ 'cf-connecting-ip': '203.0.113.1', 'x-real-ip': '10.1.1.1' }), opcoes('vercel-1')).allowed).toBe(true);
        expect(rateLimit(pedido({ 'cf-connecting-ip': '203.0.113.99', 'x-real-ip': '10.1.1.1' }), opcoes('vercel-1')).allowed).toBe(false);
    });
});

describe('upload: R2 no Worker, Vercel Blob fora dele', () => {
    const bytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]).buffer;

    it('sem binding R2: usa o Vercel Blob (como hoje)', async () => {
        const url = await salvarImagemPublica('thumbnails/1-foto.jpg', bytes, 'image/jpeg');
        expect(blobPut).toHaveBeenCalledTimes(1);
        expect(blobPut.mock.calls[0][0]).toBe('thumbnails/1-foto.jpg');
        expect(blobPut.mock.calls[0][2]).toEqual({ access: 'public', addRandomSuffix: true });
        expect(url).toMatch(/^https:\/\/exemplo\.public\.blob\.vercel-storage\.com\//);
    });

    it('com binding R2: grava no bucket com content-type e devolve a URL pública do R2', async () => {
        vi.stubEnv('R2_PUBLIC_URL', 'https://midia.exemplo.example/');
        const bucket = { put: vi.fn(async () => ({})) };
        const url = await salvarImagemPublica('thumbnails/1-foto.jpg', bytes, 'image/jpeg', bucket);
        expect(blobPut).not.toHaveBeenCalled();
        const [chave, dados, opcoes] = bucket.put.mock.calls[0];
        expect(chave).toMatch(/^thumbnails\/1-foto-[0-9a-f]{8}\.jpg$/);
        expect(dados).toBe(bytes);
        expect(opcoes).toEqual({ httpMetadata: { contentType: 'image/jpeg' } });
        expect(url).toBe(`https://midia.exemplo.example/${chave}`);
    });

    it('com binding R2 e sem R2_PUBLIC_URL: erro (não grava nada)', async () => {
        const bucket = { put: vi.fn() };
        await expect(salvarImagemPublica('thumbnails/x.png', bytes, 'image/png', bucket)).rejects.toThrow(/R2_PUBLIC_URL/);
        expect(bucket.put).not.toHaveBeenCalled();
    });

    it('R2_PUBLIC_URL inválida é ignorada', () => {
        vi.stubEnv('R2_PUBLIC_URL', 'javascript:alert(1)');
        expect(urlPublicaR2()).toBeNull();
        vi.stubEnv('R2_PUBLIC_URL', 'nao-e-url');
        expect(urlPublicaR2()).toBeNull();
    });
});

describe('banco: pg Pool no Node, Neon serverless no Worker', () => {
    it('Node/Vercel: usa o Pool do pg', async () => {
        const res = await db.query('SELECT 1 AS ok', []);
        expect(res.rows).toEqual([{ ok: 2 }]);
        expect(poolQuery).toHaveBeenCalledWith('SELECT 1 AS ok', []);
        expect(neonFactory).not.toHaveBeenCalled();
    });

    it('Worker: um cliente Neon novo por consulta, com fullResults', async () => {
        vi.stubEnv('CLOUDFLARE_WORKER', '1');
        const res = await db.query('SELECT $1::int AS ok', [1]);
        await db.query('SELECT 2', undefined);
        expect(res).toEqual({ rows: [{ ok: 1 }], rowCount: 1 });
        expect(neonFactory).toHaveBeenCalledTimes(2);
        expect(neonFactory).toHaveBeenCalledWith('postgres://usuario:senha@host-ficticio/banco', { fullResults: true });
        expect(neonQuery).toHaveBeenNthCalledWith(1, 'SELECT $1::int AS ok', [1]);
        expect(neonQuery).toHaveBeenNthCalledWith(2, 'SELECT 2', []);
        expect(poolQuery).not.toHaveBeenCalled();
    });
});
