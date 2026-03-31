import db from '@/lib/db';

const BASE_URL = 'https://tvcomplexo.com.br';

export default async function sitemap() {
    const staticPages = [
        { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
        { url: `${BASE_URL}/videos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/noticias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
        { url: `${BASE_URL}/denuncias`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
        { url: `${BASE_URL}/denuncias/enviar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    let dynamicPages = [];

    try {
        const { rows: videos } = await db.query('SELECT id, created_at FROM videos ORDER BY created_at DESC LIMIT 200');
        const { rows: noticias } = await db.query('SELECT id, created_at FROM noticias WHERE publicada = 1 ORDER BY created_at DESC LIMIT 200');

        dynamicPages = [
            ...videos.map(v => ({
                url: `${BASE_URL}/videos/${v.id}`,
                lastModified: new Date(v.created_at),
                changeFrequency: 'weekly',
                priority: 0.6,
            })),
            ...noticias.map(n => ({
                url: `${BASE_URL}/noticias/${n.id}`,
                lastModified: new Date(n.created_at),
                changeFrequency: 'weekly',
                priority: 0.6,
            })),
        ];
    } catch {
        // Se o DB falhar, retorna só as páginas estáticas
    }

    return [...staticPages, ...dynamicPages];
}
