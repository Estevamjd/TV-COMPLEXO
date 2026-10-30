import { listarDenunciasPublicas } from '@/lib/denuncias';
import ReportCard from '@/components/ReportCard';
import MapWrapper from './MapWrapper';
import Link from 'next/link';
import { metadataDaPagina } from '@/lib/site';

export const metadata = metadataDaPagina({
    titulo: 'Denúncias da comunidade e mapa de problemas | TV Complexo',
    descricao: 'Mapa e lista de problemas denunciados por moradores das favelas do Rio: falta de luz, lixo, saneamento, risco de deslizamento e mais.',
    caminho: '/denuncias',
});

export const dynamic = 'force-dynamic';

const LEGENDA = [
    { label: 'Falta de luz', color: '#f4a261' },
    { label: 'Lixo acumulado', color: '#e76f51' },
    { label: 'Risco de deslizamento', color: '#e63946' },
    { label: 'Saneamento', color: '#2a9d8f' },
    { label: 'Fios energizados', color: '#f9c74f' },
    { label: 'Poste caído', color: '#999999' },
    { label: 'Violência', color: '#c1121f' },
    { label: 'Outros', color: '#666666' },
];

export default async function DenunciasPage() {
    // Sem banco configurado (prévia/build local): mapa e lista vazios, sem tela de erro.
    const denuncias = process.env.DATABASE_URL ? await listarDenunciasPublicas() : [];

    return (
        <div>
            <div className="page-header">
                <h1>Mapa de denúncias</h1>
                <p>Problemas reportados pela comunidade, revisados antes de ir ao ar. Veja no mapa e ajude a cobrar solução.</p>
                <div className="flex-between" style={{ justifyContent: 'flex-start', marginTop: '20px' }}>
                    <Link href="/denuncias/enviar" className="btn btn-primary">Enviar denúncia</Link>
                </div>
            </div>

            <div className="container">
                <section aria-labelledby="mapa-titulo" style={{ marginBottom: '48px' }}>
                    <h2 id="mapa-titulo" className="section-title">Mapa de problemas</h2>
                    <MapWrapper denuncias={denuncias} />
                    <div role="list" aria-label="Legenda do mapa" className="legenda-mapa">
                        {LEGENDA.map(item => (
                            <div role="listitem" key={item.label}>
                                <span aria-hidden="true" style={{ background: item.color }} />
                                {item.label}
                            </div>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="lista-titulo" style={{ marginBottom: '48px' }}>
                    <h2 id="lista-titulo" className="section-title">Denúncias da comunidade</h2>
                    {denuncias.length === 0 ? (
                        <div className="empty-state">
                            <h3>Nenhuma denúncia publicada ainda</h3>
                            <p>Viu um problema no seu bairro? Mande a primeira. Por padrão sai anônimo.</p>
                            <div className="botoes-vazio">
                                <Link href="/denuncias/enviar" className="btn btn-primary">Enviar denúncia</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid-2">
                            {denuncias.map(d => (
                                <ReportCard key={d.id} denuncia={d} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
