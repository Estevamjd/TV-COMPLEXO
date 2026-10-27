# MIGRACAO-PLANO — Fase 1 (moderação e anonimização das denúncias)

> **Quem aplica: o Estevam, depois de revisar este plano.** O agente não aplicou nada em nenhum banco remoto.
> Pré-requisitos: (1) backup verificado (seção 3); (2) as 3 consultas de schema (seção 2) conferidas; (3) de preferência, ensaio numa branch do Neon (seção 4).

Arquivos:
- `scripts/migrations/2026-10-26-fase1-moderacao.sql`: migração
- `scripts/migrations/2026-10-26-fase1-moderacao.rollback.sql`: rollback

## 1. O que muda

| Item | Antes | Depois |
|---|---|---|
| Status | `pendente` (pública), `resolvida`, `rejeitada` | `pendente` (**oculta**), `aprovada` (pública), `rejeitada` (nunca pública), `resolvida` (pública) |
| Consentimento de nome | não existe | `publicar_nome BOOLEAN NOT NULL DEFAULT false` |
| CHECK de status | desconhecido (schema real não lido) | CHECKs preexistentes sobre `status` são guardados e removidos. `denuncias_status_check_fase1` com os 4 status é sempre criado, se ainda não existir (idempotente) |
| Denúncias atuais | `pendente`, no ar | `aprovada`, continuam no ar (decisão §12.3) |

Registros criados pela migração (usados pelo rollback):
- `denuncias_migracao_fase1(id, status_anterior, migrado_em)`: ids que passaram de `pendente` para `aprovada`.
- `denuncias_migracao_fase1_checks(conname, definicao, salvo_em)`: definição original dos CHECKs removidos.
- `denuncias_migracao_fase1_execucao(etapa, concluida_em)`: marca `conversao_legado`, gravada na mesma transação. Reexecutar preserva antigas devolvidas pelo admin para `pendente`, sem reaprovar.

### Corte (`CORTE_LEGADO`)
Só viram `aprovada` as `pendente` com `created_at < '2026-10-27 22:15:00'` (UTC, 19:15 BRT de 27/10/2026, hora planejada da migração e do deploy).
**O mesmo valor está em `lib/corte-legado.js`.** O código usa esse corte para manter no ar as denúncias antigas enquanto a migração não roda. **Antes do merge, troque o valor nos dois lugares pelo instante do deploy em produção.** Assim as denúncias enviadas entre o PR e o deploy, que já estavam no ar, também continuam públicas. Um teste automatizado (`__tests__/denuncias-moderacao.test.js`, "CORTE_LEGADO") falha se os dois valores divergirem.

### Compatibilidade do código (funciona antes e depois)
- **Público, antes da migração:** `status IN ('aprovada','resolvida') OR (status='pendente' AND created_at < CORTE_LEGADO)`. As antigas continuam visíveis e as novas ficam ocultas.
- **Público, depois da migração:** só `status IN ('aprovada','resolvida')`. O código detecta a migração pela coluna `publicar_nome` (criada na mesma transação) e **desliga a cláusula legada**: se o admin devolver uma denúncia antiga para `pendente`, ela sai do ar. No admin, o selo "No ar (anterior à moderação)" só aparece antes da migração.
- **`publicar_nome` ausente:** a consulta com a coluna falha com `42703` e o código usa a versão sem ela, com autor "Anônimo". A ausência não é memorizada: cada request tenta a coluna novamente. Assim, o primeiro GET após a migração já desliga a cláusula legada, sem espera nem reinício do processo. Só a detecção positiva é memorizada.
Se a coluna `publicar_nome` for removida após a migração (limpeza opcional), é preciso reiniciar/redeployar a aplicação, pois o código memoriza que a coluna existe.

Antes da migração, o log do banco terá erros `42703` esperados nas tentativas de consultar `publicar_nome`; o fallback sem a coluna mantém as consultas funcionando.

- **Aprovar antes da migração:** se o banco tiver um CHECK sem `aprovada`, o PUT responde `409` com mensagem clara. Rejeitar funciona.

## 2. Antes de tudo: as 3 consultas de schema (só leitura)
No SQL editor do Neon:
```sql
SELECT column_name,data_type,column_default,is_nullable FROM information_schema.columns WHERE table_name='denuncias' ORDER BY ordinal_position;
SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='denuncias'::regclass;
SELECT status,count(*) FROM denuncias GROUP BY status;
```
O que conferir:
- `status` é `text`. Se for `USER-DEFINED` (ENUM), a migração **aborta sem alterar nada**. Nesse caso é preciso um passo extra (`ALTER TYPE ... ADD VALUE 'aprovada'`), que fica fora deste arquivo e deve ser revisto antes.
- `id` é `uuid` ou `text`. Os dois funcionam, porque o registro copia o tipo.
- Status existentes: se aparecer algum valor fora de `pendente/resolvida/rejeitada` **e** houver CHECK, a recriação do CHECK falha e a transação inteira é desfeita. Resolver antes.
- `created_at` sem fuso (`timestamp without time zone`) em UTC, como no `scripts/init-db.js`.

## 3. Backup (obrigatório) e verificação
1. Neon console → **Branches → Create branch** a partir de `main`/produção (snapshot, grátis), com um nome como `backup-pre-fase1-AAAAMMDD`. Alternativa: `pg_dump "$DATABASE_URL" -Fc -f backup-pre-fase1.dump`, rodado pelo Estevam na máquina dele, sem colar a URL em chat ou arquivo.
2. Verificação: rodar na **origem** e no **backup** e comparar. Os números têm que ser iguais:
   ```sql
   SELECT status, count(*) FROM denuncias GROUP BY status ORDER BY status;
   SELECT (SELECT count(*) FROM denuncias) AS denuncias, (SELECT count(*) FROM noticias) AS noticias,
          (SELECT count(*) FROM videos) AS videos, (SELECT count(*) FROM comentarios) AS comentarios;
   ```
3. Anotar as contagens (só números) para comparar depois.

## 4. Ensaio numa branch do Neon (recomendado)
1. Criar uma branch de teste (separada do backup) a partir da produção.
2. Rodar o arquivo de migração nela (seção 5) e conferir a seção 6.
3. Rodar o rollback e conferir que as contagens voltam às da seção 3.
4. Rodar a migração de novo (é idempotente) e conferir outra vez.
5. Se for usar essa branch no Preview: `DATABASE_URL` **só no target Preview** (STACK-DECISION §5). Isso é decisão do Estevam.

O ensaio local já foi feito com PGlite (Postgres em memória), nos testes automatizados: com e sem CHECK legado, migração rodada duas vezes, rollback rodado duas vezes, contagens e CHECKs restaurados, e status ENUM recusado.

## 5. Ordem de aplicação (produção)
1. Seções 2 e 3 feitas e conferidas. `CORTE_LEGADO` ajustado nos dois arquivos para o instante do deploy.
2. **Merge e deploy do código** (o código funciona antes da migração).
3. Conferir o site: as denúncias atuais seguem no mapa e uma denúncia nova de teste **não** aparece. Esse teste escreve em produção, então só com OK do Estevam. Se for feito, rejeitar ou apagar a denúncia de teste depois.
4. No SQL editor do Neon: colar e executar **todo** o conteúdo de `scripts/migrations/2026-10-26-fase1-moderacao.sql`. Ele roda em uma transação (`BEGIN … COMMIT`).
5. Verificação (seção 6).

### Ambiente com versão anterior já aplicada sem a marca

Antes de reexecutar, se uma versão anterior desta migração já foi aplicada sem a marca `conversao_legado`, criar a tabela e inserir a marca manualmente. Isso impede reaprovar denúncias antigas que o admin já devolveu para `pendente`:

```sql
CREATE TABLE IF NOT EXISTS denuncias_migracao_fase1_execucao (
    etapa TEXT PRIMARY KEY,
    concluida_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO denuncias_migracao_fase1_execucao (etapa) VALUES ('conversao_legado') ON CONFLICT DO NOTHING;
```

## 6. Verificação depois da migração
```sql
SELECT status, count(*) FROM denuncias GROUP BY status ORDER BY status;
SELECT count(*) FROM denuncias_migracao_fase1;
SELECT etapa, concluida_em FROM denuncias_migracao_fase1_execucao;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'denuncias'::regclass;
SELECT count(*) FILTER (WHERE publicar_nome) AS com_nome, count(*) AS total FROM denuncias;
```
**Impacto esperado (só contagens):**
- `aprovada` (depois) = `pendente` anteriores ao corte (antes). `count(*)` de `denuncias_migracao_fase1` deve dar o mesmo número.
- `pendente` (depois) = só as criadas depois do corte, que aguardam moderação.
- `resolvida` e `rejeitada`: inalteradas.
- Total de linhas: inalterado.
- `publicar_nome`: `com_nome = 0` (todas as antigas ficam "Anônimo").

O número exato só é conhecido com a 3ª consulta da seção 2. Ele deve ser igual ao `pendente` dela, menos as criadas depois do corte.

## 7. Rollback
Usar **junto com a volta do código anterior** (revert do merge), porque o código antigo não conhece `aprovada`.
1. Reverter o código e fazer o deploy.
2. Executar `scripts/migrations/2026-10-26-fase1-moderacao.rollback.sql` (idempotente, em transação):
   - toda `aprovada` volta para `pendente` (no código antigo, `pendente` é pública). Isso inclui as aprovadas pelo admin depois da migração;
   - remove `denuncias_status_check_fase1` e recria os CHECKs originais guardados;
   - apaga `denuncias_migracao_fase1_execucao`. Reaplicar depois do rollback converte novamente as antigas `pendente`, inclusive as devolvidas pelo admin. Os registros de ids e CHECKs são preservados.
3. Verificar com as consultas da seção 3. As contagens por status devem bater com as de antes, mais as denúncias novas criadas no meio tempo.
4. Efeito colateral: com o código antigo, as `pendente` não moderadas voltam a ser públicas. As `rejeitada` seguem ocultas.
5. Limpeza opcional, só com OK do Estevam (está comentada no fim do rollback): `DROP COLUMN publicar_nome` (perde os consentimentos) e `DROP TABLE` dos dois registros.
6. Último recurso: restaurar o backup da seção 3. Isso perde tudo o que foi escrito depois.

**Nota sobre produção:** já existe 1 denúncia `aprovada` anterior à migração (não criada por ela). Como o rollback também a converte para `pendente`, o resultado esperado é 12 `pendente` (11 + 1), não 11, sem considerar novas denúncias ou moderações.

## 8. Fora deste plano
- Upload público de mídia (`/api/upload` exige admin e responde 401 para o público). É pendência da Fase 1.
- Env de produção (`NEXT_PUBLIC_SITE_URL`, `ADMIN_PASSWORD_HASH`): o agente não alterou. Ver o corpo do PR.
