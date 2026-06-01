# Lista de Compras - Documentacao Completa

## Visao Geral

Modulo de Lista de Compras compartilhada para o Shop Smart API. Permite criar listas pessoais ou vinculadas a um grupo familiar, com atualizacoes em tempo real via WebSocket (Socket.IO), sugestoes inteligentes de itens baseadas no historico de compras, e integracao com Alexa via token pessoal.

---

## Arquitetura

```
src/shopping-list/
  shopping-list.module.ts
  shopping-list.controller.ts
  shopping-list.service.ts
  shopping-list.gateway.ts              # WebSocket Gateway (Socket.IO)
  entities/
    shopping-list.entity.ts
    shopping-list-item.entity.ts
  dto/
    create-shopping-list.dto.ts
    update-shopping-list.dto.ts
    create-shopping-list-item.dto.ts
    update-shopping-list-item.dto.ts
    shopping-list-filter.dto.ts
    item-suggestion.dto.ts
    alexa-add-item.dto.ts
    shopping-list-response.dto.ts
    shopping-list-detail-response.dto.ts
    shopping-list-item-response.dto.ts
    item-suggestion-response.dto.ts
  repositories/
    shopping-list.repository.ts
  interfaces/
    shopping-list.repository.interface.ts
  types/
    shopping-list-status.type.ts        # 'active' | 'completed' | 'archived'
    shopping-list-item-status.type.ts   # 'pending' | 'in_cart'
    shopping-list-item-unit.type.ts     # 'un' | 'kg' | 'g' | 'l' | 'ml' | 'pack' | 'dz'
```

---

## Endpoints REST

### Shopping Lists

#### `GET /shopping-lists`

Lista todas as listas do usuario (pessoais + do grupo familiar).

**Auth**: Bearer Token (JWT)

**Query Params**:

| Param  | Tipo   | Obrigatorio | Default | Descricao                          |
|--------|--------|-------------|---------|-------------------------------------|
| page   | number | Nao         | 1       | Pagina atual                        |
| limit  | number | Nao         | 10      | Itens por pagina (max 100)          |
| status | string | Nao         | -       | Filtrar por status: `active`, `completed`, `archived` |

**Response** (200):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Compras Semanais",
      "status": "active",
      "familyGroupId": "uuid | null",
      "familyGroupName": "Familia Silva | null",
      "createdByName": "Dener",
      "itemsCount": 12,
      "pendingCount": 8,
      "inCartCount": 4,
      "createdAt": "2026-03-26T00:00:00.000Z",
      "updatedAt": "2026-03-26T00:00:00.000Z"
    }
  ],
  "meta": {
    "itemCount": 1,
    "totalItems": 1,
    "itemsPerPage": 10,
    "totalPages": 1,
    "currentPage": 1
  },
  "links": {
    "first": "...",
    "previous": null,
    "next": null,
    "last": "..."
  }
}
```

---

#### `POST /shopping-lists`

Cria uma nova lista de compras.

**Auth**: Bearer Token (JWT)

**Body**:

```json
{
  "name": "Compras Semanais",
  "familyGroupId": "uuid (opcional - se omitido, cria lista pessoal)"
}
```

**Response** (201): `ShoppingListResponseDto`

---

#### `GET /shopping-lists/:id`

Retorna detalhes da lista com itens agrupados por categoria.

**Auth**: Bearer Token (JWT)

**Response** (200):

```json
{
  "id": "uuid",
  "name": "Compras Semanais",
  "status": "active",
  "familyGroupId": "uuid | null",
  "familyGroupName": "Familia Silva | null",
  "createdByName": "Dener",
  "itemsCount": 5,
  "pendingCount": 3,
  "inCartCount": 2,
  "itemsByCategory": {
    "Alimentacao": [
      {
        "id": "uuid",
        "name": "Arroz 5kg",
        "quantity": 1,
        "unit": "un",
        "status": "pending",
        "groupId": "uuid",
        "groupName": "Alimentacao",
        "addedById": "uuid",
        "addedByName": "Dener",
        "checkedById": null,
        "checkedByName": null,
        "createdAt": "2026-03-26T00:00:00.000Z",
        "updatedAt": "2026-03-26T00:00:00.000Z"
      }
    ],
    "Limpeza": [
      {
        "id": "uuid",
        "name": "Detergente",
        "quantity": 2,
        "unit": "un",
        "status": "in_cart",
        "groupId": "uuid",
        "groupName": "Limpeza",
        "addedById": "uuid",
        "addedByName": "Maria",
        "checkedById": "uuid",
        "checkedByName": "Dener",
        "createdAt": "2026-03-26T00:00:00.000Z",
        "updatedAt": "2026-03-26T00:00:00.000Z"
      }
    ]
  },
  "createdAt": "2026-03-26T00:00:00.000Z",
  "updatedAt": "2026-03-26T00:00:00.000Z"
}
```

---

#### `PATCH /shopping-lists/:id`

Atualiza nome ou status de uma lista.

**Auth**: Bearer Token (JWT)

**Body**:

```json
{
  "name": "Novo nome (opcional)",
  "status": "archived (opcional)"
}
```

**Response** (200): `ShoppingListResponseDto`

---

#### `DELETE /shopping-lists/:id`

Soft delete de uma lista.

**Auth**: Bearer Token (JWT)

**Response** (200):

```json
{ "deleted": true }
```

---

#### `PATCH /shopping-lists/:id/complete`

Finaliza uma lista ativa: muda status para `completed` e marca todos os itens pendentes como `in_cart`.

**Auth**: Bearer Token (JWT)

**Response** (200): `ShoppingListResponseDto`

**WebSocket Event**: Emite `list_completed` para todos na room da lista.

**Erros**: `400` se a lista nao estiver `active`.

---

#### `PATCH /shopping-lists/:id/complete-with-remaining`

Finaliza a lista ativa e cria uma **nova lista ativa** com o mesmo nome, grupo familiar e apenas os itens que estavam `pending` (copiados como pendentes). Exige pelo menos um item `in_cart` e um `pending`.

**Auth**: Bearer Token (JWT)

**Response** (200):

```json
{
  "completed": { "...ShoppingListResponseDto" },
  "newList": { "...ShoppingListResponseDto" }
}
```

**WebSocket Event**: Emite `list_completed` na lista original.

---

#### `POST /shopping-lists/:id/recreate`

Cria uma **nova lista ativa** a partir de uma lista `completed`, com o mesmo nome, grupo familiar e todos os itens (como `pending`). A lista original permanece finalizada.

**Auth**: Bearer Token (JWT)

**Response** (201): `ShoppingListResponseDto`

**Erros**: `400` se a lista nao estiver `completed`.

---

### Shopping List Items

#### `POST /shopping-lists/:listId/items`

Adiciona um item na lista. O backend tenta inferir automaticamente a categoria (group) baseado no historico de compras.

**Auth**: Bearer Token (JWT)

**Body**:

```json
{
  "name": "Arroz integral",
  "quantity": 2,
  "unit": "kg",
  "groupId": "uuid (opcional - se omitido, infere automaticamente)"
}
```

| Campo    | Tipo   | Obrigatorio | Default | Descricao                             |
|----------|--------|-------------|---------|----------------------------------------|
| name     | string | Sim         | -       | Nome do produto                        |
| quantity | number | Nao         | 1       | Quantidade (min: 0.01)                 |
| unit     | string | Nao         | "un"    | Unidade: un, kg, g, l, ml, pack, dz    |
| groupId  | string | Nao         | -       | UUID da categoria (auto-inferido)      |

**Response** (201): `ShoppingListItemResponseDto`

**WebSocket Event**: Emite `item_added` para todos na room da lista.

---

#### `PATCH /shopping-lists/items/:itemId`

Edita um item (nome, quantidade, unidade, status, categoria).

**Auth**: Bearer Token (JWT)

**Body** (todos opcionais):

```json
{
  "name": "Arroz integral 5kg",
  "quantity": 1,
  "unit": "un",
  "status": "in_cart",
  "groupId": "uuid"
}
```

**Response** (200): `ShoppingListItemResponseDto`

**WebSocket Event**: Emite `item_updated` para todos na room da lista.

---

#### `PATCH /shopping-lists/items/:itemId/toggle`

Alterna o status do item entre `pending` e `in_cart`. Quando move para `in_cart`, registra quem colocou no carrinho (`checkedBy`).

**Auth**: Bearer Token (JWT)

**Response** (200): `ShoppingListItemResponseDto`

**WebSocket Event**: Emite `item_toggled` para todos na room da lista.

---

#### `DELETE /shopping-lists/items/:itemId`

Remove um item da lista.

**Auth**: Bearer Token (JWT)

**Response** (200):

```json
{ "deleted": true }
```

**WebSocket Event**: Emite `item_removed` com `{ itemId }` para todos na room da lista.

---

### Sugestoes

#### `GET /shopping-lists/suggestions?search=arro`

Busca sugestoes de nomes de itens baseado no historico de compras do usuario (tabela `item` de expenses + historico de `shopping_list_item`).

**Auth**: Bearer Token (JWT)

**Query Params**:

| Param  | Tipo   | Obrigatorio | Min Length | Descricao           |
|--------|--------|-------------|------------|----------------------|
| search | string | Sim         | 2          | Termo de busca       |

**Response** (200):

```json
[
  {
    "name": "Arroz integral 5kg",
    "suggestedGroup": "Alimentacao",
    "suggestedUnit": "un",
    "frequency": 15
  },
  {
    "name": "Arroz branco",
    "suggestedGroup": "Alimentacao",
    "suggestedUnit": "kg",
    "frequency": 8
  }
]
```

---

### Integracao Alexa

#### `POST /shopping-lists/alexa/add-item`

Endpoint simplificado para a Alexa. Nao usa JWT, autentica via token pessoal no header.

**Auth**: Header `X-Alexa-Token: <token_pessoal>`

**Body**:

```json
{
  "text": "2 litros de leite"
}
```

O backend faz parse automatico do texto:
- `"2 litros de leite"` -> nome: "Leite", quantity: 2, unit: "l"
- `"3 pacotes de arroz"` -> nome: "Arroz", quantity: 3, unit: "pack"
- `"detergente"` -> nome: "Detergente", quantity: 1, unit: "un"

**Unidades reconhecidas no parse**: unidade(s), quilo(s), kg, grama(s), g, litro(s), l, ml, mililitro(s), pacote(s), duzia(s), dz

**Comportamento**: Adiciona o item na lista ativa mais recente do usuario. Se nao existir lista ativa, cria uma automaticamente com o nome "Lista de Compras".

**Response** (201): `ShoppingListItemResponseDto`

**WebSocket Event**: Emite `item_added` para todos na room da lista.

---

### Geracao/Remocao do Token Alexa (Profile)

#### `POST /profile/generate-alexa-token`

Gera um token UUID v4 para integracao com Alexa.

**Auth**: Bearer Token (JWT)

**Response** (201):

```json
{
  "alexaToken": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

#### `DELETE /profile/alexa-token`

Remove o token Alexa do perfil do usuario.

**Auth**: Bearer Token (JWT)

**Response** (200):

```json
{ "removed": true }
```

---

## WebSocket (Socket.IO)

### Configuracao

- **Namespace**: `/shopping-list`
- **Transporte**: Socket.IO (v4)
- **CORS**: Mesmas origins do REST

### Conexao

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/shopping-list', {
  auth: {
    token: 'JWT_TOKEN_AQUI'
  }
});
```

A autenticacao e feita automaticamente no `handleConnection` via JWT no handshake.

### Eventos Client -> Server

#### `joinList`

Entra na "room" de uma lista para receber atualizacoes em tempo real.

```javascript
socket.emit('joinList', { listId: 'uuid-da-lista' });
```

#### `leaveList`

Sai da room de uma lista.

```javascript
socket.emit('leaveList', { listId: 'uuid-da-lista' });
```

### Eventos Server -> Client

#### `item_added`

Emitido quando um item e adicionado a lista.

```javascript
socket.on('item_added', (item) => {
  // item: ShoppingListItemResponseDto
});
```

#### `item_updated`

Emitido quando um item e atualizado (nome, quantidade, unidade, status, categoria).

```javascript
socket.on('item_updated', (item) => {
  // item: ShoppingListItemResponseDto
});
```

#### `item_toggled`

Emitido quando o status de um item e alternado (pending <-> in_cart).

```javascript
socket.on('item_toggled', (item) => {
  // item: ShoppingListItemResponseDto
});
```

#### `item_removed`

Emitido quando um item e removido.

```javascript
socket.on('item_removed', ({ itemId }) => {
  // itemId: string
});
```

#### `list_completed`

Emitido quando uma lista e finalizada.

```javascript
socket.on('list_completed', ({ listId }) => {
  // listId: string
});
```

#### `user_joined`

Emitido quando alguem entra na room da lista.

```javascript
socket.on('user_joined', ({ userId, userName }) => {
  // userId: string, userName: string
});
```

#### `user_left`

Emitido quando alguem sai da room da lista.

```javascript
socket.on('user_left', ({ userId, userName }) => {
  // userId: string, userName: string
});
```

---

## Guia de Configuracao da Alexa

### Passo 1: Gerar o Token

No app, acessar Perfil e gerar o token Alexa (chama `POST /profile/generate-alexa-token`). Copiar o token gerado.

### Passo 2: Criar Alexa Skill (Gratuito)

1. Acessar [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Criar uma Custom Skill
3. Configurar o Intent para capturar o texto do item (ex: `AddItemIntent` com slot `{itemText}`)
4. No backend da Skill (Lambda AWS Free Tier ou endpoint HTTPS), fazer um POST para:

```
POST https://sua-api.com/shopping-lists/alexa/add-item
Headers:
  Content-Type: application/json
  X-Alexa-Token: <token_gerado_no_passo_1>
Body:
  { "text": "{itemText}" }
```

### Alternativa: IFTTT / Alexa Routines

Se o pais suportar, pode usar Alexa Routines com acao de webhook customizado, passando o token no header.

---

## Orientacoes para Implementacao no Frontend React

### Dependencias Necessarias

```bash
npm install socket.io-client
```

### Estrutura de Telas Sugerida

#### 1. Dashboard de Listas (`/shopping-lists`)

- Listar listas ativas chamando `GET /shopping-lists?status=active`
- Botao "Nova Lista" -> modal com nome e opcao de vincular ao grupo familiar
- Cada card mostra: nome, contagem de itens pendentes/no carrinho, quem criou

#### 2. Lista Viva (`/shopping-lists/:id`)

**Header**:
- Nome da lista
- Usuarios online (via eventos `user_joined`/`user_left`)
- Botao "Finalizar Lista"

**Input Rapido (topo)**:
- Campo de texto sempre visivel para adicionar itens rapidamente
- Auto-complete usando `GET /shopping-lists/suggestions?search=...`
- Suporte a formato "2x Leite Integral" (parse no frontend)

**Corpo**:
- Itens agrupados por categoria (usar `itemsByCategory` do response)
- Cada item mostra: checkbox (toggle), nome, quantidade/unidade, quem adicionou
- Item `in_cart` aparece riscado com nome de quem colocou no carrinho
- Botoes de editar quantidade e excluir

**WebSocket**:
- Conectar ao namespace `/shopping-list` ao montar o componente
- Emitir `joinList` com o `listId`
- Escutar `item_added`, `item_updated`, `item_toggled`, `item_removed` para atualizar estado local sem refresh
- Emitir `leaveList` ao desmontar

### Exemplo de Integracao React

```tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

function useShoppingListSocket(listId: string, token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(`${API_URL}/shopping-list`, {
      auth: { token },
    });

    s.on('connect', () => {
      s.emit('joinList', { listId });
    });

    s.on('item_added', (item) => {
      // Adicionar item ao estado local
    });

    s.on('item_toggled', (item) => {
      // Atualizar status do item no estado local
    });

    s.on('item_updated', (item) => {
      // Atualizar item no estado local
    });

    s.on('item_removed', ({ itemId }) => {
      // Remover item do estado local
    });

    s.on('list_completed', () => {
      // Atualizar status da lista
    });

    s.on('user_joined', ({ userName }) => {
      // Mostrar notificacao ou atualizar lista de usuarios online
    });

    setSocket(s);

    return () => {
      s.emit('leaveList', { listId });
      s.disconnect();
    };
  }, [listId, token]);

  return socket;
}
```

### Fluxo de Uso

```
1. Usuario abre o app -> ve Dashboard de Listas
2. Seleciona uma lista -> abre Lista Viva + conecta WebSocket
3. Digita "2x Leite" no input rapido -> POST /:listId/items
4. Todos os membros conectados recebem `item_added` via WebSocket
5. No mercado, clica no checkbox -> PATCH /items/:id/toggle
6. Todos veem o item riscado via `item_toggled`
7. Finaliza compra -> PATCH /:id/complete (volta ao dashboard de listas ativas)
8. Todos recebem `list_completed`
9. Compra parcial em um mercado -> PATCH /:id/complete-with-remaining (nova lista so com pendentes)
10. Recriar lista finalizada -> POST /:id/recreate (nova lista ativa com mesmos itens)
```

---

## Migration

Arquivo: `db/migrations/1774557173946-AddShoppingListTables.ts`

Cria:
- Tabela `shopping_list` (id, name, status, familyGroupId, createdById, timestamps)
- Tabela `shopping_list_item` (id, name, quantity, unit, status, shoppingListId, addedById, checkedById, groupId, timestamps)
- Coluna `alexaToken` (varchar, nullable, unique) na tabela `user`
- Foreign keys e indices

Para executar:

```bash
npm run migration:run
```

Para reverter:

```bash
npm run migration:revert
```
