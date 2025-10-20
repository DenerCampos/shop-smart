#!/bin/sh

# Define variáveis padrão
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="manual"
COMPRESS=true

# Função para mostrar ajuda
show_help() {
    echo "Uso: manual-backup [opções]"
    echo ""
    echo "Opções:"
    echo "  -n, --name NOME     Nome personalizado para o backup (default: manual)"
    echo "  -d, --dir DIR       Diretório de destino (default: /backups)"
    echo "  -nc, --no-compress  Não comprimir o backup"
    echo "  -h, --help         Mostra esta ajuda"
    echo ""
    echo "Exemplo:"
    echo "  manual-backup --name pre_deploy"
    echo "  manual-backup --dir /backups/especial"
    exit 0
}

# Processa argumentos
while [ "$1" != "" ]; do
    case $1 in
        -n | --name )          shift
                              BACKUP_NAME=$1
                              ;;
        -d | --dir )          shift
                              BACKUP_DIR=$1
                              ;;
        -nc | --no-compress ) COMPRESS=false
                              ;;
        -h | --help )         show_help
                              exit
                              ;;
        * )                   show_help
                              exit 1
    esac
    shift
done

# Define nome do arquivo
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}_${TIMESTAMP}.sql"
LOG_FILE="${BACKUP_DIR}/logs/manual_backup.log"
ERROR_LOG="${BACKUP_DIR}/logs/manual_error.log"

# Cria diretórios necessários
mkdir -p ${BACKUP_DIR}/logs

# Função para log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${LOG_FILE}
}

# Inicia o backup
log_message "Iniciando backup manual do banco ${MYSQL_DATABASE}..."
log_message "Arquivo de backup: ${BACKUP_FILE}"

# Executa o backup com configurações otimizadas
mysqldump \
    --skip-ssl \
    --host=${MYSQL_HOST} \
    --port=${MYSQL_PORT} \
    --user=${MYSQL_USER} \
    --password=${MYSQL_PASSWORD} \
    --single-transaction \
    --quick \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --skip-extended-insert \
    --skip-comments \
    --skip-lock-tables \
    ${MYSQL_DATABASE} > ${BACKUP_FILE} 2>${ERROR_LOG}

# Verifica se o backup foi bem sucedido
if [ $? -ne 0 ] || [ ! -s ${BACKUP_FILE} ]; then
    log_message "ERRO: Falha ao criar backup. Verifique ${ERROR_LOG}"
    cat ${ERROR_LOG} >> ${LOG_FILE}
    exit 1
fi

# Comprime o arquivo se necessário
if [ "$COMPRESS" = true ]; then
    log_message "Comprimindo backup..."
    gzip -9 ${BACKUP_FILE}
    if [ $? -eq 0 ]; then
        log_message "Backup comprimido com sucesso: ${BACKUP_FILE}.gz"
    else
        log_message "ERRO: Falha ao comprimir o backup"
        exit 1
    fi
else
    log_message "Backup não comprimido conforme solicitado"
fi

log_message "Backup manual finalizado com sucesso!"
log_message "Local do backup: ${BACKUP_FILE}${COMPRESS:+.gz}"
