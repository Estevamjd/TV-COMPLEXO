'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { mascararTextoPublico, autorPublico } from '@/lib/mascara';

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

const statusInfo = {
    pendente: { label: 'Pendente', badge: 'badge-yellow' },
    aprovada: { label: 'Aprovada', badge: 'badge-green' },
    rejeitada: { label: 'Rejeitada', badge: 'badge-gray' },
    resolvida: { label: 'Resolvida', badge: 'badge-green' },
};

const filtros = [
    { value: 'pendente', label: 'Pendentes' },
    { value: 'aprovada', label: 'Aprovadas' },
    { value: 'rejeitada', label: 'Rejeitadas' },
    { value: 'resolvida', label: 'Resolvidas' },
    { value: 'todos', label: 'Todas' },
];

export default function AdminDenunciasPage() {
    const toast = useToast();
    const [denuncias, setDenuncias] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState('pendente');
    const [loading, setLoading] = useState(true);
    const [recarregar, setRecarregar] = useState(0);
    const [editando, setEditando] = useState(null); // { id, nome, local_problema, descricao }
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        let ignorar = false;
        const params = new URLSearchParams({ limit: '200' });
        if (filtroStatus !== 'todos') params.append('status', filtroStatus);
        fetch(`/api/denuncias?${params}`)
            .then((res) => (res.ok ? res.json() : []))
            .catch(() => [])
            .then((data) => {
                if (ignorar) return;
                setDenuncias(Array.isArray(data) ? data : []);
                setLoading(false);
            });
        return () => { ignorar = true; };
    }, [filtroStatus, recarregar]);

    const atualizarLista = () => {
        setLoading(true);
        setRecarregar((n) => n + 1);
    };

    const trocarFiltro = (valor) => {
        if (valor === filtroStatus) return;
        setLoading(true);
        setEditando(null);
        setFiltroStatus(valor);
    };

    const enviarPut = async (body, mensagemOk) => {
        setSalvando(true);
        try {
            const res = await fetch('/api/denuncias', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            toast(res.ok ? mensagemOk : data.error || 'Erro ao atualizar', res.ok ? 'success' : 'error');
            if (res.ok) {
                setEditando(null);
                atualizarLista();
            }
            return res.ok;
        } finally {
            setSalvando(false);
        }
    };

    // Se o texto estiver em edição, as alterações vão junto com a decisão.
    const edicaoDe = (id) => (editando?.id === id
        ? { nome: editando.nome, local_problema: editando.local_problema, descricao: editando.descricao }
        : {});

    const aprovar = (d) => {
        if (!confirm('Publicar esta denúncia? Ela fica visível no site e no mapa.')) return;
        enviarPut({ id: d.id, ...edicaoDe(d.id), status: 'aprovada' }, 'Denúncia aprovada e publicada');
    };

    const rejeitar = (d) => {
        if (!confirm('Rejeitar esta denúncia? Ela não vai aparecer no site.')) return;
        enviarPut({ id: d.id, status: 'rejeitada' }, 'Denúncia rejeitada');
    };

    const mudarStatus = (d, status, mensagem) => enviarPut({ id: d.id, status }, mensagem);

    const salvarTexto = () => enviarPut({ id: editando.id, ...edicaoDe(editando.id) }, 'Texto atualizado');

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja deletar esta denúncia?')) return;
        const res = await fetch(`/api/denuncias?id=${id}`, { method: 'DELETE' });
        toast(res.ok ? 'Denúncia deletada' : 'Erro ao deletar', res.ok ? 'success' : 'error');
        atualizarLista();
    };

    return (
        <div className="admin-layout">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase' }}>
                            Fila de <span className="text-red">moderação</span>
                        </h1>
                    </div>
                    <Link href="/admin" className="btn btn-secondary btn-sm">← Voltar</Link>
                </div>

                <p className="moderation-reminder" role="note">
                    Antes de aprovar: tire nomes de outras pessoas e dados de saúde da descrição. Autor aparece só com
                    primeiro nome (se autorizou) ou &quot;Anônimo&quot;.
                </p>

                <div className="filter-bar" role="group" aria-label="Filtrar por status">
                    {filtros.map(f => (
                        <button
                            key={f.value}
                            type="button"
                            className={`filter-chip ${filtroStatus === f.value ? 'active' : ''}`}
                            aria-pressed={filtroStatus === f.value}
                            onClick={() => trocarFiltro(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex-center" style={{ padding: '4rem' }}>
                        <div className="spinner" role="status" aria-label="Carregando"></div>
                    </div>
                ) : denuncias.length === 0 ? (
                    <div className="empty-state">
                        <h3>{filtroStatus === 'pendente' ? 'Nenhuma denúncia esperando revisão.' : 'Nenhuma denúncia encontrada'}</h3>
                    </div>
                ) : (
                    <ul className="moderation-list">
                        {denuncias.map(d => {
                            const emEdicao = editando?.id === d.id;
                            const info = statusInfo[d.status] || { label: d.status, badge: 'badge-gray' };
                            const textoPrevia = emEdicao ? editando.descricao : d.descricao;
                            const legadoNoAr = d.legado_no_ar === true;
                            return (
                                <li key={d.id} className={`moderation-item ${d.status === 'pendente' ? 'is-pendente' : ''}`}>
                                    <div className="moderation-meta">
                                        <span className={`badge ${info.badge}`}>{info.label}</span>
                                        {legadoNoAr && <span className="badge badge-gray">No ar (anterior à moderação)</span>}
                                        <span>{new Date(d.created_at).toLocaleString('pt-BR')}</span>
                                        <span>· {d.comunidade}</span>
                                        <span>· {tipoLabels[d.tipo] || d.tipo}</span>
                                    </div>

                                    {emEdicao ? (
                                        <div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor={`nome-${d.id}`}>Nome (interno)</label>
                                                <input
                                                    id={`nome-${d.id}`}
                                                    className="form-input"
                                                    value={editando.nome}
                                                    maxLength={200}
                                                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor={`local-${d.id}`}>Local</label>
                                                <input
                                                    id={`local-${d.id}`}
                                                    className="form-input"
                                                    value={editando.local_problema}
                                                    maxLength={500}
                                                    onChange={(e) => setEditando({ ...editando, local_problema: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" htmlFor={`descricao-${d.id}`}>Descrição</label>
                                                <textarea
                                                    id={`descricao-${d.id}`}
                                                    className="form-textarea"
                                                    value={editando.descricao}
                                                    maxLength={5000}
                                                    onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p><strong>{d.local_problema}</strong></p>
                                            <p className="moderation-text">{d.descricao}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-gray-light)' }}>
                                                Nome enviado: {d.nome || 'Anônimo'} ·{' '}
                                                {d.publicar_nome ? 'autorizou mostrar o primeiro nome' : 'publicar anonimamente'}
                                            </p>
                                        </>
                                    )}

                                    <div className="moderation-preview">
                                        <strong>Prévia pública (máscara automática):</strong>{' '}
                                        {autorPublico(emEdicao ? editando.nome : d.nome, d.publicar_nome)} —{' '}
                                        {mascararTextoPublico(textoPrevia)}
                                    </div>

                                    <div className="moderation-actions">
                                        {emEdicao ? (
                                            <>
                                                <button type="button" className="admin-btn admin-btn-edit" disabled={salvando} onClick={salvarTexto}>
                                                    Salvar texto
                                                </button>
                                                <button type="button" className="admin-btn" disabled={salvando} onClick={() => setEditando(null)}>
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                className="admin-btn admin-btn-edit"
                                                disabled={salvando}
                                                onClick={() => setEditando({
                                                    id: d.id,
                                                    nome: d.nome || '',
                                                    local_problema: d.local_problema || '',
                                                    descricao: d.descricao || '',
                                                })}
                                            >
                                                Editar texto
                                            </button>
                                        )}

                                        {(d.status === 'pendente' || d.status === 'rejeitada') && (
                                            <button type="button" className="admin-btn admin-btn-approve" disabled={salvando} onClick={() => aprovar(d)}>
                                                Aprovar e publicar
                                            </button>
                                        )}
                                        {(d.status === 'pendente' || d.status === 'aprovada') && (
                                            <button type="button" className="admin-btn admin-btn-delete" disabled={salvando} onClick={() => rejeitar(d)}>
                                                Rejeitar
                                            </button>
                                        )}
                                        {d.status === 'aprovada' && (
                                            <button type="button" className="admin-btn admin-btn-approve" disabled={salvando}
                                                onClick={() => mudarStatus(d, 'resolvida', 'Denúncia marcada como resolvida')}>
                                                Marcar resolvida
                                            </button>
                                        )}
                                        {d.status === 'resolvida' && (
                                            <button type="button" className="admin-btn admin-btn-edit" disabled={salvando}
                                                onClick={() => mudarStatus(d, 'aprovada', 'Denúncia reaberta')}>
                                                Reabrir
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-delete"
                                            aria-label="Deletar denúncia"
                                            disabled={salvando}
                                            onClick={() => handleDelete(d.id)}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
