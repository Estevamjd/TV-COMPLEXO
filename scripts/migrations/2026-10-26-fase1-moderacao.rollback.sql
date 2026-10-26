-- =============================================================================
-- ROLLBACK da migração Fase 1 — moderação (2026-10-26-fase1-moderacao.sql)
--
-- Use junto com a volta do código anterior (o código antigo não conhece
-- 'aprovada'). Idempotente. Ver MIGRACAO-PLANO.md.
--
-- O que faz:
--   1. Toda 'aprovada' volta a 'pendente' (no código antigo, 'pendente' é
--      pública). Isso inclui as migradas e as aprovadas pelo admin depois.
--   2. Remove o CHECK desta migração e recria os CHECKs originais guardados.
--   3. NÃO apaga publicar_nome nem as tabelas de registro (o código antigo
--      ignora a coluna; apagar perde os consentimentos). Os comandos de
--      limpeza estão comentados no fim, para uso só com OK do Estevam.
--
-- Atenção: com o código antigo de volta, denúncias 'pendente' criadas depois
-- do corte (ainda não moderadas) voltam a ser públicas. 'rejeitada' segue oculta.
-- =============================================================================

BEGIN;

-- Contagem informativa do que volta a 'pendente'.
DO $$
DECLARE
    migradas integer := 0;
    total integer;
BEGIN
    IF to_regclass('denuncias_migracao_fase1') IS NOT NULL THEN
        EXECUTE 'SELECT count(*) FROM denuncias d JOIN denuncias_migracao_fase1 m ON m.id = d.id WHERE d.status = ''aprovada'''
        INTO migradas;
    END IF;
    SELECT count(*) INTO total FROM denuncias WHERE status = 'aprovada';
    RAISE NOTICE 'Rollback: % aprovada(s) voltam a pendente (% vieram da migração).', total, migradas;
END $$;

-- 1. aprovada → pendente
UPDATE denuncias SET status = 'pendente' WHERE status = 'aprovada';

-- 2. CHECK: remove o da migração e recria os originais (se foram guardados).
ALTER TABLE denuncias DROP CONSTRAINT IF EXISTS denuncias_status_check_fase1;

DO $$
DECLARE
    r record;
BEGIN
    IF to_regclass('denuncias_migracao_fase1_checks') IS NULL THEN
        RETURN;
    END IF;
    FOR r IN EXECUTE 'SELECT conname, definicao FROM denuncias_migracao_fase1_checks'
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = 'denuncias'::regclass AND conname = r.conname
        ) THEN
            EXECUTE format('ALTER TABLE denuncias ADD CONSTRAINT %I %s', r.conname, r.definicao);
        END IF;
    END LOOP;
END $$;

COMMIT;

-- Limpeza opcional (só com OK do Estevam, depois de conferir o rollback):
-- ALTER TABLE denuncias DROP COLUMN IF EXISTS publicar_nome;
-- DROP TABLE IF EXISTS denuncias_migracao_fase1;
-- DROP TABLE IF EXISTS denuncias_migracao_fase1_checks;
