import db from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { toEmbedUrl } from '@/lib/video-utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const { id } = await params;
    const { rows } = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
    const video = rows[0];
    if (!video) return { title: 'Vídeo não encontrado' };
    return { title: `${video.titulo} | TV Complexo` };
}

export default async function VideoPage({ params }) {
    const { id } = await params;
    const { rows } = await db.query('SELECT * FROM videos WHERE id = $1', [id]);
    const video = rows[0];

    if (!video) {
        notFound();
    }

    const date = new Date(video.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const embedUrl = toEmbedUrl(video.url_video);
    const isSocialLink = video.plataforma !== 'manual';

    return (
        <main className="page-content">
            <div className="container" style={{ maxWidth: '900px', marginTop: '40px', marginBottom: '60px' }}>
                <Link href="/videos" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem', display: 'inline-flex' }}>
                    ← Voltar para Vídeos
                </Link>

                <div
                    style={{
                        background: 'var(--color-dark-gray)',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    {embedUrl ? (
                        <div className="video-player" style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
                            <iframe
                                src={embedUrl}
                                title={video.titulo}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            background: video.thumbnail ? `url(${video.thumbnail}) center/cover no-repeat` : 'linear-gradient(135deg, var(--color-dark) 0%, #1a0a0a 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            padding: '2rem',
                            position: 'relative'
                        }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }}></div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <span style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>
                                    {video.plataforma === 'instagram' ? '📷' : video.plataforma === 'tiktok' ? '🎵' : '📘'}
                                </span>
                                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
                                    Vídeo Original {video.plataforma.charAt(0).toUpperCase() + video.plataforma.slice(1)}
                                </h3>
                                <p style={{ color: 'var(--color-gray-light)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
                                    Este conteúdo foi importado da nossa rede social. Abra diretamente na plataforma para a melhor experiência.
                                </p>
                                <a
                                    href={video.url_video}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary btn-lg"
                                >
                                    Assistir no {video.plataforma.charAt(0).toUpperCase() + video.plataforma.slice(1)} ↗
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
                        {video.destaque ? <span className="badge badge-yellow">⭐ Destaque</span> : null}
                        <span className={`platform-icon platform-${video.plataforma}`}>
                            {video.plataforma.toUpperCase()}
                        </span>
                        <span style={{ color: 'var(--color-gray-medium)', fontSize: '0.9rem' }}>• {date}</span>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        marginBottom: '1rem',
                        lineHeight: 1.2
                    }}>
                        {video.titulo}
                    </h1>

                    <p style={{
                        fontSize: '1.1rem',
                        color: 'var(--color-gray-light)',
                        lineHeight: 1.8,
                        marginBottom: '2rem'
                    }}>
                        {video.descricao}
                    </p>

                    {isSocialLink && (
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px dashed rgba(255,255,255,0.1)'
                        }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🔗 Conteúdo Original</h3>
                            <p style={{ color: 'var(--color-gray-medium)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                Este vídeo foi importado automaticamente de uma rede social. Apoie o criador visualizando o post original:
                            </p>
                            <a
                                href={video.url_video}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            >
                                Abrir Original no {video.plataforma.charAt(0).toUpperCase() + video.plataforma.slice(1)} ↗
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
