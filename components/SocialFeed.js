'use client';
import ScrollReveal from './ScrollReveal';
import { FaFacebook, FaInstagram, FaTiktok } from 'react-icons/fa';

export default function SocialFeed() {
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
                            <iframe
                                src="https://www.instagram.com/tvcomplexo/embed"
                                width="100%"
                                height="480"
                                frameBorder="0"
                                scrolling="no"
                                allowtransparency="true"
                                style={{ borderRadius: '8px' }}
                            ></iframe>
                        </div>
                    </ScrollReveal>

                    {/* TikTok Embed (Exemplo de Embed de Perfil/Vídeo genérico) */}
                    <ScrollReveal delay={0.2}>
                        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', padding: '10px' }}>
                            <h3 style={{ color: '#000000', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaTiktok /> TikTok
                            </h3>
                            <blockquote className="tiktok-embed" cite="https://www.tiktok.com/@tvcomplexo" data-unique-id="tvcomplexo" data-embed-type="creator" style={{ maxWidth: '100%', minWidth: '288px' }} >
                                <section> <a target="_blank" href="https://www.tiktok.com/@tvcomplexo?refer=creator_embed">@tvcomplexo</a> </section>
                            </blockquote>
                            <script async src="https://www.tiktok.com/embed.js"></script>
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
