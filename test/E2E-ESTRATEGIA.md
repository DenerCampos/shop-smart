# E2E — estratégia (Shop Smart API)

O `test/jest-e2e.json` inclui `moduleNameMapper` para imports `src/...`, alinhado ao Jest unitário.

O arquivo `test/app.e2e-spec.ts` importa o `AppModule` completo, incluindo `TypeOrmModule.forRootAsync` e MySQL. Portanto:

- **Não** é adequado rodar `npm run test:e2e` em CI ou localmente sem banco configurado (variáveis `API_DB_*`) e migrações aplicadas.
- O teste legado `GET /` com resposta "Hello World" **não** reflete rotas reais da aplicação; deve ser substituído por health check real ou removido quando houver rota definida.

## Opções recomendadas

1. **E2E com banco de teste:** MySQL dedicado (Docker ou serviço CI), `migration:run`, seed mínimo, depois Supertest sobre `AppModule`.
2. **E2E sem banco:** não usar `AppModule`; montar `TestingModule` com módulos parciais e `overrideProvider` (como nos testes de integração em `src/**/test/*.integration.spec.ts`).
3. **Manter `test:e2e` desativado** até existir ambiente estável: usar `describe.skip` no arquivo e2e ou documentar no pipeline que o job e2e é opcional.

O `AppModule` expõe `ThrottlerGuard` com `APP_GUARD` + `useExisting: ThrottlerGuard`, permitindo `overrideProvider(ThrottlerGuard)` em testes quando necessário (documentação NestJS Testing).
