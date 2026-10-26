import db from './db';
import { autorPublico, mascararTextoPublico } from './mascara';
import { COMUNIDADES, COMUNIDADE_OUTRA } from './comunidades';
import { tipoPublico, tipoValido } from './tipos';

/**
 * Regras de moderação e de saída pública das denúncias (R2/R3).
 *
 * Status: pendente (nova, oculta) → aprovada (pública) | rejeitada (nunca
 * pública) | resolvida (pública).
 */
export const STATUS = ['pendente', 'aprovada', 'rejeitada', 'resolvida'];
export const STATUS_PUBLICOS = ['aprovada', 'resolvida'];

import { CORTE_LEGADO, anteriorAoCorte } from './corte-legado';

export { CORTE_LEGADO };

/**
 * Cláusula WHERE pública.
 *
 * Com a migração aplicada (migracaoAplicada = true, detectada pela coluna
 * publicar_nome, que a mesma transação cria), só aprovada/resolvida: uma
 * denúncia antiga devolvida para 'pendente' pelo admin sai do ar.
 * Antes da migração, as 'pendente' anteriores ao CORTE_LEGADO continuam
 * públicas (estavam no ar); nesse caso o corte é o parâmetro posicional.
 */
export function filtroPublicoSQL(migracaoAplicada, posicaoParametroCorte) {
    if (migracaoAplicada) return "status IN ('aprovada', 'resolvida')";
    return `(status IN ('aprovada', 'resolvida') OR (status = 'pendente' AND created_at < $${posicaoParametroCorte}::timestamp))`;
}

const NOMES_COMUNIDADES = new Set(COMUNIDADES.map((c) => c.nome));

/** Comunidade da lista sai como está; texto livre ("Outra") passa pela máscara. */
export function comunidadePublica(comunidade) {
    if (NOMES_COMUNIDADES.has(comunidade) || comunidade === COMUNIDADE_OUTRA) return comunidade;
    return mascararTextoPublico(comunidade);
}

// Lista explícita de colunas — nunca SELECT *.
const COLUNAS_PUBLICAS_BASE = ['id', 'nome', 'comunidade', 'local_problema', 'tipo', 'descricao', 'latitude', 'longitude', 'status', 'created_at'];
const COLUNAS_ADMIN_BASE = ['id', 'nome', 'comunidade', 'local_problema', 'tipo', 'descricao', 'latitude', 'longitude', 'midia', 'status', 'created_at'];

const ERRO_COLUNA_INEXISTENTE = '42703';

// A coluna publicar_nome só existe depois da migração; a presença dela é o
// sinal de "migração aplicada" (desliga a cláusula legada). Em vez de consultar
// o catálogo a cada request, tenta com a coluna e, se o banco responder
// "coluna inexistente", cai para a versão sem ela (e lembra disso por 1 min).
// Nesse minuto logo após a migração o consentimento é ignorado (autor
// "Anônimo") e a cláusula legada ainda vale; como a migração já trocou as
// 'pendente' antigas por 'aprovada', ela só alcança uma antiga que o admin
// devolva para 'pendente' dentro desse minuto.
let semPublicarNomeAte = 0;
const MEMORIA_SEM_COLUNA_MS = 60 * 1000;

export function _resetDeteccaoColuna() {
    semPublicarNomeAte = 0;
}

/** Resultado do db.query + comColuna (true = migração aplicada). */
async function queryComPublicarNome(montar) {
    if (Date.now() >= semPublicarNomeAte) {
        try {
            return { ...(await db.query(...montar(true))), comColuna: true };
        } catch (err) {
            if (err?.code !== ERRO_COLUNA_INEXISTENTE) throw err;
            semPublicarNomeAte = Date.now() + MEMORIA_SEM_COLUNA_MS;
        }
    }
    return { ...(await db.query(...montar(false))), comColuna: false };
}

/**
 * Converte a linha do banco no formato público: sem nome completo, sem mídia,
 * com texto mascarado e status normalizado (pendente legado → aprovada).
 */
export function paraSaidaPublica(row) {
    return {
        id: row.id,
        autor: autorPublico(row.nome, row.publicar_nome === true),
        comunidade: comunidadePublica(row.comunidade),
        local_problema: mascararTextoPublico(row.local_problema),
        tipo: tipoPublico(row.tipo),
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
        const params = comColuna ? [] : [CORTE_LEGADO];
        const conditions = [filtroPublicoSQL(comColuna, 1)];

        // Filtros públicos só com valores conhecidos: não dá para sondar texto livre.
        if (tipo && tipo !== 'todos') {
            params.push(tipoValido(tipo) ? tipo : null);
            conditions.push(`tipo = $${params.length}`);
        }
        if (comunidade && comunidade !== 'todos') {
            params.push(NOMES_COMUNIDADES.has(comunidade) ? comunidade : null);
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
    const { rows, comColuna: migracaoAplicada } = await queryComPublicarNome((comColuna) => {
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
    // legado_no_ar: pendente que o público ainda vê (só antes da migração).
    return rows.map((row) => ({
        ...row,
        publicar_nome: row.publicar_nome === true,
        legado_no_ar: !migracaoAplicada && row.status === 'pendente' && anteriorAoCorte(row.created_at),
    }));
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
