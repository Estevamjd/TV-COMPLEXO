import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const noticia_id = searchParams.get('noticia_id');

        if (!noticia_id) {
            return NextResponse.json({ error: 'noticia_id é obrigatório' }, { status: 400 });
        }

        const { rows: comentarios } = await db.query(
            'SELECT * FROM comentarios WHERE noticia_id = $1 ORDER BY created_at ASC',
            [noticia_id]
        );

        return NextResponse.json(comentarios);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { allowed } = rateLimit(request);
        if (!allowed) {
            return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento.' }, { status: 429 });
        }

        const body = await request.json();
        const { noticia_id, autor, texto } = body;

        if (!noticia_id || !texto) {
            return NextResponse.json({ error: 'noticia_id e texto são obrigatórios' }, { status: 400 });
        }

        const id = uuidv4();
        await db.query(`
      INSERT INTO comentarios (id, noticia_id, autor, texto)
      VALUES ($1, $2, $3, $4)
    `, [id, noticia_id, autor || 'Anônimo', texto]);

        return NextResponse.json({ id, message: 'Comentário adicionado com sucesso' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
