import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { isAuthenticated } from '@/lib/auth';
import { auditLogWithRequest } from '@/lib/audit';
import { rateLimitResponse } from '@/lib/rate-limit';
import { sanitizeArticleHtml, sanitizeText } from '@/lib/sanitize';

const ADMIN_WRITE_LIMIT = { namespace: 'admin-write', maxRequests: 100, windowMs: 60 * 1000 };

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get('categoria');
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit')) || 50));

        let query = 'SELECT * FROM noticias WHERE publicada = 1';
        const params = [];

        if (categoria && categoria !== 'todos') {
            params.push(categoria);
            query += ` AND categoria = $${params.length}`;
        }

        params.push(limit);
        query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

        const { rows: noticias } = await db.query(query, params);
        return NextResponse.json(noticias);
    } catch (error) {
        console.error('[noticias GET]', error);
        return NextResponse.json({ error: 'Erro interno ao buscar notícias' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const blocked = await rateLimitResponse(request, ADMIN_WRITE_LIMIT);
        if (blocked) return blocked;

        const body = await request.json();
        const { titulo, resumo, conteudo, imagem, categoria, autor } = body;

        if (!titulo || !conteudo) {
            return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 });
        }

        if (titulo.length > 500 || (resumo && resumo.length > 2000) || conteudo.length > 50000) {
            return NextResponse.json({ error: 'Campos excedem o tamanho máximo permitido' }, { status: 400 });
        }

        // Sanitização defensiva na entrada (defense in depth)
        const tituloLimpo = sanitizeText(titulo);
        const resumoLimpo = resumo ? sanitizeText(resumo) : '';
        const conteudoLimpo = sanitizeArticleHtml(conteudo);
        const autorLimpo = autor ? sanitizeText(autor) : 'TV Complexo';

        const id = randomUUID();
        await db.query(`
      INSERT INTO noticias (id, titulo, resumo, conteudo, imagem, categoria, autor)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, tituloLimpo, resumoLimpo, conteudoLimpo, imagem || '', categoria || 'geral', autorLimpo]);

        await auditLogWithRequest(request, 'create', 'noticia', id, null, { titulo: tituloLimpo, categoria });
        return NextResponse.json({ id, message: 'Notícia criada com sucesso' }, { status: 201 });
    } catch (error) {
        console.error('[noticias POST]', error);
        return NextResponse.json({ error: 'Erro interno ao criar notícia' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const blocked = await rateLimitResponse(request, ADMIN_WRITE_LIMIT);
        if (blocked) return blocked;

        const body = await request.json();
        const { id, titulo, resumo, conteudo, imagem, categoria, autor, publicada } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }
        if (!titulo || titulo.length > 500) {
            return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
        }
        if (!conteudo || conteudo.length > 50000) {
            return NextResponse.json({ error: 'Conteúdo inválido' }, { status: 400 });
        }

        const tituloLimpo = sanitizeText(titulo);
        const resumoLimpo = resumo ? sanitizeText(resumo) : '';
        const conteudoLimpo = sanitizeArticleHtml(conteudo);
        const autorLimpo = autor ? sanitizeText(autor) : 'TV Complexo';

        await db.query(`
      UPDATE noticias SET titulo = $1, resumo = $2, conteudo = $3, imagem = $4, categoria = $5, autor = $6, publicada = $7
      WHERE id = $8
    `, [tituloLimpo, resumoLimpo, conteudoLimpo, imagem, categoria, autorLimpo, publicada ? 1 : 0, id]);

        await auditLogWithRequest(request, 'update', 'noticia', id, null, { titulo: tituloLimpo });
        return NextResponse.json({ message: 'Notícia atualizada com sucesso' });
    } catch (error) {
        console.error('[noticias PUT]', error);
        return NextResponse.json({ error: 'Erro interno ao atualizar notícia' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const blocked = await rateLimitResponse(request, ADMIN_WRITE_LIMIT);
        if (blocked) return blocked;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        await db.query('DELETE FROM noticias WHERE id = $1', [id]);
        await auditLogWithRequest(request, 'delete', 'noticia', id);
        return NextResponse.json({ message: 'Notícia deletada com sucesso' });
    } catch (error) {
        console.error('[noticias DELETE]', error);
        return NextResponse.json({ error: 'Erro interno ao deletar notícia' }, { status: 500 });
    }
}
