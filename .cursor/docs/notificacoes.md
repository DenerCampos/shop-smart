# Notificações internas (SP-101 / SP-91)

## Objetivo

Centralizar o envio de notificações do sistema com arquitetura extensível (canais). Canais atuais: **in-app** (inbox do sino) e **e-mail** (Brevo/noop). O primeiro caso de uso é o convite para grupo familiar.

## Escopo

**Entra**

- Persistência de notificações internas (`notification`)
- Orquestrador + Strategy de canais (`in_app` e `email`; registry pronto para WhatsApp/push)
- Evento de domínio `family_group.member_invited` (com ou sem conta)
- E-mail de boas-vindas no `user.created` (template próprio, sem inbox)
- Endpoints HTTP para listar, contar não lidas e marcar IDs como lidas

**Fora**

- WhatsApp / push
- WebSocket em tempo real
- Preferências de canal por usuário

## Fluxo

1. Domínio emite evento (convite do admin, ou vínculo no `user.created` com `origin: signup_link`).
2. `NotificationEventsListener` recebe o evento e chama `NotificationService.notify(...)`.
3. O orquestrador resolve os canais no `NotificationChannelRegistry` e dispara cada um de forma isolada.
4. `InAppChannel` persiste a linha na tabela `notification` **só se houver `userId`**; senão marca `skipped`.
5. `EmailChannel` envia se houver `recipientEmail`; o default dos canais continua só `in_app` — e-mail é opt-in no evento.
6. Convite `signup_link` (vínculo no cadastro) **não** reenvia e-mail: a pessoa já recebeu o convite original.
7. O app lista / conta / marca como lidas via HTTP.

Convite sem conta: `userId: null`, `actionUrl: /register?email=...`, só o e-mail alcança. Ver [email.md](./email.md).

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
  - Com conta: `actionUrl` `/new-resources/family?tab=invitations`
  - Sem conta: `actionUrl` `/register?email=<urlencoded>`
  - `data`: `{ groupId, memberId }`
  - Rodapé no app: `actorName` + data/hora de `createdAt`

## Regras de negócio

- Notificação in-app só é criada quando o destinatário tem `userId`.
- Convite com e-mail sem conta: o evento é emitido na hora (e-mail de cadastro) e de novo no `user.created` só in-app (`signup_link`).
- `PATCH /notifications/read` marca apenas IDs do usuário autenticado que ainda estão não lidas (máx. 50 IDs por request).
- Falha em um canal não deve quebrar os demais (log isolado).
- `recipientName` vai no evento quando o convidado já tem conta (nome no e-mail).

## Arquivos-chave

| Área | Path |
|------|------|
| Módulo | `src/notification/` |
| Entity | `src/notification/entities/notification.entity.ts` |
| Canais | `src/notification/channels/` |
| Listener | `src/notification/listeners/notification-events.listener.ts` |
| Evento | `src/family-group/events/family-group-member-invited.event.ts` |
| Emit (convite) | `src/family-group/family-group.service.ts` |
| E-mail | `src/email/` |
| Migration | `db/migrations/1776000000000-AddNotificationTable.ts` |

## Testes

```bash
npm test -- --testPathPattern=notification
npm test -- --testPathPattern=family-group.service.spec
npm run test:e2e:low-mem -- --testPathPattern=notification
```
