import { suavizarPlaceholders } from '@/lib/exibicao';

const tipoLabels = {
    falta_de_luz: '💡 Falta de Luz',
    lixo_acumulado: '🗑️ Lixo Acumulado',
    risco_deslizamento: '⛰️ Risco de Deslizamento',
    saneamento: '🚰 Saneamento',
    fios_energizados: '⚡ Fios Energizados',
    poste_caido: '🔌 Poste Caído',
    violencia: '🚨 Violência',
    outros: '📋 Outros',
};

const statusLabels = {
    aprovada: '🔴 Problema Ativo',
    pendente: '🔴 Problema Ativo',
    resolvida: '✅ Resolvido',
};

export default function ReportCard({ denuncia }) {
    const date = new Date(denuncia.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div className="card">
            <div className="card-body">
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-red">
                        {tipoLabels[denuncia.tipo] || denuncia.tipo}
                    </span>
                    <span className="badge badge-yellow">
                        📍 {suavizarPlaceholders(denuncia.comunidade)}
                    </span>
                    <span className={`badge ${denuncia.status === 'resolvida' ? 'badge-green' : 'badge-red'}`}
                        style={{ fontSize: '0.7rem' }}>
                        {statusLabels[denuncia.status] || denuncia.status}
                    </span>
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-primary)',
                    fontSize: '1rem',
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    lineHeight: 1.3,
                }}>
                    {tipoLabels[denuncia.tipo]?.split(' ').slice(1).join(' ') || denuncia.tipo} — {suavizarPlaceholders(denuncia.local_problema)}
                </h3>
                <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-gray-light)',
                    marginBottom: '0.75rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: 1.5
                }}>{suavizarPlaceholders(denuncia.descricao)}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-light)' }}>
                        <span aria-hidden="true">👤</span> {denuncia.autor || 'Anônimo'} · <span aria-hidden="true">📅</span> {date}
                    </span>
                </div>
            </div>
        </div>
    );
}

export { tipoLabels, statusLabels };
