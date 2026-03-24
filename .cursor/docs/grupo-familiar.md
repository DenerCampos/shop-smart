# Grupo Familiar - Documentação Técnica

## Visão Geral

Funcionalidade de grupo familiar que permite usuários criarem um grupo, convidarem membros (esposa, filhos, etc.) e visualizarem dados financeiros consolidados do grupo. A interface do front segue o conceito de "stories" do Instagram.

## Modelagem de Banco de Dados

### Tabela `family_group`

| Coluna    | Tipo           | Descrição                      |
|-----------|----------------|--------------------------------|
| id        | VARCHAR(36) PK | UUID gerado automaticamente    |
| name      | VARCHAR(255)   | Nome do grupo                  |
| ownerId   | VARCHAR(36) FK | Criador/dono do grupo → User   |
| createdAt | DATETIME       | Data de criação                |
| updatedAt | DATETIME       | Data de atualização            |
| deletedAt | DATETIME       | Soft delete                    |

### Tabela `family_group_member`

| Coluna        | Tipo                               | Descrição                                |
|---------------|--------------------------------------|------------------------------------------|
| id            | VARCHAR(36) PK                       | UUID gerado automaticamente              |
| familyGroupId | VARCHAR(36) FK                       | FK → family_group                        |
| userId        | VARCHAR(36) FK, NULLABLE             | FK → user (null se não cadastrado)       |
| invitedEmail  | VARCHAR(255)                         | Email do convite                         |
| role          | ENUM('admin', 'member')              | Papel no grupo                           |
| status        | ENUM('pending', 'accepted', 'rejected') | Status do convite                     |
| invitedById   | VARCHAR(36) FK                       | FK → user (quem convidou)                |
| joinedAt      | DATETIME, NULLABLE                   | Data de aceite do convite                |
| createdAt     | DATETIME                             | Data de criação                          |
| updatedAt     | DATETIME                             | Data de atualização                      |
| deletedAt     | DATETIME                             | Soft delete                              |

## Endpoints da API

Todas as rotas são protegidas com `@UseGuards(AuthGuard)`.

### Grupo Familiar (CRUD)

| Método | Rota                | Descrição                               |
|--------|---------------------|-----------------------------------------|
| POST   | /family-group       | Criar grupo (criador vira admin/owner)  |
| GET    | /family-group       | Listar grupos do usuário                |
| GET    | /family-group/:id   | Detalhes do grupo                       |
| PUT    | /family-group/:id   | Atualizar grupo (admin)                 |
| DELETE | /family-group/:id   | Deletar grupo (apenas owner)            |

### Membros e Convites

| Método | Rota                                          | Descrição                    |
|--------|-----------------------------------------------|------------------------------|
| POST   | /family-group/:id/invite                      | Convidar membro por email    |
| GET    | /family-group/:id/members                     | Listar membros               |
| PATCH  | /family-group/:id/members/:memberId/role      | Alterar role (admin↔member)  |
| DELETE | /family-group/:id/members/:memberId           | Remover membro               |
| DELETE | /family-group/:id/leave                       | Sair do grupo                |

### Convites Recebidos

| Método | Rota                                     | Descrição             |
|--------|------------------------------------------|-----------------------|
| GET    | /family-group/invitations                | Convites pendentes    |
| PATCH  | /family-group/invitations/:id/accept     | Aceitar convite       |
| PATCH  | /family-group/invitations/:id/reject     | Rejeitar convite      |

### Dashboard de Dados

| Método | Rota                                              | Descrição                           |
|--------|---------------------------------------------------|-------------------------------------|
| GET    | /family-group/:id/summary                         | Resumo financeiro do grupo          |
| GET    | /family-group/:id/members/:memberId/data          | Dados financeiros de um membro      |

## Regras de Permissão e Visibilidade

### Admin
- Pode ver dados financeiros de TODOS os membros (admins + members)
- Pode ver o resumo/total do grupo inteiro
- Pode convidar novos membros
- Pode alterar roles (admin ↔ member)
- Pode remover membros (exceto o owner)
- Pode atualizar dados do grupo
- Vê todos os membros na listagem (admins + members)

### Membro (member)
- Pode ver dados financeiros de outros **members** do grupo
- **NÃO vê admins** na listagem de membros (API filtra automaticamente)
- **NÃO vê dados financeiros de admins** (bloqueado pela API)
- Vê o resumo/total consolidado apenas dos members (exclui admins dos cálculos)
- Pode sair do grupo voluntariamente

### Owner (criador)
- Possui todas as permissões de admin
- Não pode ser removido por outros admins
- Único que pode deletar o grupo

### Filtragem por Role (Backend)
A API filtra automaticamente os membros retornados com base na role do usuário logado. **O frontend NÃO precisa filtrar membros manualmente** — basta renderizar o que a API retorna.

Endpoints afetados pela filtragem:
- `GET /family-group` — members do grupo embutidos no response
- `GET /family-group/:id` — members do grupo embutidos no response
- `GET /family-group/:id/members` — listagem direta de membros
- `GET /family-group/:id/summary` — resumo financeiro (members visíveis apenas)
- `GET /family-group/:id/members/:targetUserId/data` — member pode ver outro member, mas não admin

## Fluxos

### Criação do Grupo
1. Usuário cria grupo com nome
2. Sistema cria `FamilyGroup` com `ownerId = user.id`
3. Sistema cria `FamilyGroupMember` automático com `role: admin`, `status: accepted`

### Convite (Usuário Existente)
1. Admin envia convite com email
2. Sistema encontra User pelo email
3. Cria `FamilyGroupMember` com `status: pending`, `userId` preenchido
4. Usuário convidado vê convite pendente no front
5. Aceita → `status: accepted`, `joinedAt` preenchido

### Convite (Usuário Não Cadastrado)
1. Admin envia convite com email
2. Sistema NÃO encontra User
3. Cria `FamilyGroupMember` com `status: pending`, `userId: null`
4. Email mockado (preparado para envio real futuro)
5. Quando o novo usuário se cadastrar, evento `user.created` vincula o `userId`
6. Convite pendente aparece no front

### Dashboard
- Filtros: `month` e `year` (query params)
- Admin: soma de despesas e receitas de todos os membros aceitos (admins + members)
- Membro: soma de despesas e receitas dos members aceitos (exclui admins dos cálculos e da listagem)
- Members podem clicar nos "stories" de outros members e ver seus dados financeiros detalhados

## Integração com Outras Rotas

### Latest Registrations (`GET /profile/latest-registrations`)
- Usa `FamilyMemberResolverService` para resolver os membros do grupo familiar
- Se o usuário é admin do grupo: retorna registros (despesas + receitas) de todos os membros
- Cada registro inclui o campo `user` (via `OwnerResponseDto`: id, name, profileImage) para identificar o dono
- Métodos `getLatest` e `countByUser` nos services/repositórios de expense e revenue recebem `userIds: string[]` (array) em vez de um único userId

## Restrições Atuais
- Um usuário pode participar de apenas UM grupo familiar por vez (código preparado para múltiplos no futuro)
- Email de convite é mockado (será implementado em tarefa futura)

## Profile Image
- Campo `profileImage` na entidade `User` (VARCHAR, nullable)
- Upload via API → armazenamento no Google Drive
- Usado no front para o conceito de "stories" (imagem circular dos membros)
- Rate limiting para respeitar limites do Google Drive (plano gratuito)

## Variáveis de Ambiente (Google Drive)

```env
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=
```

## Estrutura de Pastas

```
src/family-group/
├── family-group.controller.ts
├── family-group.service.ts
├── family-group.module.ts
├── entities/
│   ├── family-group.entity.ts
│   └── family-group-member.entity.ts
├── dto/
│   ├── create-family-group.dto.ts
│   ├── update-family-group.dto.ts
│   ├── invite-member.dto.ts
│   ├── update-member-role.dto.ts
│   ├── family-group-response.dto.ts
│   ├── family-group-member-response.dto.ts
│   ├── family-group-summary-response.dto.ts
│   ├── family-group-member-data-response.dto.ts
│   └── family-group-list.dto.ts
├── repositories/
│   └── family-group.repository.ts
├── interfaces/
│   └── family-group.repository.interface.ts
├── types/
│   ├── family-group-role.type.ts
│   └── family-group-member-status.type.ts
├── guards/
│   └── family-group-role.guard.ts
└── events/
    └── family-group-member.event.ts

src/google-drive/
├── google-drive.service.ts
├── google-drive.module.ts
└── interfaces/
    └── google-drive.interface.ts
```
