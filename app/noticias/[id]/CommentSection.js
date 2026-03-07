'use client';
import { useState, useEffect } from 'react';

export default function CommentSection({ noticiaId }) {
    const [comentarios, setComentarios] = useState([]);
    const [autor, setAutor] = useState('');
    const [texto, setTexto] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchComentarios();
    }, []);

    const fetchComentarios = async () => {
        const res = await fetch(`/api/comentarios?noticia_id=${noticiaId}`);
        const data = await res.json();
        setComentarios(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!texto.trim()) return;

        setLoading(true);
        await fetch('/api/comentarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                noticia_id: noticiaId,
                autor: autor || 'Anônimo',
                texto,
            }),
        });

        setTexto('');
        setAutor('');
        await fetchComentarios();
        setLoading(false);
    };

    return (
        <div className="comments-section">
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                textTransform: 'uppercase',
                marginBottom: '1.5rem'
            }}>
                💬 Comentários ({comentarios.length})
            </h3>

            <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Seu nome (opcional)"
                        value={autor}
                        onChange={(e) => setAutor(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <textarea
                        className="form-textarea"
                        placeholder="Escreva seu comentário..."
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        required
                        style={{ minHeight: '80px' }}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Enviando...' : '📨 Enviar Comentário'}
                </button>
            </form>

            {comentarios.length === 0 ? (
                <p style={{ color: 'var(--color-gray-medium)', textAlign: 'center', padding: '2rem' }}>
                    Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
            ) : (
                comentarios.map(c => (
                    <div key={c.id} className="comment">
                        <div className="comment-author">{c.autor}</div>
                        <div className="comment-text">{c.texto}</div>
                        <div className="comment-date">
                            {new Date(c.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
