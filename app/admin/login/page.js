'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (res.ok) {
                router.push('/admin');
            } else {
                setError('Usuário ou senha incorretos.');
            }
        } catch {
            setError('Erro de conexão.');
        }

        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'var(--color-black)',
        }}>
            <div style={{
                background: 'var(--color-black-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem',
                width: '100%',
                maxWidth: '420px',
                border: '1px solid var(--color-dark-gray)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '2rem',
                        letterSpacing: '2px',
                        marginBottom: '0.5rem'
                    }}>
                        <span style={{
                            background: 'var(--color-red)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: 'var(--radius-sm)',
                            marginRight: '0.5rem',
                        }}>TV</span>
                        <span style={{ color: 'var(--color-yellow)' }}>Complexo</span>
                    </div>
                    <p style={{ color: 'var(--color-gray-light)', fontSize: '0.9rem' }}>
                        Painel Administrativo
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid var(--color-red)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem',
                        color: '#ef4444',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                    }}>
                        ❌ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Usuário</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="admin"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Senha</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? '⏳ Entrando...' : '🔐 Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
