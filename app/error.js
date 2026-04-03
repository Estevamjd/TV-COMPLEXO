'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
    useEffect(() => {
        console.error('[GlobalError]', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                textTransform: 'uppercase',
                marginBottom: '1rem',
            }}>
                Algo deu <span style={{ color: 'var(--color-red)' }}>errado</span>
            </h2>
            <p style={{ color: 'var(--color-gray-light)', marginBottom: '2rem', maxWidth: '500px' }}>
                Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
                onClick={() => reset()}
                className="btn btn-primary"
            >
                Tentar novamente
            </button>
        </div>
    );
}
