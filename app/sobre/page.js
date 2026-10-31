import Link from 'next/link';
import { metadataDaPagina } from '@/lib/site';

export const metadata = metadataDaPagina({
    titulo: 'Sobre a TV Complexo | Mídia comunitária do Rio',
    descricao: 'Conheça a missão, os valores e a história da TV Complexo, plataforma de comunicação comunitária feita por moradores das favelas do Rio.',
    caminho: '/sobre',
});

const VALORES = [
    { titulo: 'Dar voz', texto: 'Amplificar as vozes dos moradores das comunidades que sempre foram silenciados.' },
    { titulo: 'Transparência', texto: 'Mostrar a realidade sem filtros e sem manipulação. A verdade das favelas contada por quem vive nelas.' },
    { titulo: 'Luta', texto: 'Usar a informação como ferramenta de transformação social e pressão por melhorias.' },
    { titulo: 'Comunidade', texto: 'Construir pontes entre moradores, coletivos e organizações para fortalecer a comunidade.' },
    { titulo: 'Cultura', texto: 'Celebrar e preservar a riqueza cultural das favelas do Rio de Janeiro.' },
    { titulo: 'Independência', texto: 'Mídia independente, feita pela comunidade, para a comunidade.' },
];

const FAZEMOS = [
    { titulo: 'Vídeos', texto: 'Publicamos vídeos das redes sociais e produzimos conteúdo mostrando a realidade das comunidades.', href: '/videos' },
    { titulo: 'Notícias', texto: 'Cobrimos eventos, problemas e conquistas das comunidades que a grande mídia ignora.', href: '/noticias' },
    { titulo: 'Denúncias', texto: 'Recebemos e publicamos denúncias de moradores sobre problemas nas comunidades.', href: '/denuncias/enviar' },
    { titulo: 'Mapa de problemas', texto: 'Mapeamos os problemas das comunidades para facilitar a cobrança de soluções.', href: '/denuncias' },
];

const COMUNIDADES = ['Complexo do Alemão', 'Rocinha', 'Cidade de Deus', 'Maré', 'Vidigal', 'Jacarezinho', 'Manguinhos', 'Penha'];

export default function SobrePage() {
    return (
        <div>
            <div className="page-header">
                <h1>Sobre a TV Complexo</h1>
                <p>Conheça a missão, os valores e a história da nossa plataforma comunitária.</p>
            </div>

            <div className="container">
                <div className="about-content">
                    <div className="mission-card">
                        <h2 className="section-title">Nossa missão</h2>
                        <p style={{ fontSize: '1.15rem', lineHeight: 1.7, margin: 0 }}>
                            A TV Complexo é uma plataforma digital comunitária onde moradores podem mostrar
                            a realidade das favelas, denunciar problemas e compartilhar histórias que raramente
                            aparecem na mídia tradicional. Nosso objetivo é <strong>fortalecer a comunicação
                                comunitária</strong> e ajudar a pressionar autoridades a resolver problemas locais.
                        </p>
                    </div>

                    <section className="about-section" aria-labelledby="valores-titulo">
                        <h2 id="valores-titulo" className="section-title">Nossos valores</h2>
                        <ul className="values-grid" role="list">
                            {VALORES.map(v => (
                                <li key={v.titulo} className="value-item">
                                    <h3>{v.titulo}</h3>
                                    <p>{v.texto}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="about-section" aria-labelledby="fazemos-titulo">
                        <h2 id="fazemos-titulo" className="section-title">O que fazemos</h2>
                        <ul className="lista-faz" role="list">
                            {FAZEMOS.map(item => (
                                <li key={item.titulo}>
                                    <h3><Link href={item.href}>{item.titulo} →</Link></h3>
                                    <p>{item.texto}</p>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="about-section" aria-labelledby="comunidades-titulo">
                        <h2 id="comunidades-titulo" className="section-title">Comunidades atendidas</h2>
                        <ul style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }} role="list">
                            {COMUNIDADES.map(c => (
                                <li key={c} className="badge badge-yellow" style={{ fontSize: '0.95rem', padding: '0.5rem 0.9rem' }}>{c}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="about-section contato-caixa" aria-labelledby="contato-titulo" style={{ marginBottom: '48px' }}>
                        <h2 id="contato-titulo" className="section-title">Fale conosco</h2>
                        <p style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>Quer colaborar, enviar pautas ou tirar dúvidas?</p>
                        <p style={{ fontWeight: 700, margin: 0 }}>
                            <a href="mailto:tvcomplexofc@gmail.com">tvcomplexofc@gmail.com</a>
                        </p>
                        <p style={{ fontWeight: 700, margin: 0 }}>
                            <a href="https://wa.me/5521966030258" target="_blank" rel="noopener noreferrer">WhatsApp (21) 96603-0258</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
