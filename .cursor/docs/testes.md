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
| `npm run test:e2e` | Apenas `test/**/*.e2e-spec.ts` — [`test/jest-e2e.json`](../../test/jest-e2e.json): carrega [`.env.test`](../../.env.test) (obrigatório), `globalSetup` (build + `migration:run` + seeds no `shop_smart_test`), suíte, `globalTeardown` (`schema:drop` no mesmo banco). Usa `--runInBand` e `--forceExit`. |
| `npm run test:e2e:low-mem` | **Preferir em máquina com pouca RAM**: heap limitado a ~1 GB (`NODE_OPTIONS=--max-old-space-size=1024`), `--runInBand`, `--forceExit`, `--logHeapUsage`. Pode demorar mais; troca velocidade por menor pico de memória. Combine com `--testPathPattern=<spec>` para um arquivo por vez. |
| `npm run test:e2e:cov` | Igual ao `test:e2e` com `--coverage` e heap 4 GB — **evitar em máquina fraca**; relatório em `coverage-e2e/`. |
| `npm run test:e2e:ci` | E2E com `--forceExit` (redundante se `test:e2e` já incluir; mantido para pipelines que chamem o alvo explícito). |
| `npm run db:create` | [`scripts/create-shop-smart-databases.sh`](../../scripts/create-shop-smart-databases.sh) — cria `shop_smart` e `shop_smart_test` (`IF NOT EXISTS`) e aplica `GRANT`. Sem `mysql` no host, defina **`MYSQL_DOCKER_CONTAINER`** (ex.: `gym-flow-mysql`) no `.env` / `.env.test` para executar SQL via `docker exec`. |
| `npm run seed:test` | Build + seeds de dev usando `.env.test` (debug manual sem Jest). |

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
- **Estratégia e CI:** ver [test/E2E-ESTRATEGIA.md](../../test/E2E-ESTRATEGIA.md).
- **Configuração da aplicação em E2E:** [`test/configure-e2e-app.ts`](../../test/configure-e2e-app.ts) espelha pipe, `ClassSerializerInterceptor`, `useContainer` e CORS de [`main.ts`](../../src/main.ts) (sem Winston/listen).

## TypeORM: `autoLoadEntities` (runtime Nest vs CLI)

[`src/config/typeorm.config.ts`](../../src/config/typeorm.config.ts) usa **`autoLoadEntities: true`** e **não** define glob `entities: ['dist/**/*.entity.js']`.

### Produção (e qualquer `npm run start` / `start:prod`)

- **Não há problema** desde que **cada entidade** usada pela aplicação esteja registada via `TypeOrmModule.forFeature([...])` nalgum módulo **importado** pelo [`AppModule`](../../src/app.module.ts) (padrão recomendado pelo Nest).
- **Vantagem:** a mesma classe TypeScript (ou a carregada pelo `ts-jest` nos testes) é a que o TypeORM regista — evita o erro *“No metadata for … was found”* quando o runtime misturava metadados de `dist/**/*.entity.js` com repositórios resolvidos a partir de `src/`.
- **Risco operacional:** alguém adiciona um ficheiro `*.entity.ts` e **esquece** o `forFeature` — em produção o sintoma é falha ao usar essa entidade (igual em E2E). Mitigação: incluir sempre a entidade no módulo do domínio.

### CLI (`db/data-source.ts`, migrações)

- A flag `autoLoadEntities` é tratada pelo **@nestjs/typeorm** ao criar o `DataSource` **dentro** da app; o **`new DataSource(options)`** usado pelo CLI **não** preenche entidades sozinho.
- Por isso [`db/data-source.ts`](../../db/data-source.ts) **remove** `autoLoadEntities` das opções e define explicitamente `entities: ['dist/**/*.entity.js']`, para `migration:generate`, `schema:log`, etc., continuarem com metadados corretos **após** `npm run build`.
- Comandos que só executam SQL de migrações (`migration:run`, `migration:revert`) toleram lista de entidades vazia; os que comparam entidades à base dependem deste glob.

## E2E com MySQL (`shop_smart_test`)

1. **Criar bases e permissões (uma vez por ambiente):** `npm run db:create` (exige `mysql` no PATH e senha de admin via `MYSQL_ADMIN_PASS` ou `API_DB_ROOT_PASS` no `.env`). Alternativa: SQL em [`scripts/create-shop-smart-databases.sql`](../../scripts/create-shop-smart-databases.sql).
2. **Variáveis:** copie [`.env.test.example`](../../.env.test.example) para **`.env.test`** na raiz (arquivo ignorado pelo Git). É obrigatório **`API_DB_NAME=shop_smart_test`** — o `globalSetup` / `globalTeardown` abortam ou ignoram se o nome for outro (proteção contra `schema:drop` no banco errado).
3. **Fluxo ao rodar `npm run test:e2e` / `test:e2e:low-mem`:** `test/load-env-test.js` → `e2e-global-setup.js` (`npm run build`, `typeorm migration:run`, `run-all.dev.seed.js`) → testes → `e2e-global-teardown.js` (`typeorm schema:drop`). Seeds usam o mesmo bundle de dev e **não** rodam com `NODE_ENV=production`.
4. **Pouca RAM:** use `npm run test:e2e:low-mem -- --testPathPattern=nome` (um spec por vez). Detalhes em [test/E2E-ESTRATEGIA.md](../../test/E2E-ESTRATEGIA.md#máquina-com-pouca-ram-prioridade-memória-não-velocidade).
5. **Desenvolvimento local:** o `.env` habitual pode continuar com `API_DB_NAME=shop_smart`; só o E2E usa `shop_smart_test`.
6. **Credenciais de seed (login):** o usuário criado em [`db/seeds/user.dev.seed.ts`](../../db/seeds/user.dev.seed.ts) (`teste@dev.local` / senha de dev no seed) — não usar segredos reais em fixtures; ver regra-projeto.
7. **Throttling:** [`test/e2e/helpers/create-e2e-app.ts`](../../test/e2e/helpers/create-e2e-app.ts) (e smoke em [`test/app.e2e-spec.ts`](../../test/app.e2e-spec.ts)) usa `overrideProvider(ThrottlerGuard)` para evitar 429 em E2E; o `APP_GUARD` com `useExisting: ThrottlerGuard` permite este override.
8. **Mocks de IAs / Drive / cupom:** [`test/e2e/helpers/external-mocks.ts`](../../test/e2e/helpers/external-mocks.ts) — nomes dos provedores mockados devem coincidir com o que as factories resolvem (`DEFAULT_RECOGNITION_PROVIDER`, ex.: `gemini`, `gemini-text`, `gemini-audio`); caso contrário a API responde 404 (*provider not found*).
9. **Recuperação manual:** se o processo Jest for encerrado de forma anormal e o `globalTeardown` não rodar, com `.env.test` carregado execute `npx typeorm schema:drop -d dist/db/data-source.js` (após `npm run build`) ou rode `npm run test:e2e` de novo (o setup reaplica migrações em schema vazio).

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
- E2E: [`test/app.e2e-spec.ts`](../../test/app.e2e-spec.ts) com `shop_smart_test` e pipeline acima; expandir cenários HTTP conforme prioridade de negócio.

## Estado atual

- Vários `*.spec.ts` são placeholders (`should be defined`) ou instanciam services sem mocks — **corrigir antes** de confiar em `npm test` no CI.
- Nenhuma mudança obrigatória de dependências para mocks; Jest + `@nestjs/testing` já estão no projeto.
