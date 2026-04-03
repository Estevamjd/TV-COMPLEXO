import Link from 'next/link';
import db from '@/lib/db';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // Uma única query para todas as estatísticas (em vez de 6 separadas)
    const { rows: [stats] } = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM videos) AS total_videos,
            (SELECT COUNT(*) FROM noticias) AS total_noticias,
            (SELECT COUNT(*) FROM denuncias) AS total_denuncias,
            (SELECT COUNT(*) FROM denuncias WHERE status = 'pendente') AS denuncias_pendentes,
            (SELECT COUNT(*) FROM denuncias WHERE status = 'resolvida') AS denuncias_resolvidas,
            (SELECT COUNT(*) FROM comentarios) AS total_comentarios
    `);

    const { rows: recentDenuncias } = await db.query(
        "SELECT * FROM denuncias WHERE status = 'pendente' ORDER BY created_at DESC LIMIT 5"
    );

    return (
        <div className="admin-layout">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            textTransform: 'uppercase'
                        }}>
                            Painel <span className="text-red">Admin</span>
                        </h1>
                        <p style={{ color: 'var(--color-gray-light)' }}>Gerencie todo o conteúdo da TV Complexo</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link href="/" className="btn btn-secondary btn-sm">Ver Site</Link>
                        <LogoutButton />
                    </div>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-number">{Number(stats.total_videos)}</div>
                        <div className="stat-label">Vídeos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{Number(stats.total_noticias)}</div>
                        <div className="stat-label">Notícias</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number" style={{ color: 'var(--color-yellow)' }}>{Number(stats.denuncias_pendentes)}</div>
                        <div className="stat-label">Denúncias Pendentes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number" style={{ color: 'var(--color-green)' }}>{Number(stats.denuncias_resolvidas)}</div>
                        <div className="stat-label">Denúncias Resolvidas</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{Number(stats.total_comentarios)}</div>
                        <div className="stat-label">Comentários</div>
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    <Link href="/admin/videos" className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700 }}>Gerenciar Vídeos</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Editar, deletar, destacar vídeos</p>
                    </Link>
                    <Link href="/admin/denuncias" className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700 }}>Moderar Denúncias</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Aprovar, editar, rejeitar denúncias</p>
                    </Link>
                    <Link href="/admin/noticias" className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700 }}>Gerenciar Notícias</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Criar, editar, deletar notícias</p>
                    </Link>
                </div>

                {/* Denúncias Pendentes */}
                {recentDenuncias.length > 0 && (
                    <div>
                        <h2 className="section-title">Denúncias Pendentes</h2>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Comunidade</th>
                                        <th>Tipo</th>
                                        <th>Local</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentDenuncias.map(d => (
                                        <tr key={d.id}>
                                            <td>{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td>{d.comunidade}</td>
                                            <td>{d.tipo}</td>
                                            <td>{d.local_problema}</td>
                                            <td>
                                                <Link href="/admin/denuncias" className="admin-btn admin-btn-approve">
                                                    Moderar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
