import db from './db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Sincronização diária dos vídeos do canal (RSS do YouTube → tabela videos).
 * Usada pela rota /api/cron/youtube (Vercel Cron) e pelo handler `scheduled` do Worker (Cloudflare).
 * Usa external_id (videoId do YouTube) para evitar duplicações.
 */

/**
 * Faz parse simples do XML do RSS do YouTube sem dependência externa.
 * Extrai os campos: videoId, title, link, published, thumbnail.
 */
export function parseYouTubeRSS(xml) {
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entryXml = match[1];

        const videoId = extractTag(entryXml, 'yt:videoId');
        const title = extractTag(entryXml, 'title');
        const link = extractAttr(entryXml, 'link', 'href');
        const published = extractTag(entryXml, 'published');
        const description = extractTag(entryXml, 'media:description');

        // Thumbnail padrão do YouTube
        const thumbnail = videoId
            ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            : '';

        if (videoId && title) {
            entries.push({
                videoId,
                title: decodeHtmlEntities(title),
                link: link || `https://www.youtube.com/watch?v=${videoId}`,
                published,
                description: description ? decodeHtmlEntities(description) : '',
                thumbnail,
            });
        }
    }

    return entries;
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
    const match = xml.match(regex);
    return match ? match[1].trim() : '';
}

function extractAttr(xml, tag, attr) {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"[^>]*/?>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
}

function decodeHtmlEntities(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

/**
 * Busca o RSS do canal e grava os vídeos novos.
 * Devolve `{ status, corpo }`: o status HTTP e o JSON que a rota responde (o Worker só registra no log).
 */
export async function sincronizarVideosYoutube({ channelId = process.env.YOUTUBE_CHANNEL_ID } = {}) {
    if (!channelId) {
        return { status: 500, corpo: { error: 'YOUTUBE_CHANNEL_ID não configurado nas variáveis de ambiente.' } };
    }

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(rssUrl, {
        headers: { 'User-Agent': 'TV-Complexo-Bot/1.0' },
        cache: 'no-store', // Sem cache
    });

    if (!response.ok) {
        return { status: 502, corpo: { error: `Erro ao buscar RSS do YouTube: ${response.status} ${response.statusText}` } };
    }

    const xml = await response.text();
    const videos = parseYouTubeRSS(xml);

    if (videos.length === 0) {
        return { status: 200, corpo: { message: 'Nenhum vídeo encontrado no feed RSS.', imported: 0 } };
    }

    // Verificar quais vídeos já existem no banco (anti-duplicação)
    const videoIds = videos.map(v => v.videoId);
    const placeholders = videoIds.map((_, i) => `$${i + 1}`).join(', ');
    const { rows: existing } = await db.query(
        `SELECT external_id FROM videos WHERE external_id IN (${placeholders})`,
        videoIds
    );
    const existingIds = new Set(existing.map(r => r.external_id));

    // Inserir apenas vídeos novos
    const newVideos = videos.filter(v => !existingIds.has(v.videoId));
    let importedCount = 0;

    for (const video of newVideos) {
        const id = uuidv4();
        await db.query(`
            INSERT INTO videos (id, titulo, descricao, url_video, thumbnail, plataforma, author, external_id, published_at, categoria, destaque)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
            id,
            video.title,
            video.description,
            video.link,
            video.thumbnail,
            'youtube',
            '@tvcomplexofc',
            video.videoId,
            video.published ? new Date(video.published) : new Date(),
            'geral',
            0
        ]);
        importedCount++;
    }

    console.log(`[YouTube Cron] Feed processado: ${videos.length} no feed, ${importedCount} novos importados, ${existingIds.size} já existentes.`);

    return {
        status: 200,
        corpo: {
            message: `Sincronização concluída.`,
            total_in_feed: videos.length,
            imported: importedCount,
            already_existing: existingIds.size,
            new_videos: newVideos.map(v => ({ id: v.videoId, title: v.title })),
        },
    };
}
