'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({ error, reset }) {
    useEffect(() => {
        console.error('[AdminError]', error);
    }, [error]);

    return (
        <div className="admin-layout">
            <div className="container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                }}>
                    Erro no <span style={{ color: 'var(--color-red)' }}>Painel</span>
                </h2>
                <p style={{ color: 'var(--color-gray-light)', marginBottom: '2rem' }}>
                    Ocorreu um erro ao carregar esta página do painel administrativo.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => reset()} className="btn btn-primary">
                        Tentar novamente
                    </button>
                    <Link href="/admin" className="btn btn-secondary">
                        Voltar ao painel
                    </Link>
                </div>
            </div>
        </div>
    );
}
