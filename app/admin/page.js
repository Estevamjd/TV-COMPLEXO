import Link from 'next/link';
import db from '@/lib/db';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const { rows: tVideos } = await db.query('SELECT COUNT(*) as count FROM videos');
    const totalVideos = Math.round(tVideos[0].count) || 0;

    const { rows: tNoticias } = await db.query('SELECT COUNT(*) as count FROM noticias');
    const totalNoticias = Math.round(tNoticias[0].count) || 0;

    const { rows: tDenuncias } = await db.query('SELECT COUNT(*) as count FROM denuncias');
    const totalDenuncias = Math.round(tDenuncias[0].count) || 0;

    const { rows: dPendentes } = await db.query("SELECT COUNT(*) as count FROM denuncias WHERE status = 'pendente'");
    const denunciasPendentes = Math.round(dPendentes[0].count) || 0;

    const { rows: dAprovadas } = await db.query("SELECT COUNT(*) as count FROM denuncias WHERE status = 'aprovada'");
    const denunciasAprovadas = Math.round(dAprovadas[0].count) || 0;

    const { rows: tComentarios } = await db.query('SELECT COUNT(*) as count FROM comentarios');
    const totalComentarios = Math.round(tComentarios[0].count) || 0;

    const { rows: recentDenuncias } = await db.query("SELECT * FROM denuncias WHERE status = 'pendente' ORDER BY created_at DESC LIMIT 5");

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
                            🛡️ Painel <span className="text-red">Admin</span>
                        </h1>
                        <p style={{ color: 'var(--color-gray-light)' }}>Gerencie todo o conteúdo da TV Complexo</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <Link href="/" className="btn btn-secondary btn-sm">📺 Ver Site</Link>
                        <LogoutButton />
                    </div>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-number">{totalVideos}</div>
                        <div className="stat-label">Vídeos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{totalNoticias}</div>
                        <div className="stat-label">Notícias</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number" style={{ color: 'var(--color-yellow)' }}>{denunciasPendentes}</div>
                        <div className="stat-label">Denúncias Pendentes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number" style={{ color: 'var(--color-green)' }}>{denunciasAprovadas}</div>
                        <div className="stat-label">Denúncias Aprovadas</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{totalComentarios}</div>
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
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📺</div>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700 }}>Gerenciar Vídeos</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Editar, deletar, destacar vídeos</p>
                    </Link>
                    <Link href="/admin/denuncias" className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📢</div>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700 }}>Moderar Denúncias</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Aprovar, editar, rejeitar denúncias</p>
                    </Link>
                    <Link href="/admin/noticias" className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📰</div>
                        <h3 style={{ fontFamily: 'var(--font-primary)', fontWeight: 700 }}>Gerenciar Notícias</h3>
                        <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>Criar, editar, deletar notícias</p>
                    </Link>
                </div>

                {/* Denúncias Pendentes */}
                {recentDenuncias.length > 0 && (
                    <div>
                        <h2 className="section-title">⚠️ Denúncias Pendentes</h2>
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
