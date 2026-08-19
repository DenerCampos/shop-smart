# Grupo Familiar - Documentação Técnica

## Visão Geral

Funcionalidade de grupo familiar que permite usuários criarem um grupo, convidarem membros (esposa, filhos, etc.) e visualizarem dados financeiros consolidados do grupo. A interface do front segue o conceito de "stories" do Instagram.

## Modelagem de Banco de Dados

### Tabela `family_group`

| Coluna    | Tipo           | Descrição                      |
|-----------|----------------|--------------------------------|
| id        | VARCHAR(36) PK | UUID gerado automaticamente    |
| name      | VARCHAR(255)   | Nome do grupo                  |
| coatOfArms | VARCHAR(255)  | Brasão do grupo (asset estático). Default `/assets/images/brasao/brasao-1.png` |
| groupImage | VARCHAR(255) NULLABLE | Foto do grupo (URL do storage). Tem prioridade sobre `coatOfArms` na exibição |
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

| Método | Rota                | Body                                    | Descrição                               |
|--------|---------------------|-----------------------------------------|-----------------------------------------|
| POST   | /family-group       | `{ name, coatOfArms? }`                 | Criar grupo (criador vira admin/owner)  |
| GET    | /family-group       | —                                       | Listar grupos do usuário                |
| GET    | /family-group/:id   | —                                       | Detalhes do grupo                       |
| PUT    | /family-group/:id   | `{ name, coatOfArms? }`                 | Atualizar nome/brasão (admin)           |
| POST   | /family-group/:id/upload-image | multipart, campo `image`      | Enviar foto do grupo (admin, bloqueado na conta demo) |
| DELETE | /family-group/:id   | —                                       | Deletar grupo (apenas owner)            |

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
1. Usuário cria grupo com nome e, opcionalmente, o brasão escolhido
2. Sistema cria `FamilyGroup` com `ownerId = user.id` e `coatOfArms` (default `brasao-1.png`)
3. Sistema cria `FamilyGroupMember` automático com `role: admin`, `status: accepted`
4. Se o usuário escolheu uma foto, o app envia em seguida `POST /family-group/:id/upload-image`

### Convite (Usuário Existente)
1. Admin envia convite com email
2. Sistema encontra User pelo email
3. Cria `FamilyGroupMember` com `status: pending`, `userId` preenchido
4. Emite `family_group.member_invited` → notificação interna (inbox / sino); ver [notificacoes.md](./notificacoes.md)
5. Usuário convidado vê convite pendente no front
6. Aceita → `status: accepted`, `joinedAt` preenchido

### Convite (Usuário Não Cadastrado)
1. Admin envia convite com email
2. Sistema NÃO encontra User
3. Cria `FamilyGroupMember` com `status: pending`, `userId: null`
4. Email mockado (preparado para envio real futuro)
5. Quando o novo usuário se cadastrar, evento `user.created` vincula o `userId`
6. Após o vínculo, emite `family_group.member_invited` → notificação interna
7. Convite pendente aparece no front

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

## Multi-família (SP-127)

- Um usuário pode participar de **0..N** grupos familiares (`accepted`).
- Role por membership: `admin` | `member`. Dono = `family_group.ownerId` (+ membership admin).
- **Prioridade** (família ativa / display name no profile / OAuth primary): owner → admin → member (desempate `joinedAt`, depois nome).
- `GET /family-group` retorna grupos já ordenados por essa prioridade.
- Escopo familiar em listagens financeiras/relatórios/coin/profile exige `familyGroupId` query (UUID) quando a visão for familiar; sem param = só o próprio usuário.
- `FamilyMemberResolverService.resolve(userId, familyGroupId?)`: sem `familyGroupId` não promove visão de admin; com `familyGroupId` **exige** membership `accepted` — caso contrário **403** (não degrada silenciosamente).
- Autocomplete de convite: `GET /user/search?email=` (mín. 3 / máx. 255 chars, até 10 resultados, throttle 15/min, só admin de algum grupo).
  - **Privacidade (tradeoff aceito):** a busca é em usuários da plataforma (não só do clã), para permitir convidar e-mails ainda não membros. Mitigações: AuthGuard, admin-only, prefixo ≥ 3, limite 10, throttle, DTO só `id/name/email`.
- Email de convite continua mockado (envio real em tarefa futura).

## Identidade visual do grupo (SP-131)

Antes o brasão exibido para a família vinha de `User.coatOfArms` do owner, o que não funcionava para quem é dono de vários grupos. Agora a identidade visual pertence ao **grupo**:

- `family_group.coatOfArms` — brasão escolhido entre os assets estáticos do app. Validado por regex (`/assets/images/brasao/brasao-N.png`) nos DTOs de criação e atualização; qualquer outra string é rejeitada com 400.
- `family_group.groupImage` — foto enviada via multipart, armazenada pelo `FILE_STORAGE` (Supabase/Drive) na subpasta `family-group`. Ver [file-storage.md](./file-storage.md).
- **Brasão e foto são alternativas.** Ao salvar `coatOfArms` no `PUT`, a foto atual é removida do storage e `groupImage` volta para `null`. Enquanto existir `groupImage`, ele tem prioridade na exibição.
- Permissão: criar é livre para qualquer usuário autenticado; alterar nome/brasão e enviar foto exigem **admin** (owner é admin por definição). `POST /family-group/:id/upload-image` também usa `DenyDemoGuard`.
- Limites do upload: 1 identidade por requisição, 1,5 MB no Multer, mimetypes `jpg|jpeg|png|gif|webp`.
- Migration `1776100000000-AddFamilyGroupImage`: cria as colunas e faz backfill copiando `user.coatOfArms` do owner para os grupos já existentes.
- `User.coatOfArms` continua existindo e é usado apenas no perfil/avatar do usuário — não foi removido.

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
