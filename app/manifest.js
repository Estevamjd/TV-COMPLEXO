export default function manifest() {
    return {
        name: 'TV Complexo',
        short_name: 'TV Complexo',
        description: 'Mídia Comunitária Independente — Vídeos, denúncias e notícias das comunidades do Rio de Janeiro',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#ef4444',
        icons: [
            {
                src: '/logo.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
            },
        ],
    };
}
