/**
 * Entrada do Worker na Cloudflare: o worker gerado pelo OpenNext (.open-next/worker.js) mais o
 * handler `scheduled` do cron (triggers.crons no wrangler.jsonc), que substitui o Vercel Cron.
 *
 * O cron passa pela própria rota /api/cron/youtube (com o CRON_SECRET), dentro do mesmo Worker e sem
 * sair para a rede: roda a mesma lógica (lib/youtube-cron.js) com o mesmo banco e as mesmas variáveis,
 * sem empacotar o `pg` e o Neon uma segunda vez fora do bundle do Next.
 */
// @ts-ignore: gerado no build (`opennextjs-cloudflare build`)
import { default as handler } from '../.open-next/worker.js';

const worker = {
    fetch: handler.fetch,

    async scheduled(controller, env, ctx) {
        if (!env.CRON_SECRET) {
            console.error('[YouTube Cron] CRON_SECRET não configurado; cron ignorado.');
            return;
        }
        const pedido = new Request('https://worker.interno/api/cron/youtube', {
            headers: { authorization: `Bearer ${env.CRON_SECRET}` },
        });
        const resposta = await handler.fetch(pedido, env, ctx);
        const corpo = await resposta.text();
        if (!resposta.ok) {
            console.error(`[YouTube Cron] ${controller.cron}: HTTP ${resposta.status} ${corpo.slice(0, 300)}`);
        }
    },
};

export default worker;

// Classes de Durable Object que o worker do OpenNext exporta (só valem se ligadas no wrangler.jsonc).
// @ts-ignore: gerado no build
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from '../.open-next/worker.js';
