import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/lib/auth';
import { rateLimitResponse } from '@/lib/rate-limit';
import sanitizeHtml from 'sanitize-html';
import { auditLog } from '@/lib/audit';

const sanitizeText = (text) => sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();

// Fallback de coordenadas por comunidade (usado quando o frontend não envia)
const comunidadeCoordenadas = {
    'Complexo do Alemão': { lat: -22.8575, lng: -43.2650 },
    'Rocinha': { lat: -22.9880, lng: -43.2480 },
    'Cidade de Deus': { lat: -22.9480, lng: -43.3620 },
    'Maré': { lat: -22.8620, lng: -43.2430 },
    'Vidigal': { lat: -22.9940, lng: -43.2330 },
    'Jacarezinho': { lat: -22.8880, lng: -43.2620 },
    'Manguinhos': { lat: -22.8820, lng: -43.2500 },
    'Penha': { lat: -22.8410, lng: -43.2710 },
};

const VALID_STATUSES = ['pendente', 'resolvida', 'rejeitada'];

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tipo = searchParams.get('tipo');
        const comunidade = searchParams.get('comunidade');
        const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit')) || 50));

        // Verificar se é admin para ver denúncias pendentes
        const admin = await isAuthenticated();

        let query = 'SELECT * FROM denuncias';
        const conditions = [];
        const params = [];

        // Público vê denúncias pendentes e resolvidas; admin vê todas
        if (!admin) {
            conditions.push("status IN ('pendente', 'resolvida')");
        } else if (status && status !== 'todos') {
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

        params.push(limit);
        query += ` ORDER BY created_at DESC LIMIT $${params.length}`;

        const { rows: denuncias } = await db.query(query, params);
        return NextResponse.json(denuncias);
    } catch (error) {
        console.error('[denuncias GET]', error);
        return NextResponse.json({ error: 'Erro interno ao buscar denúncias' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const blocked = rateLimitResponse(request, { namespace: 'denuncias', maxRequests: 3, windowMs: 120000 });
        if (blocked) return blocked;

        const body = await request.json();
        const { nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia } = body;

        if (!comunidade || !local_problema || !tipo || !descricao) {
            return NextResponse.json({ error: 'Comunidade, local, tipo e descrição são obrigatórios' }, { status: 400 });
        }

        if (descricao.length > 5000 || (nome && nome.length > 200) || local_problema.length > 500) {
            return NextResponse.json({ error: 'Campos excedem o tamanho máximo permitido' }, { status: 400 });
        }

        // Sanitizar inputs de texto
        const nomeSanitizado = nome ? sanitizeText(nome) : 'Anônimo';
        const descricaoSanitizada = sanitizeText(descricao);
        const localSanitizado = sanitizeText(local_problema);

        // Usar coordenadas enviadas ou fallback da comunidade
        const fallback = comunidadeCoordenadas[comunidade];
        const finalLat = latitude || fallback?.lat || null;
        const finalLng = longitude || fallback?.lng || null;

        const id = uuidv4();
        await db.query(`
      INSERT INTO denuncias (id, nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendente')
    `, [id, nomeSanitizado, comunidade, localSanitizado, tipo, descricaoSanitizada, finalLat, finalLng, midia || '']);

        return NextResponse.json({ id, message: 'Denúncia enviada com sucesso! Ela já está visível no mapa.' }, { status: 201 });
    } catch (error) {
        console.error('[denuncias POST]', error);
        return NextResponse.json({ error: 'Erro interno ao enviar denúncia' }, { status: 500 });
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

        // Validar status se fornecido
        if (newStatus && !VALID_STATUSES.includes(newStatus)) {
            return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
        }

        // UPDATE único com todos os campos (em vez de 2 updates separados)
        const fields = [];
        const params = [];

        if (newStatus) {
            params.push(newStatus);
            fields.push(`status = $${params.length}`);
        }
        if (nome !== undefined) {
            params.push(nome);
            fields.push(`nome = $${params.length}`);
        }
        if (comunidade !== undefined) {
            params.push(comunidade);
            fields.push(`comunidade = $${params.length}`);
        }
        if (local_problema !== undefined) {
            params.push(local_problema);
            fields.push(`local_problema = $${params.length}`);
        }
        if (tipo !== undefined) {
            params.push(tipo);
            fields.push(`tipo = $${params.length}`);
        }
        if (descricao !== undefined) {
            params.push(descricao);
            fields.push(`descricao = $${params.length}`);
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }

        params.push(id);
        await db.query(`UPDATE denuncias SET ${fields.join(', ')} WHERE id = $${params.length}`, params);

        auditLog('update', 'denuncia', id, null, { newStatus, tipo });
        return NextResponse.json({ message: 'Denúncia atualizada com sucesso' });
    } catch (error) {
        console.error('[denuncias PUT]', error);
        return NextResponse.json({ error: 'Erro interno ao atualizar denúncia' }, { status: 500 });
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
        auditLog('delete', 'denuncia', id);
        return NextResponse.json({ message: 'Denúncia deletada com sucesso' });
    } catch (error) {
        console.error('[denuncias DELETE]', error);
        return NextResponse.json({ error: 'Erro interno ao deletar denúncia' }, { status: 500 });
    }
}
