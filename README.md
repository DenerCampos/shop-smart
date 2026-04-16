<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Ambiente de desenvolvimento

### Arquivos de ambiente (`.env`)

| Arquivo | Uso |
|---------|-----|
| **`.env-default`** | Referência de variáveis (pode copiar trechos para o seu `.env`). Não é carregado automaticamente pela aplicação. |
| **`.env`** | Configuração local da API (desenvolvimento/produção conforme você definir). **Não commitar** — contém segredos. Use `API_DB_NAME=shop_smart` (ou o nome do banco de dev que você criou). |
| **`.env.test`** | Usado pelos testes **E2E** e pelo script `npm run seed:test`. **Não commitar.** Crie a partir de **`.env.test.example`**. |
| **`.env.test.example`** | Modelo versionado: copie para `.env.test` e ajuste host, portas e credenciais MySQL. |

Variáveis MySQL usuais: `API_DB_HOST`, `API_DB_PORT`, `API_DB_USER`, `API_DB_PASS`, `API_DB_NAME`, `API_DB_ROOT_PASS` (ou `MYSQL_ADMIN_PASS`, conforme o script de criação de bases). Para **E2E**, `API_DB_NAME` deve ser **`shop_smart_test`** (o pipeline de testes valida isso antes de rodar `schema:drop`).

Se o cliente **`mysql` não estiver instalado** na máquina host, defina **`MYSQL_DOCKER_CONTAINER`** no `.env` ou `.env.test` com o nome do container Docker do MySQL (ex.: o serviço do `docker-compose`). O script `npm run db:create` passa a executar o SQL via `docker exec`.

### Criação dos bancos `shop_smart` e `shop_smart_test`

Uma vez o MySQL acessível (local ou container):

```bash
# Cria os bancos (IF NOT EXISTS) e aplica GRANTs — lê .env e .env.test para senha de admin
npm run db:create
```

Detalhes: script `scripts/create-shop-smart-databases.sh` e SQL em `scripts/create-shop-smart-databases.sql`. Depois, para o banco de **desenvolvimento** apontado pelo `.env`, execute as migrações (`npm run migration:run`). Os **E2E** rodam migrações e seeds no `shop_smart_test` no `globalSetup` do Jest (ver seção **Testes** abaixo).

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testes

A documentação detalhada (estrutura de pastas, mocks sem banco, E2E com MySQL) está em [`.cursor/docs/testes.md`](.cursor/docs/testes.md). Resumo:

### Testes unitários

- **Onde:** `src/<módulo>/test/*.spec.ts` (ex.: `auth.service.spec.ts`, `user.controller.spec.ts`).
- **Comando:** `npm run test` (ou `npm run test:watch`, `npm run test:cov`).
- **Ideia:** `Test.createTestingModule` do NestJS, dependências mockadas; **não** subir `TypeOrmModule.forRoot` — usar tokens de repositório / factories mockadas.
- **CI / handles abertos:** `npm run test:ci` usa `--forceExit` se o processo não encerrar sozinho.

### Testes de integração (HTTP, sem DB real)

- **Onde:** mesmo padrão `*.spec.ts` sob `src/`, por exemplo `src/auth/test/auth.integration.spec.ts`.
- **Comando:** incluídos em `npm run test` (mesmo `testRegex` que os unitários).
- **Ideia:** `createNestApplication()`, Supertest, `app.close()` no `afterAll`; módulos reais com providers mockados; alinhar `ValidationPipe` / guards com `main.ts` quando necessário (`overrideProvider(ThrottlerGuard)` etc.).

### Testes E2E (com MySQL `shop_smart_test`)

- **Onde:** `test/*.e2e-spec.ts` (config: `test/jest-e2e.json`).
- **Pré-requisitos:** bases criadas (`npm run db:create`), arquivo **`.env.test`** na raiz (cópia de `.env.test.example`) com **`API_DB_NAME=shop_smart_test`**.
- **Fluxo:** `load-env-test` → `globalSetup` (build, `migration:run`, seeds de dev no banco de teste) → suíte → `globalTeardown` (`schema:drop` no `shop_smart_test`).
- **Comandos:** `npm run test:e2e` · `npm run test:e2e:ci` (com `--forceExit`).
- **Estratégia:** [`test/E2E-ESTRATEGIA.md`](test/E2E-ESTRATEGIA.md); app de teste: [`test/configure-e2e-app.ts`](test/configure-e2e-app.ts).

### Scripts relacionados a testes e banco

| Comando | Descrição |
|---------|-----------|
| `npm run typecheck` | `tsc --noEmit` — checagem de tipos (complementa Jest com `isolatedModules`). |
| `npm run db:create` | Cria `shop_smart` e `shop_smart_test` e permissões (ver **Ambiente de desenvolvimento**). |
| `npm run seed:test` | Build + seeds de dev usando **`.env.test`** (debug manual, fora do Jest). |
| `npm run seed:dev` | Seeds de desenvolvimento usando **`.env`** (apenas `NODE_ENV` ≠ `production`). |

```bash
# testes unitários + integração (src/**/*.spec.ts)
npm run test

# E2E (requer .env.test e MySQL)
npm run test:e2e

# cobertura
npm run test:cov
```

# Scripts Commands

## 📋 Comandos Disponíveis

### 🔨 Comandos de criação de modulos

| Comando | Descrição |
|---------|-----------|
| `npm run generate:module` | Comando base que cria estrutura de pastas e arquivos default para o projeto |

```bash
# Cria estrutra de pastas e arquivos
npm run generate:module nomeDoModulo

```

# Arquitetura

## Responsabilidades por Camada

### Controller

- Recebe parâmetros da requisição
- Valida DTOs
- Chama o Service
- Mapeia entidades para DTOs de resposta

### Service

- Implementa a lógica de paginação
- Aplica filtros e ordenação
- Constrói metadados da paginação
- Retorna resultado paginado com entidades

### Repository

- Query building específico
- Otimizações de banco de dados
- Reutilização de queries complexas

# TypeORM Commands

Este projeto utiliza TypeORM para gerenciamento de banco de dados. Abaixo estão os comandos disponíveis para trabalhar com migrações e schema.

## 📋 Comandos Disponíveis

### 🔨 Comandos de Migração

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `npm run migration:generate` | Gera uma nova migração baseada nas mudanças das entidades | `npm run migration:generate db/migrations/AddUserFields` |
| `npm run migration:run` | Executa todas as migrações pendentes | `npm run migration:run` |
| `npm run migration:revert` | Reverte a última migração executada | `npm run migration:revert` |
| `npm run migration:show` | Mostra o status de todas as migrações (executadas e pendentes) | `npm run migration:show` |
| `npm run migration:drop` | **⚠️ CUIDADO**: Dropa todo o schema do banco de dados | `npm run migration:drop` |

### 🔧 Base Command

| Comando | Descrição |
|---------|-----------|
| `npm run typeorm` | Comando base do TypeORM (executa build + typeorm) | Usado internamente pelos outros comandos |

## 🚀 Fluxo de Trabalho Típico

### 1. Criando uma Nova Migração

Quando você modifica uma entidade (adiciona/remove campos, etc.):

```bash
# 1. Atualize sua entidade TypeORM
# 2. Gere a migração
npm run migration:generate db/migrations/DescricaoDaMudanca

# 3. Execute a migração
npm run migration:run
```

### 2. Verificando Status das Migrações

```bash
# Ver quais migrações foram executadas e quais estão pendentes
npm run migration:show
```

### 3. Desfazendo uma Migração

```bash
# Reverte a última migração executada
npm run migration:revert
```

### 4. Recriando o Banco do Zero

```bash
# ⚠️ CUIDADO: Isso apaga TODOS os dados!
npm run migration:drop

# Depois execute as migrações novamente
npm run migration:run
```

## 📝 Exemplos Práticos

### Adicionando um novo campo à entidade User

```bash
# 1. Edite user/entities/user.entity.ts
# 2. Adicione o novo campo com os decorators apropriados
# 3. Gere a migração
npm run migration:generate db/migrations/AddUserPhoneField

# 4. Execute a migração
npm run migration:run
```

### Criando uma nova entidade

```bash
# 1. Crie a nova entidade com todos os decorators
# 2. Adicione no data-source.ts se necessário
# 3. Gere a migração
npm run migration:generate db/migrations/CreateProductTable

# 4. Execute a migração
npm run migration:run
```

## ⚠️ Avisos Importantes

- **Sempre faça backup** do banco antes de executar migrações em produção
- **Teste as migrações** em ambiente de desenvolvimento primeiro
- **Revise o código gerado** das migrações antes de executar
- **O comando `migration:drop`** apaga TODOS os dados do banco
- **Migrações são irreversíveis** em produção - tenha certeza antes de executar

## 🔍 Troubleshooting

### Migração gerou mudanças não desejadas
```bash
# Se a migração gerou mais mudanças do que esperava:
# 1. Não execute a migração ainda
# 2. Revise o arquivo gerado em db/migrations/
# 3. Edite manualmente se necessário
# 4. Ou delete o arquivo e crie uma migração manual
```

### Erro ao executar migração
```bash
# Se deu erro ao executar uma migração:
# 1. Verifique os logs de erro
# 2. Se necessário, reverta a migração
npm run migration:revert

# 3. Corrija a migração e execute novamente
npm run migration:run
```

### Verificar estado atual
```bash
# Para ver o que foi executado e o que está pendente
npm run migration:show
```

## 📁 Estrutura de Arquivos

```
---/
├── db/
│   ├── data-source.ts          # Configuração do TypeORM
│   └── migrations/             # Arquivos de migração
│       ├── 1623456789000-InitialMigration.ts
│       └── 1623456890000-AddUserFields.ts
├── user/
│   └── entities/
│       └── user.entity.ts      # Entidades TypeORM
└── ...
```

---

💡 **Dica**: Sempre mantenha suas entidades TypeORM sincronizadas com suas models/DTOs para evitar inconsistências!

# Seeds (desenvolvimento)

Scripts para popular o banco com dados iniciais **apenas em ambiente de desenvolvimento**. Eles usam o mesmo `DataSource` do TypeORM (`db/data-source.ts`) e as variáveis do `.env` na raiz do projeto (por exemplo `API_DB_*`).

## Comando

| Comando | Descrição |
|---------|-----------|
| `npm run seed:dev` | Executa o build e roda **todos** os seeds de dev em sequência |

O comando carrega o `.env` via `dotenv/config`. É seguro rodar várias vezes: **cada arquivo de seed verifica se o dado já existe antes de inserir** (evita duplicatas).

## Requisitos e segurança

- Banco acessível e migrações aplicadas (`npm run migration:run`).
- **`NODE_ENV` não pode ser `production`** — o runner aborta nesse caso.
- Prefira `NODE_ENV=development` (ou deixe sem definir; só evite `production` ao rodar seeds).

## Estrutura dos arquivos

```
db/
├── data-source.ts
├── migrations/
└── seeds/
    ├── run-all.dev.seed.ts   # Orquestra todos os seeds (entrada do npm run seed:dev)
    ├── theme.dev.seed.ts     # Themes padrão (rpg, default)
    └── user.dev.seed.ts      # Usuário de teste para login local
```

## Incluir um novo seed

1. Crie um arquivo em `db/seeds/` (ex.: `foo.dev.seed.ts`) exportando uma função assíncrona que recebe `DataSource`:

   `export async function seedFooDev(dataSource: DataSource): Promise<void> { ... }`

2. Dentro da função, **sempre** verifique se o registro já existe (por chave de negócio, ID, etc.) antes de fazer `INSERT`.

3. Registre no array `DEV_SEEDS` em `db/seeds/run-all.dev.seed.ts`:

   ```typescript
   import { seedFooDev } from './foo.dev.seed';

   const DEV_SEEDS = [
     { name: 'theme', run: seedThemeDev },
     { name: 'foo', run: seedFooDev },
   ];
   ```

4. Rode `npm run seed:dev` para validar.

## Seeds incluídos

### `theme`

Insere os registros com slug `rpg` e `default` quando ainda não existem na tabela `theme` (datas com `NOW(6)`, UUID novo por linha).

### Usuário de desenvolvimento `teste`

Criado **após** o seed de themes (para existir tema gratuito e vincular o usuário). Só é inserido se não houver usuário com o mesmo e-mail.

| Campo | Valor |
|-------|--------|
| Nome | `teste` |
| E-mail (login) | `teste@dev.local` |
| Senha | `Valid123` |

A senha é gravada com **bcrypt**, usando `BCRYPT_SALT` do `.env` ou **10** rounds (mesma regra do `AppConfig`). Também são criados, quando aplicável, o registro em `user_theme` (tema padrão `requiredCoins = 0`) e o registro inicial em `coin` (saldo zero), alinhados ao fluxo normal da aplicação.

# Backup do Banco de Dados

O sistema oferece duas formas de backup do banco de dados, utilizando containers Docker otimizados para ambientes com recursos limitados.

## 📊 Características dos Backups

- Compressão automática dos arquivos
- Otimizado para baixo consumo de memória
- Backups incrementais (apenas dados, sem estrutura)
- Limpeza automática de backups antigos (7 dias)
- Logs detalhados de todas as operações

## 🔄 Backup Automático

O sistema realiza backups automáticos diariamente. Os arquivos são salvos em:
- Produção: `/opt/shop_smart/backups`
- Local: `./backups`

Para executar o backup automático manualmente:

```bash
# Executa o backup automático
docker-compose run --rm backup
```

## 📋 Backup Manual

O backup manual oferece mais opções de personalização:

```bash
# Backup manual básico
docker-compose run --rm -e MANUAL=1 backup

# Backup com nome personalizado
docker-compose run --rm -e MANUAL=1 backup --name pre_deploy

# Backup em diretório específico
docker-compose run --rm -e MANUAL=1 backup --dir /backups/especial

# Backup sem compressão
docker-compose run --rm -e MANUAL=1 backup --no-compress

# Ver todas as opções disponíveis
docker-compose run --rm -e MANUAL=1 backup --help
```

## 📁 Estrutura dos Arquivos de Backup

```
/backups/
├── backup_YYYYMMDD_HHMMSS.sql.gz     # Backups automáticos
├── manual_YYYYMMDD_HHMMSS.sql.gz     # Backups manuais
└── logs/                             # Logs detalhados
    ├── backup.log                    # Log geral
    ├── error.log                     # Log de erros automáticos
    └── manual_error.log             # Log de erros manuais
```

## 🔍 Verificando Backups

Para listar todos os backups disponíveis:
```bash
# Lista todos os backups
ls -la /opt/shop_smart/backups/

# Ver logs de backup
cat /opt/shop_smart/backups/logs/backup.log
```

## ⚠️ Observações Importantes

- Os backups são comprimidos automaticamente para economizar espaço
- Backups mais antigos que 7 dias são removidos automaticamente
- O diretório de backup deve ter permissões adequadas (chmod 755)
- Recomenda-se manter uma cópia externa dos backups importantes

## 📥 Download de Backups da Oracle Cloud

O script `download_from_oracle.sh` permite baixar backups da instância Oracle Cloud para seu ambiente local.

### 🔧 Pré-requisitos

1. Arquivo `.env` configurado com as variáveis necessárias
2. Chave SSH configurada
3. Permissões adequadas na chave SSH (chmod 600)

### ⚙️ Configuração do Ambiente

Crie ou edite o arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:

```bash
# Configurações da Oracle Cloud
ORACLE_INSTANCE_IP=IP_DA_INSTANCIA
ORACLE_SSH_KEY_PATH=~/.ssh/ssh-key-oracle-super-family-quest.key
ORACLE_BACKUP_PATH=/opt/shop_smart/backups
LOCAL_BACKUP_PATH=/home/dener/projetos/shop_smart/api/db/backup
```

#### Variáveis Disponíveis:

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|---------|-----------|
| `ORACLE_INSTANCE_IP` | Sim | - | IP da instância Oracle Cloud |
| `ORACLE_SSH_KEY_PATH` | Sim | - | Caminho da chave SSH |
| `ORACLE_BACKUP_PATH` | Não | `/opt/shop_smart/backups` | Diretório remoto dos backups |
| `LOCAL_BACKUP_PATH` | Não | `./db/backup` | Diretório local para salvar backups |

### 📋 Comandos Disponíveis

```bash
# Listar backups disponíveis na Oracle Cloud
./download_from_oracle.sh list

# Baixar apenas o backup mais recente
./download_from_oracle.sh latest

# Baixar todos os backups
./download_from_oracle.sh all
```

### 📁 Localização dos Arquivos

- **Origem (Oracle Cloud)**: `/opt/shop_smart/backups/*.sql.gz`
- **Destino (Local)**: `/home/dener/projetos/shop_smart/api/db/backup/`

### 🚀 Exemplo de Uso

```bash
# 1. Primeiro, veja quais backups estão disponíveis
./download_from_oracle.sh list

# 2. Baixe o backup mais recente
./download_from_oracle.sh latest

# 3. Verifique o arquivo baixado
ls -lh /home/dener/projetos/shop_smart/api/db/backup/
```

### ⚠️ Observações

- O script criará automaticamente o diretório de destino se não existir
- Os backups são mantidos comprimidos (.sql.gz) para economizar espaço
- Certifique-se de ter espaço suficiente no disco local antes de baixar todos os backups

---

# CI/CD (GitHub Actions)

O repositório inclui workflows em [`.github/workflows/`](.github/workflows/) para rodar testes em pull requests e, após código na branch `main`, disparar deploy por SSH na VPS (mesma ideia do `deploy.sh`, porém com o script não interativo `ci_deploy.sh`).

## Workflows

| Workflow | Arquivo | Quando executa | O que faz |
|----------|---------|----------------|-----------|
| **CI** | [`ci.yml`](.github/workflows/ci.yml) | Pull request para `main` | Checkout, `npm ci`, `npm run test:ci` |
| **Deploy** | [`deploy.yml`](.github/workflows/deploy.yml) | Push para `main` (ex.: após merge do PR) | Repete os testes; se passarem, abre SSH na VPS e executa `bash ci_deploy.sh` no diretório configurado |

## Como usar no fluxo Git

1. Desenvolva em uma branch e abra um **pull request** para `main`. O workflow **CI** aparece na aba **Actions** e na página do PR.
2. Após revisão, faça **merge** na `main`. Isso gera um push e dispara o workflow **Deploy**: testes de novo e, em seguida, conexão SSH + `ci_deploy.sh` (backup, `git pull`, build Docker, subida dos containers, migrations quando detectadas).
3. Deploy **manual** na VPS continua disponível com [`deploy.sh`](deploy.sh) (perguntas interativas). O fluxo automatizado usa apenas [`ci_deploy.sh`](ci_deploy.sh).

## Configuração no GitHub

### Secrets (obrigatório para o Deploy)

Cadastre em **Settings → Secrets and variables → Actions → New repository secret**. **Não** coloque chaves ou senhas no repositório; use apenas estes nomes de secret no GitHub (valores são os seus, fora do git):

| Nome do secret | Conteúdo esperado |
|----------------|-------------------|
| `DEPLOY_SSH_HOST` | IP ou hostname público da VPS (exemplo ilustrativo: `203.0.113.50`). |
| `DEPLOY_SSH_USER` | Usuário SSH (ex.: `ubuntu`, `opc`). |
| `DEPLOY_SSH_PRIVATE_KEY` | Chave **privada** em texto (incluindo linhas `BEGIN` / `END`). Recomenda-se um par **só para CI**; a chave **pública** correspondente deve estar em `authorized_keys` na VPS. |
| `DEPLOY_REMOTE_DIR` | Caminho absoluto do clone do projeto na VPS (ex.: `/home/ubuntu/shop-smart`). |

A action [appleboy/ssh-action](https://github.com/appleboy/ssh-action) usa porta **22** por padrão. Se a SSH da VPS for outra porta, edite [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) e inclua `port:` no passo (valor numérico, sem commitar segredos).

### Branch protection (opcional)

Em **Settings → Branches**, regras na `main` podem exigir pull request e que o status check **unit-tests** (workflow **CI**) passe antes do merge. Isso **não** ativa o workflow; só impede merge sem testes verdes. O **Deploy** continua dependendo do push na `main` e dos secrets acima.

## Requisitos na VPS

- Diretório `DEPLOY_REMOTE_DIR` com clone do repo, `docker-compose` e o mesmo contexto em que você já roda `./deploy.sh`.
- `git remote` apontando para este repositório GitHub (o `ci_deploy.sh` faz `git pull origin main`).
- Após o primeiro merge que trouxer `ci_deploy.sh`, o arquivo estará no servidor após o `git pull` (ou um pull manual inicial).

## Plano gratuito e minutos

Repositórios **públicos** costumam ter uso amplo de GitHub Actions; **privados** seguem a cota de minutos do plano gratuito da conta. A VPS (ex.: Oracle) é independente: o workflow apenas executa comandos remotos por SSH.

---

# 🚀 Deploy e Monitoramento

Este projeto possui scripts automatizados para facilitar o deploy em produção e monitoramento de recursos.

## 📊 Verificação Rápida de Recursos

Antes de qualquer operação, é importante verificar os recursos disponíveis no servidor.

### Comandos de Diagnóstico Rápido

```bash
# Análise única (snapshot rápido)
echo "=== $(date) ===" && free -h && echo "" && docker stats --no-stream && echo "" && df -h /

# Análise simplificada (só o essencial)
free -h | grep -E "Mem:|Swap:" && df -h / | grep -v "Filesystem"

# Monitoramento contínuo (atualiza a cada 2 segundos)
watch -n 2 'echo "=== $(date) ==="; free -h; echo ""; docker stats --no-stream; echo ""; df -h /'

# Verificação completa pré-build
echo "=== CHECK PRÉ-BUILD ===" && \
echo "RAM:" && free -h | grep Mem: && \
echo "SWAP:" && free -h | grep Swap: && \
echo "DISCO:" && df -h / | tail -1 && \
echo "" && \
echo "Containers rodando:" && docker ps
```

### Criar Atalho (Opcional)

```bash
# Adicionar alias ao ~/.bashrc
echo 'alias checkres="free -h && echo && df -h / && echo && docker ps"' >> ~/.bashrc
source ~/.bashrc

# Usar o atalho
checkres
```

---

## 🔧 Script de Preparação para Build

### `prepare-build.sh` - Prepara Servidor para Build

Este script é **essencial** para servidores com recursos limitados (< 2GB RAM).

#### O que ele faz:

- ✅ Cria SWAP de 2GB automaticamente (se não existir)
- ✅ Para containers Docker para liberar memória
- ✅ Limpa cache do Docker (imagens antigas, build cache)
- ✅ Libera cache do sistema operacional
- ✅ Cria arquivo `.npmrc` otimizado para economia de memória
- ✅ Verifica se há recursos suficientes para build
- ✅ Avisa sobre possíveis problemas

#### Como usar:

```bash
# Executar antes de qualquer build
./prepare-build.sh
```

#### Quando usar:

- **Sempre** antes de fazer build em produção com pouca RAM
- Quando o build está falhando por falta de memória
- Antes de executar `docker-compose build --no-cache`
- Após adicionar novas dependências no `package.json`

#### Exemplo de saída:

```
╔════════════════════════════════════════╗
║   Preparação para Build - Low Memory  ║
╚════════════════════════════════════════╝

📊 Recursos Atuais:
              total        used        free      shared  buff/cache   available
Mem:          952Mi       337Mi        83Mi       1.0Mi       531Mi       429Mi
Swap:            0B          0B          0B

🔍 Verificando SWAP...
❌ SWAP não configurado!
   Criando SWAP de 2GB...
✅ SWAP criado com sucesso!

📊 Análise:
   RAM Disponível: 429MB
   SWAP Total: 2048MB
   Total Disponível: 2477MB

✅ Recursos suficientes para build!

╔════════════════════════════════════════╗
║     ✅ Preparação Concluída!           ║
╚════════════════════════════════════════╝
```

---

## 📦 Script de Deploy Automatizado

### `deploy.sh` - Deploy Completo e Inteligente

Script que automatiza todo o processo de deploy em produção com detecção inteligente de mudanças.

#### Características:

- 🔍 **Detecção Inteligente**: Identifica automaticamente o que mudou
  - `package.json` → Rebuild completo com `--no-cache`
  - Migrations → Executa automaticamente
  - Dockerfile → Rebuild necessário
  - Apenas código TypeScript → Build rápido com cache

- 🛡️ **Segurança**: Backup automático do banco antes de qualquer mudança
- ✅ **Validação**: Verifica se API iniciou corretamente
- 📊 **Relatórios**: Mostra resumo detalhado do deploy
- 🔄 **Rollback**: Facilita voltar atrás se necessário

#### Como usar:

```bash
# Deploy completo automatizado
./deploy.sh
```

#### Fluxo do Deploy:

```
1. 📊 Verifica status atual dos containers
2. 📦 Cria backup do banco de dados
3. 📌 Salva commit atual
4. ⬇️  Faz git pull origin main
5. 🔍 Analisa mudanças (package.json, migrations, Dockerfile)
6. 🔨 Build inteligente (com ou sem cache)
7. 🛑 Para containers
8. 🚀 Inicia containers atualizados
9. ⏳ Aguarda API inicializar
10. 🗄️  Executa migrations (se houver)
11. 📋 Mostra logs e status final
12. ✅ Confirma sucesso do deploy
```

#### Exemplo de uso no servidor:

```bash
# 1. SSH no servidor
ssh usuario@servidor-oracle

# 2. Ir para o diretório do projeto
cd /caminho/do/projeto

# 3. Executar deploy
./deploy.sh
```

#### Saída exemplo:

```
╔════════════════════════════════════════╗
║     Shop Smart API - Deployment       ║
╚════════════════════════════════════════╝

📊 Verificando status atual...
📦 Criando backup do banco de dados...
✅ Backup criado com sucesso!

📌 Commit atual: a1b2c3d
⬇️  Baixando últimas alterações do repositório...
✅ Código atualizado!

🔍 Analisando mudanças...
  📦 package.json alterado - rebuild completo necessário
  🗄️  Migrations novas detectadas

🔨 Rebuilding com --no-cache (pode demorar mais)...
✅ Build concluído!

🛑 Parando containers...
✅ Containers parados!

🚀 Iniciando containers...
✅ Containers iniciados!

✅ API está rodando!

🗄️  Executando migrations...
✅ Migrations executadas com sucesso!

╔════════════════════════════════════════╗
║     ✅ Deploy concluído com sucesso!   ║
╚════════════════════════════════════════╝

📝 Informações do Deploy:
  • Commit anterior: a1b2c3d
  • Commit atual: e4f5g6h
  • Package.json alterado: Sim
  • Migrations executadas: Sim
  • Data/Hora: 2025-11-22 14:35:00

🔍 Comandos úteis:
  • Ver logs em tempo real: docker-compose logs -f api
  • Verificar status: docker-compose ps
  • Restart API: docker-compose restart api
  • Parar tudo: docker-compose down

🎉 Aplicação pronta para uso!
```

---

## 📈 Script de Monitoramento de Build

### `monitor-build.sh` - Monitora Build em Tempo Real

Script que monitora recursos durante o build e detecta problemas automaticamente.

#### Características:

- 📊 Monitora CPU, RAM, SWAP e Disco em tempo real
- 🌐 Detecta quedas de rede/conexão
- 📝 Salva log detalhado de todo o processo
- ⏱️ Timeout de 30 minutos (evita espera infinita)
- ⚠️ Avisos proativos sobre recursos baixos
- 🔍 Mostra progresso detalhado do build (`--progress=plain`)

#### Como usar:

```bash
# Build monitorado automaticamente
./monitor-build.sh
```

#### O que ele monitora:

```
- Uso de CPU (%)
- RAM Total/Usada/Livre
- SWAP Total/Usado
- Espaço em Disco
- Status dos containers Docker
- Conectividade de rede
- Processos sendo executados
```

#### Exemplo de saída:

```
╔════════════════════════════════════════╗
║   Monitoramento de Build - Shop Smart ║
╚════════════════════════════════════════╝

📊 Recursos do Sistema:
----------------------------------------
  CPU: 45.2%
  RAM Total: 952Mi
  RAM Usada: 337Mi
  RAM Livre: 83Mi
  Disco Total: 45G
  Disco Usado: 9.8G (22%)
  Disco Livre: 36G
----------------------------------------

⚠️  AVISO: Menos de 512MB de RAM livre!
   Build pode ser lento ou falhar.

✅ Monitor iniciado (PID: 12345)
   Para parar: kill 12345

📝 Log será salvo em: build-monitor-20251122-143500.log

🚀 Iniciando build monitorado...
   Pressione Ctrl+C para cancelar

========================================

[... progresso do build ...]

========================================

✅ Build concluído com sucesso!

📋 Para ver o log completo:
   cat build-monitor-*.log
```

---

## 🎯 Fluxo de Deploy Recomendado

### Para Desenvolvimento Local:

```bash
# 1. Fazer alterações no código
# 2. Testar localmente
npm run start:dev

# 3. Commitar e pushar
git add .
git commit -m "feat: sua alteração"
git push origin main
```

### Para Produção (Servidor Oracle):

```bash
# 1. SSH no servidor
ssh usuario@servidor-oracle

# 2. Ir para o diretório do projeto
cd /caminho/do/projeto

# 3. (Opcional) Se servidor tem pouca RAM, preparar ambiente
./prepare-build.sh

# 4. Executar deploy automatizado
./deploy.sh

# 5. Verificar logs (se necessário)
docker-compose logs -f api
```

---

## 🆘 Troubleshooting de Deploy

### Build está travando/falhando:

**Problema**: Build trava ou falha com erro de memória

**Solução**:
```bash
# 1. Verificar recursos
free -h
df -h /

# 2. Se RAM < 1GB ou SWAP = 0, preparar ambiente
./prepare-build.sh

# 3. Tentar build monitorado
./monitor-build.sh

# 4. Ver logs para identificar onde travou
cat build-monitor-*.log | tail -100
```

---

### Conexão SSH cai durante build:

**Problema**: SSH desconecta e perde o build

**Solução - Usar TMUX**:
```bash
# 1. Instalar tmux
sudo apt install tmux -y

# 2. Criar sessão tmux (terminal persistente)
tmux new -s build

# 3. Executar deploy dentro do tmux
./deploy.sh

# 4. Para sair sem matar: Ctrl+B, depois D
# 5. Se desconectar, reconectar: tmux attach -t build
```

---

### Build demora muito (> 30 minutos):

**Problema**: Build muito lento

**Causas Possíveis**:
- Rede lenta
- Servidor com poucos recursos
- Download de dependências travando

**Soluções**:
```bash
# 1. Ver onde está travando
./monitor-build.sh

# 2. Se estiver no npm install, verificar rede
ping -c 5 registry.npmjs.org

# 3. Se rede OK mas lento, limpar cache
docker builder prune -a
npm cache clean --force

# 4. Em último caso, aumentar timeout
# Editar monitor-build.sh: timeout 30m → timeout 60m
```

---

### Migrations falhando:

**Problema**: Erro ao executar migrations

**Solução**:
```bash
# 1. Ver status das migrations
docker-compose exec api npm run migration:show

# 2. Ver erro específico
docker-compose logs api | grep -i migration

# 3. Se necessário, reverter migration
docker-compose exec api npm run migration:revert

# 4. Corrigir migration e executar novamente
docker-compose exec api npm run migration:run
```

---

## 📋 Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] ✅ Código testado localmente
- [ ] ✅ Testes passando (`npm test`)
- [ ] ✅ Linter sem erros (`npm run lint`)
- [ ] ✅ Build local funcionando
- [ ] ✅ Migrations testadas em desenvolvimento
- [ ] ✅ Variáveis de ambiente atualizadas (se necessário)
- [ ] ✅ Backup do banco será criado automaticamente (via `deploy.sh`)
- [ ] ✅ Recursos do servidor verificados (RAM, Disco, SWAP)
- [ ] ✅ Time avisado sobre o deploy (se aplicável)

---

## 🔧 Configuração SSH Keep Alive

Para evitar desconexões SSH durante builds longos:

```bash
# No seu PC, editar ~/.ssh/config
nano ~/.ssh/config

# Adicionar:
Host servidor-oracle
    HostName ip-do-servidor
    User seu-usuario
    ServerAliveInterval 60
    ServerAliveCountMax 120
    TCPKeepAlive yes
```

---

## 🛠️ Ferramentas de Desenvolvimento

### Ferramenta de Teste de Reconhecimento de Áudio

O projeto inclui uma ferramenta web para testar o reconhecimento de áudio localmente.

**Localização**: `dev-tools/test-audio-recorder.html`

#### Como Usar:

1. **Abrir a ferramenta**:
   ```bash
   # Opção 1: Abrir diretamente no navegador
   open dev-tools/test-audio-recorder.html
   
   # Opção 2: Usar um servidor HTTP local
   cd dev-tools
   python3 -m http.server 8000
   # Acessar: http://localhost:8000/test-audio-recorder.html
   ```

2. **Configurar a API**:
   - Por padrão, a ferramenta aponta para `http://localhost:3000`
   - Se sua API estiver em outra URL, atualize a variável `API_URL` no arquivo

3. **Gravar e Testar**:
   - Clique em "Iniciar Gravação" e permita acesso ao microfone
   - Descreva uma despesa verbalmente (ex: "Comprei 2 leites por R$ 8,50 no Mercado XYZ")
   - Clique em "Parar Gravação"
   - Clique em "Enviar para API" para analisar o áudio
   - Visualize o resultado da análise

4. **Recursos da Ferramenta**:
   - ✅ Gravação de áudio direto do navegador
   - ✅ Visualização do formato e tamanho do áudio
   - ✅ Envio para API de reconhecimento
   - ✅ Exibição do resultado formatado (JSON)
   - ✅ Informações de quota da API

#### Requisitos:

- Navegador moderno com suporte a `MediaRecorder` API
- Permissão para acessar o microfone
- API rodando localmente ou em servidor acessível

#### Observações:

- ⚠️ Esta ferramenta é apenas para **desenvolvimento/testes**
- ⚠️ Não deve ser incluída no build de produção (já está no `.dockerignore`)
- ⚠️ Funciona melhor no Chrome/Edge (suporte completo a `webm`)

---

## 📚 Documentação Adicional

- **Testes (Jest, E2E, mocks)**: `.cursor/docs/testes.md`
- **Estratégia E2E**: `test/E2E-ESTRATEGIA.md`
- **Diagnóstico de Build**: `docs/DIAGNOSTICO-BUILD.md`
- **Por que não fazer npm no container**: `docs/WHY-NOT-NPM-IN-CONTAINER.md`
- **Regras do Projeto**: `.cursor/rules/regra-projeto.md`
- **Code Review Guide**: `.cursor/rules/code-review.md`

---

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
