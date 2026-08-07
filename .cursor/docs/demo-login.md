# Demo Login — API (SP-118 / SP-130)

## Objetivo

Endpoint para autenticação direta do usuário demo via chave secreta, usado pelo frontend de portfólio sem expor credenciais reais. Em sessão demo, mutações de **perfil/conta** são bloqueadas (SP-130).

## Escopo

**Entra:**
- `POST /auth/demo` — valida chave, emite JWT reduzido (2h) para o usuário demo
- Bloqueio de escrita de perfil quando JWT tem `isDemo: true` (`DenyDemoGuard`)

**Fica de fora:**
- Criação automática do usuário demo (deve ser cadastrado manualmente no banco)
- Rotação automática da chave
- Demo somente leitura do sistema inteiro (listas, despesas, etc. seguem liberados)

## Fluxo

1. Frontend envia `POST /auth/demo` com `{ key: string }`
2. `AuthController` despacha para `AuthService.demoLogin(key)` com rate limit de 3 req/min
3. `AuthService` verifica `DEMO_ENABLED`; se `false` → `ForbiddenException`
4. Compara `key` com `DEMO_SECRET` usando `timingSafeEqual` (previne timing attack)
5. Se inválida → `logJson warn` com `event: demo_login_failed` + `UnauthorizedException`
6. Busca usuário por `DEMO_USER_EMAIL`; se não existir → `NotFoundException`
7. Emite JWT com `{ sub, username, isDemo: true }` e `expiresIn: '2h'`
8. Salva token via `usersService.saveToken()` e retorna `{ accessToken }`
9. Em rotas autenticadas, `AuthGuard` propaga `request.isDemo` a partir do payload
10. Rotas de mutação de perfil usam `DenyDemoGuard` → `403` se `isDemo`

## Contrato HTTP

### `POST /auth/demo`

| | |
|---|---|
| Path | `/auth/demo` |
| Método | `POST` |
| Throttle | 3 req/min por IP |
| Auth | Nenhuma |

**Request body:**
```json
{ "key": "string" }
```

**Responses:**

| Status | Situação |
|--------|----------|
| 200 | `{ accessToken: string }` — login bem-sucedido |
| 401 | Chave inválida ou `DEMO_SECRET` não configurado |
| 403 | `DEMO_ENABLED=false` |
| 404 | Usuário demo não encontrado no banco |
| 429 | Rate limit excedido |

### Mutações bloqueadas em sessão demo (403)

| Método | Path |
|--------|------|
| `PATCH` | `/user/:id` |
| `DELETE` | `/user/:id` |
| `POST` | `/profile/complete-profile` |
| `POST` | `/profile/upload-image` |
| `POST` | `/profile/integrations/alexa/unlink` |

Leitura (`GET /profile`, `GET /user/:id`, etc.) permanece permitida.

## Variáveis de ambiente

| Variável | Padrão | Obrigatório em prod |
|---|---|---|
| `DEMO_ENABLED` | `false` | Sim — setar `true` para ativar |
| `DEMO_SECRET` | _(vazio)_ | Sim — gere com `openssl rand -hex 32` |
| `DEMO_USER_EMAIL` | `demo@superfamilyquest.com` | Sim — deve existir no banco |

## Arquivos-chave

- [`src/common/app-config/app.config.ts`](../src/common/app-config/app.config.ts) — `isDemoEnabled()`, `getDemoSecret()`, `getDemoUserEmail()`
- [`src/auth/auth.service.ts`](../src/auth/auth.service.ts) — `demoLogin(key)`
- [`src/auth/auth.controller.ts`](../src/auth/auth.controller.ts) — `POST /auth/demo`
- [`src/auth/auth.guard.ts`](../src/auth/auth.guard.ts) — propaga `request.isDemo`
- [`src/auth/deny-demo.guard.ts`](../src/auth/deny-demo.guard.ts) — bloqueia writes de perfil
- [`src/user/user.controller.ts`](../src/user/user.controller.ts) — `PATCH`/`DELETE` com `DenyDemoGuard`
- [`src/profile/profile.controller.ts`](../src/profile/profile.controller.ts) — mutações de perfil com `DenyDemoGuard`
- [`.env-default`](../.env-default) — template de variáveis

## Segurança

- `timingSafeEqual` (Node.js `crypto`) — compare em tempo constante, sem vazamento por timing
- Rate limit rigoroso: 3 req/min (mesmo limite do `POST /auth/login`)
- JWT `expiresIn: '2h'` — janela menor que tokens normais
- `DEMO_ENABLED` flag — kill switch imediato sem redeploy
- Log `warn` a cada tentativa com chave inválida — rastreável via `{app="shop-smart-api"} | json | event="demo_login_failed"` no Loki
- Log `warn` em mutação de perfil bloqueada — `{app="shop-smart-api"} | json | event="demo_profile_mutation_denied"` (`userId`, `method`, `path`)
- Proteção de perfil no **servidor** via `isDemo` no JWT (não confiar só no frontend)

## Testes

```bash
# Unitários do guard
npm run test -- --testPathPattern=deny-demo.guard

# E2E (sessão demo bloqueia PATCH /user e complete-profile)
npm run test:e2e:low-mem -- --testPathPattern=auth.e2e-spec

# Ativar e testar com chave correta
curl -X POST http://localhost:3000/auth/demo \
  -H 'Content-Type: application/json' \
  -d '{"key":"<DEMO_SECRET>"}'
# Esperado: 200 + accessToken

# Chave errada
curl -X POST http://localhost:3000/auth/demo \
  -H 'Content-Type: application/json' \
  -d '{"key":"chave-errada"}'
# Esperado: 401

# Demo desabilitado
# Setar DEMO_ENABLED=false e reiniciar a API
# Esperado: 403
```

Documentação do lado frontend: `app/super-family-quest/.cursor/docs/demo-login.md`
