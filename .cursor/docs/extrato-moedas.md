# Extrato de Moedas

## Objetivo

Expor o histórico de transações de moedas (`coin_transaction`) com filtros de período e escopo (usuário ou família), incluindo totais de ganhos e gastos.

## Escopo

- Endpoint paginado de extrato completo (ganhos e gastos).
- Mesma regra de permissão dos relatórios financeiros (`resolveUserIds`).
- Remoção de tipos de crédito inexistentes na prática (`group`, `payment`, `store`, `resource`).
- Celebração de recompensa de tarefas domésticas ao abrir o hub de quests no app.

## Fluxo

1. App chama `GET /coin/statement` com `startDate`, `endDate`, `userId?`, `page`, `limit`.
2. API resolve os `userIds` permitidos (admin vê família; membro vê só a si).
3. Retorna totais + lista ordenada por data decrescente.
4. Ao abrir `/new-resources/quests`, app consulta recompensas pendentes de tarefas e dispara animação.

## Contratos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/coin/statement` | Extrato paginado + totais |
| GET | `/family-groups/:id/chores/coin-rewards/pending` | Soma de moedas de tarefas aprovadas ainda não celebradas |
| POST | `/family-groups/:id/chores/coin-rewards/celebrate` | Marca como celebradas e retorna total |

### Query `GET /coin/statement`

- `startDate`, `endDate` — intervalo (defaults: mês atual).
- `userId` — omitido, UUID ou `all` (mesma semântica dos relatórios).
- `page`, `limit` — paginação (default 1, 20).

### Resposta

```json
{
  "totals": { "totalEarned": 0, "totalSpent": 0 },
  "data": [
    {
      "id": "uuid",
      "amount": 10,
      "transactionType": "earn",
      "description": "...",
      "balanceBefore": 0,
      "balanceAfter": 10,
      "createdAt": "...",
      "userId": "uuid",
      "userName": "Nome"
    }
  ],
  "meta": { "...": "..." },
  "links": { "...": "..." }
}
```

## Regras de negócio

- `totalEarned`: soma de `earn`, `bonus`, `refund`.
- `totalSpent`: soma de `spend`, `penalty`.
- Créditos automáticos ativos: `coupon` (+5), `revenue` (+10), missões e tarefas (valor variável).
- `coinRewardCelebratedAt` em `chore_occurrence`: nulo até o assignee abrir o hub de quests.

## Arquivos-chave

- `src/coin/coin.service.ts` — `getStatement`, tipos de crédito
- `src/coin/coin.controller.ts` — `GET /statement`
- `src/coin/repositories/coin.repository.ts` — queries do extrato
- `src/chore/chore.service.ts` — celebração de recompensa
- `db/migrations/1775000000000-AddChoreCoinRewardCelebratedAt.ts`

## Testes

```bash
cd api/shop-smart
npm run test -- --testPathPattern=coin.service.spec
npm run test -- --testPathPattern=chore.service.spec
npm run test:e2e:low-mem -- --testPathPattern=coin-statement
npm run lint
```
