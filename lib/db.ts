import type { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';
import { rodandoNoWorker } from './runtime';

/*
 * Node/Vercel: um Pool do `pg`, reaproveitado entre requisições (como sempre foi).
 * Cloudflare Worker: o I/O fica preso à requisição, então um Pool global não pode ser reaproveitado.
 * Lá cada consulta usa um cliente novo do @neondatabase/serverless (HTTP, sem conexão aberta).
 *
 * O `pg` é importado só no caminho Node (import dinâmico). Com import estático, o Turbopack marca o
 * módulo como externo (`pg-<hash>`) e todo arquivo que importa este aqui passa a carregar esse externo
 * ao iniciar; no Worker o OpenNext não resolve esse nome e a rota dá 500 ("No such module").
 * No build da Cloudflare o next.config.mjs ainda troca o `pg` por lib/pg-indisponivel.js.
 */

let pool: Promise<Pool> | null = null;

function poolNode(): Promise<Pool> {
    pool ??= import('pg').then(({ default: pg }) => new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    }));
    pool.catch(() => { pool = null; });
    return pool;
}

interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number | null;
}

async function queryNoWorker<T>(text: string, params?: unknown[]): Promise<QueryResult<T>> {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL não configurada');
    const sql = neon(url, { fullResults: true });
    const res = await sql.query(text, params ?? []);
    return { rows: res.rows as T[], rowCount: res.rowCount };
}

const query = async <T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> => {
    try {
        if (rodandoNoWorker()) return await queryNoWorker<T>(text, params);
        const res = await (await poolNode()).query(text, params);
        return res as unknown as QueryResult<T>;
    } catch (err) {
        console.error('DB query error:', (err as Error).message);
        throw err;
    }
};

const db = {
    query,
};

export default db;
