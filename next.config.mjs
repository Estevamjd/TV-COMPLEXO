/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.instagram.com' },
      { hostname: '*.cdninstagram.com' },
      { hostname: 'i.ytimg.com' },
      { hostname: '*.youtube.com' },
      { hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
    formats: ['image/webp'],
  },
  compress: true,
  productionBrowserSourceMaps: false,
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.tiktok.com https://connect.facebook.net https://www.youtube.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.ytimg.com https://*.instagram.com https://*.cdninstagram.com https://images.unsplash.com https://*.public.blob.vercel-storage.com https://unpkg.com https://tile.openstreetmap.org https://*.basemaps.cartocdn.com",
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.tiktok.com https://www.facebook.com",
              "connect-src 'self' https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://*.basemaps.cartocdn.com",
              "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
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
