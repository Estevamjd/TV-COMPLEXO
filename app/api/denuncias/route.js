import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated } from '@/lib/auth';
import { rateLimitResponse } from '@/lib/rate-limit';
import sanitizeHtml from 'sanitize-html';
import { auditLog } from '@/lib/audit';
import { COMUNIDADE_MAX_LENGTH, coordenadasDaComunidade } from '@/lib/comunidades';
import { STATUS, inserirDenuncia, listarDenunciasAdmin, listarDenunciasPublicas } from '@/lib/denuncias';

const sanitizeText = (text) => sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();

const ERRO_CHECK = '23514';
const ERRO_COLUNA_INEXISTENTE = '42703';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tipo = searchParams.get('tipo');
        const comunidade = searchParams.get('comunidade');
        const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit')) || 50));

        // Admin vê tudo (original, sem máscara); público só aprovada/resolvida,
        // anonimizada e mascarada no servidor. O parâmetro status é ignorado no público.
        const admin = await isAuthenticated();
        const denuncias = admin
            ? await listarDenunciasAdmin({ status, tipo, comunidade, limit })
            : await listarDenunciasPublicas({ tipo, comunidade, limit });

        return NextResponse.json(denuncias, admin ? { headers: { 'Cache-Control': 'private, no-store' } } : undefined);
    } catch (error) {
        console.error('[denuncias GET]', error?.message);
        return NextResponse.json({ error: 'Erro interno ao buscar denúncias' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const blocked = rateLimitResponse(request, { namespace: 'denuncias', maxRequests: 3, windowMs: 120000 });
        if (blocked) return blocked;

        const body = await request.json();
        const { nome, comunidade, local_problema, tipo, descricao, latitude, longitude, midia } = body;

        if (![comunidade, local_problema, tipo, descricao].every((v) => typeof v === 'string' && v.trim())) {
            return NextResponse.json({ error: 'Comunidade, local, tipo e descrição são obrigatórios' }, { status: 400 });
        }

        if (descricao.length > 5000 || (nome && String(nome).length > 200) || local_problema.length > 500
            || comunidade.length > COMUNIDADE_MAX_LENGTH || tipo.length > 50) {
            return NextResponse.json({ error: 'Campos excedem o tamanho máximo permitido' }, { status: 400 });
        }

        // Sanitizar inputs de texto
        const nomeSanitizado = nome ? sanitizeText(String(nome)) || 'Anônimo' : 'Anônimo';
        const comunidadeSanitizada = sanitizeText(comunidade);
        const descricaoSanitizada = sanitizeText(descricao);
        const localSanitizado = sanitizeText(local_problema);
        const tipoSanitizado = sanitizeText(tipo);

        // Anônimo por padrão: só publica o primeiro nome com consentimento
        // explícito (publicar_nome === true) e se houver nome.
        const publicarNome = body.publicar_nome === true && nomeSanitizado !== 'Anônimo';

        // Usar coordenadas enviadas ou fallback da comunidade
        const fallback = coordenadasDaComunidade(comunidadeSanitizada);
        const lat = Number(latitude);
        const lng = Number(longitude);
        const finalLat = latitude != null && Number.isFinite(lat) ? lat : fallback?.lat ?? null;
        const finalLng = longitude != null && Number.isFinite(lng) ? lng : fallback?.lng ?? null;

        const id = uuidv4();
        await inserirDenuncia({
            id,
            nome: nomeSanitizado,
            comunidade: comunidadeSanitizada,
            localProblema: localSanitizado,
            tipo: tipoSanitizado,
            descricao: descricaoSanitizada,
            latitude: finalLat,
            longitude: finalLng,
            midia: typeof midia === 'string' ? midia : '',
            publicarNome,
        });

        return NextResponse.json({ id, message: 'Recebida. Vai ao ar depois da revisão.' }, { status: 201 });
    } catch (error) {
        console.error('[denuncias POST]', error?.message);
        return NextResponse.json({ error: 'Erro interno ao enviar denúncia' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }
        const body = await request.json();
        const { id, status: newStatus, nome, comunidade, local_problema, tipo, descricao, publicar_nome } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
        }

        // Validar status se fornecido
        if (newStatus && !STATUS.includes(newStatus)) {
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
        if (publicar_nome !== undefined) {
            params.push(publicar_nome === true);
            fields.push(`publicar_nome = $${params.length}`);
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }

        params.push(id);
        const { rowCount } = await db.query(`UPDATE denuncias SET ${fields.join(', ')} WHERE id = $${params.length}`, params);
        if (rowCount === 0) {
            return NextResponse.json({ error: 'Denúncia não encontrada' }, { status: 404 });
        }

        auditLog('update', 'denuncia', id, null, { newStatus, tipo });
        return NextResponse.json({ message: 'Denúncia atualizada com sucesso' });
    } catch (error) {
        // Antes da migração: CHECK antigo sem 'aprovada' ou coluna publicar_nome ausente.
        if (error?.code === ERRO_CHECK || error?.code === ERRO_COLUNA_INEXISTENTE) {
            return NextResponse.json(
                { error: 'O banco ainda não recebeu a migração da moderação (status aprovada/publicar_nome). Veja MIGRACAO-PLANO.md.' },
                { status: 409 }
            );
        }
        console.error('[denuncias PUT]', error?.message);
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
        console.error('[denuncias DELETE]', error?.message);
        return NextResponse.json({ error: 'Erro interno ao deletar denúncia' }, { status: 500 });
    }
}
