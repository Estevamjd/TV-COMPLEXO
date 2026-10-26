import fs from 'fs';
import path from 'path';
import { PGlite } from '@electric-sql/pglite';

// Postgres local em memória (PGlite) para testes de escrita/moderação.
// Nenhum banco remoto é acessado. Todos os dados são fictícios.

export const MIGRACAO = fs.readFileSync(
    path.resolve(__dirname, '../../scripts/migrations/2026-10-26-fase1-moderacao.sql'), 'utf8');
export const ROLLBACK = fs.readFileSync(
    path.resolve(__dirname, '../../scripts/migrations/2026-10-26-fase1-moderacao.rollback.sql'), 'utf8');

// Mesmo DDL de scripts/init-db.js (schema de referência; o real não foi lido).
const SCHEMA_DENUNCIAS = `
  CREATE TABLE IF NOT EXISTS denuncias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT DEFAULT 'Anônimo',
    comunidade TEXT NOT NULL,
    local_problema TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    midia TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias(status);
`;

// Uma instância por arquivo de teste (subir o PGlite é lento); cada
// criarBanco() recria o schema do zero.
let instancia = null;

export async function criarBanco({ checkLegado = false } = {}) {
    if (!instancia) instancia = new PGlite();
    const pg = instancia;
    await pg.exec(`DROP SCHEMA public CASCADE; CREATE SCHEMA public; SET TIME ZONE 'UTC';`);
    await pg.exec(SCHEMA_DENUNCIAS);
    if (checkLegado) {
        await pg.exec(`ALTER TABLE denuncias ADD CONSTRAINT denuncias_status_check
            CHECK (status IN ('pendente', 'resolvida', 'rejeitada'));`);
    }
    return pg;
}

/** Adaptador com a mesma interface de lib/db.ts. */
export function adaptador(pg) {
    return {
        query: async (text, params) => {
            const res = await pg.query(text, params);
            return { rows: res.rows, rowCount: res.affectedRows ?? res.rows.length };
        },
    };
}

let seq = 0;
export async function inserirFicticia(pg, { status = 'pendente', createdAt = '2026-10-01 12:00:00', nome = 'Fulana de Tal', descricao = 'Poste caído na rua, perigo.', publicarNome } = {}) {
    seq += 1;
    const cols = ['nome', 'comunidade', 'local_problema', 'tipo', 'descricao', 'latitude', 'longitude', 'midia', 'status', 'created_at'];
    const vals = [nome, 'Maré', `Rua Fictícia ${seq}`, 'poste_caido', descricao, -22.86, -43.24, '', status, createdAt];
    if (publicarNome !== undefined) {
        cols.push('publicar_nome');
        vals.push(publicarNome);
    }
    const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await pg.query(`INSERT INTO denuncias (${cols.join(', ')}) VALUES (${ph}) RETURNING id`, vals);
    return rows[0].id;
}

export async function contagemPorStatus(pg) {
    const { rows } = await pg.query('SELECT status, count(*)::int AS n FROM denuncias GROUP BY status ORDER BY status');
    return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
