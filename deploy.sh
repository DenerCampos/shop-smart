#!/bin/bash

# Shop Smart API - Deploy Script
# Este script automatiza o processo de deploy da aplicação

set -e  # Para a execução se algum comando falhar

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Shop Smart API - Deployment       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Verifica se está na pasta correta
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Execute este script na raiz do projeto.${NC}"
    exit 1
fi

# Verifica se docker-compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Erro: docker-compose não está instalado.${NC}"
    exit 1
fi

# 1. Verificar status atual
echo -e "${BLUE}📊 Verificando status atual...${NC}"
docker-compose ps

# 2. Criar backup do banco de dados
echo ""
echo -e "${YELLOW}📦 Criando backup do banco de dados...${NC}"
if docker-compose run --rm -e MANUAL=1 backup; then
    echo -e "${GREEN}✅ Backup criado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup!${NC}"
    echo -e "${YELLOW}⚠️  Continuando deploy mesmo assim (não recomendado)...${NC}"
    read -p "Deseja continuar sem backup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deploy cancelado.${NC}"
        exit 1
    fi
fi

# 3. Salvar hash do commit atual (antes do pull)
CURRENT_COMMIT=$(git rev-parse HEAD)
echo ""
echo -e "${BLUE}📌 Commit atual: ${CURRENT_COMMIT:0:7}${NC}"

# 4. Pull das mudanças
echo ""
echo -e "${BLUE}⬇️  Baixando últimas alterações do repositório...${NC}"
git fetch origin
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo -e "${YELLOW}⚠️  Você já está na versão mais recente!${NC}"
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deploy cancelado.${NC}"
        exit 0
    fi
fi

git pull origin main
echo -e "${GREEN}✅ Código atualizado!${NC}"

# 5. Verificar mudanças importantes
echo ""
echo -e "${BLUE}🔍 Analisando mudanças...${NC}"

PACKAGE_CHANGED=false
MIGRATIONS_CHANGED=false
DOCKERFILE_CHANGED=false

# Verifica se package.json mudou
if git diff $CURRENT_COMMIT HEAD -- package.json package-lock.json | grep -q "^[+-]"; then
    PACKAGE_CHANGED=true
    echo -e "${YELLOW}  📦 package.json alterado - rebuild completo necessário${NC}"
fi

# Verifica se há novas migrations
if git diff $CURRENT_COMMIT HEAD --name-only | grep -q "db/migrations/"; then
    MIGRATIONS_CHANGED=true
    echo -e "${YELLOW}  🗄️  Migrations novas detectadas${NC}"
fi

# Verifica se Dockerfile mudou
if git diff $CURRENT_COMMIT HEAD --name-only | grep -q "Dockerfile"; then
    DOCKERFILE_CHANGED=true
    echo -e "${YELLOW}  🐳 Dockerfile alterado - rebuild necessário${NC}"
fi

if [ "$PACKAGE_CHANGED" = false ] && [ "$MIGRATIONS_CHANGED" = false ] && [ "$DOCKERFILE_CHANGED" = false ]; then
    echo -e "${GREEN}  ✅ Apenas código TypeScript alterado${NC}"
fi

# 6. Build da aplicação
echo ""
echo -e "${BLUE}🛑 Parando containers para liberar memória durante o build...${NC}"
docker-compose down
echo ""

if [ "$PACKAGE_CHANGED" = true ] || [ "$DOCKERFILE_CHANGED" = true ]; then
    echo -e "${BLUE}🔨 Rebuilding com --no-cache (pode demorar mais)...${NC}"
    docker-compose build --no-cache api
else
    echo -e "${BLUE}🔨 Building API...${NC}"
    docker-compose build api
fi
echo -e "${GREEN}✅ Build concluído!${NC}"

# 7. Subir containers
echo ""
echo -e "${BLUE}🚀 Iniciando containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ Containers iniciados!${NC}"

# 8. Aguardar API ficar pronta
echo ""
echo -e "${BLUE}⏳ Aguardando API inicializar...${NC}"
sleep 5

# Verificar se a API está rodando
RETRY_COUNT=0
MAX_RETRIES=12
API_PORT=${API_PORT:-3000}

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose ps | grep -q "api.*Up"; then
        echo -e "${GREEN}✅ API está rodando!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo -e "${YELLOW}  Tentativa $RETRY_COUNT/$MAX_RETRIES...${NC}"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}❌ API não iniciou corretamente. Verifique os logs.${NC}"
    docker-compose logs --tail=50 api
    exit 1
fi

# 9. Executar migrations (se houver)
if [ "$MIGRATIONS_CHANGED" = true ]; then
    echo ""
    echo -e "${BLUE}🗄️  Executando migrations...${NC}"
    
    # Aguardar mais um pouco para o banco estar pronto
    sleep 10
    
    if docker-compose exec -T api npm run migration:run:prod; then
        echo -e "${GREEN}✅ Migrations executadas com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao executar migrations!${NC}"
        echo -e "${YELLOW}📋 Logs do banco:${NC}"
        docker-compose logs --tail=30 db
        echo ""
        echo -e "${YELLOW}📋 Logs da API:${NC}"
        docker-compose logs --tail=30 api
        exit 1
    fi
fi

# 10. Mostrar logs recentes
echo ""
echo -e "${BLUE}📋 Últimos logs da API:${NC}"
docker-compose logs --tail=30 api

# 11. Status final
echo ""
echo -e "${BLUE}📊 Status dos containers:${NC}"
docker-compose ps

# 12. Resumo do deploy
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Deploy concluído com sucesso!   ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📝 Informações do Deploy:${NC}"
echo -e "  • Commit anterior: ${CURRENT_COMMIT:0:7}"
echo -e "  • Commit atual: $(git rev-parse HEAD | cut -c1-7)"
echo -e "  • Package.json alterado: $([ "$PACKAGE_CHANGED" = true ] && echo 'Sim' || echo 'Não')"
echo -e "  • Migrations executadas: $([ "$MIGRATIONS_CHANGED" = true ] && echo 'Sim' || echo 'Não')"
echo -e "  • Data/Hora: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${BLUE}🔍 Comandos úteis:${NC}"
echo -e "  • Ver logs em tempo real: ${YELLOW}docker-compose logs -f api${NC}"
echo -e "  • Verificar status: ${YELLOW}docker-compose ps${NC}"
echo -e "  • Restart API: ${YELLOW}docker-compose restart api${NC}"
echo -e "  • Parar tudo: ${YELLOW}docker-compose down${NC}"
echo ""
echo -e "${GREEN}🎉 Aplicação pronta para uso!${NC}"

