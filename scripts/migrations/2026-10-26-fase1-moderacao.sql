-- =============================================================================
-- Migração Fase 1 — moderação e anonimização das denúncias (R2/R3)
-- Arquivo: scripts/migrations/2026-10-26-fase1-moderacao.sql
-- Rollback: scripts/migrations/2026-10-26-fase1-moderacao.rollback.sql
--
-- NÃO aplicar sem: (a) backup verificado e (b) revisão do Estevam.
-- Procedimento completo em MIGRACAO-PLANO.md (raiz do repositório).
--
-- O que faz (idempotente — rodar duas vezes não muda o resultado):
--   1. Recusa rodar se denuncias.status for ENUM (exige outro caminho).
--   2. Adiciona publicar_nome BOOLEAN NOT NULL DEFAULT false (consentimento).
--   3. Guarda e remove os CHECKs preexistentes sobre status. Sempre cria
--      denuncias_status_check_fase1, se ainda não existir, aceitando os
--      4 status (pendente, aprovada, rejeitada, resolvida).
--   4. Registra e troca para 'aprovada' as 'pendente' criadas ANTES do corte
--      (as que já estavam no ar continuam no ar). Só na PRIMEIRA execução:
--      a marca em denuncias_migracao_fase1_execucao impede que uma reexecução
--      reaprove antigas que o admin devolveu para 'pendente' depois.
--
-- CORTE_LEGADO: '2026-10-26 16:00:00' (UTC). Tem que ser IGUAL ao valor de
-- CORTE_LEGADO em lib/corte-legado.js. Se o corte mudar antes do merge, troque
-- nos dois lugares.
-- =============================================================================

BEGIN;

-- 1. Guarda: status como ENUM não é tratado por este arquivo.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'denuncias'
          AND column_name = 'status' AND data_type = 'USER-DEFINED'
    ) THEN
        RAISE EXCEPTION 'denuncias.status é ENUM: adicionar o valor aprovada com ALTER TYPE antes (ver MIGRACAO-PLANO.md). Nada foi alterado.';
    END IF;
END $$;

-- 2. Consentimento para mostrar o primeiro nome (anônimo por padrão).
ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS publicar_nome BOOLEAN NOT NULL DEFAULT false;

-- 3. CHECK de status (defensivo).
CREATE TABLE IF NOT EXISTS denuncias_migracao_fase1_checks (
    conname   TEXT PRIMARY KEY,
    definicao TEXT NOT NULL,
    salvo_em  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT conname, pg_get_constraintdef(oid) AS definicao
        FROM pg_constraint
        WHERE conrelid = 'denuncias'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%status%'
    LOOP
        IF r.conname = 'denuncias_status_check_fase1' THEN
            CONTINUE; -- já é o CHECK desta migração (segunda execução)
        END IF;
        INSERT INTO denuncias_migracao_fase1_checks (conname, definicao)
        VALUES (r.conname, r.definicao)
        ON CONFLICT (conname) DO NOTHING;
        EXECUTE format('ALTER TABLE denuncias DROP CONSTRAINT %I', r.conname);
    END LOOP;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'denuncias'::regclass AND conname = 'denuncias_status_check_fase1'
    ) THEN
        ALTER TABLE denuncias ADD CONSTRAINT denuncias_status_check_fase1
            CHECK (status IN ('pendente', 'aprovada', 'rejeitada', 'resolvida'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_denuncias_status ON denuncias(status);

-- 4. As 'pendente' anteriores ao corte já estavam no ar: viram 'aprovada'.
--    O registro guarda os ids para o rollback (mesmo tipo de id da tabela).
--    Só converte se a marca 'conversao_legado' ainda não existe (primeira
--    execução, ou primeira depois de um rollback, que apaga a marca).
CREATE TABLE IF NOT EXISTS denuncias_migracao_fase1 AS
    SELECT id, status AS status_anterior, CURRENT_TIMESTAMP::timestamp AS migrado_em
    FROM denuncias
    WITH NO DATA;

CREATE TABLE IF NOT EXISTS denuncias_migracao_fase1_execucao (
    etapa        TEXT PRIMARY KEY,
    concluida_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO denuncias_migracao_fase1 (id, status_anterior, migrado_em)
SELECT d.id, d.status, CURRENT_TIMESTAMP
FROM denuncias d
WHERE d.status = 'pendente'
  AND d.created_at < TIMESTAMP '2026-10-26 16:00:00'
  AND NOT EXISTS (SELECT 1 FROM denuncias_migracao_fase1 m WHERE m.id = d.id)
  AND NOT EXISTS (SELECT 1 FROM denuncias_migracao_fase1_execucao e WHERE e.etapa = 'conversao_legado');

UPDATE denuncias d
SET status = 'aprovada'
FROM denuncias_migracao_fase1 m
WHERE d.id = m.id
  AND d.status = 'pendente'
  AND NOT EXISTS (SELECT 1 FROM denuncias_migracao_fase1_execucao e WHERE e.etapa = 'conversao_legado');

INSERT INTO denuncias_migracao_fase1_execucao (etapa) VALUES ('conversao_legado')
ON CONFLICT (etapa) DO NOTHING;

COMMIT;

-- Verificação (só leitura), rodar depois:
--   SELECT status, count(*) FROM denuncias GROUP BY status ORDER BY status;
--   SELECT count(*) FROM denuncias_migracao_fase1;
--   SELECT etapa, concluida_em FROM denuncias_migracao_fase1_execucao;
--   SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'denuncias'::regclass;
