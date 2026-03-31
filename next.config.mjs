/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.instagram.com' },
      { hostname: '*.cdninstagram.com' },
      { hostname: 'i.ytimg.com' },
      { hostname: '*.youtube.com' },
      { hostname: 'images.unsplash.com' },
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
