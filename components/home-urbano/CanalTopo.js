'use client';
import { useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import BarraNavegacao from '@/components/BarraNavegacao';
import { VIDEO_RESERVA } from '@/lib/video-reserva';
import s from './urbano.module.css';

const ORIGEM_PLAYER = 'https://www.youtube-nocookie.com';
const ORIGEM_YOUTUBE = 'https://www.youtube.com';
// o player só aceita comandos depois de pronto: reenvia algumas vezes após o load do iframe
const REENVIO_COMANDO_MS = [0, 600, 1500, 3000];

function parametrosEmbed() {
    return new URLSearchParams({ autoplay: '1', mute: '1', playsinline: '1', rel: '0', enablejsapi: '1', fs: '1' });
}

/**
 * URL do embed. Começa sozinho e sem som (autoplay=1&mute=1: único jeito que os
 * navegadores deixam tocar sem clique), com enablejsapi=1 para o botão de som mandar
 * mute/unMute por postMessage sem recarregar e fs=1 para o botão de tela cheia do player.
 * Sem origin: a URL é a mesma no servidor e no navegador. Vídeo fora da live repete em
 * loop (loop=1 exige playlist=<mesmo id>); a live não usa loop.
 */
export function urlEmbed(id, { loop = false } = {}) {
    const q = parametrosEmbed();
    if (loop) {
        q.set('loop', '1');
        q.set('playlist', id);
    }
    return `${ORIGEM_PLAYER}/embed/${id}?${q}`;
}

/**
 * Embed da live: sempre o vídeo detectado, https://www.youtube.com/embed/<videoId>, venha a live
 * da API, da página /live ou da simulação. Mesmos parâmetros do vídeo avulso (autoplay mudo,
 * jsapi para o botão de som, fs=1), sem loop. Nunca embed/live_stream?channel=: o player e o
 * "Assistir agora" mostram o mesmo vídeo.
 */
export function urlEmbedDaLive(live) {
    return `${ORIGEM_YOUTUBE}/embed/${live.videoId}?${parametrosEmbed()}`;
}

/** Link no YouTube do vídeo exato que está tocando aqui (live ou vídeo em destaque). */
export function urlYoutube(id) {
    return `https://www.youtube.com/watch?v=${id}`;
}

/** Comando da IFrame API do YouTube por postMessage (mesmo formato que a API usa), na origem do iframe. */
function comandoPlayer(iframe, func) {
    if (!iframe?.src) return;
    iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), new URL(iframe.src).origin);
}

// false no HTML do servidor, true depois da hidratação (sem setState em efeito)
const semInscricao = () => () => {};
function useHidratado() {
    return useSyncExternalStore(semInscricao, () => true, () => false);
}

/** "18:40" no horário de Brasília. */
function horaBrasilia(iso) {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
        .format(new Date(iso));
}

function IconePlay() {
    return <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>;
}

function IconeSom({ ligado }) {
    return (
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
            {ligado ? <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /> : <path d="M16 9l6 6M22 9l-6 6" />}
        </svg>
    );
}

/**
 * Topo da home. A live vem pronta do servidor (lib/live.ts, cache de 60 s):
 * - sem live (live = null, inclusive sem chave ou com falha da API): "Liga a TV!" com o
 *   vídeo mais recente do canal (destaque) ou, sem ele, o vídeo de reserva. O HTML do
 *   servidor traz o pôster; depois da hidratação o player toca sozinho, mudo e em loop.
 * - com live: "Tá no ar!", player da live já no HTML do servidor em autoplay mudo e selo AO VIVO.
 *   O player da live é https://www.youtube.com/embed/<videoId> do vídeo detectado.
 * Nos dois: botão de som (só ícone) sobre o vídeo, "Assistir agora" abre o vídeo exato no
 * YouTube em nova aba, e o player tem tela cheia.
 */
export default function CanalTopo({ live = null, destaque = null }) {
    const [aviso, setAviso] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [faixaParada, setFaixaParada] = useState(false);
    const [som, setSom] = useState(false); // começa sempre mudo (exigência de autoplay dos navegadores)
    const somRef = useRef(false);
    const iframeRef = useRef(null);
    const hidratado = useHidratado();
    const estado = live ? 'live' : 'normal';

    const avulso = live ? null : destaque ?? VIDEO_RESERVA;
    const videoId = live ? live.videoId : avulso.youtubeId;
    const titulo = live ? live.titulo : avulso.titulo;
    // live: iframe já no HTML do servidor; vídeo avulso: pôster no servidor, iframe depois da hidratação
    const iframeSrc = live ? urlEmbedDaLive(live) : hidratado ? urlEmbed(videoId, { loop: true }) : null;

    function alternarSom() {
        const ligar = !som;
        somRef.current = ligar;
        setSom(ligar);
        comandoPlayer(iframeRef.current, ligar ? 'unMute' : 'mute');
        setAviso(ligar ? 'Som ligado.' : 'Som desligado.');
    }

    // avisa o player que a página quer ouvir e, se a pessoa já ligou o som antes do player
    // ficar pronto, religa assim que ele puder receber o comando
    function aoCarregarPlayer(e) {
        const iframe = e.currentTarget;
        for (const ms of REENVIO_COMANDO_MS) {
            setTimeout(() => {
                if (iframeRef.current !== iframe) return;
                iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), new URL(iframe.src).origin);
                if (somRef.current) comandoPlayer(iframe, 'unMute');
            }, ms);
        }
    }

    async function compartilhar() {
        const url = window.location.origin + '/';
        const dados = { title: 'TV Complexo das Favelas ao vivo', text: live?.titulo ?? 'TV Complexo das Favelas', url };
        try {
            if (navigator.share) { await navigator.share(dados); return; }
            await navigator.clipboard.writeText(url);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
        } catch {
            // a pessoa cancelou o compartilhamento
        }
    }

    const assistirAgora = (
        <a className={`${s.btn}${live ? ` ${s.btnGrande}` : ''}`} href={urlYoutube(videoId)} target="_blank" rel="noopener noreferrer">
            <IconePlay /> Assistir agora<span className={s.srOnly}> (abre o YouTube em nova aba)</span>
        </a>
    );

    return (
        <>
            <section id="topo" className={s.topo} data-state={estado} aria-labelledby="topo-titulo">
                <div className={s.wrap}>
                    <header>
                        <BarraNavegacao />
                    </header>

                    <div className={s.heroGrid}>
                        <h1 id="topo-titulo" className={s.grito}>
                            {live ? <>Tá<br />no ar!</> : <>Liga<br />a TV!</>}
                        </h1>

                        <div className={s.playerArea}>
                            <div className={s.playerMoldura} key={estado}>
                                <div className={s.playerTela}>
                                    {iframeSrc ? (
                                        <>
                                            <iframe
                                                key={iframeSrc}
                                                ref={iframeRef}
                                                src={iframeSrc}
                                                title={`Player do YouTube${live ? ', ao vivo' : ''}: ${titulo}`}
                                                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                                allowFullScreen
                                                onLoad={aoCarregarPlayer}
                                            />
                                            <button type="button" className={s.somPlayer} onClick={alternarSom}
                                                aria-pressed={som} aria-label={som ? 'Desligar o som' : 'Ligar o som'}>
                                                <IconeSom ligado={som} />
                                            </button>
                                        </>
                                    ) : (
                                        // pôster até a hidratação (o player entra sozinho logo depois)
                                        <span className={s.posterBtn} aria-hidden="true">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" />
                                            <span className={s.playDiamante}><IconePlay /></span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={s.stamp} aria-hidden="true">
                                {live
                                    ? <span>No ar<br /><small>ao vivo</small></span>
                                    : <span>Na<br />tela<br /><small>da favela</small></span>}
                            </div>
                        </div>

                        {live ? (
                            <>
                                <div className={`${s.botoes} ${s.acoesLive}`}>{assistirAgora}</div>
                                <div className={s.heroInfo}>
                                    <p className={s.kicker}>
                                        <span className={s.badgeLive}>AO VIVO</span>{live.inicio ? ` desde ${horaBrasilia(live.inicio)}` : ' agora'}
                                    </p>
                                    <h2 className={s.heroTitulo}>{live.titulo}</h2>
                                    <div className={s.botoes}>
                                        <button type="button" className={s.btnOutline} onClick={compartilhar}>
                                            {copiado ? 'Link copiado' : 'Compartilhar'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={s.heroInfo}>
                                <p className={s.kicker}>{avulso.reserva ? 'Vídeo em destaque' : 'Vídeo mais recente'}</p>
                                <h2 className={s.heroTitulo}>{avulso.titulo}</h2>
                                <p className={s.heroSub}>Do canal @tvcomplexofc no YouTube.</p>
                                <div className={s.botoes}>
                                    {assistirAgora}
                                    <Link className={s.btnOutline} href="/videos">Todos os vídeos</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <p className={s.srOnly} aria-live="polite">{aviso}</p>
            </section>
            <div className={s.ticker} data-state={estado} data-parada={faixaParada || undefined} aria-hidden="true">
                <div className={s.tickerTrack}>
                    {[0, 1].map(i => (
                        <span key={i}>
                            {live
                                ? 'NO AR AGORA ● AO VIVO DA QUEBRADA ● NO AR AGORA ● AO VIVO DA QUEBRADA ● NO AR AGORA ● AO VIVO DA QUEBRADA ● '
                                : 'O FATO, VISTO DE PERTO ● A REAL DA FAVELA ● O FATO, VISTO DE PERTO ● A REAL DA FAVELA ● O FATO, VISTO DE PERTO ● A REAL DA FAVELA ● '}
                        </span>
                    ))}
                </div>
            </div>
            <div className={`${s.wrap} ${s.tickerControle}`}>
                <button type="button" className={s.btnOutline} onClick={() => setFaixaParada(v => !v)}>
                    {faixaParada ? 'Retomar a faixa animada' : 'Pausar a faixa animada'}
                </button>
            </div>
        </>
    );
}
