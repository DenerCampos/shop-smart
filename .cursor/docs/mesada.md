# Mesada / liquidação de quests (SP-113)

## Objetivo

Fechar o período de mesada das tarefas aprovadas, registrar o fechamento no domínio `chore`, gerar movimentação financeira (despesa para quem aprovou, receita para quem executou) e permitir consulta do histórico de liquidações pelo admin.

## Escopo

- Liquidação (`POST .../payroll/settle`) com criação de despesa/receita.
- Consulta de liquidação por período (`GET .../payroll/settlements`).
- Regra de rollover: tarefas aprovadas após o fechamento do mês corrente passam para o mês seguinte (`earnedPeriodYm`).

Fora do escopo: estorno de liquidação; edição manual de `earnedPeriodYm` pelo admin.

## Fluxo — liquidar

1. Admin chama `POST /family-groups/:id/chores/payroll/settle` com `{ periodYm }`.
2. API valida admin, unicidade do período e ocorrências `COMPLETED` pendentes (`payrollSettlementId IS NULL`, `earnedPeriodYm = periodYm`).
3. Em transação: cria `chore_payroll_settlement`, linhas por membro, vincula ocorrências.
4. Na mesma transação:
   - **Despesa agregada** por aprovador (`approvedBy`): itens = título da tarefa + valor; categoria `Mesada`; pagamento `Dinheiro`; loja `Mesada`; data = último dia do período.
   - **Receita agregada** por executor (`assignedTo`): nome lista tarefas e valores; data = último dia do período.
5. Sem moedas nem eventos `expense.created` / `revenue.created` (não afeta missões diárias).

## Fluxo — aprovar após fechamento

1. Admin aprova ocorrência no mês M.
2. Se já existe `chore_payroll_settlement` para M no grupo, `earnedPeriodYm` = M+1.
3. Caso contrário, `earnedPeriodYm` = M (mês da aprovação).

## Fluxo — devolver para ajuste (SP-115)

1. Admin abre **Aprovações** com ocorrência em `WAITING_APPROVAL`.
2. `POST .../occurrences/:id/return-for-adjustment` (sem body).
3. Status volta para `IN_PROGRESS`; `assignedTo` permanece o executor original.
4. `submittedAt`, `approvedBy` e `rejectionReason` são limpos; fotos permanecem para o executor revisar.
5. Executor pode reenviar fotos e submeter novamente.

## Contratos HTTP

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `.../payroll/pending?year&month` | membro | Pendentes por período |
| GET | `.../payroll/suggestion` | admin | Sugestão (mês anterior) |
| GET | `.../payroll/settlements?year&month` | admin | Detalhe da liquidação ou `null` |
| POST | `.../payroll/settle` | admin | Liquida período |
| POST | `.../occurrences/:occurrenceId/return-for-adjustment` | admin | Devolve ocorrência para `IN_PROGRESS` (SP-115) |

**Resposta `GET payroll/settlements`:** `{ id, periodYm, settledAt, settledBy, members: [{ member, totalAmount }], totalSettled }` ou `null`.

**Erros `POST settle`:** `409` período já liquidado ou sem pendentes.

## Regras de negócio

- `periodYm` formato `YYYYMM` (ex.: `202605`).
- Um fechamento por `(familyGroupId, periodYm)` — índice único.
- Valor da mesada vem de `snapshotRewardMoney` na aprovação/início.
- Data financeira: último dia civil do `periodYm` (fuso do servidor).

## Arquivos-chave

| Arquivo | Papel |
|---------|--------|
| `chore/chore.service.ts` | `settlePayroll`, `getPayrollSettlement`, rollover na aprovação, `returnOccurrenceForAdjustment` (SP-115) |
| `chore/utils/period-ym.util.ts` | Helpers de período |
| `expense/expense.service.ts` | `createPayrollExpense` |
| `revenue/revenue.service.ts` | `createPayrollRevenue` |
| `chore/repositories/chore.repository.ts` | Queries de folha e liquidação |

## Testes

```bash
npm run test -- --testPathPattern=chore.service.spec
npm run test:e2e:low-mem -- --testPathPattern=chore.e2e-spec
```
