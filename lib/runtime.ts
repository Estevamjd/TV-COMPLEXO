/**
 * Onde o servidor está rodando: Cloudflare Workers (OpenNext) ou Node (Vercel, `next dev`, testes).
 *
 * O Worker se identifica por `navigator.userAgent === 'Cloudflare-Workers'` (padrão do runtime).
 * `CLOUDFLARE_WORKER=1` (definida no wrangler.jsonc) força o modo Worker, e serve também nos testes.
 */
export function rodandoNoWorker(): boolean {
    if (process.env.CLOUDFLARE_WORKER === '1') return true;
    return typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
}

/** Ambiente do deploy: APP_ENV (Cloudflare ou qualquer host) e, se vazia, VERCEL_ENV (a Vercel define sozinha). */
export function ambienteDoDeploy(): string {
    return process.env.APP_ENV?.trim() || process.env.VERCEL_ENV?.trim() || '';
}

/**
 * Bindings do Worker (R2 etc.), via OpenNext. Fora do Worker devolve null sem importar o adaptador,
 * para o build e o runtime da Vercel não dependerem dele.
 */
export async function bindingsDoWorker(): Promise<Record<string, unknown> | null> {
    if (!rodandoNoWorker()) return null;
    try {
        const { getCloudflareContext } = await import('@opennextjs/cloudflare');
        const { env } = await getCloudflareContext({ async: true });
        return env as unknown as Record<string, unknown>;
    } catch {
        return null;
    }
}
