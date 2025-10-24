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

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
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

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
