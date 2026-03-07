import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
    try {
        // 1. Validar Webhook Secret
        const secret = request.headers.get('x-webhook-secret');
        if (!process.env.WEBHOOK_SECRET || secret !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized: Invalid or missing Webhook Secret' }, { status: 401 });
        }

        const body = await request.json();

        // Mapeando dados no formato esperado do webhook
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

        // 3. Sistema inteligente anti-duplicação
        // Check por external_id ou URL exata
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

        // 4. Salvar no banco (Ingestão)
        const id = uuidv4();
        await db.query(`
            INSERT INTO videos (id, titulo, url_video, thumbnail, plataforma, author, external_id, published_at, categoria, destaque)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            id,
            title || `Publicação via ${platform}`,
            video_url,
            thumbnail || null,
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
            platform: platform
        }, { status: 201 });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Erro interno ao processar webhook.' }, { status: 500 });
    }
}
