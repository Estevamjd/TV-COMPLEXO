import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// O `opennextjs-cloudflare build` roda o `next build` num processo filho, que herda esta variável.
// O next.config.mjs usa ela para ligar o que só vale no Worker (images.unoptimized).
process.env.CLOUDFLARE_BUILD = '1';

export default defineCloudflareConfig({});
