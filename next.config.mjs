// Build da Cloudflare (OpenNext): o open-next.config.ts define CLOUDFLARE_BUILD=1 antes do `next build`.
const BUILD_CLOUDFLARE = process.env.CLOUDFLARE_BUILD === '1';

// Origem pública do bucket R2 (uploads na Cloudflare). Entra no CSP e no next/image; é lida no build.
function origemR2() {
  try {
    const url = new URL(process.env.R2_PUBLIC_URL || '');
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
const R2 = origemR2();
const CSP_R2 = R2 ? ` ${R2.origin}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No Worker o banco usa só o @neondatabase/serverless. O `pg` (externo no Node) viraria um módulo
  // `pg-<hash>` que o OpenNext não resolve; aqui ele é trocado por um stub e sai do bundle.
  ...(BUILD_CLOUDFLARE ? { turbopack: { resolveAlias: { pg: './lib/pg-indisponivel.js' } } } : {}),
  images: {
    // A otimização de imagens da Vercel não existe no Worker: lá o next/image serve o arquivo original.
    ...(BUILD_CLOUDFLARE ? { unoptimized: true } : {}),
    remotePatterns: [
      { hostname: '*.instagram.com' },
      { hostname: '*.cdninstagram.com' },
      { hostname: 'i.ytimg.com' },
      { hostname: '*.youtube.com' },
      { hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      ...(R2 ? [{ protocol: 'https', hostname: R2.hostname }] : []),
    ],
    formats: ['image/webp'],
  },
  compress: true,
  productionBrowserSourceMaps: false,
  async redirects() {
    return [
      // O mapa fica em /denuncias; /mapa é o endereço curto (antes dava 404).
      { source: '/mapa', destination: '/denuncias', permanent: true },
      // Canal 24h removido (missão live-e-topo): endereços antigos/óbvios voltam para a Início, sem 404.
      ...['/canal24h', '/canal-24h', '/24h'].map(source => ({ source, destination: '/', permanent: true })),
    ];
  },
  async headers() {
    return [
      {
        // Headers de segurança para todas as rotas
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.tiktok.com https://connect.facebook.net https://www.youtube.com https://www.instagram.com https://static.cdninstagram.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://www.instagram.com",
              "font-src 'self' https://fonts.gstatic.com",
              `img-src 'self' data: blob: https://*.ytimg.com https://*.instagram.com https://*.cdninstagram.com https://images.unsplash.com https://*.public.blob.vercel-storage.com${CSP_R2} https://unpkg.com https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://*.tiktokcdn.com https://p16-sign-sg.tiktokcdn.com`,
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com https://www.facebook.com https://www.instagram.com",
              "connect-src 'self' https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://*.basemaps.cartocdn.com https://www.instagram.com https://www.tiktok.com",
              `media-src 'self' blob: https://*.public.blob.vercel-storage.com${CSP_R2}`,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Headers de API — sem cache, proteção extra
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
