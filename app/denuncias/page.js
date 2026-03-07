import db from '@/lib/db';
import ReportCard from '@/components/ReportCard';
import MapWrapper from './MapWrapper';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DenunciasPage() {
    const { rows: denuncias } = await db.query("SELECT * FROM denuncias WHERE status = 'aprovada' ORDER BY created_at DESC");

    return (
        <div>
            <div className="page-header">
                <h1>📢 <span className="text-red">Denúncias</span></h1>
                <p>Problemas reportados pela comunidade. Veja o mapa e ajude a cobrar soluções.</p>
            </div>

            <div className="container">
                {/* Mapa */}
                <div style={{ marginBottom: '3rem' }}>
                    <h2 className="section-title">🗺️ Mapa de Problemas</h2>
                    <MapWrapper denuncias={denuncias} />

                    {/* Legenda */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'var(--color-black-light)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-dark-gray)',
                    }}>
                        {[
                            { label: 'Falta de Luz', color: '#f4a261' },
                            { label: 'Lixo Acumulado', color: '#e76f51' },
                            { label: 'Risco Deslizamento', color: '#e63946' },
                            { label: 'Saneamento', color: '#2a9d8f' },
                            { label: 'Fios Energizados', color: '#f9c74f' },
                            { label: 'Poste Caído', color: '#999999' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }}></div>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Lista de Denúncias */}
                <div>
                    <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>📋 Denúncias Aprovadas</h2>
                        <Link href="/denuncias/enviar" className="btn btn-primary btn-sm">📢 Enviar Denúncia</Link>
                    </div>
                    {denuncias.length === 0 ? (
                        <div className="empty-state">
                            <h3>Nenhuma denúncia aprovada</h3>
                            <p>Seja o primeiro a denunciar um problema na sua comunidade.</p>
                        </div>
                    ) : (
                        <div className="grid-2">
                            {denuncias.map(d => (
                                <ReportCard key={d.id} denuncia={d} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
