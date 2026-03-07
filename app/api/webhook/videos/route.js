import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Webhook endpoint for n8n to send videos automatically
export async function POST(request) {
    try {
        const body = await request.json();
        const { titulo, descricao, url_video, thumbnail, plataforma } = body;

        if (!titulo || !url_video) {
            return NextResponse.json(
                { error: 'titulo e url_video são campos obrigatórios' },
                { status: 400 }
            );
        }

        const id = uuidv4();
        await db.query(`
      INSERT INTO videos (id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque)
      VALUES ($1, $2, $3, $4, $5, $6, 'geral', 0)
    `, [id, titulo, descricao || '', url_video, thumbnail || '', plataforma || 'manual']);

        return NextResponse.json({
            id,
            message: 'Vídeo importado com sucesso via webhook',
        }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
