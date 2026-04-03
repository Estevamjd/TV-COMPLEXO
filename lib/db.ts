import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

interface QueryResult<T = Record<string, unknown>> {
    rows: T[];
    rowCount: number | null;
}

const query = async <T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
): Promise<QueryResult<T>> => {
    try {
        const res = await pool.query(text, params);
        return res as QueryResult<T>;
    } catch (err) {
        console.error('DB query error:', (err as Error).message);
        throw err;
    }
};

export default { pool, query };
