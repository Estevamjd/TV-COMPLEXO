import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { XMLParser } from 'fast-xml-parser';

/**
 * Vercel Cron Job — Busca novos vídeos do YouTube via RSS
 *
 * Lê o feed RSS público do canal do YouTube e insere vídeos novos no banco.
 * Usa external_id (videoId do YouTube) para evitar duplicações.
 */

const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const CRON_SECRET = process.env.CRON_SECRET;

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    trimValues: true,
    // Previne prototype pollution
    allowBooleanAttributes: false,
});

function parseYouTubeRSS(xml) {
    let data;
    try {
        data = parser.parse(xml);
    } catch (err) {
        console.error('[YouTube Cron] Falha ao parsear XML:', err.message);
        return [];
    }

    const feed = data?.feed;
    if (!feed) return [];

    const rawEntries = Array.isArray(feed.entry) ? feed.entry : (feed.entry ? [feed.entry] : []);
    const entries = [];

    for (const entry of rawEntries) {
        const videoId = typeof entry['yt:videoId'] === 'string' ? entry['yt:videoId'] : null;
        const title = typeof entry.title === 'string' ? entry.title : null;
        if (!videoId || !title) continue;

        // Valida formato do videoId do YouTube (11 chars alfanuméricos + -_)
        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) continue;

        const link = entry.link?.['@_href'] || `https://www.youtube.com/watch?v=${videoId}`;
        const published = typeof entry.published === 'string' ? entry.published : null;
        const description = typeof entry['media:group']?.['media:description'] === 'string'
            ? entry['media:group']['media:description']
            : '';

        entries.push({
            videoId,
            title,
            link,
            published,
            description,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
    }

    return entries;
}

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!YOUTUBE_CHANNEL_ID) {
            return NextResponse.json(
                { error: 'YOUTUBE_CHANNEL_ID não configurado nas variáveis de ambiente.' },
                { status: 500 }
            );
        }

        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(YOUTUBE_CHANNEL_ID)}`;
        const response = await fetch(rssUrl, {
            headers: { 'User-Agent': 'TV-Complexo-Bot/1.0' },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Erro ao buscar RSS do YouTube: ${response.status} ${response.statusText}` },
                { status: 502 }
            );
        }

        const xml = await response.text();
        const videos = parseYouTubeRSS(xml);

        if (videos.length === 0) {
            return NextResponse.json({
                message: 'Nenhum vídeo encontrado no feed RSS.',
                imported: 0,
            });
        }

        const videoIds = videos.map(v => v.videoId);
        const placeholders = videoIds.map((_, i) => `$${i + 1}`).join(', ');
        const { rows: existing } = await db.query(
            `SELECT external_id FROM videos WHERE external_id IN (${placeholders})`,
            videoIds
        );
        const existingIds = new Set(existing.map(r => r.external_id));

        const newVideos = videos.filter(v => !existingIds.has(v.videoId));
        let importedCount = 0;

        for (const video of newVideos) {
            const id = randomUUID();
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
                0,
            ]);
            importedCount++;
        }

        console.log(`[YouTube Cron] Feed processado: ${videos.length} no feed, ${importedCount} novos importados, ${existingIds.size} já existentes.`);

        return NextResponse.json({
            message: 'Sincronização concluída.',
            total_in_feed: videos.length,
            imported: importedCount,
            already_existing: existingIds.size,
            new_videos: newVideos.map(v => ({ id: v.videoId, title: v.title })),
        });
    } catch (error) {
        console.error('[YouTube Cron] Erro:', error);
        return NextResponse.json(
            { error: 'Erro interno ao processar cron do YouTube' },
            { status: 500 }
        );
    }
}
