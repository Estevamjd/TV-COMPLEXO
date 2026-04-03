'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

export default function AdminLoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const router = useRouter();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: { username: '', password: '' },
    });

    const onSubmit = async (data) => {
        setServerError('');

        try {
            const res = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                router.push('/admin');
            } else {
                setServerError('Usuário ou senha incorretos.');
            }
        } catch {
            setServerError('Erro de conexão.');
        }
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

                {serverError && (
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
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="form-group">
                        <label className="form-label">Usuário</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="admin"
                            {...register('username', { required: 'Usuário é obrigatório' })}
                        />
                        {errors.username && (
                            <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.username.message}</span>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            Senha
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-gray-light)', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                {showPassword ? 'Ocultar' : 'Ver Senha'}
                            </button>
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-input"
                            placeholder="••••••••"
                            {...register('password', { required: 'Senha é obrigatória' })}
                        />
                        {errors.password && (
                            <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.password.message}</span>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
