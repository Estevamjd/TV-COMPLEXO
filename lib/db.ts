import pg from 'pg';
const { Pool } = pg;

/**
 * Pool PostgreSQL com retry automático para acomodar cold starts do Neon
 * (plano free auto-suspende o compute após inatividade).
 */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
});

// Evita derrubar o processo quando uma conexão idle é encerrada pelo provedor
pool.on('error', (err) => {
    console.error('[db] Idle client error:', err.message);
});

interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number | null;
}

// Erros transitórios comuns de Neon/Postgres durante cold start ou rede instável
const TRANSIENT_ERROR_CODES = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    '57P01', // admin_shutdown
    '57P03', // cannot_connect_now (Neon acordando)
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment
]);

function isTransient(err: unknown): boolean {
    const e = err as { code?: string; message?: string };
    if (!e) return false;
    if (e.code && TRANSIENT_ERROR_CODES.has(e.code)) return true;
    const msg = (e.message || '').toLowerCase();
    return msg.includes('connection terminated') ||
        msg.includes('timeout') ||
        msg.includes('cannot connect') ||
        msg.includes('server closed the connection');
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const query = async <T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> => {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const res = await pool.query(text, params);
            return res as QueryResult<T>;
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts && isTransient(err)) {
                const backoff = 500 * attempt; // 500ms, 1000ms
                console.warn(`[db] Tentativa ${attempt} falhou (transient), retry em ${backoff}ms:`, (err as Error).message);
                await sleep(backoff);
                continue;
            }
            console.error('[db] Query error:', (err as Error).message);
            throw err;
        }
    }

    throw lastError;
};

export default { pool, query };
