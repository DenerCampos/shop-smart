#!/bin/bash

# Carrega as variáveis de ambiente
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/^[A-Z]/ {print}')
else
    echo -e "${RED}Erro: Arquivo .env não encontrado${NC}"
    exit 1
fi

# Configurações
ORACLE_IP="${ORACLE_INSTANCE_IP:-000.000.000.000}"
KEY_PATH="${ORACLE_SSH_KEY_PATH:-~/.ssh/ssh-key-oracle-super-family-quest.key}"
REMOTE_BACKUP_PATH="${ORACLE_BACKUP_PATH:-/opt/shop_smart/backups}"
LOCAL_BACKUP_PATH="${LOCAL_BACKUP_PATH:-/home/dener/projetos/shop_smart/api/db/backup}"

# Valida variáveis obrigatórias
if [ -z "$ORACLE_IP" ] || [ -z "$KEY_PATH" ]; then
    echo -e "${RED}Erro: Variáveis de ambiente ORACLE_INSTANCE_IP e ORACLE_SSH_KEY_PATH são obrigatórias${NC}"
    exit 1
fi

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verifica se a chave SSH existe
if [ ! -f "${KEY_PATH/#\~/$HOME}" ]; then
    echo -e "${RED}Erro: Chave SSH não encontrada em ${KEY_PATH}${NC}"
    exit 1
fi

# Verifica permissões da chave
if [ "$(stat -c %a ${KEY_PATH/#\~/$HOME})" != "600" ]; then
    echo -e "${YELLOW}Aviso: Ajustando permissões da chave SSH...${NC}"
    chmod 600 "${KEY_PATH/#\~/$HOME}"
fi

# Cria diretório local se não existir
echo -e "${GREEN}Verificando diretório local...${NC}"
mkdir -p $LOCAL_BACKUP_PATH

# Função para mostrar o uso do script
show_usage() {
    echo "Uso: $0 [opção]"
    echo "Opções:"
    echo "  all    - Baixa todos os backups"
    echo "  latest - Baixa apenas o backup mais recente"
    echo "  list   - Lista os backups disponíveis"
}

# Lista os backups disponíveis
list_backups() {
    echo -e "${GREEN}Backups disponíveis na instância Oracle:${NC}"
    if ! ssh -i "${KEY_PATH/#\~/$HOME}" ubuntu@${ORACLE_IP} "ls -lh ${REMOTE_BACKUP_PATH}/*.sql.gz 2>/dev/null"; then
        echo -e "${RED}Nenhum backup encontrado ou erro ao listar backups${NC}"
        return 1
    fi
}

# Baixa o backup mais recente
download_latest() {
    echo -e "${GREEN}Baixando o backup mais recente...${NC}"
    local latest_backup=$(ssh -i "${KEY_PATH/#\~/$HOME}" ubuntu@${ORACLE_IP} "ls -t ${REMOTE_BACKUP_PATH}/*.sql.gz 2>/dev/null | head -n1")
    
    if [ -z "$latest_backup" ]; then
        echo -e "${RED}Nenhum backup encontrado na instância Oracle${NC}"
        return 1
    fi

    echo -e "${YELLOW}Iniciando download de: $(basename $latest_backup)${NC}"
    if scp -i "${KEY_PATH/#\~/$HOME}" ubuntu@${ORACLE_IP}:"$latest_backup" "$LOCAL_BACKUP_PATH/"; then
        echo -e "${GREEN}Download concluído com sucesso!${NC}"
    else
        echo -e "${RED}Erro ao baixar o backup${NC}"
        return 1
    fi
}

# Baixa todos os backups
download_all() {
    echo -e "${GREEN}Verificando backups disponíveis...${NC}"
    local backup_count=$(ssh -i "${KEY_PATH/#\~/$HOME}" ubuntu@${ORACLE_IP} "ls -1 ${REMOTE_BACKUP_PATH}/*.sql.gz 2>/dev/null | wc -l")
    
    if [ "$backup_count" -eq 0 ]; then
        echo -e "${RED}Nenhum backup encontrado na instância Oracle${NC}"
        return 1
    fi

    echo -e "${YELLOW}Encontrados $backup_count backups. Iniciando download...${NC}"
    if scp -i "${KEY_PATH/#\~/$HOME}" ubuntu@${ORACLE_IP}:"${REMOTE_BACKUP_PATH}/*.sql.gz" "$LOCAL_BACKUP_PATH/"; then
        echo -e "${GREEN}Download de todos os backups concluído com sucesso!${NC}"
    else
        echo -e "${RED}Erro ao baixar os backups${NC}"
        return 1
    fi
}

# Verifica argumentos
case "$1" in
    "all")
        if download_all; then
            echo -e "\n${GREEN}Os backups foram salvos em: $LOCAL_BACKUP_PATH${NC}"
        else
            echo -e "\n${RED}Falha ao baixar os backups${NC}"
            exit 1
        fi
        ;;
    "latest")
        if download_latest; then
            echo -e "\n${GREEN}O backup foi salvo em: $LOCAL_BACKUP_PATH${NC}"
        else
            echo -e "\n${RED}Falha ao baixar o backup${NC}"
            exit 1
        fi
        ;;
    "list")
        list_backups
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

# Mostra o espaço em disco disponível
echo -e "\n${YELLOW}Espaço em disco disponível:${NC}"
df -h "$LOCAL_BACKUP_PATH"
