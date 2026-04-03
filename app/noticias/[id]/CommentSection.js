'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function CommentSection({ noticiaId }) {
    const [comentarios, setComentarios] = useState([]);

    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: { autor: '', texto: '' },
    });

    const fetchComentarios = async () => {
        const res = await fetch(`/api/comentarios?noticia_id=${noticiaId}`);
        const data = await res.json();
        setComentarios(data);
    };

    useEffect(() => {
        fetchComentarios();
    }, []);

    const onSubmit = async (data) => {
        await fetch('/api/comentarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                noticia_id: noticiaId,
                autor: data.autor || 'Anônimo',
                texto: data.texto,
            }),
        });

        reset();
        await fetchComentarios();
    };

    return (
        <div className="comments-section">
            <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                textTransform: 'uppercase',
                marginBottom: '1.5rem'
            }}>
                Comentários ({comentarios.length})
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Seu nome (opcional)"
                        {...register('autor', { maxLength: { value: 100, message: 'Máximo 100 caracteres' } })}
                    />
                </div>
                <div className="form-group">
                    <textarea
                        className="form-textarea"
                        placeholder="Escreva seu comentário..."
                        style={{ minHeight: '80px' }}
                        {...register('texto', {
                            required: 'Comentário é obrigatório',
                            maxLength: { value: 2000, message: 'Máximo 2000 caracteres' },
                        })}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Comentário'}
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
