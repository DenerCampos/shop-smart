# E2E — estratégia (Shop Smart API)

O [`test/jest-e2e.json`](jest-e2e.json) inclui `moduleNameMapper` para imports `src/...`, `setupFiles` ([`load-env-test.js`](load-env-test.js)), `globalSetup` / `globalTeardown` ([`e2e-global-setup.js`](e2e-global-setup.js), [`e2e-global-teardown.js`](e2e-global-teardown.js)) e timeout de 60s.

## Banco fixo (sem container descartável)

- Bases: **`shop_smart`** (dev) e **`shop_smart_test`** (E2E), criadas com `IF NOT EXISTS` via [`scripts/create-shop-smart-databases.sh`](../scripts/create-shop-smart-databases.sh) ou [`.sql`](../scripts/create-shop-smart-databases.sql).
- **`.env.test`** na raiz (a partir de [`.env.test.example`](../.env.test.example)): `API_DB_NAME=shop_smart_test`, `NODE_ENV=test`, demais `API_DB_*` apontando para o MySQL local. O setup falha se `API_DB_NAME` ≠ `shop_smart_test`.
- **Antes da suíte:** `npm run build`, `typeorm migration:run`, `dist/db/seeds/run-all.dev.seed.js`.
- **Depois da suíte:** `typeorm schema:drop` no banco configurado em `.env.test` (apaga todas as tabelas; na próxima execução o setup roda migrações de novo).

Não rode E2E apontando `API_DB_NAME` para produção ou para o banco de desenvolvimento que você não quer limpar.

## Máquina com pouca RAM (prioridade: memória, não velocidade)

O setup global faz `build` + migrations + seeds — **pico de RAM** no início. Depois, preferir rodar **um spec por vez**.

```bash
# Recomendado no dia a dia (limite ~1 GB heap; pode demorar mais)
npm run test:e2e:low-mem -- --testPathPattern=mission

# Evitar em máquina fraca (cobertura E2E usa muita RAM)
# npm run test:e2e:cov
```

| Prática | Motivo |
|---------|--------|
| `test:e2e:low-mem` | `NODE_OPTIONS=--max-old-space-size=1024`, `--runInBand`, `--forceExit` |
| `--testPathPattern=<nome>` | Não carregar a suíte inteira enquanto desenvolve |
| `app.close()` no `afterAll` | Libera handles do Nest/MySQL entre arquivos |
| Suíte completa | Só antes de merge em `homolog` ou no CI |

Se ainda faltar memória, suba o heap gradualmente (`1536` ou `2048`) ou rode um único `.e2e-spec.ts` por invocação.

## AppModule e alternativas

[`test/app.e2e-spec.ts`](app.e2e-spec.ts) importa o [`AppModule`](../src/app.module.ts) completo (TypeORM, Redis só se exigido no futuro, etc.). Exige MySQL acessível e `.env.test` válido.

**E2E sem banco:** não importar `AppModule`; montar `TestingModule` com módulos parciais e `overrideProvider` (como em `src/**/test/*.integration.spec.ts`).

## NestJS

O `AppModule` expõe `ThrottlerGuard` com `APP_GUARD` + `useExisting: ThrottlerGuard`, permitindo `overrideProvider(ThrottlerGuard)` nos testes. A configuração HTTP espelhando [`main.ts`](../src/main.ts) está em [`configure-e2e-app.ts`](configure-e2e-app.ts).

Documentação detalhada: [`.cursor/docs/testes.md`](../.cursor/docs/testes.md) (seção E2E com MySQL).
