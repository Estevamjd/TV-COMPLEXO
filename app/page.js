import Link from 'next/link';
import db from '@/lib/db';
import { COLUNAS_NOTICIAS, COLUNAS_VIDEOS } from '@/lib/colunas-publicas';
import { DIAS, programasDoDia } from '@/lib/grade';
import { toEmbedUrl } from '@/lib/video-utils';
import CanalTopo from '@/components/home-urbano/CanalTopo';
import Fileira from '@/components/home-urbano/Fileira';
import GradeSemana from '@/components/home-urbano/GradeSemana';
import InstalarApp from '@/components/home-urbano/InstalarApp';
import ReelsInstagram from '@/components/ReelsInstagram';
import { REELS_DESTAQUE } from '@/lib/instagramReels';
import s from '@/components/home-urbano/urbano.module.css';
import { metadataDaPagina } from '@/lib/site';
import { jsonLdOrganizacao, serializarJsonLd } from '@/lib/json-ld';

export const dynamic = 'force-dynamic';

export const metadata = metadataDaPagina({
    titulo: 'TV Complexo — A Real da Favela | Canal 24h do Complexo do Alemão',
    descricao: 'TV comunitária do Complexo do Alemão (RJ): canal 24h, vídeos, notícias e denúncias feitas por quem vive nas favelas do Rio de Janeiro.',
    caminho: '/',
});

const MOLDURAS = ['var(--pink)', 'var(--blue)', 'var(--yellow)', 'var(--green)'];
const GIROS = [-2, 1.5, -1, 2, -1.5];
const FITAS = [1, -6, -1, -7, 0];

/** Só leitura. Sem DATABASE_URL (build, prévia sem banco) ou com erro, a seção some. */
async function lerDoBanco(sql) {
    if (!process.env.DATABASE_URL) return [];
    try {
        return (await db.query(sql)).rows;
    } catch {
        return [];
    }
}

/** Hora do pedido (página dinâmica): ponto de partida do relógio do canal 24h. */
function relogio() {
    return Date.now();
}

function thumbDoVideo(v) {
    if (v.thumbnail && /^https:\/\//.test(v.thumbnail)) return v.thumbnail;
    if (v.external_id && /^[A-Za-z0-9_-]{11}$/.test(v.external_id)) return `https://i.ytimg.com/vi/${v.external_id}/hqdefault.jpg`;
    return null;
}

/** ID do YouTube do vídeo cadastrado (external_id ou URL), para tocar no topo; null se não for do YouTube. */
function idYoutube(v) {
    if (v.external_id && /^[A-Za-z0-9_-]{11}$/.test(v.external_id) && v.plataforma === 'youtube') return v.external_id;
    const m = toEmbedUrl(v.url_video ?? '')?.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

export default async function HomePage({ searchParams }) {
    const params = await searchParams;
    const demoLive = params?.demo === 'live';
    const agora = relogio();

    const [videosDb, noticias] = await Promise.all([
        lerDoBanco(`SELECT ${COLUNAS_VIDEOS} FROM videos ORDER BY created_at DESC LIMIT 8`),
        lerDoBanco(`SELECT ${COLUNAS_NOTICIAS} FROM noticias WHERE publicada = 1 ORDER BY created_at DESC LIMIT 3`),
    ]);

    // Mesma fonte de /videos (tabela videos). Sem vídeo (ou sem banco), a seção some:
    // nada de vídeo de exemplo na Início.
    const videos = videosDb.map(v => ({ chave: v.id, titulo: v.titulo, href: `/videos/${v.id}`, thumb: thumbDoVideo(v) }));
    // Vídeo mais recente do YouTube: entra no topo enquanto a playlist do canal 24h não tem vídeo real.
    const recente = videosDb.map(v => ({ v, id: idYoutube(v) })).find(x => x.id);
    const destaque = recente ? { youtubeId: recente.id, titulo: recente.v.titulo } : null;
    // Grade sem nenhum programa cadastrado: a seção some (nada de "em breve" em todos os dias).
    const temGrade = DIAS.some(d => programasDoDia(d.chave).length > 0);

    return (
        <div className={s.root}>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializarJsonLd(jsonLdOrganizacao()) }} />
            <a href="#conteudo" className={s.pular}>Pular para o conteúdo</a>

            <CanalTopo agoraInicial={agora} demoLive={demoLive} destaque={destaque} temGrade={temGrade} />

            <div id="conteudo">
                {/* REELS DO INSTAGRAM (lista fixa em lib/instagramReels.js; não depende do banco) */}
                <div className={s.wrap}>
                    <ReelsInstagram limite={REELS_DESTAQUE} verTudo />
                </div>

                {/* ÚLTIMOS VÍDEOS */}
                {videos.length > 0 && (
                    <section className={s.secao} aria-labelledby="videos-titulo">
                        <div className={s.wrap}>
                            <div className={s.secaoTopo}>
                                <h2 id="videos-titulo" className={s.display}>Últimos<br />vídeos</h2>
                                <Link href="/videos" className={s.verTudo}>ver tudo →</Link>
                            </div>
                            <Fileira rotulo="Últimos vídeos">
                                {videos.map((v, i) => {
                                    return (
                                        <li key={v.chave} className={s.videoItem}>
                                            <Link href={v.href} className={s.videoCard}>
                                                <span className={s.poster} style={{ '--moldura': MOLDURAS[i % 4], '--giro': `${GIROS[i % 5]}deg` }}>
                                                    <span className={s.duo} style={{ '--duo': MOLDURAS[i % 4] }}>
                                                        {v.thumb ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={v.thumb} alt="" loading="lazy" decoding="async" />
                                                        ) : (
                                                            <span className={`${s.ph} ${s.phFill}`} />
                                                        )}
                                                    </span>
                                                    <span className={s.tape} style={{ left: '50%', top: -12, transform: `translateX(-50%) rotate(${FITAS[i % 5]}deg)` }} aria-hidden="true" />
                                                </span>
                                                <span className={s.videoTitulo}>{v.titulo}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </Fileira>
                        </div>
                    </section>
                )}

                {/* NOTÍCIAS DA QUEBRADA (some sem notícia publicada) */}
                {noticias.length > 0 && (
                    <section className={s.noticias} aria-labelledby="noticias-titulo">
                        <div className={s.wrap}>
                            <div className={s.secaoTopo}>
                                <h2 id="noticias-titulo" className={s.display}>Notícias<br />da quebrada</h2>
                                <Link href="/noticias" className={s.verTudo}>ver todas →</Link>
                            </div>
                            <ol className={s.noticiasLista}>
                                {noticias.map((n, i) => (
                                    <li key={n.id}>
                                        <Link href={`/noticias/${n.id}`} className={s.noticiaLink}>
                                            <span className={s.noticiaNum} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                                            <span className={s.noticiaTitulo}>{n.titulo}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </section>
                )}

                {/* GRADE DA SEMANA (arquivo lib/grade.json; some enquanto não houver programa) */}
                {temGrade && (
                    <section id="grade" className={s.secao} aria-labelledby="grade-titulo">
                        <div className={s.wrap}>
                            <h2 id="grade-titulo" className={s.display}>Grade</h2>
                            <GradeSemana agoraInicial={agora} />
                        </div>
                    </section>
                )}

                {/* CHAMADAS: DENÚNCIA + APP */}
                <section className={s.secao} aria-label="Participe">
                    <div className={`${s.wrap} ${s.chamadas}`}>
                        <div className={s.denuncia}>
                            <h2 className={s.display}>Viu um problema?<br />Denuncia.</h2>
                            <p>Marca no mapa do bairro. Por padrão sai anônimo, e tudo passa por revisão antes de ir ao ar.</p>
                            <div className={s.botoes}>
                                <Link href="/denuncias" className={`${s.btn} ${s.btnAmarelo}`}>Abrir o mapa</Link>
                                <Link href="/denuncias/enviar" className={s.btnOutline}>Enviar denúncia</Link>
                            </div>
                        </div>
                        <div id="instalar" className={s.app}>
                            <h2 className={s.display}>Bota a TV<br />no celular</h2>
                            <p>iPhone: Safari → Compartilhar → “Adicionar à Tela de Início” (iOS 16.4+).</p>
                            <div className={s.botoes}><InstalarApp /></div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
