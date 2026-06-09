# Parcelamento financeiro e comprovante (receipt)

## Objetivo

Suportar parcelamento finito e infinito em despesas e receitas, garantia por item, fotos anexas e visualização tipo cupom fiscal via endpoint dedicado.

## Escopo

- Campos de parcelamento em `Expense` e `Revenue`
- Garantia por item em `Item`
- Fotos (até 5) em despesa/receita via FileStorage
- Geração de lote no create (finito) ou parcela 1 + confirmação mensal (infinito)
- Endpoint `GET /expense|revenue/:id/receipt`
- Filtro de últimos lançamentos: parcelas finitas futuras ocultas fora do mês calendário atual

## Fluxo

### Create — parcelamento finito

1. Cliente envia `recurrence` com `mode: installment_finite` e `count`
2. `InstallmentPlannerService` gera N lançamentos com `installmentGroupId`, datas e valores divididos
3. Todos persistidos no mesmo request; sem modal mensal

### Create — parcelamento infinito

1. Cliente envia `recurrence` com `mode: installment_infinite`
2. Apenas parcela 1 é criada (`totalInstallments: null`)
3. Modal mensal (`/expense|revenue/recurring/current-month`) lista parcelas pendentes
4. `POST /expense|revenue/recurring/confirm` gera próxima parcela editável

### Receipt

`GET /expense/:id/receipt` ou `GET /revenue/:id/receipt` retorna payload para UI tipo cupom (itens, pagamento, fotos, parcela, garantias).

### Fotos

- `POST /expense|revenue/:id/photos` — multipart, máx. 5
- `DELETE /expense|revenue/:id/photos` — body `{ photoUrl }`

### Delete

- `DELETE /expense|revenue/:id?deleteGroup=true` remove grupo inteiro de parcelas

## Contratos

### Recurrence (create)

```json
{
  "enabled": true,
  "mode": "installment_finite | installment_infinite | fixed_repeat",
  "count": 12,
  "intervalUnit": "months",
  "intervalValue": 1,
  "dueDay": 10
}
```

### Edit — `GET /expense/:id` e `GET /revenue/:id`

Além de `items[]` e `photos[]`, a despesa retorna blocos agrupados para o formulário stepper:

```json
{
  "items": [
    {
      "code": "123",
      "name": "Televisão",
      "warrantyDuration": 12,
      "warrantyUnit": "months",
      "warrantyExpiresAt": "2027-06-08T00:00:00.000Z"
    }
  ],
  "photos": [ "https://..." ],
  "recurrence": {
    "enabled": true,
    "mode": "installment_finite",
    "count": 12,
    "intervalUnit": "months",
    "intervalValue": 1,
    "dueDay": 10
  }
}
```

- `recurrence` — reconstruído a partir dos flags de parcelamento/repeat da entidade (intervalo padrão `months/1` quando não persistido).
- Garantia — campos `warrantyDuration`, `warrantyUnit` e `warrantyExpiresAt` em cada elemento de `items[]` (create/update/leitura). Não existe array `warranties` no response.
- Receita inclui apenas `recurrence` no detalhe (sem garantia).
- Listagens (`GET /expense`, `/current-month`, etc.) usam DTO resumido **sem** `recurrence`; detalhe/edit (`GET /:id`, `POST`, `PATCH`) incluem `recurrence`.

### Campos de parcelamento (entidade)

| Campo | Descrição |
|-------|-----------|
| `installmentGroupId` | UUID do grupo |
| `installmentNumber` | Número da parcela (1-based) |
| `totalInstallments` | Total finito ou `null` (∞) |
| `isInstallment` | Flag derivada |
| `photos` | JSON string[] |

## Regras de negócio

- Valor de item ≥ 0 (zero permitido)
- Divisão de valor: centavos distribuídos nas primeiras parcelas
- `installmentLabel`: ex. "Parcela 2 de 12" ou "Parcela 3 de ∞"
- Últimos lançamentos (`profile`): parcelas finitas com vencimento fora do mês atual não aparecem

### Datas — cadastro (parcelamento finito)

1. **Parcela 1** — data do cadastro (campo `date` do formulário), normalizada em meio-dia UTC no fuso `America/Sao_Paulo`.
2. **Parcelas 2..N** — dia de vencimento (`recurrence.dueDay`) no intervalo configurado (`intervalUnit` / `intervalValue`).

### Datas — edição (parcelamento finito)

Ao editar a parcela **K**, preservam-se as datas das parcelas **1..K** (inclusive). Somente parcelas **K+1..N** são recalculadas com o novo `dueDay` / intervalo / quantidade. Se não existirem parcelas posteriores, nenhuma data é alterada.

### `dueDay` no GET (edit)

Inferido da **parcela 2** do grupo (não da parcela 1), para refletir o vencimento configurado e não o dia do cadastro.

### Valor (`value`) — contrato create/update

| Tipo | Payload do cliente | Backend |
|------|-------------------|---------|
| **Despesa** | Sem `value`; enviar `items[]` com `value` (unitário) e `quantity`. `total` por item é opcional. | Calcula `item.total = value × quantity` e `expense.value = soma dos itens`. |
| **Receita** | `value` obrigatório (valor informado pelo usuário; não há itens). | Valida, persiste e usa na divisão de parcelas. |

Rotas que **recalculam** valor no servidor: `POST/PATCH /expense`, `POST /expense/recurring/confirm`, `PATCH` item de despesa (`updateValueExpense`). Relatórios e `GET /revenue/value-current-month` leem valores já persistidos.

### Timezone

Datas persistidas em meio-dia UTC (`parseCalendarDateInput`) para evitar off-by-one entre API, MySQL e app (Brasil).

## Arquivos-chave

- `src/common/installment/installment.util.ts`
- `src/common/installment/installment-planner.service.ts`
- `src/expense/expense.service.ts`, `expense.controller.ts`, `expense.repository.ts`
- `src/revenue/revenue.service.ts`, `revenue.controller.ts`, `revenue.repository.ts`
- `db/migrations/1775200000000-AddFinancialInstallmentFields.ts`

## Testes

```bash
npm run test:e2e:low-mem -- --testPathPattern=expense
npm run test:e2e:low-mem -- --testPathPattern=revenue
```
