# Relatório Despesas vs Receitas

## Objetivo

Comparar totais mensais de despesas e receitas no ano selecionado (`GET /reports/expenses-income-comparison`).

## Contrato

Query: `year`, `userId` (opcional, família).

Response: **12 meses fixos** (`YYYY-01` … `YYYY-12`), com `totalExpenses` e `totalRevenues` zerados quando não houver lançamentos.

## Agrupamento

| Tipo | Campo de data | Agregação |
|------|---------------|-----------|
| Despesa | `expense.date` | `SUM(expense.value)` |
| Receita | `revenue.date` | `SUM(revenue.value)` |

Receitas usam **`date`** (data do lançamento), não `createdAt`.

## Recorrência e parcelas

O relatório soma **apenas registros persistidos** no banco, pelo mês da **data do lançamento**:

- **Parcelamento finito:** todas as parcelas são criadas no cadastro; cada parcela entra no mês da sua `date`.
- **Parcelamento infinito / recorrente:** entra cada parcela **confirmada** (via modal mensal ou create); meses sem confirmação **não** são projetados.
- **Recorrência `fixed_repeat`:** não há projeção automática; só conta o que foi registrado (incluindo novas confirmações mensais).

Não há duplicação por `repeat = true`: cada linha na tabela é somada uma vez.

## Arquivos-chave

- `reports/repositories/reports.repository.ts` — queries mensais
- `reports/reports.service.ts` — preenchimento jan–dez
- App: `BarChartExpensesIncome.tsx`

## Testes

```bash
cd api/shop-smart && npm test -- --testPathPattern=reports.service
cd app/super-family-quest && npm run build
```

---

## Relacionado — Despesas por Data (app)

`GET /reports/expense-by-date` agrupa `SUM(expense.value)` por `expense.date` no intervalo filtrado. O app preenche todos os dias entre `startDate` e `endDate` com zero quando não há lançamento (`fillDateRangeDays`).
