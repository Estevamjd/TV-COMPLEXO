import Link from 'next/link';

export default function NewsCard({ noticia }) {
    const date = new Date(noticia.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const categoryLabels = {
        comunidade: '🏘️ Comunidade',
        cultura: '🎨 Cultura',
        noticias: '📰 Notícias',
        eventos: '🎉 Eventos',
        geral: '📋 Geral',
    };

    return (
        <Link href={`/noticias/${noticia.id}`}>
            <div className="card">
                <div className="card-image">
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1a0a0a 0%, #0a1a0a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{ fontSize: '3rem', opacity: 0.3 }}>📰</span>
                    </div>
                </div>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-red">
                            {categoryLabels[noticia.categoria] || noticia.categoria}
                        </span>
                    </div>
                    <h3 style={{
                        fontFamily: 'var(--font-primary)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginBottom: '0.5rem',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>{noticia.titulo}</h3>
                    <p style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-gray-light)',
                        marginBottom: '0.75rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>{noticia.resumo}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-medium)' }}>📅 {date}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-medium)' }}>✍️ {noticia.autor}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
