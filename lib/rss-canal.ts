/**
 * Vídeo mais recente do @tvcomplexofc pelo RSS público do canal. SÓ SERVIDOR.
 * É o topo da Início quando não há live (como na base 461fb49). Sem chave e sem cota.
 *
 * Cache de 10 min, compartilhado entre a Início e qualquer outra rota (globalThis, mesmo
 * motivo de lib/live.ts), com consultas simultâneas deduplicadas. Falha (rede, demora
 * > 2,5 s, XML estranho) = null, em cache por só 1 min: a Início cai no vídeo mais recente do
 * banco ou no vídeo de reserva (lib/video-reserva.ts).
 */
import { canalConfigurado } from './live';

export const CACHE_RSS_MS = 10 * 60_000;
const CACHE_FALHA_MS = 60_000;
const LIMITE_MS = 2500;

export type VideoRss = { youtubeId: string; titulo: string };

type Memoria = { cache: { video: VideoRss | null; expira: number; canal: string } | null; pendente: Promise<VideoRss | null> | null };
const CHAVE_GLOBAL = Symbol.for('tv-complexo.rss');
function memoria(): Memoria {
    const g = globalThis as typeof globalThis & { [CHAVE_GLOBAL]?: Memoria };
    return (g[CHAVE_GLOBAL] ??= { cache: null, pendente: null });
}

/** Só para os testes: zera o cache. */
export function limparCacheRss() {
    memoria().cache = null;
    memoria().pendente = null;
}

function desescapar(texto: string) {
    return texto
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/** Primeira <entry> do feed (o YouTube lista do mais novo para o mais antigo). */
export function analisarRss(xml: string): VideoRss | null {
    const entrada = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
    if (!entrada) return null;
    const id = entrada.match(/<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/)?.[1];
    const titulo = desescapar(entrada.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').trim();
    return id && titulo ? { youtubeId: id, titulo } : null;
}

async function lerRss(canal: string): Promise<VideoRss | null> {
    const resposta = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${canal}`, {
        cache: 'no-store', // o cache é o de 10 min acima
        signal: AbortSignal.timeout(LIMITE_MS),
    });
    if (!resposta.ok) return null;
    return analisarRss(await resposta.text());
}

/** Vídeo mais recente do canal pelo RSS; null se o RSS falhar. Nunca lança erro. */
export async function videoMaisRecenteDoCanal(): Promise<VideoRss | null> {
    const canal = canalConfigurado();
    const m = memoria();
    if (m.cache && m.cache.canal === canal && Date.now() < m.cache.expira) return m.cache.video;
    if (m.pendente) return m.pendente;
    const promessa = lerRss(canal)
        .catch(() => null)
        .then(video => {
            m.cache = { video, expira: Date.now() + (video ? CACHE_RSS_MS : CACHE_FALHA_MS), canal };
            return video;
        })
        .finally(() => { if (m.pendente === promessa) m.pendente = null; });
    m.pendente = promessa;
    return promessa;
}
