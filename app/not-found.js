import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '2rem',
        }}>
            <div>
                <div style={{ fontSize: '6rem', marginBottom: '1rem', opacity: 0.3 }}>404</div>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                    textTransform: 'uppercase',
                    marginBottom: '1rem',
                }}>
                    Página <span className="text-red">não encontrada</span>
                </h1>
                <p style={{
                    color: 'var(--color-gray-light)',
                    fontSize: '1.1rem',
                    maxWidth: '500px',
                    margin: '0 auto 2rem',
                    lineHeight: 1.7,
                }}>
                    A página que você procura não existe ou foi removida.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" className="btn btn-primary">
                        Voltar ao Início
                    </Link>
                    <Link href="/denuncias/enviar" className="btn btn-secondary">
                        Enviar Denúncia
                    </Link>
                </div>
            </div>
        </div>
    );
}
