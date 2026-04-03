'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function NoticiasError({ error, reset }) {
    useEffect(() => {
        console.error('[NoticiasError]', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2rem',
                textTransform: 'uppercase',
                marginBottom: '1rem',
            }}>
                Erro ao carregar <span style={{ color: 'var(--color-red)' }}>notícias</span>
            </h2>
            <p style={{ color: 'var(--color-gray-light)', marginBottom: '2rem' }}>
                Não foi possível carregar as notícias. Tente novamente.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => reset()} className="btn btn-primary">Tentar novamente</button>
                <Link href="/" className="btn btn-secondary">Voltar ao início</Link>
            </div>
        </div>
    );
}
