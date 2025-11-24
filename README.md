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

## 📚 Documentação Adicional

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
