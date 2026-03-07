'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDenunciasPage() {
    const [denuncias, setDenuncias] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState('todos');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDenuncias();
    }, [filtroStatus]);

    const fetchDenuncias = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filtroStatus !== 'todos') params.append('status', filtroStatus);
        const res = await fetch(`/api/denuncias?${params}`);
        const data = await res.json();
        setDenuncias(data);
        setLoading(false);
    };

    const handleStatusChange = async (id, newStatus) => {
        await fetch('/api/denuncias', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus }),
        });
        fetchDenuncias();
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja deletar esta denúncia?')) return;
        await fetch(`/api/denuncias?id=${id}`, { method: 'DELETE' });
        fetchDenuncias();
    };

    const tipoLabels = {
        falta_de_luz: '💡 Falta de Luz',
        lixo_acumulado: '🗑️ Lixo',
        risco_deslizamento: '⛰️ Deslizamento',
        saneamento: '🚰 Saneamento',
        fios_energizados: '⚡ Fios',
        poste_caido: '🔌 Poste',
        violencia: '🚨 Violência',
        outros: '📋 Outros',
    };

    const statusBadge = {
        pendente: 'badge-yellow',
        aprovada: 'badge-green',
        rejeitada: 'badge-red',
    };

    return (
        <div className="admin-layout">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase' }}>
                            📢 Moderar <span className="text-red">Denúncias</span>
                        </h1>
                    </div>
                    <Link href="/admin" className="btn btn-secondary btn-sm">← Voltar</Link>
                </div>

                {/* Filtros */}
                <div className="filter-bar">
                    {[
                        { value: 'todos', label: '📋 Todas' },
                        { value: 'pendente', label: '⏳ Pendentes' },
                        { value: 'aprovada', label: '✅ Aprovadas' },
                        { value: 'rejeitada', label: '❌ Rejeitadas' },
                    ].map(f => (
                        <button
                            key={f.value}
                            className={`filter-chip ${filtroStatus === f.value ? 'active' : ''}`}
                            onClick={() => setFiltroStatus(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex-center" style={{ padding: '4rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : denuncias.length === 0 ? (
                    <div className="empty-state">
                        <h3>Nenhuma denúncia encontrada</h3>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Nome</th>
                                    <th>Comunidade</th>
                                    <th>Tipo</th>
                                    <th>Local</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {denuncias.map(d => (
                                    <tr key={d.id}>
                                        <td>{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td>{d.nome || 'Anônimo'}</td>
                                        <td>{d.comunidade}</td>
                                        <td>{tipoLabels[d.tipo] || d.tipo}</td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {d.local_problema}
                                        </td>
                                        <td>
                                            <span className={`badge ${statusBadge[d.status]}`}>{d.status}</span>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                {d.status !== 'aprovada' && (
                                                    <button
                                                        className="admin-btn admin-btn-approve"
                                                        onClick={() => handleStatusChange(d.id, 'aprovada')}
                                                    >
                                                        ✅ Aprovar
                                                    </button>
                                                )}
                                                {d.status !== 'rejeitada' && (
                                                    <button
                                                        className="admin-btn admin-btn-edit"
                                                        onClick={() => handleStatusChange(d.id, 'rejeitada')}
                                                    >
                                                        ❌ Rejeitar
                                                    </button>
                                                )}
                                                <button
                                                    className="admin-btn admin-btn-delete"
                                                    onClick={() => handleDelete(d.id)}
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
