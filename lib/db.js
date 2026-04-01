import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

const query = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        console.error('Error executing query', { text, err });
        throw err;
    }
};

export default { pool, query };
