import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

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
        const body = await request.json();
        const { titulo, resumo, conteudo, imagem, categoria, autor } = body;

        if (!titulo || !conteudo) {
            return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 });
        }

        if (titulo.length > 500 || (resumo && resumo.length > 2000) || conteudo.length > 50000) {
            return NextResponse.json({ error: 'Campos excedem o tamanho máximo permitido' }, { status: 400 });
        }

        const id = uuidv4();
        await db.query(`
      INSERT INTO noticias (id, titulo, resumo, conteudo, imagem, categoria, autor)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, titulo, resumo || '', conteudo, imagem || '', categoria || 'geral', autor || 'TV Complexo']);

        auditLog('create', 'noticia', id, null, { titulo, categoria });
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
        const body = await request.json();
        const { id, titulo, resumo, conteudo, imagem, categoria, autor, publicada } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        await db.query(`
      UPDATE noticias SET titulo = $1, resumo = $2, conteudo = $3, imagem = $4, categoria = $5, autor = $6, publicada = $7
      WHERE id = $8
    `, [titulo, resumo, conteudo, imagem, categoria, autor, publicada ? 1 : 0, id]);

        auditLog('update', 'noticia', id, null, { titulo });
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        await db.query('DELETE FROM noticias WHERE id = $1', [id]);
        auditLog('delete', 'noticia', id);
        return NextResponse.json({ message: 'Notícia deletada com sucesso' });
    } catch (error) {
        console.error('[noticias DELETE]', error);
        return NextResponse.json({ error: 'Erro interno ao deletar notícia' }, { status: 500 });
    }
}
