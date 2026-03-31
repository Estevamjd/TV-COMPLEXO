'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toEmbedUrl, detectPlatform } from '@/lib/video-utils';
import { useToast } from '@/components/Toast';

export default function AdminVideosPage() {
    const toast = useToast();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editVideo, setEditVideo] = useState(null);
    const [form, setForm] = useState({
        titulo: '', descricao: '', url_video: '', thumbnail: '', plataforma: 'youtube', categoria: 'geral', destaque: false
    });

    useEffect(() => { fetchVideos(); }, []);

    const fetchVideos = async () => {
        setLoading(true);
        const res = await fetch('/api/videos');
        const data = await res.json();
        setVideos(data);
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        const updated = { ...form, [name]: val };

        // Auto-detectar plataforma e converter URL ao colar/digitar URL
        if (name === 'url_video' && value) {
            const platform = detectPlatform(value);
            if (platform !== 'manual') {
                updated.plataforma = platform;
            }
        }

        setForm(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Converter URL para embed se possível (YouTube, Vimeo, etc.)
        const submitData = { ...form };
        const embedUrl = toEmbedUrl(submitData.url_video);
        if (embedUrl) {
            submitData.url_video = embedUrl;
        }

        if (editVideo) {
            const res = await fetch('/api/videos', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...submitData, id: editVideo.id }),
            });
            toast(res.ok ? 'Vídeo atualizado com sucesso' : 'Erro ao atualizar vídeo', res.ok ? 'success' : 'error');
        } else {
            const res = await fetch('/api/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });
            toast(res.ok ? 'Vídeo adicionado com sucesso' : 'Erro ao adicionar vídeo', res.ok ? 'success' : 'error');
        }
        setShowForm(false);
        setEditVideo(null);
        setForm({ titulo: '', descricao: '', url_video: '', thumbnail: '', plataforma: 'youtube', categoria: 'geral', destaque: false });
        fetchVideos();
    };

    const handleEdit = (video) => {
        setEditVideo(video);
        setForm({
            titulo: video.titulo,
            descricao: video.descricao,
            url_video: video.url_video,
            thumbnail: video.thumbnail || '',
            plataforma: video.plataforma,
            categoria: video.categoria,
            destaque: video.destaque === 1,
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;
        const res = await fetch(`/api/videos?id=${id}`, { method: 'DELETE' });
        toast(res.ok ? 'Vídeo deletado' : 'Erro ao deletar', res.ok ? 'success' : 'error');
        fetchVideos();
    };

    const handleToggleDestaque = async (video) => {
        await fetch('/api/videos', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...video, destaque: video.destaque ? 0 : 1 }),
        });
        fetchVideos();
    };

    return (
        <div className="admin-layout">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', textTransform: 'uppercase' }}>
                            📺 Gerenciar <span className="text-red">Vídeos</span>
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setEditVideo(null); setForm({ titulo: '', descricao: '', url_video: '', thumbnail: '', plataforma: 'youtube', categoria: 'geral', destaque: false }); }}>
                            {showForm ? '✕ Fechar' : '+ Novo Vídeo'}
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
                            {editVideo ? '✏️ Editar Vídeo' : '➕ Novo Vídeo'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Título *</label>
                                    <input type="text" name="titulo" className="form-input" value={form.titulo} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">URL do Vídeo *</label>
                                    <input type="text" name="url_video" className="form-input" placeholder="Cole qualquer link do YouTube, Instagram, TikTok..." value={form.url_video} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Thumbnail (URL opcional)</label>
                                    <input type="text" name="thumbnail" className="form-input" placeholder="https://exemplo.com/imagem.jpg" value={form.thumbnail} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Plataforma</label>
                                    <select name="plataforma" className="form-select" value={form.plataforma} onChange={handleChange}>
                                        <option value="youtube">YouTube</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="vimeo">Vimeo</option>
                                        <option value="manual">Manual</option>
                                    </select>
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
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descrição</label>
                                <textarea name="descricao" className="form-textarea" value={form.descricao} onChange={handleChange} style={{ minHeight: '80px' }} />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" name="destaque" id="destaque" checked={form.destaque} onChange={handleChange} style={{ width: 18, height: 18 }} />
                                <label htmlFor="destaque" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>⭐ Marcar como destaque</label>
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editVideo ? '💾 Salvar Alterações' : '➕ Adicionar Vídeo'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tabela */}
                {loading ? (
                    <div className="flex-center" style={{ padding: '4rem' }}><div className="spinner"></div></div>
                ) : videos.length === 0 ? (
                    <div className="empty-state"><h3>Nenhum vídeo cadastrado</h3></div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Título</th>
                                    <th>Plataforma</th>
                                    <th>Categoria</th>
                                    <th>Destaque</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.map(v => (
                                    <tr key={v.id}>
                                        <td>{new Date(v.created_at).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.titulo}</td>
                                        <td><span className={`platform-icon platform-${v.plataforma}`}>{v.plataforma}</span></td>
                                        <td>{v.categoria}</td>
                                        <td>
                                            <button
                                                className={`admin-btn ${v.destaque ? 'admin-btn-approve' : 'admin-btn-edit'}`}
                                                onClick={() => handleToggleDestaque(v)}
                                            >
                                                {v.destaque ? '⭐ Sim' : '☆ Não'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="admin-actions">
                                                <button className="admin-btn admin-btn-edit" onClick={() => handleEdit(v)}>✏️ Editar</button>
                                                <button className="admin-btn admin-btn-delete" onClick={() => handleDelete(v.id)}>🗑 Deletar</button>
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
