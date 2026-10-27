import { describe, it, expect, vi, beforeEach } from 'vitest';
import { criarBanco, adaptador, inserirFicticia, contagemPorStatus, MIGRACAO, ROLLBACK } from './helpers/pglite-db';

// R2/R3 — moderação e saída pública, contra Postgres local (PGlite).
// Nada aqui toca banco remoto; dados fictícios.

const estado = vi.hoisted(() => ({ db: null, admin: false }));

vi.mock('@/lib/db', () => ({
    default: { query: (...args) => estado.db.query(...args) },
}));
vi.mock('@/lib/auth', () => ({
    isAuthenticated: async () => estado.admin,
}));
vi.mock('@/lib/audit', () => ({
    auditLog: async () => {},
}));

const { GET, POST, PUT } = await import('@/app/api/denuncias/route');
const { _resetDeteccaoColuna, CORTE_LEGADO } = await import('@/lib/denuncias');

let ipSeq = 0;
function req(method, { body, query = '' } = {}) {
    ipSeq += 1;
    return new Request(`http://localhost/api/denuncias${query}`, {
        method,
        headers: { 'content-type': 'application/json', 'x-real-ip': `10.9.0.${ipSeq}` },
        body: body ? JSON.stringify(body) : undefined,
    });
}

async function getPublico(query = '') {
    estado.admin = false;
    const res = await GET(req('GET', { query }));
    expect(res.status).toBe(200);
    return res.json();
}

async function getAdmin(query = '') {
    estado.admin = true;
    const res = await GET(req('GET', { query }));
    estado.admin = false;
    expect(res.status).toBe(200);
    return res.json();
}

async function enviar(extra = {}) {
    estado.admin = false;
    const res = await POST(req('POST', {
        body: {
            nome: 'Fulano Ciclano da Silva',
            comunidade: 'Complexo do Alemão',
            local_problema: 'Beco Fictício',
            tipo: 'lixo_acumulado',
            descricao: 'Lixo acumulado. Falar com Beltrano Souza (21) 98888-7777, que teve AVC hemorrágico e tumor.',
            ...extra,
        },
    }));
    const json = await res.json();
    return { res, json };
}

async function moderar(body) {
    estado.admin = true;
    const res = await PUT(req('PUT', { body }));
    estado.admin = false;
    return res;
}

function expectSaidaPublicaLimpa(lista) {
    const texto = JSON.stringify(lista);
    for (const d of lista) {
        expect(Object.keys(d).sort()).toEqual(
            ['autor', 'comunidade', 'created_at', 'descricao', 'id', 'latitude', 'local_problema', 'longitude', 'status', 'tipo'].sort());
        expect(['aprovada', 'resolvida']).toContain(d.status);
    }
    expect(texto).not.toMatch(/"nome"/);
    expect(texto).not.toMatch(/"midia"/);
    expect(texto).not.toMatch(/"pendente"|"rejeitada"/);
    expect(texto).not.toMatch(/Ciclano|Beltrano|Souza|da Silva|de Tal/);
    expect(texto).not.toMatch(/98888|@/);
    expect(texto).not.toMatch(/AVC|tumor/i);
}

describe.each([
    { cenario: 'ANTES da migração, sem CHECK', checkLegado: false, migrar: false },
    { cenario: 'ANTES da migração, com CHECK legado', checkLegado: true, migrar: false },
    { cenario: 'DEPOIS da migração (com CHECK legado)', checkLegado: true, migrar: true },
    { cenario: 'DEPOIS da migração (sem CHECK)', checkLegado: false, migrar: true },
])('$cenario', ({ checkLegado, migrar }) => {
    let pg;
    let legadoPendente;
    let legadoResolvida;
    let legadoRejeitada;

    beforeEach(async () => {
        pg = await criarBanco({ checkLegado });
        estado.db = adaptador(pg);
        _resetDeteccaoColuna();
        // Denúncias que já estavam no ar antes da moderação.
        legadoPendente = await inserirFicticia(pg, { status: 'pendente', createdAt: '2026-10-01 10:00:00' });
        legadoResolvida = await inserirFicticia(pg, { status: 'resolvida', createdAt: '2026-10-02 10:00:00' });
        legadoRejeitada = await inserirFicticia(pg, { status: 'rejeitada', createdAt: '2026-10-03 10:00:00' });
        if (migrar) await pg.exec(MIGRACAO);
    });

    it('as denúncias atuais (pendente antes do corte) continuam públicas; rejeitada não', async () => {
        const ids = (await getPublico()).map((d) => d.id);
        expect(ids).toContain(legadoPendente);
        expect(ids).toContain(legadoResolvida);
        expect(ids).not.toContain(legadoRejeitada);
    });

    it('POST: nasce pendente, responde "Recebida. Vai ao ar depois da revisão." e NÃO aparece no público', async () => {
        const { res, json } = await enviar();
        expect(res.status).toBe(201);
        expect(json.message).toBe('Recebida. Vai ao ar depois da revisão.');

        const { rows } = await pg.query('SELECT status FROM denuncias WHERE id = $1', [json.id]);
        expect(rows[0].status).toBe('pendente');

        const publico = await getPublico();
        expect(publico.map((d) => d.id)).not.toContain(json.id);
        // Nem pedindo status=pendente explicitamente.
        expect((await getPublico('?status=pendente')).map((d) => d.id)).not.toContain(json.id);

        // O admin vê o original, sem máscara.
        const admin = await getAdmin('?status=pendente');
        const original = admin.find((d) => d.id === json.id);
        expect(original.nome).toBe('Fulano Ciclano da Silva');
        expect(original.descricao).toMatch(/AVC hemorrágico e tumor/);
        // Fila: pendentes no topo.
        expect((await getAdmin())[0].status).toBe('pendente');
    });

    it('saída pública não traz nome completo, e-mail, telefone, mídia nem saúde', async () => {
        await inserirFicticia(pg, {
            status: 'resolvida',
            nome: 'Fulana de Tal',
            descricao: 'Contato fulana@exemplo.com, (21) 98888-7777. Beltrano Souza está com câncer.',
        });
        const publico = await getPublico();
        expect(publico.length).toBeGreaterThan(0);
        expectSaidaPublicaLimpa(publico);
        expect(publico.every((d) => d.autor === 'Anônimo')).toBe(true);
    });

    if (migrar) {
        it('aprovar torna pública; rejeitar nunca; resolvida pública', async () => {
            const a = (await enviar()).json.id;
            const r = (await enviar()).json.id;

            // Admin edita a descrição (caminho principal) e aprova.
            expect((await moderar({ id: a, descricao: 'Lixo acumulado na esquina.', status: 'aprovada' })).status).toBe(200);
            expect((await moderar({ id: r, status: 'rejeitada' })).status).toBe(200);

            let ids = (await getPublico()).map((d) => d.id);
            expect(ids).toContain(a);
            expect(ids).not.toContain(r);

            expect((await moderar({ id: a, status: 'resolvida' })).status).toBe(200);
            ids = (await getPublico()).map((d) => d.id);
            expect(ids).toContain(a);

            const publico = await getPublico();
            expect(publico.find((d) => d.id === a).descricao).toBe('Lixo acumulado na esquina.');
            expectSaidaPublicaLimpa(publico);
        });

        it('publicar_nome: consentiu → só o primeiro nome; padrão → Anônimo', async () => {
            const comNome = (await enviar({ publicar_nome: true })).json.id;
            const semNome = (await enviar()).json.id;
            await moderar({ id: comNome, status: 'aprovada' });
            await moderar({ id: semNome, status: 'aprovada' });

            const publico = await getPublico();
            expect(publico.find((d) => d.id === comNome).autor).toBe('Fulano');
            expect(publico.find((d) => d.id === semNome).autor).toBe('Anônimo');
            expectSaidaPublicaLimpa(publico);

            const { rows } = await pg.query('SELECT id, publicar_nome FROM denuncias WHERE id IN ($1, $2)', [comNome, semNome]);
            expect(Object.fromEntries(rows.map((x) => [x.id, x.publicar_nome]))).toEqual({ [comNome]: true, [semNome]: false });
        });

        it('depois da migração, antiga devolvida para pendente sai do ar (cláusula legada desligada)', async () => {
            expect((await getPublico()).map((d) => d.id)).toContain(legadoPendente);
            expect((await moderar({ id: legadoPendente, status: 'pendente' })).status).toBe(200);
            expect((await getPublico()).map((d) => d.id)).not.toContain(legadoPendente);
            // Mesmo inserida direto como 'pendente' antes do corte.
            const antiga = await inserirFicticia(pg, { status: 'pendente', createdAt: '2026-09-01 10:00:00' });
            expect((await getPublico()).map((d) => d.id)).not.toContain(antiga);
            expect((await getAdmin()).find((d) => d.id === antiga).legado_no_ar).toBe(false);
        });

        it('migração: pendente antiga vira aprovada; contagens batem', async () => {
            const { rows } = await pg.query('SELECT status FROM denuncias WHERE id = $1', [legadoPendente]);
            expect(rows[0].status).toBe('aprovada');
            expect(await contagemPorStatus(pg)).toEqual({ aprovada: 1, rejeitada: 1, resolvida: 1 });
        });
    } else {
        it('primeiro GET após migração já oculta antiga devolvida a pendente, sem reset nem espera', async () => {
            expect((await getPublico()).map((d) => d.id)).toContain(legadoPendente);
            await pg.exec(MIGRACAO);
            expect((await moderar({ id: legadoPendente, status: 'pendente' })).status).toBe(200);
            expect((await getPublico()).map((d) => d.id)).not.toContain(legadoPendente);
        });

        it('antes da migração, pendente anterior ao corte segue no ar e o admin vê o aviso', async () => {
            expect((await getPublico()).map((d) => d.id)).toContain(legadoPendente);
            const admin = await getAdmin();
            expect(admin.find((d) => d.id === legadoPendente).legado_no_ar).toBe(true);
            const nova = (await enviar()).json.id;
            expect((await getAdmin()).find((d) => d.id === nova).legado_no_ar).toBe(false);
        });

        it('sem a coluna publicar_nome, o POST funciona e o autor sai sempre "Anônimo"', async () => {
            const { res } = await enviar({ publicar_nome: true });
            expect(res.status).toBe(201);
            const { rows } = await pg.query(`SELECT count(*)::int AS n FROM information_schema.columns
                WHERE table_name = 'denuncias' AND column_name = 'publicar_nome'`);
            expect(rows[0].n).toBe(0);
            expect((await getPublico()).every((d) => d.autor === 'Anônimo')).toBe(true);
        });

        if (checkLegado) {
            it('aprovar antes da migração (CHECK sem "aprovada") devolve 409 explicando', async () => {
                const id = (await enviar()).json.id;
                const res = await moderar({ id, status: 'aprovada' });
                expect(res.status).toBe(409);
                expect((await res.json()).error).toMatch(/migração/);
                // Rejeitar funciona mesmo antes da migração.
                expect((await moderar({ id, status: 'rejeitada' })).status).toBe(200);
            });
        } else {
            it('sem CHECK, aprovar já funciona antes da migração', async () => {
                const id = (await enviar()).json.id;
                expect((await moderar({ id, status: 'aprovada' })).status).toBe(200);
                expect((await getPublico()).map((d) => d.id)).toContain(id);
            });
        }
    }
});

describe('PUT', () => {
    beforeEach(async () => {
        estado.db = adaptador(await criarBanco());
        _resetDeteccaoColuna();
    });

    it('exige admin', async () => {
        estado.admin = false;
        const res = await PUT(req('PUT', { body: { id: '00000000-0000-0000-0000-000000000000', status: 'aprovada' } }));
        expect(res.status).toBe(401);
    });

    it('recusa status inválido', async () => {
        expect((await moderar({ id: '00000000-0000-0000-0000-000000000000', status: 'publicada' })).status).toBe(400);
    });

    it('404 se a denúncia não existe', async () => {
        expect((await moderar({ id: '00000000-0000-0000-0000-000000000000', status: 'rejeitada' })).status).toBe(404);
    });
});

describe('POST', () => {
    beforeEach(async () => {
        estado.db = adaptador(await criarBanco());
        _resetDeteccaoColuna();
    });

    it('aceita comunidade fora da lista ("Outra" com texto livre)', async () => {
        const { res } = await enviar({ comunidade: 'Comunidade Fictícia', latitude: null, longitude: null });
        expect(res.status).toBe(201);
    });

    it('usa a coordenada da comunidade configurada quando o formulário não manda', async () => {
        const { json } = await enviar({ comunidade: 'Penha', latitude: null, longitude: null });
        const admin = await getAdmin();
        const d = admin.find((x) => x.id === json.id);
        expect(d.latitude).toBeCloseTo(-22.841, 3);
    });

    it('recusa campos obrigatórios vazios', async () => {
        const { res } = await enviar({ descricao: '   ' });
        expect(res.status).toBe(400);
    });
});

describe('Saída pública: comunidade, local e tipo', () => {
    let pg;
    beforeEach(async () => {
        pg = await criarBanco();
        estado.db = adaptador(pg);
        _resetDeteccaoColuna();
        await pg.exec(MIGRACAO);
    });

    it('comunidade fora da lista ("Outra") passa pela máscara; da lista sai igual', async () => {
        const livre = await inserirFicticia(pg, { status: 'aprovada', comunidade: 'Joana Quintanilha' });
        const caixaAlta = await inserirFicticia(pg, { status: 'aprovada', comunidade: 'perto da casa do JOÃO DA SILVA' });
        const conhecida = await inserirFicticia(pg, { status: 'aprovada', comunidade: 'Complexo do Alemão' });
        const publico = await getPublico();
        expect(publico.find((d) => d.id === livre).comunidade).toBe('[nome]');
        expect(publico.find((d) => d.id === caixaAlta).comunidade).toBe('perto da casa do [nome]');
        expect(publico.find((d) => d.id === conhecida).comunidade).toBe('Complexo do Alemão');
        expect(JSON.stringify(publico)).not.toMatch(/Quintanilha|SILVA/);
    });

    it('local_problema é mascarado', async () => {
        const id = await inserirFicticia(pg, { status: 'aprovada', localProblema: 'Em frente à casa da maria santos, tel 21 98888-7777' });
        const d = (await getPublico()).find((x) => x.id === id);
        expect(d.local_problema).toBe('Em frente à casa da [nome], tel [telefone]');
    });

    it('mascara sobrenomes desconhecidos nos três campos de texto público', async () => {
        const id = await inserirFicticia(pg, {
            status: 'aprovada',
            descricao: 'ENZO BERTOLUCCI RECLAMOU DO LIXO',
            localProblema: 'falar com joão quintanilha amanhã',
            comunidade: 'enzo zubrelvax',
        });
        const d = (await getPublico()).find((x) => x.id === id);
        expect(d.descricao).toBe('[nome] RECLAMOU DO LIXO');
        expect(d.local_problema).toBe('falar com [nome] amanhã');
        expect(d.comunidade).toBe('[nome]');
    });

    it('mascara joão pedro quintanilha em paraSaidaPublica nos três campos livres', async () => {
        const id = await inserirFicticia(pg, {
            status: 'aprovada',
            descricao: 'falar com joão pedro quintanilha amanhã',
            localProblema: 'falar com joão pedro quintanilha amanhã',
            comunidade: 'falar com joão pedro quintanilha amanhã',
        });
        const d = (await getPublico()).find((x) => x.id === id);
        for (const campo of ['descricao', 'local_problema', 'comunidade']) {
            expect(d[campo]).toBe('falar com [nome] amanhã');
        }
    });

    it('tipo fora da lista vira "outros" na saída', async () => {
        const id = await inserirFicticia(pg, { status: 'aprovada', tipo: 'Fulano Ciclano 21 98888-7777' });
        expect((await getPublico()).find((x) => x.id === id).tipo).toBe('outros');
    });

    it('filtros públicos só aceitam valores conhecidos (não sonda texto livre)', async () => {
        await inserirFicticia(pg, { status: 'aprovada', comunidade: 'Joana Quintanilha', tipo: 'tipo_livre' });
        await inserirFicticia(pg, { status: 'aprovada' });
        expect(await getPublico('?comunidade=Joana%20Quintanilha')).toEqual([]);
        expect(await getPublico('?tipo=tipo_livre')).toEqual([]);
        expect((await getPublico('?tipo=poste_caido')).length).toBeGreaterThan(0);
    });

    it('POST e PUT recusam tipo fora da lista', async () => {
        const { res } = await enviar({ tipo: '<b>qualquer</b>' });
        expect(res.status).toBe(400);
        const id = (await enviar()).json.id;
        expect((await moderar({ id, tipo: 'inventado' })).status).toBe(400);
        expect((await moderar({ id, tipo: 'saneamento' })).status).toBe(200);
    });
});

describe('CORTE_LEGADO', () => {
    it('é o mesmo valor no código e no arquivo de migração', () => {
        expect(MIGRACAO).toContain(`TIMESTAMP '${CORTE_LEGADO}'`);
    });
});

describe('Migração e rollback (arquivos SQL)', () => {
    it.each([false, true])('idempotente e reversível (CHECK legado: %s)', async (checkLegado) => {
        const pg = await criarBanco({ checkLegado });
        await inserirFicticia(pg, { status: 'pendente', createdAt: '2026-10-01 10:00:00' });
        await inserirFicticia(pg, { status: 'pendente', createdAt: '2026-10-05 10:00:00' });
        await inserirFicticia(pg, { status: 'resolvida', createdAt: '2026-10-02 10:00:00' });
        await inserirFicticia(pg, { status: 'rejeitada', createdAt: '2026-10-03 10:00:00' });
        // Nova, depois do corte: não pode ser aprovada pela migração.
        await inserirFicticia(pg, { status: 'pendente', createdAt: '2099-01-01 00:00:00' });
        const antes = await contagemPorStatus(pg);
        const checksAntes = (await pg.query(`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
            WHERE conrelid = 'denuncias'::regclass AND contype = 'c' ORDER BY conname`)).rows;

        await pg.exec(MIGRACAO);
        const depois1 = await contagemPorStatus(pg);
        await pg.exec(MIGRACAO); // idempotente
        expect(await contagemPorStatus(pg)).toEqual(depois1);
        expect(depois1).toEqual({ aprovada: 2, pendente: 1, rejeitada: 1, resolvida: 1 });
        expect((await pg.query('SELECT count(*)::int AS n FROM denuncias_migracao_fase1')).rows[0].n).toBe(2);

        const checks = (await pg.query(`SELECT conname FROM pg_constraint
            WHERE conrelid = 'denuncias'::regclass AND contype = 'c'`)).rows.map((r) => r.conname);
        expect(checks).toEqual(['denuncias_status_check_fase1']);
        await expect(pg.query("UPDATE denuncias SET status = 'publicada'")).rejects.toThrow();

        await pg.exec(ROLLBACK);
        await pg.exec(ROLLBACK); // idempotente
        expect(await contagemPorStatus(pg)).toEqual(antes);
        const checksDepois = (await pg.query(`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
            WHERE conrelid = 'denuncias'::regclass AND contype = 'c' ORDER BY conname`)).rows;
        expect(checksDepois).toEqual(checksAntes);
    });

    it.each([false, true])('reexecução preserva moderação; rollback permite nova conversão (CHECK: %s)', async (checkLegado) => {
        const pg = await criarBanco({ checkLegado });
        estado.db = adaptador(pg);
        _resetDeteccaoColuna();
        const id = await inserirFicticia(pg, { createdAt: '2026-10-01 10:00:00' });
        const status = async () => (await pg.query('SELECT status FROM denuncias WHERE id = $1', [id])).rows[0].status;

        await pg.exec(MIGRACAO);
        expect(await status()).toBe('aprovada');
        expect((await moderar({ id, status: 'pendente' })).status).toBe(200);
        await pg.exec(MIGRACAO);
        expect(await status()).toBe('pendente');
        expect((await getPublico()).map((d) => d.id)).not.toContain(id);
        expect((await pg.query('SELECT etapa FROM denuncias_migracao_fase1_execucao')).rows)
            .toEqual([{ etapa: 'conversao_legado' }]);

        await pg.exec(ROLLBACK);
        expect((await pg.query("SELECT to_regclass('denuncias_migracao_fase1_execucao') AS tabela")).rows[0].tabela).toBeNull();
        await pg.exec(MIGRACAO);
        expect(await status()).toBe('aprovada');
        expect((await getPublico()).map((d) => d.id)).toContain(id);
    });

    it('recusa rodar se status for ENUM, sem alterar nada', async () => {
        const pg = await criarBanco();
        await pg.exec(`DROP TABLE denuncias;
            CREATE TYPE status_denuncia AS ENUM ('pendente', 'resolvida');
            CREATE TABLE denuncias (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), status status_denuncia DEFAULT 'pendente',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`);
        await expect(pg.exec(MIGRACAO)).rejects.toThrow(/ENUM/);
        await pg.exec('ROLLBACK;').catch(() => {});
        const { rows } = await pg.query(`SELECT count(*)::int AS n FROM information_schema.columns
            WHERE table_name = 'denuncias' AND column_name = 'publicar_nome'`);
        expect(rows[0].n).toBe(0);
    });
});
