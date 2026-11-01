import { put } from '@vercel/blob';
import { bindingsDoWorker } from './runtime';

/** O mínimo do binding R2 que o upload usa. */
interface BucketR2 {
    put(chave: string, valor: ArrayBuffer, opcoes?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
}

function ehBucketR2(valor: unknown): valor is BucketR2 {
    return typeof (valor as BucketR2 | null)?.put === 'function';
}

/** Origem pública do bucket R2 (R2_PUBLIC_URL), sem barra final. Null se ausente ou inválida. */
export function urlPublicaR2(): string | null {
    const bruta = process.env.R2_PUBLIC_URL?.trim();
    if (!bruta) return null;
    try {
        const url = new URL(bruta);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        return url.href.replace(/\/+$/, '');
    } catch {
        return null;
    }
}

/**
 * Salva uma imagem pública e devolve a URL.
 * No Worker com o binding UPLOADS (R2), grava no R2; em qualquer outro caso, no Vercel Blob.
 * `bucket` só é passado pelos testes.
 */
export async function salvarImagemPublica(
    caminho: string,
    dados: ArrayBuffer,
    tipo: string,
    bucketDoTeste?: unknown,
): Promise<string> {
    const bucket = bucketDoTeste ?? (await bindingsDoWorker())?.UPLOADS;
    if (ehBucketR2(bucket)) {
        const base = urlPublicaR2();
        if (!base) throw new Error('R2_PUBLIC_URL não configurada (binding UPLOADS presente)');
        const chave = `${caminho.replace(/\.([a-z0-9]+)$/i, '')}-${crypto.randomUUID().slice(0, 8)}${caminho.match(/\.[a-z0-9]+$/i)?.[0] ?? ''}`;
        await bucket.put(chave, dados, { httpMetadata: { contentType: tipo } });
        return `${base}/${chave.split('/').map(encodeURIComponent).join('/')}`;
    }

    const blob = await put(caminho, new Blob([dados], { type: tipo }), {
        access: 'public',
        addRandomSuffix: true,
    });
    return blob.url;
}
