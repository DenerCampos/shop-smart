# Missões dinâmicas (SP-78 / SP-110 / SP-112)

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
3. `MissionEventsListener` atualiza progresso (`incrementProgress`).
4. `GET /missions` sincroniza missões de saúde financeira com o **mês anterior fechado**.
5. App exibe barras de progresso; usuário resgata com `POST /missions/:progressId/claim` quando `isCompleted && !isClaimed`.

## Mapa evento → missão

| Evento | Missão (`key`) | Mecanismo |
|--------|----------------|-----------|
| `auth.login_success` | `daily_login` | +1 |
| `expense.created` | `daily_coupon` | +1 (qualquer cadastro de despesa) |
| `revenue.created` | `daily_revenue` | +1 |
| `shopping_list.created` | `monthly_shopping_list` | +1 |
| `chore.approved` | `monthly_chore_complete` | +1 (assignee) |
| `recipe.created` | `once_first_recipe` | +1 |

**Nota (SP-110):** `daily_coupon` deixou de depender de `coupon.processed` / campo `uri` da despesa. Qualquer `POST /expense` conclui "Scanner do Dia".

**Nota (SP-112):** missões `monthly_spend_under_*` **não** reagem a `expense.created` / `revenue.created`. São avaliadas em `GET /missions` com totais do **mês anterior**.

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
| `monthly_spend_under_80` | Controle Financeiro | gasto &lt; 80% da renda **do mês passado** |
| `monthly_spend_under_60` | Poupador Dedicado | gasto &lt; 60% **do mês passado** |
| `monthly_spend_under_50` | Mestre das Finanças | gasto &lt; 50% **do mês passado** |

Saúde financeira (SP-112): `spendPercent = expensePreviousMonth / revenuePreviousMonth * 100`. Receita ≤ 0 e despesa &gt; 0 → 100%. Transações do mês corrente não alteram essas missões.

## Contratos HTTP

- `GET /missions` — JWT. Retorna `MissionWithProgressDto[]`.
- `POST /missions/:progressId/claim` — JWT. 200 `{ success: true }`; 403 se não concluída, já resgatada ou **fora do período de resgate**.

## Regras de negócio

- Progresso lazy: sem linha em `user_mission_progress` até o primeiro evento (ou primeiro `GET /missions` para saúde financeira).
- Missão diária/mensal já concluída **no período atual** não incrementa de novo.
- Missão `ONCE` concluída não incrementa novamente.
- Missão já resgatada (`isClaimed`) não é rebaixada pelo recálculo financeiro.
- **Período de resgate (SP-112):**
  - **Diárias** (`daily_login`, `daily_coupon`, `daily_revenue`): só podem ser resgatadas no **mesmo dia** (America/Sao_Paulo) em que foram concluídas.
  - **Mensais** (`monthly_shopping_list`, `monthly_chore_complete`, `monthly_spend_under_*`): podem ser resgatadas **durante todo o mês** em que foram concluídas; ao virar o mês, resgate do período anterior é bloqueado.
- Reset diário/mensal zera **todo** progresso da frequência (inclui concluído não resgatado).
- Progresso expirado (fora do período) é exibido como incompleto em `GET /missions`, mesmo que a linha no banco ainda esteja `isCompleted=true` até o próximo reset.

## Arquivos-chave

| Arquivo | Papel |
|---------|-------|
| `src/mission/mission.service.ts` | Progresso, claim, reset, saúde financeira |
| `src/mission/utils/mission-period.util.ts` | Validação de período diário/mensal (America/Sao_Paulo) |
| `src/mission/mission-events.listener.ts` | Listeners de eventos |
| `src/mission/mission-scheduler.service.ts` | Cron reset diário/mensal |
| `src/expense/expense.service.ts` | Emite `expense.created`; `getExpenseByPreviousMonth` |
| `src/revenue/revenue.service.ts` | Emite `revenue.created`; `getRevenueByPreviousMonth` |
| `src/common/utils/dates.util.ts` | `APP_TIMEZONE`, `getPreviousMonthDates` (calendário America/Sao_Paulo) |
| `db/migrations/1774900000000-CreateMissionTables.ts` | Tabelas + seed inicial |
| `db/migrations/1774950000000-AddDailyRevenueMission.ts` | Missão `daily_revenue` |
| `db/migrations/1775100000000-UpdateFinancialMissionDescriptions.ts` | Descrições mês passado |

## App (super-family-quest)

- `src/pages/Missions/` — UI abas Diárias / Mensais / Conquistas
- `src/hooks/useMissions.ts`, `useMissionClaimReward.ts`
- `src/hooks/useExpensesMutations.ts`, `useRevenueMutations.ts` — invalidam `missionQueryKeys` após create

## Testes

```bash
# Unit
npm test -- --testPathPattern=mission-events.listener.spec
npm test -- --testPathPattern=mission.service.spec
npm test -- --testPathPattern=mission-period.util.spec
npm test -- --testPathPattern=dates.util.spec

# E2E (requer migrations aplicadas)
npm run test:e2e:low-mem -- --testPathPattern=mission.e2e-spec
```

## Mudanças (SP-112)

- Missões financeiras passam a usar totais do **mês anterior**; descrições atualizadas na migration `1775100000000`.
- Resgate bloqueado fora do período (dia para diárias, mês para mensais).
- Reset cron passa a zerar também missões concluídas não resgatadas.
