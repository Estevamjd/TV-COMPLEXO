import Link from 'next/link';
import NewsCard from '@/components/NewsCard';
import db from '@/lib/db';
import { COLUNAS_NOTICIAS } from '@/lib/colunas-publicas';
import { metadataDaPagina } from '@/lib/site';

export const metadata = metadataDaPagina({
    titulo: 'Notícias das comunidades | TV Complexo',
    descricao: 'Reportagens, relatos e notícias do Complexo do Alemão e de outras favelas do Rio de Janeiro, apurados pela TV Complexo.',
    caminho: '/noticias',
});

export const dynamic = 'force-dynamic';

export default async function NoticiasPage() {
    // Sem banco configurado (prévia/build local): lista vazia, sem tela de erro.
    const noticias = process.env.DATABASE_URL
        ? (await db.query(`SELECT ${COLUNAS_NOTICIAS} FROM noticias WHERE publicada = 1 ORDER BY created_at DESC`)).rows
        : [];

    return (
        <div>
            <div className="page-header">
                <h1>Notícias</h1>
                <p>Reportagens, relatos e notícias direto das comunidades do Rio de Janeiro.</p>
            </div>

            <div className="container">
                {noticias.length === 0 ? (
                    <div className="empty-state">
                        <h3>Ainda não tem notícia publicada</h3>
                        <p>
                            Enquanto isso, as reportagens da TV Complexo estão nos vídeos. Tem uma pauta do seu bairro?
                            Manda pra gente no WhatsApp.
                        </p>
                        <div className="botoes-vazio">
                            <Link href="/videos" className="btn btn-primary">Ver os vídeos</Link>
                            <a href="https://wa.me/5521966030258" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                                Mandar pauta no WhatsApp
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="grid-3">
                        {noticias.map(noticia => (
                            <NewsCard key={noticia.id} noticia={noticia} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
