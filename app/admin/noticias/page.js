'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';

export default function AdminNoticiasPage() {
    const toast = useToast();
    const [noticias, setNoticias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editNoticia, setEditNoticia] = useState(null);
    const [form, setForm] = useState({
        titulo: '', resumo: '', conteudo: '', categoria: 'geral', autor: 'TV Complexo'
    });

    const fetchNoticias = async () => {
        setLoading(true);
        const res = await fetch('/api/noticias');
        const data = await res.json();
        setNoticias(data);
        setLoading(false);
    };

    useEffect(() => { fetchNoticias(); }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editNoticia) {
            const res = await fetch('/api/noticias', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, id: editNoticia.id, publicada: true }),
            });
            toast(res.ok ? 'Notícia atualizada' : 'Erro ao atualizar', res.ok ? 'success' : 'error');
        } else {
            const res = await fetch('/api/noticias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            toast(res.ok ? 'Notícia publicada com sucesso' : 'Erro ao publicar', res.ok ? 'success' : 'error');
        }
        setShowForm(false);
        setEditNoticia(null);
        setForm({ titulo: '', resumo: '', conteudo: '', categoria: 'geral', autor: 'TV Complexo' });
        fetchNoticias();
    };

    const handleEdit = (noticia) => {
        setEditNoticia(noticia);
        setForm({
            titulo: noticia.titulo,
            resumo: noticia.resumo || '',
            conteudo: noticia.conteudo,
            categoria: noticia.categoria,
            autor: noticia.autor,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja deletar esta notícia?')) return;
        const res = await fetch(`/api/noticias?id=${id}`, { method: 'DELETE' });
        toast(res.ok ? 'Notícia deletada' : 'Erro ao deletar', res.ok ? 'success' : 'error');
        fetchNoticias();
    };

    return (
        <div className="admin-layout">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase' }}>
                            📰 Gerenciar <span className="text-red">Notícias</span>
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditNoticia(null); setForm({ titulo: '', resumo: '', conteudo: '', categoria: 'geral', autor: 'TV Complexo' }); }}>
                            {showForm ? '✕ Fechar' : '+ Nova Notícia'}
                        </button>
                        <Link href="/admin" className="btn btn-secondary btn-sm">← Voltar</Link>
                    </div>
                </div>

                {/* Formulário */}
                {showForm && (
                    <div style={{
                        background: 'var(--color-black-light)',
                        border: '1px solid var(--color-dark-gray)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        marginBottom: '2rem',
                    }}>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem', textTransform: 'uppercase' }}>
                            {editNoticia ? '✏️ Editar Notícia' : '➕ Nova Notícia'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Título *</label>
                                    <input type="text" name="titulo" className="form-input" value={form.titulo} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Autor</label>
                                    <input type="text" name="autor" className="form-input" value={form.autor} onChange={handleChange} />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Resumo</label>
                                    <input type="text" name="resumo" className="form-input" placeholder="Breve resumo da notícia" value={form.resumo} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoria</label>
                                <select name="categoria" className="form-select" value={form.categoria} onChange={handleChange}>
                                    <option value="geral">Geral</option>
                                    <option value="noticias">Notícias</option>
                                    <option value="cultura">Cultura</option>
                                    <option value="comunidade">Comunidade</option>
                                    <option value="eventos">Eventos</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Conteúdo (HTML) *</label>
                                <textarea name="conteudo" className="form-textarea" value={form.conteudo} onChange={handleChange} required style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '0.85rem' }} placeholder="<p>Escreva o conteúdo da notícia aqui...</p>" />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editNoticia ? '💾 Salvar Alterações' : '➕ Publicar Notícia'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tabela */}
                {loading ? (
                    <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner"></div></div>
                ) : noticias.length === 0 ? (
                    <div className="empty-state"><h3>Nenhuma notícia cadastrada</h3></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Título</th>
                                    <th>Categoria</th>
                                    <th>Autor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {noticias.map(n => (
                                    <tr key={n.id}>
                                        <td>{new Date(n.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.titulo}</td>
                                        <td><span className="badge badge-red">{n.categoria}</span></td>
                                        <td>{n.autor}</td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-btn admin-btn-edit" onClick={() => handleEdit(n)}>✏️ Editar</button>
                                                <button className="admin-btn admin-btn-delete" onClick={() => handleDelete(n.id)}>🗑 Deletar</button>
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
