# Missões dinâmicas (SP-78 / SP-110)

## Objetivo

Gamificar o uso do app com missões diárias, mensais e conquistas únicas. Progresso é calculado na API via eventos de domínio; o app lista e resgata recompensas em moedas.

## Escopo

- Definições de missão (`mission_definition`) e progresso por usuário (`user_mission_progress`).
- Incremento automático via `EventEmitter` (`MissionEventsListener`).
- Reset diário (meia-noite America/Sao_Paulo) e mensal (dia 1).
- Endpoints `GET /missions` e `POST /missions/:progressId/claim`.

Fora do escopo: missões configuráveis pelo admin (definições são seed/migration).

## Fluxo

1. Usuário realiza ação (login, despesa, receita, lista, tarefa, etc.).
2. Service emite evento de domínio após persistência.
3. `MissionEventsListener` atualiza progresso (`incrementProgress` ou `setFinancialHealthProgress`).
4. App consulta `GET /missions` e exibe barras de progresso.
5. Usuário resgata moedas com `POST /missions/:progressId/claim` quando `isCompleted && !isClaimed`.

## Mapa evento → missão

| Evento | Missão (`key`) | Mecanismo |
|--------|----------------|-----------|
| `auth.login_success` | `daily_login` | +1 |
| `expense.created` | `daily_coupon` | +1 (qualquer cadastro de despesa) |
| `expense.created` | `monthly_spend_under_80/60/50` | recalcula % gasto/receita do mês |
| `revenue.created` | `daily_revenue` | +1 |
| `revenue.created` | `monthly_spend_under_80/60/50` | recalcula % gasto/receita do mês |
| `shopping_list.created` | `monthly_shopping_list` | +1 |
| `chore.approved` | `monthly_chore_complete` | +1 (assignee) |
| `recipe.created` | `once_first_recipe` | +1 |

**Nota (SP-110):** `daily_coupon` deixou de depender de `coupon.processed` / campo `uri` da despesa. Qualquer `POST /expense` conclui "Scanner do Dia".

## Missões diárias (seed)

| key | Título | Moedas |
|-----|--------|--------|
| `daily_login` | Acesso Diário | 5 |
| `daily_coupon` | Scanner do Dia | 15 |
| `daily_revenue` | Receita do Dia | 20 |

## Missões mensais (seed)

| key | Título | Gatilho |
|-----|--------|---------|
| `monthly_shopping_list` | Lista Colaborativa | criar lista |
| `monthly_chore_complete` | Tarefa Concluída | tarefa aprovada |
| `monthly_spend_under_80` | Controle Financeiro | gasto &lt; 80% da renda |
| `monthly_spend_under_60` | Poupador Dedicado | gasto &lt; 60% |
| `monthly_spend_under_50` | Mestre das Finanças | gasto &lt; 50% |

Saúde financeira: `spendPercent = expenseMonth / revenueMonth * 100`. Receita ≤ 0 e despesa &gt; 0 → 100%.

## Contratos HTTP

- `GET /missions` — JWT. Retorna `MissionWithProgressDto[]`.
- `POST /missions/:progressId/claim` — JWT. 200 `{ success: true }`; 403 se não concluída ou já resgatada.

## Regras de negócio

- Progresso lazy: sem linha em `user_mission_progress` até o primeiro evento.
- Missão diária/mensal já concluída no período não incrementa de novo.
- Missão `ONCE` concluída não incrementa novamente.
- Missão já resgatada (`isClaimed`) não é rebaixada pelo recálculo financeiro.
- Reset exclui linhas `isCompleted=true && isClaimed=false` (usuário deve resgatar antes do reset).

## Arquivos-chave

| Arquivo | Papel |
|---------|-------|
| `src/mission/mission.service.ts` | Progresso, claim, reset, saúde financeira |
| `src/mission/mission-events.listener.ts` | Listeners de eventos |
| `src/mission/mission-scheduler.service.ts` | Cron reset diário/mensal |
| `src/expense/expense.service.ts` | Emite `expense.created` |
| `src/revenue/revenue.service.ts` | Emite `revenue.created` |
| `db/migrations/1774900000000-CreateMissionTables.ts` | Tabelas + seed inicial |
| `db/migrations/1774950000000-AddDailyRevenueMission.ts` | Missão `daily_revenue` |

## App (super-family-quest)

- `src/pages/Missions/` — UI abas Diárias / Mensais / Conquistas
- `src/hooks/useMissions.ts`, `useMissionClaimReward.ts`
- `src/hooks/useExpensesMutations.ts`, `useRevenueMutations.ts` — invalidam `missionQueryKeys` após create

## Testes

```bash
# Unit
npm test -- --testPathPattern=mission-events.listener.spec
npm test -- --testPathPattern=revenue.service.spec

# E2E (requer migration 1774950000000 aplicada)
npm run test:e2e:low-mem -- --testPathPattern=mission.e2e-spec
```
