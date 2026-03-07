export default function SobrePage() {
    return (
        <div>
            <div className="page-header">
                <h1>📺 <span className="text-red">Sobre</span> a TV Complexo</h1>
                <p>Conheça a missão, os valores e a história da nossa plataforma comunitária.</p>
            </div>

            <div className="container">
                <div className="about-content">
                    {/* Missão */}
                    <div className="mission-card">
                        <h2 className="section-title">🎯 Nossa Missão</h2>
                        <p style={{ color: 'var(--color-white)', fontSize: '1.15rem', lineHeight: 1.8 }}>
                            A TV Complexo é uma plataforma digital comunitária onde moradores podem mostrar
                            a realidade das favelas, denunciar problemas e compartilhar histórias que raramente
                            aparecem na mídia tradicional. Nosso objetivo é <strong style={{ color: 'var(--color-red)' }}>fortalecer
                                a comunicação comunitária</strong> e ajudar a pressionar autoridades a resolver problemas locais.
                        </p>
                    </div>

                    {/* Valores */}
                    <section className="about-section">
                        <h2 className="section-title">🌟 Nossos Valores</h2>
                        <div className="values-grid">
                            <div className="value-item">
                                <div className="value-icon">🎤</div>
                                <h3>Dar Voz</h3>
                                <p>Amplificar as vozes dos moradores das comunidades que sempre foram silenciados.</p>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">👁️</div>
                                <h3>Transparência</h3>
                                <p>Mostrar a realidade sem filtros e sem manipulação. A verdade das favelas contada por quem vive nelas.</p>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">✊</div>
                                <h3>Luta</h3>
                                <p>Usar a informação como ferramenta de transformação social e pressão por melhorias.</p>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">🤝</div>
                                <h3>Comunidade</h3>
                                <p>Construir pontes entre moradores, coletivos e organizações para fortalecer a comunidade.</p>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">🎨</div>
                                <h3>Cultura</h3>
                                <p>Celebrar e preservar a riqueza cultural das favelas do Rio de Janeiro.</p>
                            </div>
                            <div className="value-item">
                                <div className="value-icon">📱</div>
                                <h3>Independência</h3>
                                <p>Mídia independente, feita pela comunidade, para a comunidade.</p>
                            </div>
                        </div>
                    </section>

                    {/* O que fazemos */}
                    <section className="about-section">
                        <h2 className="section-title">📋 O Que Fazemos</h2>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {[
                                { icon: '📺', title: 'Vídeos', desc: 'Publicamos vídeos das redes sociais e produzimos conteúdo mostrando a realidade das comunidades.' },
                                { icon: '📰', title: 'Notícias', desc: 'Cobrimos eventos, problemas e conquistas das comunidades que a grande mídia ignora.' },
                                { icon: '📢', title: 'Denúncias', desc: 'Recebemos e publicamos denúncias de moradores sobre problemas nas comunidades.' },
                                { icon: '🗺️', title: 'Mapa de Problemas', desc: 'Mapeamos os problemas das comunidades para facilitar a cobrança de soluções.' },
                            ].map(item => (
                                <div key={item.title} style={{
                                    background: 'var(--color-black-light)',
                                    border: '1px solid var(--color-dark-gray)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    transition: 'all 0.3s ease',
                                }}>
                                    <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                                    <div>
                                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700, marginBottom: '0.25rem' }}>{item.title}</h3>
                                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.95rem' }}>{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Comunidades */}
                    <section className="about-section">
                        <h2 className="section-title">🏘️ Comunidades Atendidas</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {[
                                'Complexo do Alemão',
                                'Rocinha',
                                'Cidade de Deus',
                                'Maré',
                                'Vidigal',
                                'Jacarezinho',
                                'Manguinhos',
                                'Penha',
                            ].map(c => (
                                <span key={c} className="badge badge-red" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                    📍 {c}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Contato */}
                    <section className="about-section" style={{
                        background: 'rgba(56,189,248,0.05)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        textAlign: 'center',
                        border: '1px solid rgba(56,189,248,0.15)',
                    }}>
                        <h2 className="section-title" style={{ display: 'block', textAlign: 'center' }}>📩 Fale Conosco</h2>
                        <p style={{ color: 'var(--color-gray-light)', marginBottom: '1rem', fontSize: '1.05rem' }}>
                            Quer colaborar, enviar pautas ou tirar dúvidas?
                        </p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            📧 contato@tvcomplexo.com.br
                        </p>
                        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '0.5rem' }}>
                            📱 (21) 99999-0000
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
