'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { posicaoCanal, podeEmbutir, horaBrasilia } from '@/lib/canal24h';
import s from './urbano.module.css';

const CANAL_URL = 'https://www.youtube.com/@tvcomplexofc';
const CHECAR_LIVE_MS = 120_000;
const DESVIO_MAX_SEG = 4;
const CONFERIR_DESVIO_MS = 5000;
const TENTATIVAS_API = 3;
const PRONTO_API_MS = 10_000;
const IDA_VOLTA_MAX_MS = 5000;

// IFrame API oficial do YouTube: o script só entra na página depois do clique em assistir.
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

const NAV = [
    { href: '#topo', label: 'Ao vivo' },
    { href: '/videos', label: 'Vídeos' },
    { href: '/noticias', label: 'Notícias' },
    { href: '#grade', label: 'Grade' },
    { href: '/denuncias', label: 'Denúncias' },
];

function IconePlay() {
    return <svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>;
}
function IconeBaixar() {
    return <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 3v12m-5-5l5 5 5-5M5 21h14" /></svg>;
}

/**
 * Topo da home: canal 24h (playlist própria sincronizada pelo relógio) e,
 * quando a rota /api/live detecta live, troca sozinho para AO VIVO.
 * A tela nunca fica vazia: sem vídeo real configurado, mostra o quadro reservado.
 */
export default function CanalTopo({ agoraInicial, demoLive = false }) {
    const [agoraCanal] = useState(() => criarRelogio(agoraInicial));
    const [agora, setAgora] = useState(agoraInicial);
    const [live, setLive] = useState(
        demoLive ? { demo: true, videoId: null, titulo: 'Live de demonstração (exemplo)', inicio: agoraInicial - 25 * 60_000 } : null,
    );
    const [tocando, setTocando] = useState(null); // { id, start } quando a pessoa aperta play
    const [aviso, setAviso] = useState('');
    const [copiado, setCopiado] = useState(false);
    const [faixaParada, setFaixaParada] = useState(false);
    const [syncFalhou, setSyncFalhou] = useState(null); // id do vídeo em que a IFrame API não carregou
    // vídeo da live em exibição (null = canal 24h): troca de live A para live B também conta
    const liveAtual = useRef(demoLive ? 'demo' : null);
    const iframeRef = useRef(null);

    // relógio: avança o progresso e passa para o próximo vídeo na hora certa
    useEffect(() => {
        const t = setInterval(() => {
            const agoraMs = agoraCanal();
            setAgora(agoraMs);
            setTocando(atual => {
                if (!atual || atual.live) return atual;
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
                const r = await fetch('/api/live');
                if (!r.ok) return;
                const d = await r.json();
                if (!ativo) return;
                const novo = d.live
                    ? { videoId: d.videoId, titulo: d.titulo, inicio: d.inicio ? Date.parse(d.inicio) : null }
                    : null;
                const chave = novo ? novo.videoId ?? 'live' : null;
                if (liveAtual.current !== chave) {
                    liveAtual.current = chave;
                    // quem já estava assistindo continua assistindo: vai direto para a live
                    // ou para a posição atual do canal 24h; quem não apertou play fica no pôster
                    setTocando(t => {
                        if (!t) return null;
                        if (novo) return novo.videoId ? { live: true, id: novo.videoId, start: 0 } : null;
                        return alvo24h(agoraCanal());
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
    const tocandoId = tocando && !tocando.live ? tocando.id : null;
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

    const estado = live ? 'live' : '24h';
    const pos = posicaoCanal(agora);
    const atual = pos?.atual ?? null;
    const embutivel24h = podeEmbutir(atual);
    const progresso = pos ? Math.min(100, ((agora - pos.inicioMs) / (pos.fimMs - pos.inicioMs)) * 100) : 0;

    function assistir() {
        if (live?.videoId) setTocando({ live: true, id: live.videoId, start: 0 });
        else if (!live && embutivel24h) {
            carregarApiYT();
            setTocando({ id: atual.youtubeId, start: pos.offsetSeg });
        }
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

    const podeTocarAqui = live ? !!live.videoId : embutivel24h;
    // playlist ainda com vídeos de exemplo (lib/canal24h.json): deixa claro que é demonstração
    const canalDemo = !live && !!atual && !embutivel24h;
    const linkExterno = live ? `${CANAL_URL}/live` : CANAL_URL;
    const tituloAtual = live ? live.titulo : atual?.titulo ?? 'Canal 24h da TV Complexo';
    const rotuloPlay = live ? 'Assistir ao vivo' : 'Assistir agora';

    let iframeSrc = null;
    if (tocando) {
        const q = new URLSearchParams({ autoplay: '1', playsinline: '1', rel: '0' });
        if (tocando.start) q.set('start', String(tocando.start));
        if (!tocando.live) {
            q.set('enablejsapi', '1');
            q.set('origin', window.location.origin);
        }
        iframeSrc = `https://www.youtube-nocookie.com/embed/${tocando.id}?${q}`;
    }

    return (
        <>
            <section id="topo" className={s.topo} data-state={estado} aria-labelledby="topo-titulo">
                <div className={s.wrap}>
                    <header className={s.barra}>
                        <Link href="/" className={s.logoPlate} aria-label="TV Complexo, início">
                            <Image src="/logo-header-cropped.png" alt="TV Complexo" width={292} height={59} priority />
                        </Link>
                        <nav aria-label="Principal" className={s.nav}>
                            <ul>
                                {NAV.map(item => (
                                    <li key={item.href}><a href={item.href}>{item.label}</a></li>
                                ))}
                            </ul>
                        </nav>
                        <a href="#instalar" className={s.btnOutline}>
                            <IconeBaixar /> <span className={s.soCel}>App</span><span className={s.soDesk}>Instalar app</span>
                        </a>
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
                                        />
                                    ) : podeTocarAqui ? (
                                        <button type="button" className={s.posterBtn} onClick={assistir} aria-label={`${rotuloPlay}: ${tituloAtual}`}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`https://i.ytimg.com/vi/${live ? live.videoId : atual.youtubeId}/hqdefault.jpg`} alt="" />
                                            <span className={s.playDiamante} aria-hidden="true"><IconePlay /></span>
                                        </button>
                                    ) : (
                                        <a href={linkExterno} target="_blank" rel="noopener noreferrer" className={`${s.posterBtn} ${s.ph}`}
                                            aria-label={`${rotuloPlay} no YouTube do @tvcomplexofc (abre em nova aba)`}>
                                            <span className={s.phTag} aria-hidden="true">foto do canal em breve</span>
                                            <span className={s.playDiamante} aria-hidden="true"><IconePlay /></span>
                                        </a>
                                    )}
                                    {!live && !iframeSrc && (
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
                            {canalDemo && <p className={s.demoTag}>Demonstração — vídeos de exemplo</p>}
                            <p className={s.kicker}>
                                {live ? (
                                    <><span className={s.badgeLive}>AO VIVO</span>{live.inicio ? ` desde ${horaBrasilia(live.inicio)}` : ' agora'}</>
                                ) : pos ? (
                                    <>Canal 24h · agora {horaBrasilia(pos.inicioMs)}–{horaBrasilia(pos.fimMs)}</>
                                ) : 'Canal 24h'}
                            </p>
                            <h2 className={s.heroTitulo}>{tituloAtual}</h2>
                            <p className={s.heroSub}>
                                {live
                                    ? 'O canal 24h saiu do ar sozinho e volta quando a live acabar.'
                                    : canalDemo ? 'Player ainda não configurado: o botão abre o YouTube do @tvcomplexofc.'
                                    : pos ? `A seguir: ${pos.proximo.titulo}` : 'Vídeos do @tvcomplexofc sem parar.'}
                            </p>
                            <div className={s.botoes}>
                                {podeTocarAqui ? (
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
                                ) : (
                                    <a className={s.btnOutline} href="#grade">Ver a grade</a>
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
