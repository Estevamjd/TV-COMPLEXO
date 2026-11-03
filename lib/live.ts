/**
 * Detecção da live do @tvcomplexofc. SÓ SERVIDOR: lê YOUTUBE_API_KEY e nunca vai para o navegador.
 *
 * Dois caminhos (missão tv-complexo-live-e-topo, stack-decision.md, revisão de 01/11 16:23):
 *  - COM YOUTUBE_API_KEY (tem precedência): playlistItems.list da playlist de uploads
 *    (UC… → UU…, 1 unidade) + videos.list olhando snippet.liveBroadcastContent (1 unidade).
 *    Nunca usa search.list (100 unidades).
 *  - SEM chave: lê a página https://www.youtube.com/channel/<canal>/live (User-Agent de navegador
 *    comum, sem seguir redirect). Só conta como live quando os dois sinais concordam: o
 *    <link rel="canonical"> aponta para watch?v=<id> E a página traz "isLive":true. Qualquer
 *    sinal de live agendada ("isUpcoming":true, upcomingEventData), canal offline
 *    (LIVE_STREAM_OFFLINE) ou página de consentimento/bloqueio (redirect, consent.youtube.com,
 *    /sorry/, "unusual traffic", formulário de desafio captcha-form/g-recaptcha) = sem live.
 *    A palavra "captcha" sozinha NÃO basta: a página normal sempre tem o reCAPTCHA v3 invisível. Nunca tenta contornar consentimento ou bot.
 *    A página não é oficial: se o YouTube mudar o formato, a falha é segura (sem live).
 *
 * Cache ÚNICO de 60 s (com ou sem live, inclusive falha), com consultas simultâneas
 * deduplicadas. Fica em globalThis (Symbol.for) e não no módulo: a Início e /api/live são
 * bundles diferentes no Next e cada um teria a sua cópia deste arquivo (achado R15-2 do QA).
 * Assim a página /live (ou a API) é lida uma vez por janela de cache por instância.
 * Qualquer falha (cota, rede, resposta estranha, demora > 2,5 s) = sem live: a Início mostra
 * o vídeo mais recente, sem erro na tela.
 *
 * Variáveis (só servidor):
 *  - YOUTUBE_API_KEY: chave da YouTube Data API (opcional). Com ela, a API tem precedência.
 *  - YOUTUBE_CHANNEL_ID: canal (padrão UC63_rDkhmAv1bMm55PsyzOw, @tvcomplexofc).
 *  - LIVE_YOUTUBE_AUTO='0': desliga a detecção (interruptor de emergência). Vazio = ligada.
 *  - LIVE_MOCK_VIDEO_ID: SÓ PARA PRÉVIA/TESTE. Simula live com esse vídeo, sem chamar o YouTube.
 *    Só vale com APP_ENV=preview (ou, sem APP_ENV, VERCEL_ENV=preview, que a Vercel define sozinha).
 *    Ignorada em production, development e sem nenhuma das duas. APP_ENV, se definida, manda.
 */

import { ambienteDoDeploy } from './runtime';

export const CANAL_PADRAO = 'UC63_rDkhmAv1bMm55PsyzOw';
export const CACHE_MS = 60_000;
const API = 'https://www.googleapis.com/youtube/v3';
const LIMITE_MS = 2500;
const RECENTES = '10';
const ID_VIDEO = /^[A-Za-z0-9_-]{11}$/;
const ID_CANAL = /^UC[A-Za-z0-9_-]{22}$/;
// navegador comum (Chrome estável no Windows); a página é a mesma que qualquer visitante recebe
export const USER_AGENT_NAVEGADOR =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

export type LiveStatus =
    | { live: false }
    | {
        live: true; videoId: string; titulo: string; inicio: string | null;
        /** api: YouTube Data API; pagina: página /live sem chave (player usa embed/<videoId>); simulada: LIVE_MOCK_VIDEO_ID */
        fonte: 'api' | 'pagina' | 'simulada'; canal: string;
    };

const SEM_LIVE: LiveStatus = { live: false };

type Memoria = {
    cache: { status: LiveStatus; expira: number; chave: string } | null;
    pendente: { promessa: Promise<LiveStatus>; chave: string } | null;
};
const CHAVE_GLOBAL = Symbol.for('tv-complexo.live');
function memoria(): Memoria {
    const g = globalThis as typeof globalThis & { [CHAVE_GLOBAL]?: Memoria };
    return (g[CHAVE_GLOBAL] ??= { cache: null, pendente: null });
}

/** Só para os testes: zera o cache compartilhado. */
export function limparCacheLive() {
    const m = memoria();
    m.cache = null;
    m.pendente = null;
}

export function canalConfigurado(): string {
    const canal = process.env.YOUTUBE_CHANNEL_ID?.trim();
    return canal && ID_CANAL.test(canal) ? canal : CANAL_PADRAO;
}

/** Live simulada (LIVE_MOCK_VIDEO_ID), só em deploy de prévia (APP_ENV ou VERCEL_ENV = preview). */
function liveSimulada(): LiveStatus | null {
    const id = process.env.LIVE_MOCK_VIDEO_ID?.trim();
    if (!id || ambienteDoDeploy() !== 'preview' || !ID_VIDEO.test(id)) return null;
    return { live: true, videoId: id, titulo: 'Live de teste (simulação)', inicio: null, fonte: 'simulada', canal: canalConfigurado() };
}

/* ---------- caminho com chave: YouTube Data API ---------- */

async function consultar(recurso: string, parametros: Record<string, string>) {
    const resposta = await fetch(`${API}/${recurso}?${new URLSearchParams(parametros)}`, {
        cache: 'no-store', // o cache é o de 60 s acima, um só para a Início e /api/live
        signal: AbortSignal.timeout(LIMITE_MS),
    });
    if (!resposta.ok) throw new Error('YouTube indisponível');
    const dados = await resposta.json();
    if (!Array.isArray(dados?.items)) throw new Error('Resposta inválida do YouTube');
    return dados.items as unknown[];
}

type Video = {
    id?: unknown;
    snippet?: { channelId?: unknown; title?: unknown; liveBroadcastContent?: unknown };
    liveStreamingDetails?: { actualStartTime?: unknown; actualEndTime?: unknown };
};

async function consultarApi(chave: string, canal: string): Promise<LiveStatus> {
    const itens = await consultar('playlistItems', {
        part: 'contentDetails', playlistId: `UU${canal.slice(2)}`, maxResults: RECENTES, key: chave,
    });
    const ids = itens
        .map(i => (i as { contentDetails?: { videoId?: unknown } })?.contentDetails?.videoId)
        .filter((id): id is string => typeof id === 'string' && ID_VIDEO.test(id));
    if (ids.length === 0) return SEM_LIVE;

    const videos = (await consultar('videos', {
        part: 'snippet,liveStreamingDetails', id: ids.join(','), key: chave,
    })) as Video[];
    const live = videos.find(v =>
        typeof v?.id === 'string' && ids.includes(v.id)
        && v.snippet?.channelId === canal
        && v.snippet.liveBroadcastContent === 'live'
        && !v.liveStreamingDetails?.actualEndTime);
    if (!live) return SEM_LIVE;
    const inicio = live.liveStreamingDetails?.actualStartTime;
    return {
        live: true,
        videoId: live.id as string,
        titulo: typeof live.snippet?.title === 'string' && live.snippet.title.trim() ? live.snippet.title : 'Ao vivo',
        inicio: typeof inicio === 'string' && Number.isFinite(Date.parse(inicio)) ? inicio : null,
        fonte: 'api',
        canal,
    };
}

/* ---------- caminho sem chave: página /channel/<canal>/live ---------- */

const CANONICAL = /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})">/;
const IS_LIVE = /"isLive":true/;
// live agendada, canal offline ou página de consentimento/bloqueio: nunca é live.
// Bloqueio só por sinal ESPECÍFICO de desafio: a página /live normal sempre traz
// "RECAPTCHA_V3_SITEKEY" e ".grecaptcha-badge" (reCAPTCHA invisível), então /captcha/i
// derrubava toda live real (fixtures youtube-real-*). Desafio = página /sorry/, "unusual traffic"
// (ou "tráfego incomum"), formulário id="captcha-form" ou o widget class="g-recaptcha".
const REJEITAR = [
    /"isUpcoming":true/, /upcomingEventData/, /LIVE_STREAM_OFFLINE/,
    /consent\.youtube\.com/, /consent\.google\./,
    /\/sorry\//, /unusual traffic/i, /tr[áa]fego incomum/i,
    /id=["']?captcha-form\b/, /class=["'][^"']*\bg-recaptcha\b/,
];

function desescapar(texto: string) {
    return texto
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * Lê o HTML da página /live e decide. Exportada para os testes com fixture.
 * Live só com canonical watch?v= + "isLive":true + o próprio canal, e nenhum sinal de rejeição.
 */
export function analisarPaginaLive(html: string, canal: string): LiveStatus {
    if (REJEITAR.some(r => r.test(html))) return SEM_LIVE;
    const canonical = html.match(CANONICAL);
    if (!canonical || !IS_LIVE.test(html)) return SEM_LIVE;
    if (!html.includes(`"channelId":"${canal}"`)) return SEM_LIVE;
    const meta = html.match(/<meta name="title" content="([^"]*)">/)?.[1];
    const titulo = meta ? desescapar(meta).trim() : '';
    const inicio = html.match(/"startTimestamp":"([^"]+)"/)?.[1];
    return {
        live: true,
        videoId: canonical[1],
        titulo: titulo || 'Ao vivo',
        inicio: inicio && Number.isFinite(Date.parse(inicio)) ? new Date(inicio).toISOString() : null,
        fonte: 'pagina',
        canal,
    };
}

async function consultarPagina(canal: string): Promise<LiveStatus> {
    const resposta = await fetch(`https://www.youtube.com/channel/${canal}/live`, {
        headers: { 'User-Agent': USER_AGENT_NAVEGADOR, 'Accept-Language': 'pt-BR,pt;q=0.9' },
        redirect: 'manual', // redirect (consentimento, bloqueio) = sem live; nunca seguir
        cache: 'no-store', // a página tem ~1 MB: fora do data cache do Next; o cache é o de 60 s acima
        signal: AbortSignal.timeout(LIMITE_MS),
    });
    if (resposta.status !== 200 || resposta.redirected) return SEM_LIVE;
    if (resposta.url && new URL(resposta.url).hostname !== 'www.youtube.com') return SEM_LIVE;
    return analisarPaginaLive(await resposta.text(), canal);
}

/** Status da live para a Início e para /api/live (o mesmo cache). Nunca lança erro. */
export async function statusDaLive(): Promise<LiveStatus> {
    const simulada = liveSimulada();
    if (simulada) return simulada;
    if (process.env.LIVE_YOUTUBE_AUTO === '0') return SEM_LIVE;

    const chaveApi = process.env.YOUTUBE_API_KEY?.trim() || '';
    const canal = canalConfigurado();
    const chave = JSON.stringify([chaveApi, canal]);
    const m = memoria();
    if (m.cache && m.cache.chave === chave && Date.now() < m.cache.expira) return m.cache.status;
    if (m.pendente && m.pendente.chave === chave) return m.pendente.promessa;

    const promessa = (chaveApi ? consultarApi(chaveApi, canal) : consultarPagina(canal))
        .catch(() => SEM_LIVE)
        .then(status => {
            m.cache = { status, expira: Date.now() + CACHE_MS, chave };
            return status;
        })
        .finally(() => { if (m.pendente?.promessa === promessa) m.pendente = null; });
    m.pendente = { promessa, chave };
    return promessa;
}
