#!/bin/bash

# Script para monitorar o build e detectar problemas
# Uso: ./monitor-build.sh

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Monitoramento de Build - Shop Smart ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Função para verificar recursos do sistema
check_resources() {
    echo -e "${BLUE}📊 Recursos do Sistema:${NC}"
    echo "----------------------------------------"
    
    # CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    echo -e "  CPU: ${YELLOW}${CPU_USAGE}%${NC}"
    
    # Memória
    MEM_INFO=$(free -h | grep "Mem:")
    MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
    MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
    MEM_FREE=$(echo $MEM_INFO | awk '{print $4}')
    echo -e "  RAM Total: ${GREEN}${MEM_TOTAL}${NC}"
    echo -e "  RAM Usada: ${YELLOW}${MEM_USED}${NC}"
    echo -e "  RAM Livre: ${GREEN}${MEM_FREE}${NC}"
    
    # Disco
    DISK_INFO=$(df -h / | tail -1)
    DISK_SIZE=$(echo $DISK_INFO | awk '{print $2}')
    DISK_USED=$(echo $DISK_INFO | awk '{print $3}')
    DISK_AVAIL=$(echo $DISK_INFO | awk '{print $4}')
    DISK_PERCENT=$(echo $DISK_INFO | awk '{print $5}')
    echo -e "  Disco Total: ${GREEN}${DISK_SIZE}${NC}"
    echo -e "  Disco Usado: ${YELLOW}${DISK_USED}${NC} (${DISK_PERCENT})"
    echo -e "  Disco Livre: ${GREEN}${DISK_AVAIL}${NC}"
    
    echo "----------------------------------------"
    echo ""
}

# Função para monitorar em background
monitor_background() {
    local LOG_FILE="build-monitor-$(date +%Y%m%d-%H%M%S).log"
    echo -e "${BLUE}📝 Log será salvo em: ${YELLOW}${LOG_FILE}${NC}"
    echo ""
    
    {
        echo "=== Build Monitor Started at $(date) ==="
        echo ""
        
        while true; do
            echo "--- $(date) ---"
            
            # CPU e Memória
            echo "CPU: $(top -bn1 | grep "Cpu(s)")"
            echo "Memory: $(free -m | grep "Mem:")"
            
            # Docker stats
            if docker stats --no-stream 2>/dev/null; then
                echo "Docker OK"
            else
                echo "Docker não respondeu!"
            fi
            
            # Conexão de rede (testa ping)
            if ping -c 1 8.8.8.8 &> /dev/null; then
                echo "Network: OK"
            else
                echo "Network: FALHOU!"
            fi
            
            echo ""
            sleep 10
        done
    } > "$LOG_FILE" 2>&1 &
    
    MONITOR_PID=$!
    echo -e "${GREEN}✅ Monitor iniciado (PID: ${MONITOR_PID})${NC}"
    echo -e "${YELLOW}   Para parar: kill ${MONITOR_PID}${NC}"
    echo ""
    echo "$MONITOR_PID" > /tmp/monitor-build.pid
}

# Função para parar o monitor
stop_monitor() {
    if [ -f /tmp/monitor-build.pid ]; then
        PID=$(cat /tmp/monitor-build.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            echo -e "${GREEN}✅ Monitor parado${NC}"
        fi
        rm -f /tmp/monitor-build.pid
    fi
}

# Verificar recursos iniciais
check_resources

# Verificar se há espaço suficiente
DISK_AVAIL_GB=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$DISK_AVAIL_GB" -lt 5 ]; then
    echo -e "${RED}⚠️  AVISO: Menos de 5GB disponível em disco!${NC}"
    echo -e "${YELLOW}   Build pode falhar por falta de espaço.${NC}"
    echo ""
fi

# Verificar memória disponível
MEM_FREE_MB=$(free -m | grep "Mem:" | awk '{print $4}')
if [ "$MEM_FREE_MB" -lt 512 ]; then
    echo -e "${RED}⚠️  AVISO: Menos de 512MB de RAM livre!${NC}"
    echo -e "${YELLOW}   Build pode ser lento ou falhar.${NC}"
    echo ""
fi

# Iniciar monitoramento em background
monitor_background

# Configurar trap para limpar ao sair
trap stop_monitor EXIT

echo -e "${BLUE}🚀 Iniciando build monitorado...${NC}"
echo -e "${YELLOW}   Pressione Ctrl+C para cancelar${NC}"
echo ""
echo "========================================"
echo ""

# Executar o build com timeout e verbose
timeout 30m docker-compose build --no-cache --progress=plain api
BUILD_EXIT_CODE=$?

echo ""
echo "========================================"
echo ""

# Verificar resultado
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
elif [ $BUILD_EXIT_CODE -eq 124 ]; then
    echo -e "${RED}❌ Build excedeu o timeout de 30 minutos!${NC}"
    echo -e "${YELLOW}   Possíveis causas:${NC}"
    echo -e "   - Conexão de rede muito lenta"
    echo -e "   - Download de dependências travou"
    echo -e "   - Máquina com recursos insuficientes"
else
    echo -e "${RED}❌ Build falhou com código: ${BUILD_EXIT_CODE}${NC}"
fi

echo ""
check_resources

echo -e "${BLUE}📋 Para ver o log completo:${NC}"
echo -e "   ${YELLOW}cat build-monitor-*.log${NC}"

