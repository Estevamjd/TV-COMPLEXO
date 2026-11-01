import { metadataDaPagina } from '@/lib/site';

// A página de lista é client component; a metadata fica aqui. /videos/[id] define a própria.
export const metadata = metadataDaPagina({
    titulo: 'Vídeos | TV Complexo das Favelas',
    descricao: 'Todos os vídeos da TV Complexo das Favelas: notícias, cultura, eventos e o dia a dia do Complexo do Alemão e das favelas do Rio de Janeiro.',
    caminho: '/videos',
});

export default function VideosLayout({ children }) {
    return children;
}
