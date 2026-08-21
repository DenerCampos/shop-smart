# Autenticação e cadastro (SP-39 / SP-91 / SP-136)

## Objetivo

Garantir validação consistente de e-mail, senha e nome no login e no cadastro, unicidade real de e-mail no MySQL, exclusão de conta (soft-delete) com recuperação por e-mail e redefinição de senha autenticando o usuário ao concluir.

## Escopo

- Entra: DTOs de `POST /user`, `POST /auth/login`, `PUT /auth/refresh`, `POST /auth/recover-account`, `POST /auth/forgot-password`, `POST /auth/reset-password`; `DELETE /user/:id` com senha; índice `UNIQUE(email)`; códigos de erro 409/400; invalidação de JWT após troca de senha ou exclusão (`tokenVersion`).
- Fora: complexidade extra de senha (além de 8–64), verificação de e-mail por link, OAuth/Alexa (ver [oauth2.md](./oauth2.md)).

## Regras de validação

| Campo | Cadastro (`CreateUserDto`) | Login (`SignInDto`) | Reset (`ResetPasswordDto`) | Exclusão (`DeleteAccountDto`) |
|-------|----------------------------|---------------------|----------------------------|-------------------------------|
| name | obrigatório, 3–255, trim | — | — | — |
| email | obrigatório, `@IsEmail`, max 255, `trim` + `toLowerCase` | igual (normalização) | — | — |
| password | obrigatório, 8–64, trim | obrigatória, max 64, trim (sem mínimo, para não quebrar contas antigas) | obrigatória, 8–64, trim | obrigatória, max 64, trim |
| token | — | — | hex de 64 chars (32 bytes em claro) | — |

## Unicidade de e-mail

1. `UserRepository.findByEmailWithDeleted` usa igualdade exata (não `ILike('%...%')`).
2. `POST /user` consulta com `withDeleted: true`:
   - ativo → `409 EMAIL_ALREADY_EXISTS`
   - soft-deleted → `409 ACCOUNT_DELETED_REACTIVATION_REQUIRED`
3. `UserRepository.exist` (update de e-mail) também usa `withDeleted: true`.
4. Índice `UNIQUE(email)` `IDX_user_email_unique` na migration `AddUniqueEmailToUser` (após normalizar para minúsculas), alinhado ao `@Index` da entity.
5. Corrida de insert: `QueryFailedError` com `errno 1062` → `EmailAlreadyExistsException`.

**Antes de rodar a migration em produção:**

```sql
SELECT LOWER(email), COUNT(*) FROM `user` GROUP BY LOWER(email) HAVING COUNT(*) > 1;
```

## Contratos HTTP

| Método | Rota | Auth | Throttle | Notas |
|--------|------|------|----------|-------|
| POST | `/user` | público | 5/min | 201 DTO; 400 validação; 409 com `code` |
| DELETE | `/user/:id` | JWT + DenyDemo | default | body `{ password }`; 200 `{ deleted }`; 400 `INVALID_PASSWORD`; 409 `FAMILY_GROUP_OWNER` / `LAST_FAMILY_GROUP_ADMIN` |
| POST | `/auth/login` | público | 5/min | 200 `{ accessToken }`; 401 genérico; 409 `ACCOUNT_DELETED_REACTIVATION_REQUIRED` se senha correta e conta soft-deleted |
| POST | `/auth/recover-account` | público | 3/min | 200 mensagem genérica (anti-oráculo); só envia e-mail se a conta estiver soft-deleted |
| PUT | `/auth/refresh` | público | 10/min | e-mail normalizado |
| POST | `/auth/forgot-password` | público | 3/min | 200 mensagem genérica (anti-oráculo); cooldown 2 min por conta; contas deletadas **não** recebem este e-mail |
| POST | `/auth/reset-password` | público | 5/min | 200 `{ accessToken }`; 400 `INVALID_OR_EXPIRED_RESET_TOKEN`; 409 `USER_LIMIT_REACHED` ao reativar se o limite de ativos estourou |

### Body de conflito (409)

```json
{
  "statusCode": 409,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "E-mail já cadastrado"
}
```

Códigos: `EMAIL_ALREADY_EXISTS`, `ACCOUNT_DELETED_REACTIVATION_REQUIRED`, `USER_LIMIT_REACHED`, `INVALID_OR_EXPIRED_RESET_TOKEN`, `INVALID_PASSWORD`, `FAMILY_GROUP_OWNER`, `LAST_FAMILY_GROUP_ADMIN`.

`AlreadyExistsException` (400) permanece para group/store/payment — não alterar.

## Exclusão de conta (SP-136)

1. `DELETE /user/:id` exige ownership (`id` = usuário autenticado), `DenyDemoGuard` e senha atual no body.
2. Senha inválida → **400** `INVALID_PASSWORD` (não usa 401, para o cliente não tratar como sessão expirada).
3. Se o usuário for o **criador** (`ownerId`) de qualquer grupo familiar ativo → **409** `FAMILY_GROUP_OWNER`. Precisa **fechar o grupo** (não basta promover outro admin: não há transferência de ownership).
4. Se for o **único admin accepted** de qualquer grupo ativo (e não for o criador) → **409** `LAST_FAMILY_GROUP_ADMIN`. Precisa promover outro admin ou o criador fechar o grupo.
5. Em transação: incrementa `tokenVersion`, zera `token`/`refreshtoken`, apaga tokens de reset não usados, remove memberships (soft-delete) e soft-delete da conta. Só então emite `user.deleted`.
6. JWT anterior deixa de funcionar na hora (`AuthGuard` não encontra o usuário ativo / `ver` divergente).

## Fluxo de recuperação de conta (SP-136)

1. Login com senha **correta** de conta soft-deleted → 409 `ACCOUNT_DELETED_REACTIVATION_REQUIRED`. Senha errada continua **401** (anti-oráculo).
2. Cadastro com o mesmo e-mail → 409 `ACCOUNT_DELETED_REACTIVATION_REQUIRED`.
3. Cliente chama `POST /auth/recover-account` `{ email }`. Resposta **idêntica** exista ou não a conta / esteja ativa ou deletada.
4. Só envia e-mail se a conta estiver soft-deleted. Reusa a tabela `password_reset_token` (TTL `PASSWORD_RESET_TOKEN_TTL_MINUTES`, cooldown 2 min). Template de recuperação; link `{FRONTEND_URL}/reset-password?token=...`.
5. `POST /auth/reset-password` `{ token, password }`: se a conta estiver deletada, valida limite de 15 usuários ativos, faz `restore`, troca a senha, incrementa `tokenVersion` e devolve `{ accessToken }`. Emite `user.reactivated` (não reemite `user.created`). **Não restaura memberships** — o usuário volta sem grupo familiar e precisa de um convite novo.
6. Conta ativa (forgot-password) usa o mesmo `reset-password` e também autentica.

`POST /auth/reactivate` (senha antiga, SP-39) **foi substituído** por este fluxo.

## Recuperação de senha (SP-91)

1. `POST /auth/forgot-password` `{ email }` — resposta **idêntica** exista ou não a conta.
2. Conta ativa: invalida tokens anteriores não usados, grava SHA-256 de 32 bytes aleatórios (TTL `PASSWORD_RESET_TOKEN_TTL_MINUTES`, default 30), responde imediatamente e envia o e-mail em background (Brevo ou noop).
3. Cooldown de 2 minutos por usuário; falha de envio loga `outcome: send_failed` (não `sent`).
4. `POST /auth/reset-password` `{ token, password }` — transação com lock pessimista: marca `usedAt`, troca o hash, incrementa `tokenVersion`, zera `token`/`refreshtoken` e emite JWT.
5. JWT de acesso carrega `ver`; `AuthGuard` (e WebSocket/Alexa) rejeita token com `ver` diferente. Access tokens emitidos antes do reset param de funcionar na hora.
6. Contas demo: o reset de senha da conta demo é possível na API; o `DenyDemoGuard` só bloqueia mutações autenticadas com `isDemo` no JWT.

Link no e-mail: `{FRONTEND_URL}/reset-password?token=...`. Ver [email.md](./email.md).

## Arquivos-chave

- `src/user/dto/create-user.dto.ts`, `update-user.dto.ts`, `delete-account.dto.ts`
- `src/auth/dto/signIn.dto.ts`, `recover-account.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts`
- `src/auth/entities/password-reset-token.entity.ts`
- `src/user/repositories/user.repository.ts`, `user.service.ts`
- `src/auth/auth.service.ts`, `auth.controller.ts`, `auth.guard.ts`, `jwt-access.util.ts`
- `src/common/family-member-resolver/family-member-resolver.service.ts` (`isSoleAcceptedAdminOfAnyGroup`)
- `src/exception/authErrorException.ts`
- `src/common/utils/transformString.util.ts` (`normalizeEmail`)
- `db/migrations/1776200000000-AddUniqueEmailToUser.ts`
- `db/migrations/1776300000000-AddPasswordResetToken.ts`

## Testes

```bash
npm run test -- --testPathPattern=user.service.spec
npm run test -- --testPathPattern=user.repository.spec
npm run test -- --testPathPattern=auth.service.spec
npm run test -- --testPathPattern=auth.guard.spec
npm run test -- --testPathPattern=family-member-resolver.service.spec
npm run test:e2e:low-mem -- --testPathPattern=user.e2e-spec
npm run test:e2e:low-mem -- --testPathPattern=auth.e2e-spec
```
