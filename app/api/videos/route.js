import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { isAuthenticated } from '@/lib/auth';
import { auditLogWithRequest } from '@/lib/audit';
import { rateLimitResponse } from '@/lib/rate-limit';

const ADMIN_WRITE_LIMIT = { namespace: 'admin-write', maxRequests: 100, windowMs: 60 * 1000 };

function isValidUrl(str) {
    if (typeof str !== 'string' || str.length > 2000) return false;
    try {
        const u = new URL(str);
        return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
        return false;
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get('categoria');
        const destaque = searchParams.get('destaque');
        const busca = searchParams.get('busca');

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
        const blocked = await rateLimitResponse(request, ADMIN_WRITE_LIMIT);
        if (blocked) return blocked;

        const body = await request.json();
        const { titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque } = body;

        if (!titulo || !url_video) {
            return NextResponse.json({ error: 'Título e URL do vídeo são obrigatórios' }, { status: 400 });
        }

        if (titulo.length > 500 || (descricao && descricao.length > 5000) || url_video.length > 2000) {
            return NextResponse.json({ error: 'Campos excedem o tamanho máximo permitido' }, { status: 400 });
        }

        if (!isValidUrl(url_video)) {
            return NextResponse.json({ error: 'URL do vídeo inválida (precisa ser http/https)' }, { status: 400 });
        }

        if (thumbnail && !isValidUrl(thumbnail)) {
            return NextResponse.json({ error: 'URL da thumbnail inválida' }, { status: 400 });
        }

        const id = randomUUID();
        await db.query(`
      INSERT INTO videos (id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, titulo, descricao || '', url_video, thumbnail || '', plataforma || 'manual', categoria || 'geral', destaque ? 1 : 0]);

        await auditLogWithRequest(request, 'create', 'video', id, null, { titulo, plataforma });
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
        const blocked = await rateLimitResponse(request, ADMIN_WRITE_LIMIT);
        if (blocked) return blocked;

        const body = await request.json();
        const { id, titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }
        if (!titulo || typeof titulo !== 'string' || titulo.length > 500) {
            return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
        }
        if (descricao && (typeof descricao !== 'string' || descricao.length > 5000)) {
            return NextResponse.json({ error: 'Descrição inválida' }, { status: 400 });
        }
        if (!isValidUrl(url_video)) {
            return NextResponse.json({ error: 'URL do vídeo inválida' }, { status: 400 });
        }
        if (thumbnail && !isValidUrl(thumbnail)) {
            return NextResponse.json({ error: 'URL da thumbnail inválida' }, { status: 400 });
        }

        await db.query(`
      UPDATE videos SET titulo = $1, descricao = $2, url_video = $3, thumbnail = $4, plataforma = $5, categoria = $6, destaque = $7
      WHERE id = $8
    `, [titulo, descricao, url_video, thumbnail, plataforma, categoria, destaque ? 1 : 0, id]);

        await auditLogWithRequest(request, 'update', 'video', id, null, { titulo });
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
        const blocked = await rateLimitResponse(request, ADMIN_WRITE_LIMIT);
        if (blocked) return blocked;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        await db.query('DELETE FROM videos WHERE id = $1', [id]);
        await auditLogWithRequest(request, 'delete', 'video', id);
        return NextResponse.json({ message: 'Vídeo deletado com sucesso' });
    } catch (error) {
        console.error('[videos DELETE]', error);
        return NextResponse.json({ error: 'Erro interno ao deletar vídeo' }, { status: 500 });
    }
}
