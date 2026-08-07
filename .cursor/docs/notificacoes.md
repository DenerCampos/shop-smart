# Notificações internas (SP-101)

## Objetivo

Centralizar o envio de notificações do sistema com arquitetura extensível (canais), começando pelo canal **in-app** (inbox do sino no app). O primeiro caso de uso é o convite para grupo familiar.

## Escopo

**Entra**

- Persistência de notificações internas (`notification`)
- Orquestrador + Strategy de canais (`in_app` hoje; registry pronto para email/WhatsApp/push)
- Evento de domínio `family_group.member_invited`
- Endpoints HTTP para listar, contar não lidas e marcar IDs como lidas

**Fora**

- Envio real de email / WhatsApp / push
- WebSocket em tempo real
- Preferências de canal por usuário

## Fluxo

1. Domínio emite evento (ex.: após convite com usuário existente, ou após vincular convite no `user.created`).
2. `NotificationEventsListener` recebe o evento e chama `NotificationService.notify(...)`.
3. O orquestrador resolve os canais no `NotificationChannelRegistry` e dispara cada um de forma isolada.
4. `InAppChannel` persiste a linha na tabela `notification`.
5. O app lista / conta / marca como lidas via HTTP.

## Contratos HTTP

Todas as rotas exigem `AuthGuard` (Bearer).

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/notifications?limit=` | Lista do usuário (não lidas primeiro). `limit` default 20, máx. 50 |
| GET | `/notifications/unread-count` | `{ count: number }` |
| PATCH | `/notifications/read` | Body `{ ids: string[] }` (1–50 UUIDs) → `{ updated: number }` |

### Response item (`NotificationResponseDto`)

- `id`, `type`, `title`, `body`, `actorName`, `actionUrl`, `data`, `readAt`, `createdAt`

### Tipo inicial

- `family_group_invite` — convite para integrar família
  - `actionUrl`: `/new-resources/family?tab=invitations`
  - `data`: `{ groupId, memberId }`
  - Rodapé no app: `actorName` + data/hora de `createdAt`

## Regras de negócio

- Notificação in-app só é criada quando o destinatário tem `userId`.
- Convite com e-mail sem conta: evento emitido somente após `linkUserToMember` no `user.created`.
- `PATCH /notifications/read` marca apenas IDs do usuário autenticado que ainda estão não lidas (máx. 50 IDs por request).
- Falha em um canal futuro não deve quebrar os demais (log isolado).

## Arquivos-chave

| Área | Path |
|------|------|
| Módulo | `src/notification/` |
| Entity | `src/notification/entities/notification.entity.ts` |
| Canais | `src/notification/channels/` |
| Listener | `src/notification/listeners/notification-events.listener.ts` |
| Evento | `src/family-group/events/family-group-member-invited.event.ts` |
| Emit (convite) | `src/family-group/family-group.service.ts` |
| Migration | `db/migrations/1776000000000-AddNotificationTable.ts` |

## Testes

```bash
npm test -- --testPathPattern=notification
npm test -- --testPathPattern=family-group.service.spec
npm run test:e2e:low-mem -- --testPathPattern=notification
```
