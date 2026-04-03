import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenta buscar thumbnail do Instagram via OEmbed API (gratuita, sem auth).
 * Retorna a URL da thumbnail ou null.
 */
async function fetchInstagramThumbnail(videoUrl) {
    try {
        const oembedUrl = `https://graph.facebook.com/v22.0/instagram_oembed?url=${encodeURIComponent(videoUrl)}&access_token=`;
        // Fallback: tentar a API pública do noembed (funciona sem token)
        const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url) return data.thumbnail_url;
        }
    } catch {
        // Silencioso — thumbnail é opcional
    }
    return null;
}

/**
 * Tenta buscar thumbnail do TikTok via OEmbed API.
 */
async function fetchTikTokThumbnail(videoUrl) {
    try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url) return data.thumbnail_url;
        }
    } catch {
        // Silencioso
    }
    return null;
}

/**
 * Busca thumbnail automaticamente baseado na plataforma.
 */
async function autoFetchThumbnail(platform, videoUrl) {
    const p = platform.toLowerCase();
    if (p === 'instagram') return fetchInstagramThumbnail(videoUrl);
    if (p === 'tiktok') return fetchTikTokThumbnail(videoUrl);
    if (p === 'youtube') {
        // Extrair videoId e gerar thumbnail padrão
        const match = videoUrl.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
}

export async function POST(request) {
    try {
        // 1. Validar Webhook Secret (obrigatório)
        const webhookSecret = process.env.WEBHOOK_SECRET;
        const secret = request.headers.get('x-webhook-secret');
        if (!webhookSecret || !secret || secret !== webhookSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const {
            platform,
            video_url,
            thumbnail,
            title,
            author,
            external_id,
            published_at
        } = body;

        // 2. Validação Básica
        if (!platform || !video_url || !external_id) {
            return NextResponse.json({ error: 'Os campos "platform", "video_url" e "external_id" são obrigatórios.' }, { status: 400 });
        }

        // 3. Sistema anti-duplicação
        const existingVideo = await db.query(
            'SELECT id FROM videos WHERE external_id = $1 OR url_video = $2',
            [external_id, video_url]
        );

        if (existingVideo.rows.length > 0) {
            return NextResponse.json({
                message: 'Vídeo duplicado: Já existente no sistema.',
                id: existingVideo.rows[0].id
            }, { status: 409 });
        }

        // 4. Buscar thumbnail automaticamente se não fornecida
        let finalThumbnail = thumbnail || null;
        if (!finalThumbnail || !finalThumbnail.startsWith('http')) {
            const autoThumb = await autoFetchThumbnail(platform, video_url);
            if (autoThumb) finalThumbnail = autoThumb;
        }

        // 5. Salvar no banco
        const id = uuidv4();
        await db.query(`
            INSERT INTO videos (id, titulo, url_video, thumbnail, plataforma, author, external_id, published_at, categoria, destaque)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            id,
            title || `Publicação via ${platform}`,
            video_url,
            finalThumbnail,
            platform.toLowerCase(),
            author || null,
            external_id,
            published_at ? new Date(published_at) : null,
            'geral',
            0
        ]);

        return NextResponse.json({
            message: 'Vídeo importado da rede social com sucesso!',
            id: id,
            platform: platform,
            thumbnail_source: finalThumbnail ? (thumbnail ? 'provided' : 'auto-fetched') : 'none',
        }, { status: 201 });

    } catch (error) {
        console.error('[webhook social]', error);
        return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 });
    }
}
