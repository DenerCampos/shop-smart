# Autenticação e cadastro (SP-39)

## Objetivo

Garantir validação consistente de e-mail, senha e nome no login e no cadastro, unicidade real de e-mail no MySQL e reativação de contas soft-deleted mediante senha.

## Escopo

- Entra: DTOs de `POST /user`, `POST /auth/login`, `PUT /auth/refresh`, `POST /auth/reactivate`; índice `UNIQUE(email)`; códigos de erro 409.
- Fora: reset/recuperação de senha (tarefa futura), complexidade de senha, verificação de e-mail por link, OAuth/Alexa.

## Regras de validação

| Campo | Cadastro (`CreateUserDto`) | Login (`SignInDto`) |
|-------|----------------------------|---------------------|
| name | obrigatório, 3–255, trim | — |
| email | obrigatório, `@IsEmail`, max 255, `trim` + `toLowerCase` | igual (normalização) |
| password | obrigatório, 8–64, trim | obrigatória, max 64, trim (sem mínimo, para não quebrar contas antigas) |

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
| POST | `/auth/login` | público | 5/min | 200 `{ accessToken }`; 401 genérico |
| POST | `/auth/reactivate` | público | 3/min | 200 `{ accessToken }`; 401 genérico; 409 limite; 500 se `restore` falhar |
| PUT | `/auth/refresh` | público | 10/min | e-mail normalizado |

### Body de conflito (409)

```json
{
  "statusCode": 409,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "E-mail já cadastrado"
}
```

Códigos: `EMAIL_ALREADY_EXISTS`, `ACCOUNT_DELETED_REACTIVATION_REQUIRED`, `USER_LIMIT_REACHED`.

`AlreadyExistsException` (400) permanece para group/store/payment — não alterar.

## Fluxo de reativação

1. Cadastro com e-mail soft-deleted → 409 `ACCOUNT_DELETED_REACTIVATION_REQUIRED`.
2. Cliente chama `POST /auth/reactivate` com `{ email, password }`.
3. Busca registro deletado; senha inválida, inexistente ou conta ainda ativa → **401** (mesma resposta, anti-oráculo) + audit log. Login de conta soft-deleted também é **401**.
4. Revalida limite de 15 usuários ativos; se estourado → 409 `USER_LIMIT_REACHED`.
5. `restore` + JWT; emite `user.reactivated` (não reemite `user.created`). Falha de `restore` (nenhuma linha afetada) → **500** + log `auth_reactivate_restore_failed` (não 401).

### Limitação

Sem reset de senha, conta deletada com senha esquecida fica inacessível e o e-mail permanece bloqueado pelo UNIQUE. Tratar na tarefa de recuperação de senha.

## Arquivos-chave

- `src/user/dto/create-user.dto.ts`, `update-user.dto.ts`
- `src/auth/dto/signIn.dto.ts`, `reactivate-account.dto.ts`
- `src/user/repositories/user.repository.ts`, `user.service.ts`
- `src/auth/auth.service.ts`, `auth.controller.ts`
- `src/exception/authErrorException.ts`
- `src/common/utils/transformString.util.ts` (`normalizeEmail`)
- `db/migrations/1776200000000-AddUniqueEmailToUser.ts`

## Testes

```bash
npm run test -- --testPathPattern=user.service.spec
npm run test -- --testPathPattern=user.repository.spec
npm run test -- --testPathPattern=auth.service.spec
npm run test:e2e:low-mem -- --testPathPattern=user.e2e-spec
npm run test:e2e:low-mem -- --testPathPattern=auth.e2e-spec
```
