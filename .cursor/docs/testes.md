# Testes (Jest) — Shop Smart API

Referência para localização dos arquivos, comandos e estratégia de mocks **sem banco de dados**. Alinhar implementações futuras a este documento; o plano macro corresponde ao Cursor Plan **Estratégia de testes Jest**.

## Referências

- **Regras do repositório:** [.cursor/rules/regra-projeto.mdc](../rules/regra-projeto.mdc) — seção *Testing* (Jest, `rootDir: src/`, `*.spec.ts`), estrutura `nome-modulo/test/`, prioridade da **camada de serviço** (lógica de negócio), validação com `class-validator`, sem Swagger nos testes.
- **Documentação NestJS:** [Testing](https://docs.nestjs.com/fundamentals/testing) — `Test.createTestingModule`, `compile()`, `moduleRef.get()` / `resolve()`, custom providers, `overrideProvider` / `overrideGuard` / etc., e2e com `createNestApplication` + Supertest + `app.close()`.

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run typecheck` | `tsc --noEmit` — checagem de tipos no projeto (complementa o Jest com `ts-jest` + `isolatedModules: true`). |
| `npm test` | Roda specs em `src/**/*.spec.ts` (ver `package.json` → `jest`), sem `--forceExit`. |
| `npm run test:ci` | Igual a `npm test`, com `--forceExit` (CI ou quando há handles assíncronos pendentes). |
| `npm run test:watch` | Mesmo conjunto em modo watch. |
| `npm run test:cov` | Cobertura em `coverage/`. |
| `npm run test:cov:ci` | Cobertura com `--forceExit` (mesmo critério de `test:ci`). |
| `npm run test:e2e` | Apenas arquivos `test/**/*.e2e-spec.ts` com [`test/jest-e2e.json`](../../test/jest-e2e.json) — hoje sobe [`AppModule`](../../src/app.module.ts) com TypeORM (**espera ambiente com MySQL**). |
| `npm run test:e2e:ci` | E2E com `--forceExit`. |

O Jest (`package.json` → `jest` → `transform` / `ts-jest`) usa **`isolatedModules: true`** para acelerar a execução dos testes; **`npm run typecheck`** (`tsc --noEmit`) cobre a checagem de tipos no repositório como um todo.

Se após `npm test` aparecer *“Jest did not exit…”*, há operações assíncronas ainda ativas (handles abertos). Enquanto isso não for corrigido na suíte, use **`npm run test:ci`** no pipeline ou localmente para encerrar o processo com `--forceExit`, ou investigue com **`npm test -- --detectOpenHandles`**.

## Onde colocar os arquivos

### Testes unitários e integração sem DB

- **Pasta:** `src/<nome-do-modulo>/test/`
- **Nomes:**
  - Serviços e utilitários: `auth.service.spec.ts`, `expense.service.spec.ts`, etc.
  - Controllers: `user.controller.spec.ts`
  - **Integração HTTP (supertest, sem `TypeOrmModule.forRoot`):** `auth.integration.spec.ts` (ou sufixo similar), **ainda sob `src/`**, para continuar sendo descoberto pelo `testRegex` atual (`.*\.spec\.ts$`).

### E2E

- **Pasta:** `test/` na raiz do projeto
- **Nome:** `*.e2e-spec.ts`
- **Nota:** fluxo completo com banco; não é o mesmo objetivo dos testes “sem DB”.
- **Estratégia e CI:** ver [test/E2E-ESTRATEGIA.md](../../test/E2E-ESTRATEGIA.md). O `test/app.e2e-spec.ts` está com `describe.skip` até haver MySQL de teste e cenários reais.

### Helpers compartilhados (opcional)

- Quando surgir duplicação: `test/helpers/` ou `src/common/test/` (definir um único lugar e documentar aqui).

## Estratégia sem banco (alinhada ao Nest)

1. **`await Test.createTestingModule({ ... }).compile()`** — metadados como em `@Module()`; **não** importar `TypeOrmModule.forRoot`.
2. **Instâncias:** `moduleRef.get(MeuService)` (providers estáticos); providers *request-scoped* exigem `resolve()` e, se preciso, `ContextIdFactory` (ver doc Nest).
3. **Repositórios por interface** (`@Inject('IUserRepository')`, etc.): `{ provide: 'IUserRepository', useValue: { ... } }` ou, com módulo importado, **`.overrideProvider('IUserRepository').useValue(...)`** antes de `compile()`.
4. **TypeORM `@InjectRepository(Entity)`:** `getRepositoryToken(Entity)` + `useValue` com mock (incluindo `createQueryBuilder` encadeado quando necessário).
5. **Transações:** mockar [`QueryRunnerFactory`](../../src/common/query-runner/queryRunner.factory.ts) com `manager` fake e métodos de transação como `jest.fn()`, em vez de subir `DataSource` real.
6. **Integração HTTP:** `createNestApplication()`, `await app.init()`, `supertest(app.getHttpServer())`, **`await app.close()`** no `afterAll`; quando o caso depender de validação, aplicar `ValidationPipe` com as mesmas opções de [`main.ts`](../../src/main.ts) (`whitelist`, `transform`).
7. **Guard global (`ThrottlerGuard`):** em [`app.module.ts`](../../src/app.module.ts) o `ThrottlerGuard` está nos `providers` e o `APP_GUARD` usa **`useExisting: ThrottlerGuard`** (em vez de `useClass`), o que permite **`overrideProvider(ThrottlerGuard)`** em testes e2e/integração quando necessário (ver também [test/E2E-ESTRATEGIA.md](../../test/E2E-ESTRATEGIA.md)).
8. **Auto-mock (opcional):** `.useMocker()` ou `createMock` (`@golevelup/ts-jest`), como sugerido na doc Nest, se o número de dependências explodir.

### Segurança nos testes (regra-projeto)

- Não colocar senhas, refresh tokens ou segredos reais em fixtures, logs ou snapshots.
- Ao testar falhas de login/refresh, assertir comportamento sem reproduzir dados sensíveis nos mocks de audit.

## Prioridades de cobertura (resumo)

- **Alta (serviços — regra de negócio):** `AuthService`, `UserService`, `ExpenseService` (e fluxos CRUD dos demais domínios com interface `I*Repository`).
- **Média:** controllers apenas delegação + HTTP (service mockado); `ProfileService`, `CouponReaderService`, reconhecimento (imagem/áudio/texto) com APIs mockadas; `FamilyMemberResolverService`.
- E2E: tratar à parte (DB de teste ou revisar [`test/app.e2e-spec.ts`](../../test/app.e2e-spec.ts)).

## Estado atual

- Vários `*.spec.ts` são placeholders (`should be defined`) ou instanciam services sem mocks — **corrigir antes** de confiar em `npm test` no CI.
- Nenhuma mudança obrigatória de dependências para mocks; Jest + `@nestjs/testing` já estão no projeto.
