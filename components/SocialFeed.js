'use client';
import { useEffect, useRef } from 'react';
import ScrollReveal from './ScrollReveal';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function SocialFeed() {
    const tiktokRef = useRef(null);
    const instaRef = useRef(null);

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

        // Load TikTok embed.js
        if (!document.querySelector('script[src*="tiktok.com/embed.js"]')) {
            const tiktokScript = document.createElement('script');
            tiktokScript.src = 'https://www.tiktok.com/embed.js';
            tiktokScript.async = true;
            document.body.appendChild(tiktokScript);
        } else {
            // Re-process embeds if script already loaded
            if (window.tiktokEmbed) {
                window.tiktokEmbed.lib.render();
            }
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
                            <div ref={instaRef}>
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
                            <div ref={tiktokRef}>
                                <blockquote
                                    className="tiktok-embed"
                                    cite="https://www.tiktok.com/@tvcomplexo"
                                    data-unique-id="tvcomplexo"
                                    data-embed-type="creator"
                                    style={{ maxWidth: '100%', minWidth: '288px' }}
                                >
                                    <section>
                                        <a
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            href="https://www.tiktok.com/@tvcomplexo?refer=creator_embed"
                                        >
                                            @tvcomplexo
                                        </a>
                                    </section>
                                </blockquote>
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
