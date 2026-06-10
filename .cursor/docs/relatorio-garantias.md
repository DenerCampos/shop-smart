# Relatório de Garantias

## Objetivo

Listar itens de despesa que possuem garantia cadastrada, ordenados pela data de término (vencimentos mais próximos primeiro), com busca, filtros e acesso ao cupom fiscal.

## Escopo

- Itens com `warrantyDuration`, `warrantyUnit` e `warrantyExpiresAt` preenchidos.
- Apenas despesas raiz de parcelamento (parcela 1 ou não parcelado).
- Filtro padrão: garantias **ativas** (`warrantyExpiresAt >= hoje`).
- Opção para incluir garantias **vencidas**.
- Filtro por **ano da compra** (`expense.date`).
- Filtro por membro da família (mesma regra dos demais relatórios).
- Paginação de 25 itens por página.

## Fluxo (app)

1. Dashboard → tile **Garantias** → `/dashboard/warrantyItems`.
2. Usuário ajusta ano, membro (se admin), busca por nome e filtro ativo/vencidas.
3. Lista exibe nome do item, despesa/loja, data de compra, duração, término e dias restantes.
4. Toque na linha abre `FinancialReceiptDrawer` (`GET /expense/:id/receipt`).

## Contrato HTTP

`GET /reports/warranty-items`

| Query | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `year` | `YYYY` | ano atual | Ano da data de compra |
| `userId` | UUID \| `all` | escopo admin/membro | Filtro de membro |
| `search` | string | — | Nome do item (contém, case-insensitive) |
| `includeExpired` | boolean | `false` | Incluir garantias vencidas |
| `page` | number | `1` | Página |
| `limit` | number | `25` | Itens por página (máx. 100) |

Resposta paginada (`data`, `meta`, `links`). Cada item inclui: `id`, `name`, `quantity`, `warrantyDuration`, `warrantyUnit`, `warrantyExpiresAt`, `purchaseDate`, `daysRemaining`, `isExpired`, `expenseId`, `expenseName`, `storeName`, `userId`, `userName`.

## Regras de negócio

- Ordenação: `warrantyExpiresAt ASC`.
- `daysRemaining`: diferença em dias até o vencimento (negativo se vencida).
- Multi-tenant via `resolveUserIds` do módulo `reports` (grupo familiar).

## Arquivos-chave

**API:** `reports.controller.ts`, `reports.service.ts`, `repositories/reports.repository.ts`, DTOs `warranty-items-*`.

**App:** `pages/Dashboard`, `ReportView`, `WarrantyItemsPanel`, `useWarrantyItems`, `services/reports.ts`.

## Testes

- API: `npm run test -- reports.service.spec` (estender se necessário).
- App: `npm run build` e validação manual no dashboard.
