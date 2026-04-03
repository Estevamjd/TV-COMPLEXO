import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/lib/auth';
import { auditLog } from '@/lib/audit';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get('categoria');
        const destaque = searchParams.get('destaque');
        const busca = searchParams.get('busca');

        // Paginação
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit')) || 10));
        const offset = Math.max(0, parseInt(searchParams.get('offset')) || 0);

        let query = 'SELECT * FROM videos';
        const conditions = [];
        const params = [];

        if (categoria && categoria !== 'todos') {
            params.push(categoria);
            conditions.push(`categoria = $${params.length}`);
        }

        if (destaque === '1') {
            conditions.push('destaque = 1');
        }

        if (busca) {
            params.push(`%${busca}%`);
            conditions.push(`(titulo ILIKE $${params.length} OR descricao ILIKE $${params.length})`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Add ORDER, LIMIT and OFFSET
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const { rows: videos } = await db.query(query, params);
        return NextResponse.json(videos);
    } catch (error) {
        console.error('[videos GET]', error);
        return NextResponse.json({ error: 'Erro interno ao buscar vídeos' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const body = await request.json();
        const { titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque } = body;

        if (!titulo || !url_video) {
            return NextResponse.json({ error: 'Título e URL do vídeo são obrigatórios' }, { status: 400 });
        }

        if (titulo.length > 500 || (descricao && descricao.length > 5000) || url_video.length > 2000) {
            return NextResponse.json({ error: 'Campos excedem o tamanho máximo permitido' }, { status: 400 });
        }

        const id = uuidv4();
        await db.query(`
      INSERT INTO videos (id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, titulo, descricao || '', url_video, thumbnail || '', plataforma || 'manual', categoria || 'geral', destaque ? 1 : 0]);

        auditLog('create', 'video', id, null, { titulo, plataforma });
        return NextResponse.json({ id, message: 'Vídeo criado com sucesso' }, { status: 201 });
    } catch (error) {
        console.error('[videos POST]', error);
        return NextResponse.json({ error: 'Erro interno ao criar vídeo' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const body = await request.json();
        const { id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        await db.query(`
      UPDATE videos SET titulo = $1, descricao = $2, url_video = $3, thumbnail = $4, plataforma = $5, categoria = $6, destaque = $7
      WHERE id = $8
    `, [titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque ? 1 : 0, id]);

        auditLog('update', 'video', id, null, { titulo });
        return NextResponse.json({ message: 'Vídeo atualizado com sucesso' });
    } catch (error) {
        console.error('[videos PUT]', error);
        return NextResponse.json({ error: 'Erro interno ao atualizar vídeo' }, { status: 500 });
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

        await db.query('DELETE FROM videos WHERE id = $1', [id]);
        auditLog('delete', 'video', id);
        return NextResponse.json({ message: 'Vídeo deletado com sucesso' });
    } catch (error) {
        console.error('[videos DELETE]', error);
        return NextResponse.json({ error: 'Erro interno ao deletar vídeo' }, { status: 500 });
    }
}
