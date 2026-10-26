import db from './db';
import { autorPublico, mascararTextoPublico } from './mascara';

/**
 * Regras de moderação e de saída pública das denúncias (R2/R3).
 *
 * Status: pendente (nova, oculta) → aprovada (pública) | rejeitada (nunca
 * pública) | resolvida (pública).
 */
export const STATUS = ['pendente', 'aprovada', 'rejeitada', 'resolvida'];
export const STATUS_PUBLICOS = ['aprovada', 'resolvida'];

/**
 * CORTE_LEGADO — compatibilidade antes/depois da migração (STACK §7).
 *
 * Antes desta versão, toda denúncia nascia 'pendente' e já ia ao ar. Para não
 * despublicar as atuais antes de a migração rodar, denúncias 'pendente' criadas
 * ANTES deste instante continuam públicas. As criadas depois só aparecem quando
 * aprovadas. Depois da migração (que troca essas 'pendente' antigas por
 * 'aprovada', com o MESMO corte), esta cláusula fica inócua.
 *
 * Valor em UTC, comparado com denuncias.created_at (TIMESTAMP sem fuso, gravado
 * em UTC pelo Neon). Deve ser o instante do deploy desta versão em produção:
 * antes do merge, atualize aqui E em scripts/migrations/2026-10-26-fase1-moderacao.sql
 * (ver MIGRACAO-PLANO.md).
 */
export const CORTE_LEGADO = '2026-10-26 16:00:00';

/** Cláusula WHERE pública. Usa um parâmetro posicional para o corte. */
export function filtroPublicoSQL(posicaoParametroCorte) {
    return `(status IN ('aprovada', 'resolvida') OR (status = 'pendente' AND created_at < $${posicaoParametroCorte}::timestamp))`;
}

// Lista explícita de colunas — nunca SELECT *.
const COLUNAS_PUBLICAS_BASE = ['id', 'nome', 'comunidade', 'local_problema', 'tipo', 'descricao', 'latitude', 'longitude', 'status', 'created_at'];
const COLUNAS_ADMIN_BASE = ['id', 'nome', 'comunidade', 'local_problema', 'tipo', 'descricao', 'latitude', 'longitude', 'midia', 'status', 'created_at'];

const ERRO_COLUNA_INEXISTENTE = '42703';

// A coluna publicar_nome só existe depois da migração. Em vez de consultar o
// catálogo a cada request, tenta com a coluna e, se o banco responder
// "coluna inexistente", cai para a versão sem ela (e lembra disso por 5 min).
let semPublicarNomeAte = 0;
const MEMORIA_SEM_COLUNA_MS = 5 * 60 * 1000;

export function _resetDeteccaoColuna() {
    semPublicarNomeAte = 0;
}

async function queryComPublicarNome(montar) {
    if (Date.now() >= semPublicarNomeAte) {
        try {
            return await db.query(...montar(true));
        } catch (err) {
            if (err?.code !== ERRO_COLUNA_INEXISTENTE) throw err;
            semPublicarNomeAte = Date.now() + MEMORIA_SEM_COLUNA_MS;
        }
    }
    return db.query(...montar(false));
}

/**
 * Converte a linha do banco no formato público: sem nome completo, sem mídia,
 * com texto mascarado e status normalizado (pendente legado → aprovada).
 */
export function paraSaidaPublica(row) {
    return {
        id: row.id,
        autor: autorPublico(row.nome, row.publicar_nome === true),
        comunidade: row.comunidade,
        local_problema: mascararTextoPublico(row.local_problema),
        tipo: row.tipo,
        descricao: mascararTextoPublico(row.descricao),
        latitude: row.latitude,
        longitude: row.longitude,
        status: row.status === 'resolvida' ? 'resolvida' : 'aprovada',
        created_at: row.created_at,
    };
}

/**
 * Lista denúncias públicas (rotas públicas e páginas SSR).
 */
export async function listarDenunciasPublicas({ tipo, comunidade, limit, comCoordenadas = false } = {}) {
    const { rows } = await queryComPublicarNome((comColuna) => {
        const colunas = comColuna ? [...COLUNAS_PUBLICAS_BASE, 'publicar_nome'] : COLUNAS_PUBLICAS_BASE;
        const params = [CORTE_LEGADO];
        const conditions = [filtroPublicoSQL(1)];

        if (tipo && tipo !== 'todos') {
            params.push(tipo);
            conditions.push(`tipo = $${params.length}`);
        }
        if (comunidade && comunidade !== 'todos') {
            params.push(comunidade);
            conditions.push(`comunidade = $${params.length}`);
        }
        if (comCoordenadas) {
            conditions.push('latitude IS NOT NULL AND longitude IS NOT NULL');
        }

        let sql = `SELECT ${colunas.join(', ')} FROM denuncias WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
        if (limit) {
            params.push(limit);
            sql += ` LIMIT $${params.length}`;
        }
        return [sql, params];
    });
    return rows.map(paraSaidaPublica);
}

/**
 * Lista completa para o admin (dados originais, sem máscara).
 * Pendentes primeiro, depois as mais recentes.
 */
export async function listarDenunciasAdmin({ status, tipo, comunidade, limit } = {}) {
    const { rows } = await queryComPublicarNome((comColuna) => {
        const colunas = comColuna ? [...COLUNAS_ADMIN_BASE, 'publicar_nome'] : COLUNAS_ADMIN_BASE;
        const params = [];
        const conditions = [];

        if (status && status !== 'todos') {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }
        if (tipo && tipo !== 'todos') {
            params.push(tipo);
            conditions.push(`tipo = $${params.length}`);
        }
        if (comunidade && comunidade !== 'todos') {
            params.push(comunidade);
            conditions.push(`comunidade = $${params.length}`);
        }

        let sql = `SELECT ${colunas.join(', ')} FROM denuncias`;
        if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
        sql += " ORDER BY (status = 'pendente') DESC, created_at DESC";
        if (limit) {
            params.push(limit);
            sql += ` LIMIT $${params.length}`;
        }
        return [sql, params];
    });
    return rows.map((row) => ({ ...row, publicar_nome: row.publicar_nome === true }));
}

/**
 * Insere uma denúncia nova. Sempre nasce 'pendente' (oculta até a revisão).
 */
export async function inserirDenuncia({ id, nome, comunidade, localProblema, tipo, descricao, latitude, longitude, midia, publicarNome }) {
    const base = [id, nome, comunidade, localProblema, tipo, descricao, latitude, longitude, midia];
    await queryComPublicarNome((comColuna) => (comColuna
        ? [
            `INSERT INTO denuncias (id, nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia, status, publicar_nome)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente', $10)`,
            [...base, publicarNome === true],
        ]
        : [
            `INSERT INTO denuncias (id, nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente')`,
            base,
        ]));
}
