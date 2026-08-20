# E-mail transacional (SP-91)

## Objetivo

Enviar e-mails da API (redefinição de senha, boas-vindas, convite familiar) via provider configurável, sem acoplar domínio ao Brevo e sem queimar a cota em dev/CI.

## Escopo

**Entra**

- `EmailModule` + `EmailService` (templates HTML + texto)
- Providers `brevo` e `noop` (`EMAIL_PROVIDER`)
- Templates: reset de senha, boas-vindas, notificação genérica
- Canal `email` nas notificações internas

**Fora**

- Preferências de canal por usuário
- Fila persistente (Bull/Redis); o envio no forgot-password é fire-and-forget na request

## Configuração

| Variável | Default | Uso |
|----------|---------|-----|
| `EMAIL_PROVIDER` | `noop` | `brevo` em produção; `noop` em dev/CI |
| `BREVO_API_KEY` | vazio | Chave da API Brevo |
| `EMAIL_FROM` | vazio | Remetente confirmado no Brevo |
| `EMAIL_FROM_NAME` | Super Family Quest | Nome do remetente |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | 30 | Validade do link de reset |
| `FRONTEND_URL` | — | Base dos links (`/reset-password?token=`, convites) |

`noop` é o padrão de propósito: sem config, a API não chama a Brevo. O `logJson` do noop registra só `to` e `subject` (nunca o corpo/token). Em `isDevelopment()` o texto vai para `Logger.debug`, fora do Loki.

## Fluxo

1. Auth / listener chama `EmailService.sendPasswordReset` / `sendWelcome` / `sendNotification`.
2. `dispatch` nunca relança exceção: cadastro, convite e forgot-password não quebram se o provider falhar.
3. Forgot-password **não espera** o envio: persiste o token, responde 200 e dispara o e-mail em background.

## Arquivos-chave

| Área | Path |
|------|------|
| Módulo | `src/email/` |
| Providers | `src/email/providers/` |
| Templates | `src/email/templates/` |
| Canal de notificação | `src/notification/channels/email.channel.ts` |

## Testes

```bash
npm test -- --testPathPattern=email
npm test -- --testPathPattern=email.channel
```
