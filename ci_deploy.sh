#!/bin/bash

# Shop Smart API — deploy não interativo (CI / GitHub Actions via SSH)
# Executar na raiz do repositório na VPS (mesmo contexto que deploy.sh).

set -euo pipefail

on_error() {
  local exit_code=$?
  echo "" >&2
  echo -e "\033[0;31m❌ ci_deploy: falha (código ${exit_code}). Comando: ${BASH_COMMAND:-?}\033[0m" >&2
  exit "${exit_code}"
}
trap on_error ERR

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Shop Smart API — CI Deploy (não UI) ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Erro: package.json não encontrado. Execute na raiz do projeto.${NC}" >&2
  exit 1
fi

docker_compose() {
  if [ "${COMPOSE_CMD:-}" = "plugin" ]; then
    docker compose "$@"
  else
    docker-compose "$@"
  fi
}

if docker compose version &> /dev/null; then
  COMPOSE_CMD=plugin
  echo -e "${BLUE}🐳 Usando Docker Compose (plugin: docker compose).${NC}"
elif command -v docker-compose &> /dev/null; then
  COMPOSE_CMD=legacy
  echo -e "${BLUE}🐳 Usando docker-compose (CLI legado).${NC}"
else
  echo -e "${RED}❌ Erro: Docker Compose não encontrado (instale \`docker compose\` ou \`docker-compose\`).${NC}" >&2
  exit 1
fi
echo ""

echo -e "${BLUE}📊 Verificando status atual...${NC}"
docker_compose ps

echo ""
echo -e "${YELLOW}📦 Criando backup do banco de dados...${NC}"
if docker_compose run --rm -e MANUAL=1 backup; then
  echo -e "${GREEN}✅ Backup criado com sucesso!${NC}"
else
  echo -e "${RED}❌ Erro ao criar backup. Deploy abortado (modo CI).${NC}" >&2
  exit 1
fi

CURRENT_COMMIT=$(git rev-parse HEAD)
echo ""
echo -e "${BLUE}📌 Commit atual (antes do pull): ${CURRENT_COMMIT:0:7}${NC}"

echo ""
echo -e "${BLUE}⬇️  Baixando últimas alterações do repositório...${NC}"
git fetch origin
REMOTE_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" = "$REMOTE_COMMIT" ]; then
  echo -e "${YELLOW}ℹ️  Já está em origin/main; seguindo com build e containers.${NC}"
else
  git pull origin main
  echo -e "${GREEN}✅ Código atualizado!${NC}"
fi

echo ""
echo -e "${BLUE}🔍 Analisando mudanças...${NC}"

PACKAGE_CHANGED=false
MIGRATIONS_CHANGED=false
DOCKERFILE_CHANGED=false

if git diff "$CURRENT_COMMIT" HEAD -- package.json package-lock.json | grep -q "^[+-]"; then
  PACKAGE_CHANGED=true
  echo -e "${YELLOW}  📦 package.json alterado - rebuild completo necessário${NC}"
fi

if git diff "$CURRENT_COMMIT" HEAD --name-only | grep -q "db/migrations/"; then
  MIGRATIONS_CHANGED=true
  echo -e "${YELLOW}  🗄️  Migrations novas detectadas${NC}"
fi

if git diff "$CURRENT_COMMIT" HEAD --name-only | grep -q "Dockerfile"; then
  DOCKERFILE_CHANGED=true
  echo -e "${YELLOW}  🐳 Dockerfile alterado - rebuild necessário${NC}"
fi

if [ "$PACKAGE_CHANGED" = false ] && [ "$MIGRATIONS_CHANGED" = false ] && [ "$DOCKERFILE_CHANGED" = false ]; then
  echo -e "${GREEN}  ✅ Apenas código TypeScript alterado (ou sem diff relevante)${NC}"
fi

echo ""
echo -e "${BLUE}🛑 Parando containers para liberar memória durante o build...${NC}"
docker_compose down
echo ""

# Builder legado: melhor para VPS com pouca RAM / swap (BuildKit não alinha com --memory no compose clássico).
if [ "$PACKAGE_CHANGED" = true ] || [ "$DOCKERFILE_CHANGED" = true ]; then
  echo -e "${BLUE}🔨 Rebuilding com --no-cache (pode demorar mais)...${NC}"
  DOCKER_BUILDKIT=0 docker_compose build --no-cache api
else
  echo -e "${BLUE}🔨 Building API...${NC}"
  DOCKER_BUILDKIT=0 docker_compose build api
fi
echo -e "${GREEN}✅ Build concluído!${NC}"

echo ""
echo -e "${BLUE}🚀 Iniciando containers...${NC}"
docker_compose up -d
echo -e "${GREEN}✅ Containers iniciados!${NC}"

echo ""
echo -e "${BLUE}⏳ Aguardando API inicializar...${NC}"
sleep 5

RETRY_COUNT=0
MAX_RETRIES=12

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker_compose ps | grep -q "api.*Up"; then
    echo -e "${GREEN}✅ API está rodando!${NC}"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo -e "${YELLOW}  Tentativa $RETRY_COUNT/$MAX_RETRIES...${NC}"
  sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo -e "${RED}❌ API não iniciou corretamente. Logs da API:${NC}" >&2
  docker_compose logs --tail=50 api >&2
  exit 1
fi

if [ "$MIGRATIONS_CHANGED" = true ]; then
  echo ""
  echo -e "${BLUE}🗄️  Executando migrations...${NC}"
  sleep 10
  if docker_compose exec -T api npm run migration:run:prod; then
    echo -e "${GREEN}✅ Migrations executadas com sucesso!${NC}"
  else
    echo -e "${RED}❌ Erro ao executar migrations!${NC}" >&2
    echo -e "${YELLOW}📋 Logs do banco:${NC}" >&2
    docker_compose logs --tail=30 db >&2
    echo "" >&2
    echo -e "${YELLOW}📋 Logs da API:${NC}" >&2
    docker_compose logs --tail=30 api >&2
    exit 1
  fi
fi

echo ""
echo -e "${BLUE}📋 Últimos logs da API:${NC}"
docker_compose logs --tail=30 api

echo ""
echo -e "${BLUE}📊 Status dos containers:${NC}"
docker_compose ps

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
echo -e "${GREEN}🎉 Aplicação pronta para uso!${NC}"
