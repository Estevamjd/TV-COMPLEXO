'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { posicaoCanal, podeEmbutir, horaBrasilia } from '@/lib/canal24h';
import { VIDEO_RESERVA } from '@/lib/video-reserva';
import BarraNavegacao from '@/components/BarraNavegacao';
import s from './urbano.module.css';

const CANAL_URL = 'https://www.youtube.com/@tvcomplexofc';
const CHECAR_LIVE_MS = 120_000;
const DESVIO_MAX_SEG = 4;
const CONFERIR_DESVIO_MS = 5000;
const TENTATIVAS_API = 3;
const PRONTO_API_MS = 10_000;
const IDA_VOLTA_MAX_MS = 5000;
const ORIGEM_PLAYER = 'https://www.youtube-nocookie.com';
// o player só aceita comandos depois de pronto: reenvia algumas vezes após o load do iframe
const REENVIO_COMANDO_MS = [0, 600, 1500, 3000];

/**
 * URL do embed. Sempre começa sozinho e sem som (autoplay=1&mute=1: único jeito que os
 * navegadores deixam tocar sem clique) e com enablejsapi=1 para o botão de som mandar
 * mute/unMute por postMessage sem recarregar. Vídeo único fora do relógio repete em loop
 * (loop=1 exige playlist=<mesmo id>). Canal 24h e live não usam loop: o relógio e a
 * própria transmissão decidem o que vem depois.
 */
export function urlEmbed({ id, start = 0, live = false, avulso = false }, origem) {
    const q = new URLSearchParams({ autoplay: '1', mute: '1', playsinline: '1', rel: '0', enablejsapi: '1' });
    if (origem) q.set('origin', origem);
    if (start) q.set('start', String(start));
    if (avulso && !live) {
        q.set('loop', '1');
        q.set('playlist', id);
    }
    return `${ORIGEM_PLAYER}/embed/${id}?${q}`;
}

/** Comando da IFrame API do YouTube por postMessage (mesmo formato que a API usa). */
function comandoPlayer(iframe, func) {
    iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), ORIGEM_PLAYER);
}

// IFrame API oficial do YouTube: o script só entra na página quando o canal 24h está tocando
// (sincronia com o relógio). O botão de som não depende dele: usa postMessage direto.
// Se o script falhar ou o onYouTubeIframeAPIReady não vier em 10 s, a promessa rejeita
// e a próxima chamada tenta de novo.
let apiYT = null;
function carregarApiYT() {
    if (apiYT) return apiYT;
    apiYT = new Promise((resolve, reject) => {
        if (window.YT?.Player) { resolve(window.YT); return; }
        const tag = document.createElement('script');
        let prazo;
        function falhar(msg) {
            clearTimeout(prazo);
            apiYT = null;
            tag.remove();
            reject(new Error(msg));
        }
        const anterior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { clearTimeout(prazo); anterior?.(); resolve(window.YT); };
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        tag.onerror = () => falhar('IFrame API do YouTube não carregou');
        prazo = setTimeout(() => falhar('IFrame API do YouTube não ficou pronta a tempo'), PRONTO_API_MS);
        document.head.appendChild(tag);
    });
    return apiYT;
}

/**
 * Relógio do canal ancorado na hora do servidor e avançado com performance.now(),
 * que é monotônico: relógio errado no aparelho não adianta nem atrasa o canal.
 * Começa em agoraInicial (render) e é reancorado por ajustar() com uma amostra
 * fresca de /api/hora, para o tempo de banco/hidratação não virar desvio fixo.
 */
function criarRelogio(servidorMs) {
    let ancora = servidorMs;
    let base = performance.now();
    const agora = () => ancora + (performance.now() - base);
    agora.ajustar = (ms, emPerf) => { ancora = ms; base = emPerf; };
    return agora;
}

/** Amostra a hora do servidor compensando metade da ida e volta; null se falhar. */
async function amostrarHoraServidor() {
    try {
        const t0 = performance.now();
        const r = await fetch('/api/hora', { cache: 'no-store' });
        const t1 = performance.now();
        if (!r.ok) return null;
        const { agora } = await r.json();
        if (!Number.isFinite(agora) || t1 - t0 > IDA_VOLTA_MAX_MS) return null; // amostra ruim
        return { ms: agora + (t1 - t0) / 2, emPerf: t1 };
    } catch {
        return null;
    }
}

/** Posição atual do canal 24h como alvo do player (null se não dá para embutir). */
function alvo24h(agoraMs) {
    const p = posicaoCanal(agoraMs);
    return p && podeEmbutir(p.atual) ? { id: p.atual.youtubeId, start: p.offsetSeg } : null;
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
 * Topo da home: canal 24h (playlist própria sincronizada pelo relógio) e,
 * quando a rota /api/live detecta live, troca sozinho para AO VIVO.
 * Enquanto a playlist do canal 24h não tem vídeo real, o topo mostra o vídeo mais recente
 * cadastrado (destaque, mesma fonte de /videos) se for do YouTube; senão, o vídeo de reserva
 * (lib/video-reserva.ts), mudo e em loop.
 * temGrade = false esconde o botão "Ver a grade" (a seção some na Início).
 */
export default function CanalTopo({ agoraInicial, demoLive = false, destaque = null, temGrade = true }) {
    const [agoraCanal] = useState(() => criarRelogio(agoraInicial));
    const [agora, setAgora] = useState(agoraInicial);
    const [live, setLive] = useState(
        demoLive ? { demo: true, videoId: null, titulo: 'Live de demonstração (exemplo)', inicio: agoraInicial - 25 * 60_000 } : null,
    );
    const [tocando, setTocando] = useState(null); // { id, start } do player (autoplay mudo depois da hidratação; avulso: vídeo em destaque, fora do relógio)
    const [aviso, setAviso] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [faixaParada, setFaixaParada] = useState(false);
    const [syncFalhou, setSyncFalhou] = useState(null); // id do vídeo em que a IFrame API não carregou
    // vídeo da live em exibição (null = canal 24h): troca de live A para live B também conta
    const liveAtual = useRef(demoLive ? 'demo' : null);
    const iframeRef = useRef(null);
    const [som, setSom] = useState(false); // começa sempre mudo (exigência de autoplay dos navegadores)
    const somRef = useRef(false);

    // relógio: avança o progresso e passa para o próximo vídeo na hora certa
    useEffect(() => {
        const t = setInterval(() => {
            const agoraMs = agoraCanal();
            setAgora(agoraMs);
            setTocando(atual => {
                if (!atual || atual.live || atual.avulso) return atual;
                const p = posicaoCanal(agoraMs);
                return p && p.atual.youtubeId !== atual.id ? alvo24h(agoraMs) : atual;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [agoraCanal]);

    // reancora o relógio com a hora do servidor depois da hidratação e ao voltar para a aba.
    // Se a amostra falhar, segue com o relógio atual (agoraInicial + performance.now()).
    useEffect(() => {
        let ativo = true;
        async function reamostrar() {
            if (document.visibilityState === 'hidden') return;
            const amostra = await amostrarHoraServidor();
            if (!ativo || !amostra) return;
            agoraCanal.ajustar(amostra.ms, amostra.emPerf);
            setAgora(agoraCanal());
        }
        reamostrar();
        document.addEventListener('visibilitychange', reamostrar);
        return () => { ativo = false; document.removeEventListener('visibilitychange', reamostrar); };
    }, [agoraCanal]);

    // checagem de live (cache de 2 min no servidor). No modo demo não consulta nada.
    useEffect(() => {
        if (demoLive) return;
        let ativo = true;
        async function checar() {
            if (document.visibilityState === 'hidden') return;
            try {
                const r = await fetch('/api/live', { cache: 'no-store' });
                if (!r.ok) return;
                const d = await r.json();
                if (!ativo || (d.live !== true && d.live !== false)) return;
                if (d.live && (typeof d.videoId !== 'string' || !d.videoId || typeof d.titulo !== 'string')) return;
                // d.demo === true: detecção automática desligada no servidor (LIVE_YOUTUBE_AUTO != '1').
                // Não vira texto na tela: o topo segue no canal 24h / vídeo mais recente.
                const novo = d.live && d.demo !== true
                    ? { videoId: d.videoId, titulo: d.titulo, inicio: d.inicio ? Date.parse(d.inicio) : null }
                    : null;
                const chave = novo ? novo.videoId ?? 'live' : null;
                if (liveAtual.current !== chave) {
                    liveAtual.current = chave;
                    // o topo toca sozinho: vai direto para a live ou, quando ela acaba, volta para a
                    // posição atual do canal 24h (sem 24h real, o autoplay abaixo põe o vídeo mais recente)
                    setTocando(t => {
                        if (novo) return novo.videoId ? { live: true, id: novo.videoId, start: 0 } : t;
                        return t?.live ? alvo24h(agoraCanal()) : t;
                    });
                    setAviso(novo ? `Ao vivo agora: ${novo.titulo}` : 'A live acabou. O canal 24h voltou.');
                }
                setLive(novo);
            } catch {
                // sem rede: continua no estado atual
            }
        }
        checar();
        const t = setInterval(checar, CHECAR_LIVE_MS);
        document.addEventListener('visibilitychange', checar);
        return () => { ativo = false; clearInterval(t); document.removeEventListener('visibilitychange', checar); };
    }, [demoLive, agoraCanal]);

    // canal 24h tocando: confere a posição pela IFrame API e corrige desvio
    // (depois de pausa/buffering/seek) e o fim do vídeo/ciclo (inclusive playlist de um vídeo só)
    const tocandoId = tocando && !tocando.live && !tocando.avulso ? tocando.id : null;
    const tocandoStart = tocando?.start;
    useEffect(() => {
        if (!tocandoId) return;
        let ativo = true;
        let espera;
        let conferir;
        let retentar;

        function sincronizar(YT, player, estado) {
            const agoraMs = agoraCanal();
            let p = posicaoCanal(agoraMs);
            if (!p) return;
            if (estado === YT.PlayerState.ENDED && p.atual.youtubeId === tocandoId && p.fimMs - agoraMs < 3000) {
                p = posicaoCanal(p.fimMs); // acabou um pouco antes do relógio: já é o próximo ciclo
            }
            if (estado !== YT.PlayerState.ENDED && estado !== YT.PlayerState.PLAYING) return;
            if (p.atual.youtubeId !== tocandoId) {
                if (podeEmbutir(p.atual)) setTocando({ id: p.atual.youtubeId, start: p.offsetSeg });
                return;
            }
            const esperado = Math.max(0, (agoraMs - p.inicioMs) / 1000);
            if (estado === YT.PlayerState.ENDED && esperado >= player.getDuration() - 1) {
                // vídeo real mais curto que a duração cadastrada: espera o relógio virar
                clearTimeout(espera);
                espera = setTimeout(() => { if (ativo) setTocando(alvo24h(agoraCanal())); }, p.fimMs - agoraMs + 500);
                return;
            }
            if (estado === YT.PlayerState.ENDED || Math.abs(player.getCurrentTime() - esperado) > DESVIO_MAX_SEG) {
                player.seekTo(esperado, true);
                player.playVideo();
            }
        }

        function iniciar(tentativa) {
            carregarApiYT().then(YT => {
                if (!ativo || !YT?.Player || !iframeRef.current) return;
                const player = new YT.Player(iframeRef.current, {
                    events: {
                        onReady() {
                            if (!ativo) return;
                            // checagem periódica: pega desvio que não gera troca de estado
                            conferir = setInterval(() => {
                                if (ativo && player.getPlayerState() === YT.PlayerState.PLAYING) {
                                    sincronizar(YT, player, YT.PlayerState.PLAYING);
                                }
                            }, CONFERIR_DESVIO_MS);
                        },
                        onStateChange(e) {
                            if (ativo) sincronizar(YT, player, e.data);
                        },
                    },
                });
            }).catch(() => {
                if (!ativo) return;
                if (tentativa < TENTATIVAS_API) retentar = setTimeout(() => iniciar(tentativa + 1), 3000 * tentativa);
                else setSyncFalhou(tocandoId);
            });
        }
        iniciar(1);

        return () => { ativo = false; clearTimeout(espera); clearTimeout(retentar); clearInterval(conferir); };
    }, [tocandoId, tocandoStart, agoraCanal]);

    // autoplay ao abrir o site (depois da hidratação: o HTML do servidor continua sendo o pôster).
    // Ordem: live > canal 24h (quando a playlist tem vídeo real) > vídeo mais recente do canal.
    // Sem destaque do YouTube, o vídeo avulso é a reserva fixa (lib/video-reserva.ts).
    const videoAvulso = destaque ?? VIDEO_RESERVA;
    const autoId = live?.videoId ?? (podeEmbutir(posicaoCanal(agora)?.atual) ? '24h' : live ? null : videoAvulso.youtubeId);
    useEffect(() => {
        if (!autoId) return;
        setTocando(t => {
            if (t) return t;
            if (live?.videoId) return { live: true, id: live.videoId, start: 0 };
            const alvo = alvo24h(agoraCanal());
            if (alvo) return alvo;
            return { avulso: true, id: videoAvulso.youtubeId, start: 0 };
        });
        // live/destaque entram via autoId
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoId, agoraCanal]);

    const estado = live ? 'live' : '24h';
    const pos = posicaoCanal(agora);
    const atual = pos?.atual ?? null;
    const embutivel24h = podeEmbutir(atual);
    // playlist do canal 24h ainda sem vídeo real (lib/canal24h.json): o topo usa o destaque
    // (vídeo mais recente do YouTube no banco) ou, sem ele, a reserva fixa
    const semCanal = !embutivel24h;
    const avulso = !live && semCanal ? videoAvulso : null;
    const progresso = pos ? Math.min(100, ((agora - pos.inicioMs) / (pos.fimMs - pos.inicioMs)) * 100) : 0;

    function assistir() {
        if (live?.videoId) setTocando({ live: true, id: live.videoId, start: 0 });
        else if (!live && embutivel24h) {
            carregarApiYT();
            setTocando({ id: atual.youtubeId, start: pos.offsetSeg });
        } else if (avulso) setTocando({ avulso: true, id: avulso.youtubeId, start: 0 });
    }

    async function compartilhar() {
        const url = window.location.origin + '/';
        const dados = { title: 'TV Complexo ao vivo', text: live?.titulo ?? 'TV Complexo', url };
        try {
            if (navigator.share) { await navigator.share(dados); return; }
            await navigator.clipboard.writeText(url);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
        } catch {
            // a pessoa cancelou o compartilhamento
        }
    }

    const podeTocarAqui = live ? !!live.videoId : embutivel24h || !!avulso;
    const linkExterno = live ? `${CANAL_URL}/live` : CANAL_URL;
    const tituloAtual = live ? live.titulo
        : avulso ? avulso.titulo
        : semCanal ? 'Canal da TV Complexo'
        : atual?.titulo ?? 'Canal 24h da TV Complexo';
    const rotuloPlay = live ? 'Assistir ao vivo' : avulso || !semCanal ? 'Assistir agora' : 'Assistir no YouTube';
    const posterId = live ? live.videoId : avulso ? avulso.youtubeId : atual?.youtubeId;

    const iframeSrc = tocando ? urlEmbed(tocando, typeof window === 'undefined' ? null : window.location.origin) : null;

    function alternarSom() {
        const ligar = !som;
        somRef.current = ligar;
        setSom(ligar);
        comandoPlayer(iframeRef.current, ligar ? 'unMute' : 'mute');
        setAviso(ligar ? 'Som ligado.' : 'Som desligado.');
    }

    // iframe novo (vídeo seguinte do canal 24h, live) nasce mudo pela URL: se a pessoa já
    // ligou o som, religa por postMessage assim que o player estiver pronto para ouvir
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
                                        <iframe
                                            key={iframeSrc}
                                            ref={iframeRef}
                                            src={iframeSrc}
                                            title={`Player do YouTube: ${tituloAtual}`}
                                            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                                            allowFullScreen
                                            onLoad={aoCarregarPlayer}
                                        />
                                    ) : podeTocarAqui ? (
                                        <button type="button" className={s.posterBtn} onClick={assistir} aria-label={`${rotuloPlay}: ${tituloAtual}`}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`https://i.ytimg.com/vi/${posterId}/hqdefault.jpg`} alt="" />
                                            <span className={s.playDiamante} aria-hidden="true"><IconePlay /></span>
                                        </button>
                                    ) : (
                                        <a href={linkExterno} target="_blank" rel="noopener noreferrer" className={`${s.posterBtn} ${s.posterLogo}`}
                                            aria-label={`${live ? 'Assistir ao vivo' : 'Assistir'} no YouTube do @tvcomplexofc (abre em nova aba)`}>
                                            <Image src="/logo-header-cropped.png" alt="" width={292} height={59} />
                                            <span className={s.playDiamante} aria-hidden="true"><IconePlay /></span>
                                        </a>
                                    )}
                                    {!live && !semCanal && !iframeSrc && (
                                        <span className={s.progresso} style={{ width: `${progresso}%` }} aria-hidden="true" />
                                    )}
                                </div>
                                <span className={s.tape} style={{ left: -14, top: -8, transform: 'rotate(-28deg)' }} aria-hidden="true" />
                                <span className={s.tape} style={{ right: -14, top: -8, transform: 'rotate(24deg)' }} aria-hidden="true" />
                            </div>
                            <div className={s.stamp} aria-hidden="true">
                                {live
                                    ? <span>No ar<br /><small>ao vivo</small></span>
                                    : <span>Canal<br />24h<br /><small>sem parar</small></span>}
                            </div>
                        </div>

                        <div className={s.heroInfo}>
                            <p className={s.kicker}>
                                {live ? (
                                    <><span className={s.badgeLive}>AO VIVO</span>{live.inicio ? ` desde ${horaBrasilia(live.inicio)}` : ' agora'}</>
                                ) : avulso ? (avulso.reserva ? 'Canal 24h' : 'Vídeo mais recente')
                                : pos && !semCanal ? (
                                    <>Canal 24h · agora {horaBrasilia(pos.inicioMs)}–{horaBrasilia(pos.fimMs)}</>
                                ) : 'Canal 24h'}
                            </p>
                            <h2 className={s.heroTitulo}>{tituloAtual}</h2>
                            <p className={s.heroSub}>
                                {live
                                    ? 'O canal 24h saiu do ar sozinho e volta quando a live acabar.'
                                    : semCanal ? 'Do canal @tvcomplexofc no YouTube.'
                                    : pos ? `A seguir: ${pos.proximo.titulo}` : 'Vídeos do @tvcomplexofc sem parar.'}
                            </p>
                            <div className={s.botoes}>
                                {iframeSrc ? (
                                    <button type="button" className={`${s.btn} ${s.btnSom}`} onClick={alternarSom} aria-pressed={som}>
                                        <IconeSom ligado={som} /> {som ? 'Desligar o som' : 'Ligar o som'}
                                    </button>
                                ) : podeTocarAqui ? (
                                    <button type="button" className={s.btn} onClick={assistir}><IconePlay /> {rotuloPlay}</button>
                                ) : (
                                    <a className={s.btn} href={linkExterno} target="_blank" rel="noopener noreferrer">
                                        <IconePlay /> {rotuloPlay}<span className={s.srOnly}> (abre o YouTube em nova aba)</span>
                                    </a>
                                )}
                                {live ? (
                                    <button type="button" className={s.btnOutline} onClick={compartilhar}>
                                        {copiado ? 'Link copiado' : 'Compartilhar'}
                                    </button>
                                ) : temGrade ? (
                                    <a className={s.btnOutline} href="#grade">Ver a grade</a>
                                ) : (
                                    <Link className={s.btnOutline} href="/videos">Todos os vídeos</Link>
                                )}
                            </div>
                            {live?.demo && <p className={s.demoNota}>Modo demonstração (?demo=live): só visual, sem live de verdade.</p>}
                            {syncFalhou && syncFalhou === tocandoId && (
                                <p className={s.demoNota} role="status">
                                    Não deu para sincronizar o player com o relógio do canal. O vídeo toca, mas pode ficar fora de hora.
                                </p>
                            )}
                        </div>
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
                                : 'CANAL 24H ● O FATO, VISTO DE PERTO ● CANAL 24H ● O FATO, VISTO DE PERTO ● CANAL 24H ● O FATO, VISTO DE PERTO ● '}
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
