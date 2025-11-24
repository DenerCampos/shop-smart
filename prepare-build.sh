#!/bin/bash

# Script para preparar servidor com pouca RAM para build
# Execute ANTES de fazer docker-compose build

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Preparação para Build - Low Memory  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 1. Verificar recursos atuais
echo -e "${BLUE}📊 Recursos Atuais:${NC}"
free -h
echo ""

# 2. Verificar se tem swap
SWAP_SIZE=$(free -h | grep "Swap:" | awk '{print $2}')
echo -e "${BLUE}🔍 Verificando SWAP...${NC}"
if [ "$SWAP_SIZE" = "0B" ]; then
    echo -e "${RED}❌ SWAP não configurado!${NC}"
    echo -e "${YELLOW}   Criando SWAP de 2GB...${NC}"
    
    # Criar swap
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Tornar permanente
    if ! grep -q "/swapfile" /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    echo -e "${GREEN}✅ SWAP criado com sucesso!${NC}"
    echo ""
    free -h
else
    echo -e "${GREEN}✅ SWAP já configurado: $SWAP_SIZE${NC}"
fi
echo ""

# 3. Parar containers para liberar memória
echo -e "${BLUE}🛑 Parando containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}✅ Containers parados${NC}"
echo ""

# 4. Limpar Docker cache
echo -e "${BLUE}🧹 Limpando cache do Docker...${NC}"
docker system prune -a -f
docker builder prune -a -f
echo -e "${GREEN}✅ Cache limpo${NC}"
echo ""

# 5. Liberar cache do sistema
echo -e "${BLUE}🧹 Liberando cache do sistema...${NC}"
sudo sync
sudo sysctl -w vm.drop_caches=3 > /dev/null 2>&1 || echo "Não foi possível liberar cache (sem sudo?)"
echo -e "${GREEN}✅ Cache do sistema liberado${NC}"
echo ""

# 6. Criar .npmrc para economia de memória
echo -e "${BLUE}⚙️  Criando .npmrc otimizado...${NC}"
cat > .npmrc << 'EOF'
# Configurações para ambientes com pouca memória
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
maxsockets=1
prefer-offline=true
loglevel=error
progress=false
EOF
echo -e "${GREEN}✅ .npmrc criado${NC}"
echo ""

# 7. Mostrar recursos após limpeza
echo -e "${BLUE}📊 Recursos Após Limpeza:${NC}"
free -h
echo ""
df -h /
echo ""

# 8. Verificar se é seguro continuar
MEM_AVAILABLE=$(free -m | grep "Mem:" | awk '{print $7}')
SWAP_TOTAL=$(free -m | grep "Swap:" | awk '{print $2}')

TOTAL_AVAILABLE=$((MEM_AVAILABLE + SWAP_TOTAL))

echo -e "${BLUE}📊 Análise:${NC}"
echo -e "   RAM Disponível: ${YELLOW}${MEM_AVAILABLE}MB${NC}"
echo -e "   SWAP Total: ${YELLOW}${SWAP_TOTAL}MB${NC}"
echo -e "   Total Disponível: ${YELLOW}${TOTAL_AVAILABLE}MB${NC}"
echo ""

if [ "$TOTAL_AVAILABLE" -lt 800 ]; then
    echo -e "${RED}⚠️  AVISO: Menos de 800MB disponível!${NC}"
    echo -e "${YELLOW}   Build pode falhar por falta de memória.${NC}"
    echo -e "${YELLOW}   Recomendações:${NC}"
    echo -e "${YELLOW}   1. Aumentar RAM da instância Oracle${NC}"
    echo -e "${YELLOW}   2. Aumentar SWAP para 4GB${NC}"
    echo -e "${YELLOW}   3. Fazer build localmente e enviar imagem${NC}"
    echo ""
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
elif [ "$TOTAL_AVAILABLE" -lt 1500 ]; then
    echo -e "${YELLOW}⚠️  Recursos limitados, mas deve funcionar.${NC}"
else
    echo -e "${GREEN}✅ Recursos suficientes para build!${NC}"
fi
echo ""

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     ✅ Preparação Concluída!           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo ""
echo -e "   ${YELLOW}Opção 1 - Build Monitorado (Recomendado):${NC}"
echo -e "   ./monitor-build.sh"
echo ""
echo -e "   ${YELLOW}Opção 2 - Build em TMUX (Se conexão instável):${NC}"
echo -e "   tmux new -s build"
echo -e "   docker-compose build --no-cache --progress=plain api 2>&1 | tee build.log"
echo -e "   # Para sair: Ctrl+B, depois D"
echo ""
echo -e "   ${YELLOW}Opção 3 - Build Simples:${NC}"
echo -e "   docker-compose build --no-cache api"
echo ""

