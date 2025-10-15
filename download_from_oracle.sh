#!/bin/bash

# Configurações
ORACLE_IP="IP_ORACLE"
KEY_PATH="CHAVE_PEM"
REMOTE_BACKUP_PATH="/opt/shop_smart/backups"
LOCAL_BACKUP_PATH="/home/dener/projetos/shop_smart/api/db/backup"

# Cria diretório local se não existir
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
    echo "Backups disponíveis na instância Oracle:"
    ssh -i $KEY_PATH ubuntu@${ORACLE_IP} "ls -lh ${REMOTE_BACKUP_PATH}/*.sql.gz"
}

# Baixa o backup mais recente
download_latest() {
    echo "Baixando o backup mais recente..."
    ssh -i $KEY_PATH ubuntu@${ORACLE_IP} "ls -t ${REMOTE_BACKUP_PATH}/*.sql.gz | head -n1" | \
    xargs -I {} scp -i $KEY_PATH ubuntu@${ORACLE_IP}:{} $LOCAL_BACKUP_PATH/
}

# Baixa todos os backups
download_all() {
    echo "Baixando todos os backups..."
    scp -i $KEY_PATH ubuntu@${ORACLE_IP}:${REMOTE_BACKUP_PATH}/*.sql.gz $LOCAL_BACKUP_PATH/
}

# Verifica argumentos
case "$1" in
    "all")
        download_all
        ;;
    "latest")
        download_latest
        ;;
    "list")
        list_backups
        ;;
    *)
        show_usage
        exit 1
        ;;
esac

echo "Os backups foram salvos em: $LOCAL_BACKUP_PATH"
