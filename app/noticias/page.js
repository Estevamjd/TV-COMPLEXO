import NewsCard from '@/components/NewsCard';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function NoticiasPage() {
    const { rows: noticias } = await db.query('SELECT * FROM noticias WHERE publicada = 1 ORDER BY created_at DESC');

    return (
        <div>
            <div className="page-header">
                <h1>📰 <span className="text-red">Notícias</span></h1>
                <p>Reportagens, relatos e notícias direto das comunidades do Rio de Janeiro.</p>
            </div>

            <div className="container">
                {noticias.length === 0 ? (
                    <div className="empty-state">
                        <h3>Nenhuma notícia publicada</h3>
                        <p>Em breve teremos as últimas notícias da comunidade.</p>
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
