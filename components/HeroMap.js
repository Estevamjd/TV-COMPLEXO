'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

const legendItems = [
    { label: 'Falta de Luz', color: '#f4a261' },
    { label: 'Lixo Acumulado', color: '#e76f51' },
    { label: 'Risco Deslizamento', color: '#e63946' },
    { label: 'Saneamento', color: '#2a9d8f' },
    { label: 'Fios Energizados', color: '#f9c74f' },
    { label: 'Violência', color: '#c1121f' },
    { label: 'Poste Caído', color: '#999999' },
    { label: 'Outros', color: '#666666' },
];

export default function HeroMap({ denuncias = [] }) {
    const totalDenuncias = denuncias.length;
    const pendentes = denuncias.filter(d => d.status === 'pendente').length;

    return (
        <section className="hero-map">
            <div className="hero-map-bg">
                <MapView denuncias={denuncias} />
            </div>

            <div className="hero-map-overlay">
                <div className="hero-map-content">
                    <div className="hero-map-badge">📢 MAPA AO VIVO</div>

                    <h1 className="hero-map-title">
                        Denúncias da <span className="text-red">Comunidade</span>
                    </h1>

                    <div className="hero-map-stats">
                        <div className="hero-map-stat">
                            <span className="hero-map-stat-number">{totalDenuncias}</span>
                            <span className="hero-map-stat-label">Denúncias</span>
                        </div>
                        <div className="hero-map-stat">
                            <span className="hero-map-stat-number">{pendentes}</span>
                            <span className="hero-map-stat-label">Problemas Ativos</span>
                        </div>
                    </div>

                    <div className="hero-map-buttons">
                        <Link href="/denuncias/enviar" className="btn btn-primary btn-lg" aria-label="Enviar Denúncia">
                            📢 Denunciar Problema
                        </Link>
                        <Link href="/denuncias" className="btn btn-secondary btn-lg" aria-label="Ver Todas Denúncias">
                            🗺️ Ver Mapa Completo
                        </Link>
                    </div>

                    <div className="hero-map-legend">
                        {legendItems.map(item => (
                            <div key={item.label} className="hero-map-legend-item">
                                <div className="hero-map-legend-dot" style={{ background: item.color }}></div>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
