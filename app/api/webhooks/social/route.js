import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'node:crypto';

/**
 * Webhook para recebimento de posts de redes sociais (via n8n ou similar).
 * Protegido por WEBHOOK_SECRET.
 */

// Domínios confiáveis para thumbnails de redes sociais
const TRUSTED_THUMBNAIL_HOSTS = [
    'ytimg.com', 'i.ytimg.com', 'img.youtube.com',
    'cdninstagram.com', 'fbcdn.net', 'instagram.com',
    'tiktokcdn.com', 'tiktok.com',
    'unsplash.com', 'images.unsplash.com',
    'public.blob.vercel-storage.com',
];

function isTrustedThumbnailUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
        const u = new URL(urlStr);
        if (u.protocol !== 'https:') return false;
        const host = u.hostname.toLowerCase();
        return TRUSTED_THUMBNAIL_HOSTS.some(
            trusted => host === trusted || host.endsWith('.' + trusted)
        );
    } catch {
        return false;
    }
}

async function fetchInstagramThumbnail(videoUrl) {
    try {
        const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url && isTrustedThumbnailUrl(data.thumbnail_url)) {
                return data.thumbnail_url;
            }
        }
    } catch {
        // thumbnail é opcional
    }
    return null;
}

async function fetchTikTokThumbnail(videoUrl) {
    try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
            const data = await res.json();
            if (data.thumbnail_url && isTrustedThumbnailUrl(data.thumbnail_url)) {
                return data.thumbnail_url;
            }
        }
    } catch {
        // silencioso
    }
    return null;
}

async function autoFetchThumbnail(platform, videoUrl) {
    const p = (platform || '').toLowerCase();
    if (p === 'instagram') return fetchInstagramThumbnail(videoUrl);
    if (p === 'tiktok') return fetchTikTokThumbnail(videoUrl);
    if (p === 'youtube') {
        const match = videoUrl.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
        if (match) return `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
    }
    return null;
}

function isValidHttpUrl(urlStr) {
    if (!urlStr || typeof urlStr !== 'string' || urlStr.length > 2000) return false;
    try {
        const u = new URL(urlStr);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

export async function POST(request) {
    try {
        // 1. Content-Type obrigatório: JSON
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.toLowerCase().startsWith('application/json')) {
            return NextResponse.json({ error: 'Content-Type deve ser application/json' }, { status: 415 });
        }

        // 2. WEBHOOK_SECRET obrigatório
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
            published_at,
        } = body;

        // 3. Validação básica
        if (!platform || !video_url || !external_id) {
            return NextResponse.json({ error: 'Os campos "platform", "video_url" e "external_id" são obrigatórios.' }, { status: 400 });
        }

        if (typeof platform !== 'string' || platform.length > 50) {
            return NextResponse.json({ error: 'Platform inválida' }, { status: 400 });
        }

        if (!isValidHttpUrl(video_url)) {
            return NextResponse.json({ error: 'video_url inválido' }, { status: 400 });
        }

        if (typeof external_id !== 'string' || external_id.length > 200) {
            return NextResponse.json({ error: 'external_id inválido' }, { status: 400 });
        }

        // 4. Sistema anti-duplicação
        const existingVideo = await db.query(
            'SELECT id FROM videos WHERE external_id = $1 OR url_video = $2',
            [external_id, video_url]
        );

        if (existingVideo.rows.length > 0) {
            return NextResponse.json({
                message: 'Vídeo duplicado: Já existente no sistema.',
                id: existingVideo.rows[0].id,
            }, { status: 409 });
        }

        // 5. Thumbnail — aceita apenas URLs de domínios confiáveis
        let finalThumbnail = null;
        if (thumbnail && isTrustedThumbnailUrl(thumbnail)) {
            finalThumbnail = thumbnail;
        } else {
            const autoThumb = await autoFetchThumbnail(platform, video_url);
            if (autoThumb) finalThumbnail = autoThumb;
        }

        // 6. Insert
        const id = randomUUID();
        await db.query(`
            INSERT INTO videos (id, titulo, url_video, thumbnail, plataforma, author, external_id, published_at, categoria, destaque)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            id,
            (title && typeof title === 'string') ? title.slice(0, 500) : `Publicação via ${platform}`,
            video_url,
            finalThumbnail,
            platform.toLowerCase(),
            (author && typeof author === 'string') ? author.slice(0, 200) : null,
            external_id,
            published_at ? new Date(published_at) : null,
            'geral',
            0,
        ]);

        return NextResponse.json({
            message: 'Vídeo importado da rede social com sucesso!',
            id,
            platform,
            thumbnail_source: finalThumbnail ? (thumbnail ? 'provided' : 'auto-fetched') : 'none',
        }, { status: 201 });
    } catch (error) {
        console.error('[webhook social]', error);
        return NextResponse.json({ error: 'Erro interno ao processar webhook' }, { status: 500 });
    }
}
