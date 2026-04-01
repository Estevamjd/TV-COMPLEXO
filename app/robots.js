const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tvcomplexo.com.br';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/'],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
