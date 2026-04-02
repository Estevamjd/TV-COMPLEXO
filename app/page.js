import Link from 'next/link';
import db from '@/lib/db';
import VideoCard from '@/components/VideoCard';
import NewsCard from '@/components/NewsCard';
import ReportCard from '@/components/ReportCard';
import ScrollReveal from '@/components/ScrollReveal';
import SocialFeed from '@/components/SocialFeed';
import CommunityChips from '@/components/CommunityChips';
import HeroMap from '@/components/HeroMap';
import { toEmbedUrl } from '@/lib/video-utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    // Executar todas as queries em paralelo para melhor performance
    const [destResult, videosResult, denunciasResult, noticiasResult, denunciasMapResult] = await Promise.all([
        db.query("SELECT * FROM videos WHERE destaque = 1 ORDER BY created_at DESC LIMIT 1"),
        db.query("SELECT * FROM videos ORDER BY created_at DESC LIMIT 6"),
        db.query("SELECT * FROM denuncias WHERE status IN ('pendente', 'resolvida') ORDER BY created_at DESC LIMIT 6"),
        db.query("SELECT * FROM noticias WHERE publicada = 1 ORDER BY created_at DESC LIMIT 3"),
        db.query("SELECT * FROM denuncias WHERE status IN ('pendente', 'resolvida') AND latitude IS NOT NULL AND longitude IS NOT NULL"),
    ]);

    const destaqueVideo = destResult.rows[0] || null;
    const videosRecentes = videosResult.rows;
    const denunciasRecentes = denunciasResult.rows;
    const noticiasRecentes = noticiasResult.rows;
    const denunciasComCoords = denunciasMapResult.rows;

    return (
        <div>
            {/* HERO — MAPA INTERATIVO DE DENÚNCIAS */}
            <HeroMap denuncias={denunciasComCoords} />

            {/* COMMUNITY CHIPS */}
            <CommunityChips />

            {/* DENÚNCIAS */}
            {denunciasRecentes.length > 0 && (
                <section className="section" style={{
                    background: 'rgba(20,20,20,0.6)',
                    backdropFilter: 'blur(10px)',
                    borderTop: '1px solid var(--color-dark-gray)',
                    borderBottom: '1px solid var(--color-dark-gray)',
                }}>
                    <div className="container">
                        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                            <h2 className="section-title">📢 Denúncias da Comunidade</h2>
                            <Link href="/denuncias" className="btn btn-secondary btn-sm">Ver Todas →</Link>
                        </div>
                        <div className="grid-2">
                            {denunciasRecentes.map((d, idx) => (
                                <ScrollReveal key={d.id} delay={idx * 0.1}>
                                    <ReportCard denuncia={d} />
                                </ScrollReveal>
                            ))}
                        </div>
                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <Link href="/denuncias/enviar" className="btn btn-primary" aria-label="Faça sua Denúncia">
                                📢 Faça sua Denúncia
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* VÍDEOS RECENTES */}
            <section className="section">
                <div className="container">
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="section-title">📺 Vídeos Recentes</h2>
                        <Link href="/videos" className="btn btn-secondary btn-sm">Ver Todos →</Link>
                    </div>
                    <div className="video-scroll-container">
                        {videosRecentes.map((video, idx) => (
                            <ScrollReveal key={video.id} delay={idx * 0.1}>
                                <VideoCard video={video} />
                            </ScrollReveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* VÍDEO EM DESTAQUE */}
            {destaqueVideo && (
                <section className="section">
                    <div className="container">
                        <h2 className="section-title">🎬 Em Destaque</h2>
                        <div className="featured-grid">
                            <div className="video-player">
                                {toEmbedUrl(destaqueVideo.url_video) ? (
                                    <iframe
                                        src={toEmbedUrl(destaqueVideo.url_video)}
                                        title={destaqueVideo.titulo}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <a href={destaqueVideo.url_video} target="_blank" rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '100%', height: '100%', minHeight: '200px',
                                            background: 'var(--color-dark)', color: 'white', textDecoration: 'none',
                                        }}>
                                        <span style={{ fontSize: '1.2rem' }}>▶ Assistir no {destaqueVideo.plataforma} ↗</span>
                                    </a>
                                )}
                            </div>
                            <ScrollReveal delay={0.2}>
                                <span className="badge badge-yellow">⭐ Destaque</span>
                                <h3 style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                                    textTransform: 'uppercase',
                                    margin: '0.75rem 0',
                                }}>
                                    {destaqueVideo.titulo}
                                </h3>
                                <p style={{ color: 'var(--color-gray-light)', lineHeight: 1.7 }}>
                                    {destaqueVideo.descricao}
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-gray">📅 {new Date(destaqueVideo.created_at).toLocaleDateString('pt-BR')}</span>
                                    <span className={`platform-icon platform-${destaqueVideo.plataforma}`}>
                                        {destaqueVideo.plataforma}
                                    </span>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </section>
            )}

            {/* NOTÍCIAS */}
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

            {/* REDES SOCIAIS E FEED AUTOMÁTICO */}
            <SocialFeed />

            {/* CTA FINAL */}
            <section className="section" style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(251,191,36,0.04))',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 className="display-md" style={{ marginBottom: '1rem' }}>
                        📢 Sua comunidade <span className="text-red">precisa de você</span>
                    </h2>
                    <p style={{ color: 'var(--color-gray-light)', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
                        Denuncie problemas, compartilhe o que acontece na sua quebrada
                        e ajude a cobrar soluções. A mudança começa com a sua voz.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/denuncias/enviar" className="btn btn-primary btn-lg" aria-label="Denunciar Problema">
                            📢 Denunciar Problema
                        </Link>
                        <Link href="/denuncias" className="btn btn-secondary btn-lg" aria-label="Ver Mapa de Denúncias">
                            🗺️ Ver Mapa
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
