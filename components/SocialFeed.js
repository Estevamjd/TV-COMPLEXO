'use client';
import { useEffect } from 'react';
import ScrollReveal from './ScrollReveal';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function SocialFeed() {
    useEffect(() => {
        // Load Instagram embed.js
        if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
            const instaScript = document.createElement('script');
            instaScript.src = 'https://www.instagram.com/embed.js';
            instaScript.async = true;
            instaScript.defer = true;
            document.body.appendChild(instaScript);
            instaScript.onload = () => {
                if (window.instgrm) {
                    window.instgrm.Embeds.process();
                }
            };
        } else if (window.instgrm) {
            window.instgrm.Embeds.process();
        }
    }, []);

    return (
        <section className="section" style={{ background: 'rgba(10, 10, 10, 0.8)' }}>
            <div className="container">
                <div className="flex-between" style={{ marginBottom: '2rem' }}>
                    <h2 className="section-title">📱 Redes Sociais</h2>
                    <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Acompanhe nossas últimas publicações</p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    alignItems: 'start'
                }}>
                    {/* Instagram Embed */}
                    <ScrollReveal delay={0.1}>
                        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', padding: '10px' }}>
                            <h3 style={{ color: '#E1306C', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaInstagram /> Instagram
                            </h3>
                            <div>
                                <blockquote
                                    className="instagram-media"
                                    data-instgrm-permalink="https://www.instagram.com/tvcomplexo/"
                                    data-instgrm-version="14"
                                    style={{
                                        background: '#FFF',
                                        border: 0,
                                        borderRadius: '8px',
                                        boxShadow: 'none',
                                        margin: '0',
                                        maxWidth: '100%',
                                        minWidth: '280px',
                                        padding: 0,
                                        width: '100%',
                                    }}
                                >
                                    <a
                                        href="https://www.instagram.com/tvcomplexo/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'block',
                                            padding: '16px',
                                            textAlign: 'center',
                                            color: '#c9c8cd',
                                            fontFamily: 'Arial, sans-serif',
                                            fontSize: '14px',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Ver perfil no Instagram — @tvcomplexo
                                    </a>
                                </blockquote>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* TikTok Embed */}
                    <ScrollReveal delay={0.2}>
                        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', padding: '10px' }}>
                            <h3 style={{ color: '#000000', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaTiktok /> TikTok
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '2rem 1rem',
                                background: 'linear-gradient(135deg, #000 0%, #25F4EE 50%, #FE2C55 100%)',
                                borderRadius: '8px',
                                minHeight: '420px',
                                justifyContent: 'center',
                                gap: '1.5rem',
                            }}>
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '3px solid rgba(255,255,255,0.3)',
                                }}>
                                    <FaTiktok size={36} color="#fff" />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{
                                        color: '#fff',
                                        fontSize: '1.4rem',
                                        fontWeight: '800',
                                        margin: '0 0 4px 0',
                                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                    }}>
                                        @tvcomplexo
                                    </p>
                                    <p style={{
                                        color: 'rgba(255,255,255,0.8)',
                                        fontSize: '0.85rem',
                                        margin: 0,
                                    }}>
                                        TV Complexo
                                    </p>
                                </div>
                                <p style={{
                                    color: 'rgba(255,255,255,0.9)',
                                    fontSize: '0.9rem',
                                    textAlign: 'center',
                                    maxWidth: '250px',
                                    lineHeight: '1.5',
                                    margin: 0,
                                }}>
                                    Acompanhe nossos vídeos e bastidores das comunidades
                                </p>
                                <a
                                    href="https://www.tiktok.com/@tvcomplexo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 28px',
                                        background: '#fff',
                                        color: '#000',
                                        borderRadius: '30px',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        textDecoration: 'none',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
                                    }}
                                >
                                    <FaTiktok size={18} /> Seguir no TikTok
                                </a>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Facebook Embed */}
                    <ScrollReveal delay={0.3}>
                        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', padding: '10px' }}>
                            <h3 style={{ color: '#1877F2', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaFacebook /> Facebook
                            </h3>
                            <iframe
                                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61576841100083&tabs=timeline&width=340&height=480&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"
                                width="100%"
                                height="480"
                                style={{ border: 'none', overflow: 'hidden', borderRadius: '8px' }}
                                scrolling="no"
                                frameBorder="0"
                                allowFullScreen={true}
                                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            ></iframe>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
