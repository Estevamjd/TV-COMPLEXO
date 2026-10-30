import { NextResponse } from 'next/server';

/**
 * GET /api/live — somente leitura, sem banco.
 * Detecção automática BLOQUEADA por padrão; só LIVE_YOUTUBE_AUTO='1' habilita.
 * Limite global exige store atômico compartilhado não autorizado. Intervalo longo
 * NÃO resolve cota: os tetos abaixo protegem somente um processo.
 * Modelo atual de cota: search.list tem bucket próprio de 100 chamadas/dia,
 * custo 1; videos.list custa 1 no bucket de 10.000 unidades/dia dos demais endpoints.
 * Erros também contam; reset à meia-noite em America/Los_Angeles (Pacific Time).
 * Tetos locais: search.list 40/dia, videos.list 600/dia, reservados antes do fetch.
 * Busca bem-sucedida: intervalo 960s; falhas: 300s, 600s, 960s (teto).
 * Detalhes: intervalo 120s; falhas: 120s, 240s, 480s, 960s (teto).
 * Cache, limites, orçamento e deduplicação são POR INSTÂNCIA/PROCESSO.
 * Em Vercel, reinícios, várias instâncias e cold starts podem multiplicar chamadas.
 * BLOQUEIO: limite global real exige armazenamento compartilhado com reserva
 * atômica, não provisionado. Reiniciar o módulo também zera os tetos locais.
 * Falhas/bloqueios: 503 no-store; último estado confirmado preservado em memória.
 * Variáveis (só servidor): YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID.
 */
export const dynamic = 'force-dynamic';

const API = 'https://www.googleapis.com/youtube/v3';
type LiveStatus = { live: false } | { live: true; videoId: string; titulo: string; inicio: string | null };

async function consultar(recurso: string, parametros: Record<string, string>) {
    const resposta = await fetch(`${API}/${recurso}?${new URLSearchParams(parametros)}`, { cache: 'no-store' });
    if (!resposta.ok) throw new Error('YouTube indisponível');
    const dados = await resposta.json();
    if (!Array.isArray(dados.items)) throw new Error('Resposta inválida do YouTube');
    return dados.items;
}

type Recurso = 'search' | 'videos';
const limites = { search: 40, videos: 600 };
const minimos = { search: 300_000, videos: 120_000 };
const controles = {
    search: { proxima: 0, falhas: 0, dia: '', usadas: 0 },
    videos: { proxima: 0, falhas: 0, dia: '', usadas: 0 },
};
const calendarioPacific = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
});

async function limitada<T>(recurso: Recurso, executar: () => Promise<T>): Promise<T> {
    const controle = controles[recurso];
    const agora = Date.now();
    const dia = calendarioPacific.format(agora);
    if (controle.dia !== dia) { controle.dia = dia; controle.usadas = 0; }
    if (agora < controle.proxima || controle.usadas >= limites[recurso]) {
        throw new Error('Intervalo ou orçamento local excedido');
    }
    // Reserva síncrona antes de qualquer await; erros também consomem a cota.
    controle.usadas++;
    controle.proxima = agora + minimos[recurso];
    try {
        const resultado = await executar();
        controle.falhas = 0;
        controle.proxima = Date.now() + (recurso === 'search' ? 960_000 : 120_000);
        return resultado;
    } catch (erro) {
        controle.falhas = Math.min(controle.falhas + 1, 4);
        controle.proxima = Date.now() + Math.min(960_000, minimos[recurso] * 2 ** (controle.falhas - 1));
        throw erro;
    }
}

type Descoberta = { item: { videoId: string; titulo: string } | null; expira: number };
const descobertas = new Map<string, Descoberta>();
async function descobrir(chave: string, canal: string): Promise<Descoberta> {
    const key = JSON.stringify([chave, canal]);
    const cache = descobertas.get(key);
    if (cache && Date.now() < cache.expira) return cache;
    return limitada('search', async () => {
        const itens = await consultar('search', {
            part: 'snippet', channelId: canal, eventType: 'live', type: 'video', maxResults: '1', key: chave,
        });
        const item = itens[0];
        if (item && (!item.id?.videoId || item.snippet?.channelId !== canal || typeof item.snippet?.title !== 'string')) {
            throw new Error('Live inválida');
        }
        const descoberta = {
            item: item ? { videoId: item.id.videoId as string, titulo: item.snippet.title as string } : null,
            expira: Date.now() + 960_000,
        };
        descobertas.set(key, descoberta);
        return descoberta;
    });
}

type Estado = { status?: LiveStatus; expira: number; pendente?: Promise<LiveStatus> };
const estados = new Map<string, Estado>();

async function consultarStatus(chave: string, canal: string, anterior?: LiveStatus): Promise<LiveStatus> {
    let item;
    if (anterior?.live) item = anterior;
    else {
        const descoberta = await descobrir(chave, canal);
        item = descoberta.item;
    }
    if (!item) return { live: false };
    return limitada('videos', async (): Promise<LiveStatus> => {
        const videos = await consultar('videos', {
            part: 'snippet,liveStreamingDetails', id: item.videoId, key: chave,
        });
        // Valida identidade e campos antes de concluir o fim; falhas preservam o estado confirmado.
        const video = videos.find((v: { id?: string } | null) => v?.id === item.videoId);
        if (!video) throw new Error('Detalhes da live indisponíveis');
        if (!video.liveStreamingDetails || !video.snippet) throw new Error('Detalhes inválidos');
        if (video.snippet.channelId !== canal) throw new Error('Canal inválido');
        const conteudo = video.snippet.liveBroadcastContent;
        if (!['live', 'none', 'upcoming'].includes(conteudo)) throw new Error('Estado da live inválido');
        const fim = video.liveStreamingDetails.actualEndTime;
        const inicio = video.liveStreamingDetails.actualStartTime;
        if ((fim !== undefined && (typeof fim !== 'string' || !Number.isFinite(Date.parse(fim)))) ||
            (inicio !== undefined && (typeof inicio !== 'string' || !Number.isFinite(Date.parse(inicio))))) {
            throw new Error('Datas da live inválidas');
        }
        if (fim || conteudo !== 'live') return { live: false };
        return {
            live: true,
            videoId: item.videoId,
            titulo: item.titulo,
            inicio: video.liveStreamingDetails?.actualStartTime ?? null,
        };
    });
}

async function buscarLive(): Promise<LiveStatus> {
    const chave = process.env.YOUTUBE_API_KEY;
    const canal = process.env.YOUTUBE_CHANNEL_ID;
    if (!chave || !canal || !canal.startsWith('UC')) throw new Error('YouTube não configurado');
    const key = JSON.stringify([chave, canal]);
    let estado = estados.get(key);
    if (!estado) { estado = { expira: 0 }; estados.set(key, estado); }
    if (estado.status && Date.now() < estado.expira) return estado.status;
    if (estado.pendente) return estado.pendente;
    const atual = estado;
    atual.pendente = consultarStatus(chave, canal, atual.status).then(status => {
        atual.status = status;
        atual.expira = Date.now() + 120_000;
        return status;
    }).finally(() => { atual.pendente = undefined; });
    return atual.pendente;
}

export async function GET() {
    if (process.env.LIVE_YOUTUBE_AUTO !== '1') {
        return NextResponse.json({ live: false, demo: true, motivo: 'deteccao-automatica-desligada' }, {
            headers: { 'Cache-Control': 'no-store' },
        });
    }
    try {
        const status = await buscarLive();
        return NextResponse.json(status, {
            headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60' },
        });
    } catch {
        return NextResponse.json({ error: 'Status da live indisponível' }, {
            status: 503,
            headers: { 'Cache-Control': 'no-store' },
        });
    }
}
