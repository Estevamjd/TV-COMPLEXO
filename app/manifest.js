export default function manifest() {
    return {
        name: 'TV Complexo',
        short_name: 'TV Complexo',
        description: 'A Real da Favela — Vídeos, denúncias e notícias das comunidades do Rio de Janeiro',
        start_url: '/',
        display: 'standalone',
        background_color: '#FAF7F0',
        theme_color: '#FFD60A',
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
