export default function manifest() {
    return {
        name: 'TV Complexo das Favelas',
        // Rótulo embaixo do ícone na tela inicial: Android e iOS cortam por volta de 12 caracteres,
        // e o nome completo (23 caracteres) sairia cortado. Única abreviação permitida (docs/pr-notas.md).
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
