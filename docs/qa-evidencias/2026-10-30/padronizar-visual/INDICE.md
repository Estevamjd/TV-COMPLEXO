# Índice de evidências — padronizar-visual (PR #11, rascunho)

Ramo `fix/padronizar-visual`. Commit de código: `4028b42` (2026-10-30 02:21:31 BRT, pai `1bd8f86`).
Este índice só organiza arquivos que **já existiam** no box. Nada foi rodado de novo: nenhum build, teste, Lighthouse ou print novo.
Horários em BRT (UTC-3), tirados da data do arquivo (mtime) ou do `fetchTime` do Lighthouse.

## Avisos que valem para tudo
- Build, `next start` e Playwright rodaram **SEM `DATABASE_URL`**. Eles mostram só **estados vazios** e **rotas com HTTP 200**. **Não provam o fluxo real com dados.** O `start.log` mostra `ECONNREFUSED` ao buscar vídeos.
- **Ressalva canvas/LCP (review r3):** os tiles do mapa passaram a ser desenhados em `<canvas>`, que fica fora da conta do LCP. Então o salto de `/denuncias` de 67 para 100 em Performance **não prova** que o mapa carrega mais rápido.
- **QA publicado: bloqueado por login.** O preview da Vercel pede login. Não foi usado bypass, share link nem OAuth. Todas as medidas aqui são **LOCAIS** (`localhost:3123`).

## Conciliação 806 × 808 × 4028b42
| Hora (BRT) | Artefato | O que diz | Código a que se refere |
|---|---|---|---|
| 01:53 | `logs/tvpad-prompt.txt` | pedido ao Claude | — |
| 02:08 | `prints-depois-pre-fix1/` | prints + `medidas.json`/`shots.log` | working tree **antes** da correção r1 (fix1) e da correção do mapa (fix2) |
| 02:09 | `resumo-claude.md` (já no ramo) e `logs/tvpad-claude.log` | "Nada foi commitado", **806 testes** em 14 arquivos | primeira versão, sem commit |
| 02:10 | `tvpad-review-r1.log` (já no ramo) | REQUEST_CHANGES | primeira versão |
| 02:11 | `logs/tvpad-fix1.log` | `BarraNavegacao` + teste novo: **808/808** em 15 arquivos | versão + fix1, sem commit |
| 02:13 | `logs/tvpad-build.log`, `logs/tvpad-start.log` | build ok; start sem banco | versão + fix1 |
| 02:13 | `tvpad-review-r2.log` (já no ramo) | APPROVE | versão + fix1 |
| 02:13–02:15 | `lighthouse/intermediario-fix1/` | `/denuncias` 67, LCP 7,4 s | versão + fix1 |
| 02:17 | `logs/tvpad-fix2.log`, `lighthouse/intermediario-fix2/` | mapa: altura reservada, leaflet.css local, canvas; 808 testes | versão + fix1 + fix2 |
| 02:18–02:19 | `lighthouse/final-4028b42/`, `logs/lh-server.log` | 97/100/100/100/100/99/99 | código final = 4028b42 |
| 02:20 | `tvpad-mapa-390.png` (já no ramo) | print do mapa a 390 | código final |
| 02:21 | `tvpad-review-r3.log` (já no ramo) | APPROVE com ressalva canvas/LCP | código final |
| 02:21:31 | commit `4028b42` | um único commit | — |

Conclusão: o "806 / nada commitado" do resumo é verdade **para as 02:09**. Depois disso vieram o fix1 (que somou 2 testes: **808**) e o fix2, ainda sem commit. Tudo entrou no único commit `4028b42`. Conferido: o diff de código de `4028b42` é **idêntico** ao `/tmp/tvpad-final.patch` (02:20). A única diferença é o `stack-decision.md` e os `docs/`, que foram adicionados na hora do commit. O `resumo-claude.md` no ramo é o mesmo arquivo de 02:09 e por isso ainda diz 806. Ele **não** foi editado.

## Arquivos desta pasta
- `logs/`: `tvpad-prompt.txt`, `tvpad-claude.log`, `tvpad-fix1.log`, `tvpad-fix2.log`, `tvpad-build.log`, `tvpad-start.log`, `lh-server.log`.
- `lighthouse/final-4028b42/`: `f_*.json` (7 rotas, mobile). Resumo em `../lighthouse-mobile.txt` (já no ramo).
- `lighthouse/intermediario-fix1/`: `m_*.json` (6 rotas). `lighthouse/intermediario-fix2/`: `n_denuncias.json`, `n_home.json`.
- `prints-depois-pre-fix1/`: 36 PNG (390 e 1440), `medidas.json` e `shots.log`. **Atenção:** são de antes do fix1/fix2, então não mostram a barra final da Início nem o mapa final.
- `prints-antes/`: 14 WEBP do site antes da mudança (01:52).
- `contexto/`: `tv-audit.md` e `tv-fixlist.md` (a crítica que gerou o pedido).
- Já estavam no ramo, na pasta de cima: `resumo-claude.md`, `lighthouse-mobile.txt`, `tvpad-mapa-390.png` e `tvpad-review-r1/r2/r3.log`.

## AUSENTE (não existe arquivo)
- Saída do `npx vitest run` (806 e 808 são números **relatados**, sem log).
- Saída do `npx tsc --noEmit` e do eslint (relatados).
- Saída do Playwright do toque no mapa ("Mexer no mapa") e saída do `checks.py`.
- Prints "depois" do código final, fora o `tvpad-mapa-390.png`.
- Qualquer QA publicado (bloqueado por login).
- Teste com banco e dados reais.

## Não incluído
- Patches de código (`tvpad-wip-0158.patch`, `tvpad-final.patch`): são código, e o final já é o commit.
- Scripts de print (`/tmp/tvpad-scripts/`).
- Nenhum arquivo passou de 5 MB.

## Sanitização
E-mails e IP de rede interna trocados por `[REDACTED-*]` nos textos. Não havia tokens, cookies, cabeçalhos Authorization, parâmetros de bypass/share nem IDs de conta/time. Os PNG/WEBP não foram editados: eles podem mostrar o e-mail público de contato que aparece no próprio site. O gitleaks rodou na pasta: sem achados.
