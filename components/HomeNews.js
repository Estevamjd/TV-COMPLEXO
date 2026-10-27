import Link from 'next/link';
import NewsCard from './NewsCard';
import ScrollReveal from './ScrollReveal';

export default function HomeNews({ noticiasRecentes = [] }) {
    if (!noticiasRecentes.length) return null;
    return (
        <section className="section">
            <div className="container">
                <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <h2 className="section-title">📰 Notícias</h2>
                    <Link href="/noticias" className="btn btn-secondary btn-sm">Ver Todas →</Link>
                </div>
                <div className="grid-3">
                    {noticiasRecentes.map((noticia, idx) => (
                        <ScrollReveal key={noticia.id} delay={idx * 0.1}>
                            <NewsCard noticia={noticia} />
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
