---
alwaysApply: true
---

# Shop Smart API - Regras do Projeto

## 📋 Informações Gerais
- **Nome do Projeto**: Shop Smart API
- **Tipo**: Backend REST API
- **Versão**: 0.0.1
- **Licença**: UNLICENSED (Privado)
- **Descrição**: Sistema de gerenciamento financeiro pessoal com gamificação e recursos de leitura de cupons fiscais

## 🛠️ Stack Tecnológica

### Linguagem Principal
- **TypeScript**: ^4.7.4
  - Module: CommonJS
  - Target: ES2017
  - Decorators: Habilitado
  - Strict Mode: Parcialmente desabilitado (para flexibilidade)

### Framework Principal
- **NestJS**: ^9.0.0
  - @nestjs/common: ^9.0.0
  - @nestjs/core: ^9.0.0
  - @nestjs/platform-express: ^9.0.0
  - @nestjs/cli: ^9.0.0
  - @nestjs/schematics: ^9.0.0
  - @nestjs/jwt: ^10.1.0
  - @nestjs/typeorm: ^9.0.1
  - @nestjs/swagger: ^6.3.0
  - @nestjs/testing: ^9.0.0

### Banco de Dados e ORM
- **TypeORM**: ^0.3.16
- **MySQL**: 8.0
  - Driver: mysql2 ^3.3.3
- **Sistema de Migrações**: Habilitado
  - Migrations baseadas em entidades
  - Backup automático diário (02:00)
  - **NUNCA usar synchronize em produção**

### Autenticação e Segurança
- **JWT**: @nestjs/jwt ^10.1.0
- **BCrypt**: ^5.1.0 (hash de senhas - 10 rounds)

### Validação e Transformação
- **class-validator**: ^0.14.0
- **class-transformer**: ^0.5.1

### Documentação
- **Swagger/OpenAPI**: @nestjs/swagger ^6.3.0 (disponível mas não utilizado no projeto)

### Web Scraping
- **Cheerio**: ^1.0.0-rc.12 (parsing HTML)
- **Axios**: ^1.4.0 (HTTP client)

### Cache
- **Redis**: 7.2.4

### Utilities
- **dotenv**: ^16.0.3
- **uuid**: ^9.0.0
- **RxJS**: ^7.2.0

### Testing
- **Jest**: 29.3.1
  - ts-jest: 29.0.3
  - supertest: ^6.1.3

### Code Quality
- **ESLint**: ^8.0.1
  - @typescript-eslint/eslint-plugin: ^5.0.0
  - @typescript-eslint/parser: ^5.0.0
  - eslint-config-prettier: ^8.3.0
  - eslint-plugin-prettier: ^4.0.0
- **Prettier**: ^2.3.2

## 🏗️ Arquitetura e Estrutura

### Padrão Arquitetural
- **Arquitetura em Camadas (Layered Architecture)**
- **Domain-Driven Design (DDD)** - Organização modular por domínio
- **Repository Pattern** - Abstração de acesso a dados
- **Dependency Injection** - Injeção de dependências nativa do NestJS

### Estrutura de Pastas
```
src/
├── auth/                 # Módulo de autenticação JWT
├── user/                 # Módulo de usuários
├── expense/              # Módulo de despesas
├── revenue/              # Módulo de receitas
├── coin/                 # Módulo de moedas (gamificação)
├── theme/                # Módulo de temas visuais
├── profile/              # Módulo de perfil do usuário
├── reports/              # Módulo de relatórios financeiros
├── coupon-reader/        # Módulo de leitura de cupons fiscais
├── image-recognition/    # Módulo de reconhecimento de imagens
├── group/                # Módulo de grupos de despesas
├── payment/              # Módulo de formas de pagamento
├── store/                # Módulo de lojas/estabelecimentos
├── common/               # Módulo compartilhado
│   ├── app-config/       # Configurações da aplicação
│   ├── decorators/       # Decorators customizados
│   ├── event-emitter/    # Sistema de eventos
│   ├── pagination/       # Sistema de paginação
│   ├── query-runner/     # Query builder helpers
│   ├── response/         # Padronização de respostas
│   ├── types/            # Tipos compartilhados
│   └── utils/            # Utilidades
├── exception/            # Exceções customizadas
├── config/               # Configurações (TypeORM, etc)
└── main.ts              # Entry point da aplicação

db/
├── data-source.ts        # Configuração do DataSource
└── migrations/           # Arquivos de migração
```

### Responsabilidades por Camada

#### 1. Controller Layer
- Recebe requisições HTTP
- Valida DTOs (automático via class-validator)
- Chama services apropriados
- **SEMPRE** mapeia entidades para DTOs de resposta usando `responseService.mapToDto()`
- Retorna respostas HTTP padronizadas
- **Não deve conter lógica de negócio**
- **NUNCA retornar entidades diretamente - sempre usar DTOs**

#### 2. Service Layer
- Contém **TODA** lógica de negócio
- Implementa regras de domínio
- Orquestra repositórios
- Gerencia transações
- Emite eventos de domínio
- Sistema de paginação
- Aplicação de filtros e ordenação
- **Camada mais importante da aplicação**

#### 3. Repository Layer
- Abstração de acesso ao banco
- Query building específico
- Otimizações de queries
- Reutilização de queries complexas
- **Não deve conter lógica de negócio**

#### 4. Entity Layer
- Definição de entidades TypeORM
- Mapeamento objeto-relacional
- Relacionamentos entre entidades
- Constraints e validações de banco
- **Apenas estrutura de dados**

#### 5. DTO Layer
- Data Transfer Objects
- Validação de entrada (class-validator) em DTOs de request
- Transformação de dados (class-transformer)
- **Sempre separar DTOs de request e response**
- **OBRIGATÓRIO: Todo request deve ter um DTO de entrada**
- **OBRIGATÓRIO: Todo response deve ter um DTO de saída**
- Nunca expor entidades diretamente nas respostas
- Usar @Expose() do class-transformer em DTOs de response
- **NÃO usar decorators do Swagger** (projeto sem documentação)

#### 6. Exception Layer
- Exceções customizadas do projeto:
  - `AlreadyExistsException` - Recurso já existe
  - `NotExistException` - Recurso não encontrado
  - `InsufficientResourceException` - Recurso insuficiente
  - `RemoveException` - Erro ao remover
  - `UpdateException` - Erro ao atualizar

### Módulos Principais

#### Auth Module
- Autenticação JWT
- Login e registro de usuários
- Guard de proteção de rotas (`AuthGuard`)
- Refresh tokens
- Hash de senhas com BCrypt

#### User Module
- Gerenciamento de usuários
- Perfis de usuário
- Sistema de eventos de usuário
- Relacionamentos com outros módulos

#### Expense Module
- Registro de despesas
- Despesas recorrentes
- Relacionamento com: grupo, loja, forma de pagamento
- Histórico de despesas
- Queries otimizadas para listagens

#### Revenue Module
- Registro de receitas
- Receitas recorrentes
- Controle de entradas financeiras
- Integração com sistema de moedas

#### Coin Module
- Sistema de moedas (gamificação)
- Ganho e gasto de moedas
- Histórico de transações
- Eventos de moeda para desacoplamento

#### Theme Module
- Temas visuais compráveis com moedas
- Temas do usuário
- Gerenciamento de temas disponíveis

#### Coupon Reader Module
- Leitura de cupons fiscais
- Web scraping de dados de NF-e
- Parsing de HTML (Cheerio)
- Extração automática de produtos e valores

#### Image Recognition Module
- Reconhecimento de imagens de produtos
- Integração com provedores de IA
- Extração de dados de imagens
- Providers abstraídos para flexibilidade

#### Reports Module
- Relatórios financeiros detalhados
- Agregações e estatísticas
- Queries otimizadas para análise
- Múltiplos tipos de visualizações

#### Profile Module
- Dados de perfil do usuário
- Personalização de experiência
- Configurações do usuário

#### Resource Modules (Group, Payment, Store)
- Grupos de despesas (categorias)
- Formas de pagamento
- Lojas/estabelecimentos
- CRUD completo para cada recurso
- Relacionamento com usuário (multi-tenant)

### Common Module
- **App Config**: Configurações centralizadas da aplicação
- **Decorators**: Decorators customizados do NestJS
- **Event Emitter**: Sistema de eventos interno
- **Pagination**: Sistema de paginação reutilizável
- **Query Runner**: Helpers para construção de queries
- **Response**: Padronização de respostas HTTP
- **Utils**: Funções utilitárias compartilhadas

## 🗄️ Banco de Dados

### Configuração MySQL
- **Versão**: 8.0
- **Charset**: utf8mb4_unicode_ci
- **Pool Size**: 2 conexões (otimizado para recursos limitados)
- **Idle Timeout**: 30s
- **Keep Alive**: Habilitado
- **SSL**: Configurável via variável de ambiente

### Sistema de Migrações
```bash
# Gerar migração baseada em mudanças de entidades
npm run migration:generate db/migrations/NomeDaMigracao

# Executar migrações pendentes
npm run migration:run

# Reverter última migração
npm run migration:revert

# Ver status das migrações
npm run migration:show

# Dropar schema (CUIDADO! Apenas em desenvolvimento)
npm run migration:drop
```

### Backup Automático
- Backup diário automático às 02:00
- Backups salvos em `/opt/shop_smart/backups`
- Script de backup manual: `./backup-now.sh`
- Container dedicado para backups no Docker Compose

### Boas Práticas de Banco
- **Sempre usar migrations**
- **NUNCA usar `synchronize: true` em produção**
- Fazer backup antes de mudanças críticas
- Testar migrations em desenvolvimento
- Revisar SQL gerado antes de aplicar
- Usar índices em campos frequentemente consultados
- Evitar N+1 queries (usar eager loading quando apropriado)

## 🐳 Docker e Deploy

### Docker Compose Services
1. **API**: Aplicação NestJS
   - Porta: Configurável via `API_PORT`
   - Restart: Always
   - Logs: Volume montado

2. **DB (MySQL)**: Banco de dados
   - Porta: Configurável via `API_DB_PORT`
   - Volume persistente: `db_data`
   - Config customizada: `mysql-config/my.cnf`

3. **Redis**: Cache
   - Versão: 7.2.4
   - Restart: Always

4. **Backup**: Container Alpine para backups
   - Scripts em `/scripts`
   - Backups em `/opt/shop_smart/backups`

### Variáveis de Ambiente
```env
# API
API_PORT=3000
NODE_ENV=development|production

# Database
API_DB_HOST=localhost
API_DB_PORT=3306
API_DB_USER=root
API_DB_PASS=senha
API_DB_NAME=shop_smart
API_DB_ROOT_PASS=senha_root

# SSL (Opcional)
SSL_CERT=

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000
```

## 📦 Scripts Disponíveis

### Development
```bash
npm run start           # Inicia a aplicação
npm run start:dev       # Inicia em modo watch (recarrega automático)
npm run start:debug     # Inicia em modo debug
npm run build           # Build de produção
```

### Production
```bash
npm run start:prod      # Inicia em produção (otimizado)
```

### Testing
```bash
npm run test            # Executa testes unitários
npm run test:watch      # Testes em modo watch
npm run test:cov        # Testes com cobertura
npm run test:e2e        # Testes end-to-end
npm run test:debug      # Testes em modo debug
```

### Code Quality
```bash
npm run lint            # Executa ESLint com auto-fix
npm run format          # Formata código com Prettier
```

### Database
```bash
npm run typeorm              # Comando base TypeORM
npm run schema:log           # Visualiza schema SQL
npm run migration:generate   # Gera migração
npm run migration:run        # Executa migrações
npm run migration:revert     # Reverte migração
npm run migration:show       # Status das migrações
npm run migration:drop       # Dropa schema
```

### Utilities
```bash
./create-module.sh nomeDoModulo  # Cria estrutura completa de módulo
./backup-now.sh                  # Executa backup manual do banco
```

## 🔐 Segurança

### Autenticação e Autorização
- JWT Tokens com expiração configurável
- Passwords hasheadas com BCrypt (10 rounds)
- Guards do NestJS para proteção de rotas
- Validação de tokens em todas as rotas protegidas
- **Nunca armazenar senhas em plain text**

### Validação de Entrada
- `ValidationPipe` global habilitado
- `whitelist: true` - Remove campos não declarados
- `transform: true` - Transforma payloads automaticamente
- DTOs com class-validator decorators obrigatórios
- **Validar TODAS as entradas do usuário**

### CORS
- Configurado por ambiente (dev/prod)
- Origins permitidas:
  - Development: localhost:3000, localhost:5173
  - Production: FRONTEND_URL do .env
  - Suporte a ngrok para testes
- Credentials: true
- Headers: Configuráveis

### Serialização
- `ClassSerializerInterceptor` global
- Controle de campos expostos via `@Exclude()` decorators
- Proteção de dados sensíveis (senhas, tokens, etc)
- **Nunca expor dados sensíveis nas respostas**

## 🚀 Performance

### Otimizações de Banco
- Pool de conexões limitado (2 conexões)
- Queries lentas logadas (>1s)
- Índices em campos frequentemente consultados
- **Sempre usar paginação em listagens**
- Evitar SELECT * (selecionar apenas campos necessários)
- Usar relacionamentos eager loading com cuidado

### Logs
- Logs configurados por ambiente
- Development: Todos os níveis
- Production: Apenas errors e warnings
- Queries SQL logadas apenas em development

### Cache
- Redis disponível para cache
- Redução de chamadas ao banco
- TTL configurável por tipo de dado
- **Usar cache para dados frequentemente acessados**

## 🧪 Testing

### Configuração Jest
- Test regex: `.*\.spec\.ts$`
- Transform: ts-jest
- Coverage: Habilitada
- Environment: Node
- Root dir: src/

### Estrutura de Testes
- Testes unitários por módulo (*.spec.ts)
- Testes E2E (test/*.e2e-spec.ts)
- Mocks e stubs com @nestjs/testing
- **Testar lógica de negócio crítica**

## 💡 Boas Práticas de Código

### Princípios SOLID
- **S**ingle Responsibility Principle - Uma classe, uma responsabilidade
- **O**pen/Closed Principle - Aberto para extensão, fechado para modificação
- **L**iskov Substitution Principle - Interfaces e abstrações consistentes
- **I**nterface Segregation Principle - Interfaces específicas
- **D**ependency Inversion Principle - Depender de abstrações

### Clean Code
- **Nomes descritivos**: Variáveis, funções e classes com nomes claros
- **Funções pequenas**: Cada função deve fazer uma coisa
- **DRY (Don't Repeat Yourself)**: Evitar duplicação de código
- **Comentários úteis**: Comentar o "porquê", não o "como"
- **Formatação consistente**: Usar Prettier
- **Tratamento de erros**: Sempre tratar erros apropriadamente

### Estrutura de Módulo
```
nome-modulo/
├── nome-modulo.controller.ts    # Endpoints HTTP
├── nome-modulo.service.ts       # Lógica de negócio
├── nome-modulo.module.ts        # Configuração do módulo
├── dto/                         # Data Transfer Objects
│   ├── create-*.dto.ts         # DTO de criação
│   ├── update-*.dto.ts         # DTO de atualização
│   ├── filter-*.dto.ts         # DTO de filtros
│   └── response-*.dto.ts       # DTO de resposta
├── entities/                    # Entidades TypeORM
│   └── *.entity.ts
├── repositories/                # Repositórios customizados
│   └── *.repository.ts
├── interfaces/                  # Interfaces TypeScript
│   └── *.interface.ts
├── types/                       # Types e Enums
│   └── *.type.ts
├── events/                      # Eventos de domínio (se necessário)
│   └── *.event.ts
└── test/                        # Testes
    └── *.spec.ts
```

### Código
- **Um módulo por domínio/funcionalidade**
- **Separação clara de responsabilidades** (Controller → Service → Repository)
- **DTOs para entrada e saída** (nunca expor entidades diretamente)
- **OBRIGATÓRIO: Todo endpoint deve ter DTO de request (quando aplicável) e response**
- **Usar `responseService.mapToDto()` para mapear responses**
- **Validação em todas as entradas** (class-validator)
- **Exceções customizadas** (usar exceptions da pasta exception/)
- **Eventos de domínio** para desacoplamento entre módulos
- **Injeção de dependências** (usar constructor injection)
- **Async/await** para operações assíncronas
- **TypeScript strict** onde possível

### Banco de Dados
- **Sempre usar migrations** (nunca alterar banco manualmente)
- **Nunca usar `synchronize` em produção**
- **Backup antes de mudanças críticas**
- **Testar migrations em desenvolvimento**
- **Revisar SQL gerado** antes de aplicar
- **Usar transações** para operações críticas
- **Índices** em campos de busca e foreign keys

### Git e Deploy
- **Nunca commitar .env** (usar .env.example)
- **Commits semânticos** (feat, fix, refactor, etc)
- **Revisar código antes de merge**
- **Testar localmente antes de deploy**
- **Backups antes de deploy em produção**
- **Rollback plan** para cada deploy

### Documentação
- **README atualizado** com instruções claras
- **Comentários em código complexo**
- **Migrations documentadas** (comentários sobre o propósito)
- **Changelog** atualizado com mudanças significativas
- **Projeto SEM Swagger/OpenAPI** - Não usar decorators de documentação

## 🔄 Sistema de Eventos

### Event Emitter
- Sistema de eventos interno (NestJS EventEmitter)
- Eventos de domínio para comunicação entre módulos
- Desacoplamento de lógica de negócio
- **Usar eventos para ações que não devem bloquear o fluxo principal**

### Eventos Disponíveis
- **User events**: criação, atualização de usuário
- **Coin events**: ganho, gasto de moedas
- **Outros eventos de domínio** conforme necessidade

### Padrão de Nomenclatura
- `{dominio}.{acao}` (ex: `user.created`, `coin.earned`)

## 🌐 API REST

### Endpoints Base
- `/auth/*` - Autenticação e autorização
- `/users/*` - Gerenciamento de usuários
- `/expenses/*` - Despesas
- `/revenues/*` - Receitas
- `/coins/*` - Sistema de moedas
- `/themes/*` - Temas visuais
- `/groups/*` - Grupos de despesas
- `/payments/*` - Formas de pagamento
- `/stores/*` - Lojas
- `/reports/*` - Relatórios financeiros
- `/profile/*` - Perfil do usuário
- `/coupon-reader/*` - Leitura de cupons
- `/image-recognition/*` - Reconhecimento de imagens

### Padrões de Response
- **Sucesso**: Status 2xx com dados
  - 200: OK (GET, PUT, PATCH)
  - 201: Created (POST)
  - 204: No Content (DELETE)
- **Erro**: Status 4xx/5xx com mensagem clara
  - 400: Bad Request (validação)
  - 401: Unauthorized (não autenticado)
  - 403: Forbidden (sem permissão)
  - 404: Not Found (recurso não encontrado)
  - 409: Conflict (conflito de dados)
  - 500: Internal Server Error (erro no servidor)
- **Paginação**: Metadata incluída em todas as listagens

### Convenções REST
- **GET**: Buscar recursos (nunca alterar estado)
- **POST**: Criar novo recurso
- **PUT/PATCH**: Atualizar recurso existente
- **DELETE**: Remover recurso
- **Usar plural para recursos**: `/users`, `/expenses`
- **IDs na URL**: `/users/:id`
- **Query params para filtros**: `/expenses?month=1&year=2024`

## 📝 Scripts Customizados

### create-module.sh
- Gera estrutura completa de módulo automaticamente
- Cria: controller, service, module, entities, dto, repository, types, test
- **Uso**: `./create-module.sh nomeDoModulo`
- Seguir convenções do projeto

### backup-now.sh
- Executa backup manual do banco de dados
- Salva em `backups/manual_backup_YYYYMMDD_HHMMSS.sql.gz`
- **Usar antes de mudanças críticas**

## 🎯 Regras de Negócio

### Multi-tenant
- Todos os recursos são isolados por usuário
- Sempre filtrar por `userId` nas queries
- Validar propriedade do recurso antes de operações

### Gamificação
- Sistema de moedas para engajamento
- Temas compráveis com moedas
- Eventos de ganho/gasto de moedas

### Despesas e Receitas
- Suporte a recorrência
- Relacionamento com grupos, lojas e formas de pagamento
- Histórico completo de operações

### Cupons Fiscais
- Leitura automática de NF-e
- Parsing de HTML para extração de dados
- Criação automática de despesas baseadas no cupom

## 🚨 Regras Críticas

### NUNCA FAZER:
- ❌ Commitar senhas ou tokens no código
- ❌ Usar `synchronize: true` em produção
- ❌ Expor senhas ou dados sensíveis nas respostas
- ❌ Permitir SQL injection (sempre usar ORM corretamente)
- ❌ Ignorar validação de entrada
- ❌ Fazer queries sem paginação em listagens
- ❌ Alterar banco de dados diretamente (sempre usar migrations)
- ❌ Deployar sem testar localmente
- ❌ Ignorar erros silenciosamente

### SEMPRE FAZER:
- ✅ Validar todas as entradas do usuário
- ✅ Usar DTOs para entrada e saída
- ✅ Tratar erros apropriadamente
- ✅ Fazer backup antes de mudanças críticas
- ✅ Testar código antes de commit
- ✅ Documentar código complexo
- ✅ Seguir padrões do projeto
- ✅ Usar TypeScript corretamente (tipagem forte)
- ✅ Implementar logs úteis
- ✅ Pensar em performance e escalabilidade

