# Status da API e keepalive do Supabase (SP-145)

Liveness público da API e job interno que evita pausa do projeto Supabase no plano free por inatividade.

---

## Objetivo

- Saber se o processo Nest está respondendo (`GET /status`).
- Manter o projeto Supabase (Storage) ativo com um ping leve a cada 5 dias.

## Escopo

**Entra**

- `GET /status` público (sem JWT).
- Cron diário com gate de 5 dias + `SupabaseStorageService.ping()`.
- Skip silencioso (log `info`, sem erro) quando o provider não é `supabase` ou URL/key/bucket estão vazios.

**Fica de fora**

- Checagem de MySQL, Gemini ou outros providers na rota pública.
- Chamar `GET /status` por HTTP como keepalive do Supabase (isso **não** gera tráfego na API do Supabase).

> **Atenção:** o prefixo `/health` já é o módulo de Saúde (exames). A liveness da API é **`/status`**.

---

## Contrato HTTP

| Método | Rota | Auth | Status | Body |
|--------|------|------|--------|------|
| `GET` | `/status` | Não | `200` | `{ "status": "ok" }` |

A rota não consulta banco nem Storage. Se o Nest responde, a API está no ar.

---

## Keepalive do Supabase

O plano free pausa o projeto após **7 dias** sem chamada à API do Supabase. A API roda em VPS com processo sempre ligado; `@nestjs/schedule` dispara o job.

| Item | Valor |
|------|--------|
| Cron | `0 4 * * *` (`America/Sao_Paulo`) |
| Provider | só pinga se `FILE_STORAGE_PROVIDER=supabase` (padrão). `google-drive` gera log `supabase_keepalive_skipped` (`reason: provider_not_supabase`) e não chama o Storage |
| Config | URL, key ou bucket vazios → mesmo evento com `reason: config_incomplete` (não é erro; o dia seguinte avalia de novo) |
| Gate | só executa se nunca houve sucesso **ou** último sucesso ≥ 5 dias |
| Ação | `storage.from(bucket).list('', { limit: 1 })` |
| Falha | log `supabase_keepalive_failed`; não atualiza último sucesso (tenta de novo no dia seguinte) |
| Sucesso | log `supabase_keepalive_ok`; grava timestamp em memória do processo |

Reinício da API zera o timestamp: o próximo tick diário faz ping de novo (aceitável).

---

## Arquivos-chave

| Caminho | Papel |
|---------|--------|
| `src/status/status.controller.ts` | `GET /status` |
| `src/status/status.module.ts` | Módulo + scheduler |
| `src/status/supabase-keepalive.scheduler.ts` | Cron + gate de 5 dias |
| `src/supabase-storage/supabase-storage.service.ts` | `ping()` |
| `src/app.module.ts` | Importa `StatusModule` |

---

## Testes

```bash
npm run test -- --testPathPattern=supabase-keepalive.scheduler
npm run test -- --testPathPattern=supabase-storage.service
npm run test:e2e:low-mem -- --testPathPattern=status
```

Cobertura mínima: gate (dispara / ignora / retry após falha), skip quando o provider não é `supabase` ou a config está vazia, `ping()` com `list({ limit: 1 })`, E2E `GET /status` sem token.
