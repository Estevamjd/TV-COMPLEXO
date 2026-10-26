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

/** true se a denúncia 'pendente' é anterior ao corte (já estava no ar). */
export function anteriorAoCorte(createdAt) {
    const t = new Date(createdAt).getTime();
    return Number.isFinite(t) && t < Date.parse(`${CORTE_LEGADO.replace(' ', 'T')}Z`);
}
