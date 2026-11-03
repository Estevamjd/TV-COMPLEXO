/**
 * Substitui o pacote `pg` no build da Cloudflare (turbopack.resolveAlias no next.config.mjs).
 * No Worker o banco vai pelo @neondatabase/serverless (lib/db.ts); o `pg` não entra no bundle.
 * Se algo chegar aqui, é erro de caminho: falha com mensagem clara em vez de "No such module".
 */
class Pool {
    constructor() {
        throw new Error('pg indisponível no build da Cloudflare: use o caminho Neon serverless (lib/db.ts)');
    }
}

const pg = { Pool };

export default pg;
export { Pool };
