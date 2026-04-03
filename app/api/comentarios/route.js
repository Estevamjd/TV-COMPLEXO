import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { rateLimitResponse } from '@/lib/rate-limit';
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions = {
    allowedTags: [],
    allowedAttributes: {},
};

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const noticia_id = searchParams.get('noticia_id');
        const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit')) || 50));
        const offset = Math.max(0, parseInt(searchParams.get('offset')) || 0);

        if (!noticia_id) {
            return NextResponse.json({ error: 'noticia_id é obrigatório' }, { status: 400 });
        }

        const { rows: comentarios } = await db.query(
            'SELECT * FROM comentarios WHERE noticia_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
            [noticia_id, limit, offset]
        );

        return NextResponse.json(comentarios);
    } catch (error) {
        console.error('[comentarios GET]', error);
        return NextResponse.json({ error: 'Erro interno ao buscar comentários' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const blocked = rateLimitResponse(request, { namespace: 'comentarios', maxRequests: 5 });
        if (blocked) return blocked;

        const body = await request.json();
        const { noticia_id, autor, texto } = body;

        if (!noticia_id || !texto) {
            return NextResponse.json({ error: 'noticia_id e texto são obrigatórios' }, { status: 400 });
        }

        if (texto.length > 2000) {
            return NextResponse.json({ error: 'Comentário muito longo (máximo 2000 caracteres)' }, { status: 400 });
        }

        const autorName = autor ? autor.slice(0, 100) : 'Anônimo';

        // Sanitizar texto para prevenir XSS armazenado
        const textoSanitizado = sanitizeHtml(texto, sanitizeOptions).trim();
        const autorSanitizado = sanitizeHtml(autorName, sanitizeOptions).trim();

        if (!textoSanitizado) {
            return NextResponse.json({ error: 'Texto do comentário é obrigatório' }, { status: 400 });
        }

        const id = uuidv4();
        await db.query(`
      INSERT INTO comentarios (id, noticia_id, autor, texto)
      VALUES ($1, $2, $3, $4)
    `, [id, noticia_id, autorSanitizado || 'Anônimo', textoSanitizado]);

        return NextResponse.json({ id, message: 'Comentário adicionado com sucesso' }, { status: 201 });
    } catch (error) {
        console.error('[comentarios POST]', error);
        return NextResponse.json({ error: 'Erro interno ao adicionar comentário' }, { status: 500 });
    }
}
