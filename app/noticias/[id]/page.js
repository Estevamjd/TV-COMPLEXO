import db from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import CommentSection from './CommentSection';
import ShareButtons from '@/components/ShareButtons';
import ScrollReveal from '@/components/ScrollReveal';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const { rows } = await db.query('SELECT * FROM noticias WHERE id = $1 AND publicada = 1', [id]);
    const noticia = rows[0];

    if (!noticia) {
        return { title: 'Notícia não encontrada | TV Complexo' };
    }

    const descricao = noticia.resumo || noticia.conteudo.substring(0, 155).replace(/<[^>]*>/g, '');

    return {
        title: `${noticia.titulo} | TV Complexo`,
        description: descricao,
        openGraph: {
            title: noticia.titulo,
            description: descricao,
            type: 'article',
            images: noticia.imagem ? [noticia.imagem] : ['/og-tv-complexo.jpg'],
        },
    };
}

export default async function NoticiaPage({ params }) {
    const { id } = await params;
    const { rows } = await db.query('SELECT * FROM noticias WHERE id = $1 AND publicada = 1', [id]);
    const noticia = rows[0];

    if (!noticia) notFound();

    const date = new Date(noticia.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    // Sanitizar conteúdo HTML (remove scripts, event handlers, etc.)
    const conteudoSeguro = noticia.conteudo
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');

    return (
        <div style={{ paddingTop: '20px' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* Breadcrumb */}
                <nav style={{ marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-gray-medium)' }}>
                    <Link href="/" style={{ color: 'var(--color-gray-light)', textDecoration: 'none' }}>Início</Link>
                    {' → '}
                    <Link href="/noticias" style={{ color: 'var(--color-gray-light)', textDecoration: 'none' }}>Notícias</Link>
                    {' → '}
                    <span style={{ color: 'var(--color-white)' }}>{noticia.titulo}</span>
                </nav>

                <ScrollReveal>
                    {/* Categoria */}
                    <span className="badge badge-red" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                        {noticia.categoria || 'geral'}
                    </span>

                    {/* Título */}
                    <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                        textTransform: 'uppercase',
                        lineHeight: 1.2,
                        marginBottom: '1rem',
                    }}>
                        {noticia.titulo}
                    </h1>

                    {/* Meta info */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        color: 'var(--color-gray-light)',
                        fontSize: '0.95rem',
                        marginBottom: '2rem',
                        paddingBottom: '1.5rem',
                        borderBottom: '1px solid var(--color-dark-gray)',
                    }}>
                        <span>✍️ {noticia.autor || 'TV Complexo'}</span>
                        <span>📅 {date}</span>
                    </div>
                </ScrollReveal>

                {/* Imagem de capa */}
                {noticia.imagem && (
                    <div style={{
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        marginBottom: '2rem',
                        aspectRatio: '16/9',
                        background: `url(${noticia.imagem}) center/cover no-repeat`,
                    }} />
                )}

                {/* Resumo */}
                {noticia.resumo && (
                    <p style={{
                        fontSize: '1.15rem',
                        color: 'var(--color-yellow)',
                        lineHeight: 1.7,
                        marginBottom: '2rem',
                        fontWeight: 500,
                    }}>
                        {noticia.resumo}
                    </p>
                )}

                {/* Conteúdo */}
                <article
                    className="noticia-conteudo"
                    style={{
                        fontSize: '1.05rem',
                        lineHeight: 1.8,
                        color: 'var(--color-gray-light)',
                        marginBottom: '3rem',
                    }}
                    dangerouslySetInnerHTML={{ __html: conteudoSeguro }}
                />

                {/* Compartilhar */}
                <div style={{
                    padding: '1.5rem',
                    background: 'rgba(20,20,20,0.6)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-dark-gray)',
                    marginBottom: '3rem',
                }}>
                    <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Compartilhe esta notícia:</p>
                    <ShareButtons title={noticia.titulo} />
                </div>

                {/* Comentários */}
                <CommentSection noticiaId={noticia.id} />

                {/* Voltar */}
                <div style={{ textAlign: 'center', margin: '3rem 0' }}>
                    <Link href="/noticias" className="btn btn-secondary">
                        ← Voltar para Notícias
                    </Link>
                </div>
            </div>
        </div>
    );
}
