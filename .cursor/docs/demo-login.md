# Demo Login — API (SP-118)

## Objetivo

Endpoint para autenticação direta do usuário demo via chave secreta, usado pelo frontend de portfólio sem expor credenciais reais.

## Escopo

**Entra:**
- `POST /auth/demo` — valida chave, emite JWT reduzido (2h) para o usuário demo

**Fica de fora:**
- Criação automática do usuário demo (deve ser cadastrado manualmente no banco)
- Rotação automática da chave

## Fluxo

1. Frontend envia `POST /auth/demo` com `{ key: string }`
2. `AuthController` despacha para `AuthService.demoLogin(key)` com rate limit de 3 req/min
3. `AuthService` verifica `DEMO_ENABLED`; se `false` → `ForbiddenException`
4. Compara `key` com `DEMO_SECRET` usando `timingSafeEqual` (previne timing attack)
5. Se inválida → `logJson warn` com `event: demo_login_failed` + `UnauthorizedException`
6. Busca usuário por `DEMO_USER_EMAIL`; se não existir → `NotFoundException`
7. Emite JWT com `{ sub, username, isDemo: true }` e `expiresIn: '2h'`
8. Salva token via `usersService.saveToken()` e retorna `{ accessToken }`

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
- [`.env-default`](../.env-default) — template de variáveis

## Segurança

- `timingSafeEqual` (Node.js `crypto`) — compare em tempo constante, sem vazamento por timing
- Rate limit rigoroso: 3 req/min (mesmo limite do `POST /auth/login`)
- JWT `expiresIn: '2h'` — janela menor que tokens normais
- `DEMO_ENABLED` flag — kill switch imediato sem redeploy
- Log `warn` a cada tentativa com chave inválida — rastreável via `{app="shop-smart-api"} | json | event="demo_login_failed"` no Loki

## Testes

```bash
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
