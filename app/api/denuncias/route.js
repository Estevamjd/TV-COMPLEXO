import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tipo = searchParams.get('tipo');
        const comunidade = searchParams.get('comunidade');
        const limit = searchParams.get('limit') || 50;

        let query = 'SELECT * FROM denuncias';
        const conditions = [];
        const params = [];

        if (status && status !== 'todos') {
            params.push(status);
            conditions.push(`status = $${params.length}`);
        }

        if (tipo && tipo !== 'todos') {
            params.push(tipo);
            conditions.push(`tipo = $${params.length}`);
        }

        if (comunidade && comunidade !== 'todos') {
            params.push(comunidade);
            conditions.push(`comunidade = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        params.push(Number(limit));
        query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

        const { rows: denuncias } = await db.query(query, params);
        return NextResponse.json(denuncias);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { allowed } = rateLimit(request);
        if (!allowed) {
            return NextResponse.json({ error: 'Muitas tentativas. Aguarde um momento antes de enviar novamente.' }, { status: 429 });
        }

        const body = await request.json();
        const { nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia } = body;

        if (!comunidade || !local_problema || !tipo || !descricao) {
            return NextResponse.json({ error: 'Comunidade, local, tipo e descrição são obrigatórios' }, { status: 400 });
        }

        const id = uuidv4();
        await db.query(`
      INSERT INTO denuncias (id, nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente')
    `, [id, nome || 'Anônimo', comunidade, local_problema, tipo, descricao, latitude || null, longitude || null, midia || '']);

        return NextResponse.json({ id, message: 'Denúncia enviada com sucesso! Ela será analisada pela nossa equipe.' }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const body = await request.json();
        const { id, status: newStatus, nome, comunidade, local_problema, tipo, descricao } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        if (newStatus) {
            await db.query('UPDATE denuncias SET status = $1 WHERE id = $2', [newStatus, id]);
        }

        if (descricao) {
            await db.query(`
        UPDATE denuncias SET nome = $1, comunidade = $2, local_problema = $3, tipo = $4, descricao = $5
        WHERE id = $6
      `, [nome, comunidade, local_problema, tipo, descricao, id]);
        }

        return NextResponse.json({ message: 'Denúncia atualizada com sucesso' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
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

        await db.query('DELETE FROM denuncias WHERE id = $1', [id]);
        return NextResponse.json({ message: 'Denúncia deletada com sucesso' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
