import Link from 'next/link';
import db from '@/lib/db';
import VideoCard from '@/components/VideoCard';
import NewsCard from '@/components/NewsCard';
import ReportCard from '@/components/ReportCard';
import ScrollReveal from '@/components/ScrollReveal';
import SocialFeed from '@/components/SocialFeed';
import CommunityChips from '@/components/CommunityChips';
import { toEmbedUrl } from '@/lib/video-utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    // Executar todas as queries em paralelo para melhor performance
    const [destResult, videosResult, denunciasResult, noticiasResult] = await Promise.all([
        db.query("SELECT * FROM videos WHERE destaque = 1 ORDER BY created_at DESC LIMIT 1"),
        db.query("SELECT * FROM videos ORDER BY created_at DESC LIMIT 6"),
        db.query("SELECT * FROM denuncias WHERE status = 'aprovada' ORDER BY created_at DESC LIMIT 4"),
        db.query("SELECT * FROM noticias WHERE publicada = 1 ORDER BY created_at DESC LIMIT 3"),
    ]);

    const destaqueVideo = destResult.rows[0] || null;
    const videosRecentes = videosResult.rows;
    const denunciasRecentes = denunciasResult.rows;
    const noticiasRecentes = noticiasResult.rows;

    return (
        <div>
            {/* HERO FULLSCREEN COM LOGO CENTRAL */}
            <section className="hero full-bleed">
                <div className="hero-bg"></div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-logo-wrapper">
                            {/* O usuário mencionou ter enviado a imagem da logo. Caso o arquivo da logo venha a se chamar de outra forma, basta renomear em public/ */}
                            <img src="/logo.png" alt="TV Complexo Logo" />
                        </div>

                        <div className="hero-badge animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            🔵 AO VIVO — A Real da Favela
                        </div>

                        <p className="animate-fade-in-up" style={{ animationDelay: '0.7s', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.2rem', color: 'var(--color-white)' }}>
                            A real da favela. Vídeos, denúncias e notícias direto das comunidades do Rio de Janeiro.
                        </p>

                        <div className="hero-buttons flex-center animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                            <Link href="/videos" className="btn btn-primary btn-lg" aria-label="Assistir Vídeos">
                                ▶ Assistir Vídeos
                            </Link>
                            <Link href="/denuncias/enviar" className="btn btn-secondary btn-lg" aria-label="Enviar Denúncia">
                                📢 Enviar Denúncia
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* COMMUNITY CHIPS */}
            <CommunityChips />

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
                background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(125,211,252,0.04))',
                textAlign: 'center'
            }}>
                <div className="container">
                    <h2 className="display-md" style={{ marginBottom: '1rem' }}>
                        🎙️ A favela <span className="text-red">tem voz</span>
                    </h2>
                    <p style={{ color: 'var(--color-gray-light)', maxWidth: '600px', margin: '0 auto 2rem', lineHeight: 1.7 }}>
                        A TV Complexo é feita pela comunidade, para a comunidade.
                        Denuncie problemas, compartilhe histórias e ajude a transformar a realidade.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/denuncias/enviar" className="btn btn-primary btn-lg" aria-label="Enviar Denúncia">
                            📢 Enviar Denúncia
                        </Link>
                        <Link href="/sobre" className="btn btn-secondary btn-lg" aria-label="Sobre o Projeto">
                            ℹ️ Sobre o Projeto
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
