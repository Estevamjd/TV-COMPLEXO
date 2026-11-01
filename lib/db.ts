import pg from 'pg';
import { neon } from '@neondatabase/serverless';
import { rodandoNoWorker } from './runtime';
const { Pool } = pg;

/*
 * Node/Vercel: um Pool do `pg`, reaproveitado entre requisições (como sempre foi).
 * Cloudflare Worker: o I/O fica preso à requisição, então um Pool global não pode ser reaproveitado.
 * Lá cada consulta usa um cliente novo do @neondatabase/serverless (HTTP, sem conexão aberta).
 */

let pool: pg.Pool | null = null;

function poolNode(): pg.Pool {
    pool ??= new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });
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
        const res = await poolNode().query(text, params);
        return res as QueryResult<T>;
    } catch (err) {
        console.error('DB query error:', (err as Error).message);
        throw err;
    }
};

const db = {
    /** Pool do `pg` (só Node/Vercel; criado no primeiro uso). */
    get pool() {
        return poolNode();
    },
    query,
};

export default db;
