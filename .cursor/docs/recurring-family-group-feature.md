# Feature: Filtro de Recorrentes + Integração Family Group

## Resumo

Adicionado suporte a filtro de lançamentos recorrentes (`isRecurring`) nas rotas de listagem de despesas e receitas, com integração ao módulo de grupo familiar. Admins do grupo familiar visualizam dados de todos os membros; membros comuns veem apenas seus próprios dados.

---

## Arquitetura

### Novo Serviço: `FamilyMemberResolverService`

**Localização:** `src/common/family-member-resolver/family-member-resolver.service.ts`

Serviço utilitário registrado no `CommonModule` que resolve os `userIds` visíveis para um dado usuário. Elimina a necessidade de `ExpenseModule`/`RevenueModule` dependerem diretamente do `FamilyGroupModule`, evitando dependências circulares.

**Interface de retorno:**

```typescript
interface FamilyMemberResult {
  userIds: string[];   // IDs dos usuários cujos dados são visíveis
  isAdmin: boolean;    // Se o usuário é admin do grupo
  groupId: string | null; // ID do grupo familiar (null se não pertence a nenhum)
}
```

**Lógica de resolução:**

| Cenário | userIds retornados |
|---|---|
| Usuário não pertence a nenhum grupo | `[userId]` (apenas ele) |
| Usuário é `member` do grupo | `[userId]` (apenas ele) |
| Usuário é `admin` do grupo | `[userId, ...todosMembroAceitosIds]` (todos da família) |

### Novo DTO: `OwnerResponseDto`

**Localização:** `src/common/dto/owner-response.dto.ts`

DTO que expõe informações básicas do dono do lançamento (`id`, `name`, `profileImage`). Incluído nos response DTOs de expense e revenue para que o frontend saiba de quem é cada registro quando o admin visualiza dados da família.

---

## Endpoints Alterados

### `GET /expense`

**Novos query params:**

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `isRecurring` | `boolean` | Não | Filtra apenas despesas com `repeat = true` |

**Comportamento com Family Group:**
- Se o usuário for admin de um grupo familiar, retorna despesas de **todos os membros aceitos** do grupo.
- Se for membro (não admin) ou não pertencer a grupo, retorna apenas as despesas dele.
- Cada item do response agora inclui o campo `user` com `{ id, name, profileImage }`.

**Exemplos de chamada:**

```
GET /expense?isRecurring=true&page=1&limit=20
GET /expense?page=1&limit=10
GET /expense?isRecurring=true&search=aluguel
```

### `GET /revenue`

Mesma lógica do expense. Novos query params e comportamento idênticos.

```
GET /revenue?isRecurring=true&page=1&limit=20
GET /revenue?page=1&limit=10
```

---

## Arquivos Modificados

### Novos Arquivos

| Arquivo | Descrição |
|---|---|
| `src/common/family-member-resolver/family-member-resolver.service.ts` | Serviço de resolução de membros da família |
| `src/common/dto/owner-response.dto.ts` | DTO do dono do lançamento |

### Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `src/common/common.module.ts` | Registrou `FamilyMemberResolverService` e `FamilyGroupMember` entity |
| `src/expense/dto/expense-list.dto.ts` | Adicionou campo `isRecurring` |
| `src/revenue/dto/revenue-list.dto.ts` | Adicionou campo `isRecurring` |
| `src/expense/interface/expense.repository.interface.ts` | `findAll` agora recebe `userIds[]` e `isRecurring` |
| `src/revenue/interface/revenue.repository.interface.ts` | `findAll` agora recebe `userIds[]` e `isRecurring` |
| `src/expense/repositories/expense.repository.ts` | Query usa `IN (:...userIds)` + filtro `repeat` |
| `src/revenue/repositories/revenue.repository.ts` | Query usa `IN (:...userIds)` + filtro `repeat` |
| `src/expense/expense.service.ts` | Usa `FamilyMemberResolverService` no `findAll` |
| `src/revenue/revenue.service.ts` | Usa `FamilyMemberResolverService` no `findAll` |
| `src/expense/dto/expense-response.dto.ts` | Adicionou campo `user: OwnerResponseDto` |
| `src/revenue/dto/revenue-response.dto.ts` | Adicionou campo `user: OwnerResponseDto` |

---

## Response DTO Atualizado

### ExpenseResponseDto

```json
{
  "id": "uuid",
  "name": "Aluguel",
  "uri": null,
  "value": 1500.00,
  "repeat": true,
  "date": "2026-02-10T00:00:00.000Z",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z",
  "payment": { "id": "uuid", "name": "Débito automático" },
  "store": { "id": "uuid", "name": "Imobiliária" },
  "items": [...],
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "profileImage": "https://..."
  }
}
```

### RevenueResponseDto

```json
{
  "id": "uuid",
  "name": "Salário",
  "value": 5000.00,
  "repeat": true,
  "date": "2026-02-05T00:00:00.000Z",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-15T10:30:00.000Z",
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "profileImage": "https://..."
  }
}
```

---

## Fluxo de Dados

```
Controller (recebe query params via DTO)
    ↓
Service (resolve userIds via FamilyMemberResolverService)
    ↓
Repository (query com WHERE user IN (:...userIds) + filtro isRecurring)
    ↓
Response DTO (inclui user owner info)
```

---

## Notas Importantes

- O `FamilyMemberResolverService` acessa diretamente o `Repository<FamilyGroupMember>` via TypeORM, sem depender do `FamilyGroupService`. Isso evita dependência circular.
- O campo `user` no response é `null` quando o JOIN não carrega a relação (ex: rotas que não passam pelo `findAll` atualizado).
- As rotas de edição (`PATCH`) e exclusão (`DELETE`) permanecem inalteradas -- o membro só pode editar/excluir seus próprios dados, como já era antes.
