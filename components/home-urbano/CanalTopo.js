'use client';
import { useRef, useState } from 'react';
import BarraNavegacao from '@/components/BarraNavegacao';
import s from './urbano.module.css';

const ORIGEM_PLAYER = 'https://www.youtube-nocookie.com';
// o player só aceita comandos depois de pronto: reenvia algumas vezes após o load do iframe
const REENVIO_COMANDO_MS = [0, 600, 1500, 3000];

/**
 * URL do embed da live. Começa sozinho e sem som (autoplay=1&mute=1: único jeito que os
 * navegadores deixam tocar sem clique) e com enablejsapi=1 para o botão de som mandar
 * mute/unMute por postMessage sem recarregar. Sem origin: a URL é a mesma no servidor e
 * no navegador, então o iframe já vem no HTML e começa a tocar antes da hidratação.
 */
export function urlEmbed(id) {
    const q = new URLSearchParams({ autoplay: '1', mute: '1', playsinline: '1', rel: '0', enablejsapi: '1' });
    return `${ORIGEM_PLAYER}/embed/${id}?${q}`;
}

/** Link da live no YouTube (o vídeo exato que está tocando aqui). */
export function urlYoutube(id) {
    return `https://www.youtube.com/watch?v=${id}`;
}

/** Comando da IFrame API do YouTube por postMessage (mesmo formato que a API usa). */
function comandoPlayer(iframe, func) {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), ORIGEM_PLAYER);
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
 * - sem live (live = null): só a barra de navegação e a faixa. Nenhum player, nenhum
 *   pedido extra no navegador.
 * - com live: player no ar em autoplay mudo, selo AO VIVO, botão grande "Ligar o som"
 *   e "Assistir no YouTube" logo abaixo do player.
 */
export default function CanalTopo({ live = null }) {
    const [aviso, setAviso] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [faixaParada, setFaixaParada] = useState(false);
    const [som, setSom] = useState(false); // começa sempre mudo (exigência de autoplay dos navegadores)
    const somRef = useRef(false);
    const iframeRef = useRef(null);
    const estado = live ? 'live' : 'normal';

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
                iframe.contentWindow?.postMessage(JSON.stringify({ event: 'listening' }), ORIGEM_PLAYER);
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

    return (
        <>
            <section id="topo" className={s.topo} data-state={estado} aria-labelledby="topo-titulo">
                <div className={s.wrap}>
                    <header>
                        <BarraNavegacao />
                    </header>

                    {live ? (
                        <div className={s.heroGrid}>
                            <h1 id="topo-titulo" className={s.grito}>Tá<br />no ar!</h1>

                            <div className={s.playerArea}>
                                <div className={s.playerMoldura}>
                                    <div className={s.playerTela}>
                                        <iframe
                                            ref={iframeRef}
                                            src={urlEmbed(live.videoId)}
                                            title={`Player do YouTube, ao vivo: ${live.titulo}`}
                                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                            allowFullScreen
                                            onLoad={aoCarregarPlayer}
                                        />
                                    </div>
                                    <span className={s.tape} style={{ left: -14, top: -8, transform: 'rotate(-28deg)' }} aria-hidden="true" />
                                    <span className={s.tape} style={{ right: -14, top: -8, transform: 'rotate(24deg)' }} aria-hidden="true" />
                                </div>
                                <div className={s.stamp} aria-hidden="true"><span>No ar<br /><small>ao vivo</small></span></div>
                            </div>

                            <div className={`${s.botoes} ${s.acoesLive}`}>
                                <button type="button" className={`${s.btn} ${s.btnSom} ${s.btnGrande}`} onClick={alternarSom} aria-pressed={som}>
                                    <IconeSom ligado={som} /> {som ? 'Desligar o som' : 'Ligar o som'}
                                </button>
                                <a className={s.btnOutline} href={urlYoutube(live.videoId)} target="_blank" rel="noopener noreferrer">
                                    <IconePlay /> Assistir no YouTube<span className={s.srOnly}> (abre em nova aba)</span>
                                </a>
                            </div>

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
                        </div>
                    ) : (
                        <h1 id="topo-titulo" className={s.srOnly}>TV Complexo das Favelas: a real da favela</h1>
                    )}
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
