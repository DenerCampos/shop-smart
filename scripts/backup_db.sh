#!/bin/sh

# Define variáveis
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
LOG_FILE="${BACKUP_DIR}/logs/backup.log"
ERROR_LOG="${BACKUP_DIR}/logs/error.log"
RETENTION_DAYS=7

# Cria diretórios necessários
mkdir -p ${BACKUP_DIR}/logs

# Função para log
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> ${LOG_FILE}
    echo "$1"
}

# Limpa backups antigos
cleanup_old_backups() {
    find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    log_message "Backups mais antigos que ${RETENTION_DAYS} dias foram removidos"
}

# Executa o backup
log_message "Iniciando backup do banco ${MYSQL_DATABASE}..."

# Configurações otimizadas do mysqldump
mysqldump \
    --skip-ssl \
    --host=${MYSQL_HOST} \
    --port=${MYSQL_PORT} \
    --user=${MYSQL_USER} \
    --password=${MYSQL_PASSWORD} \
    --protocol=TCP \
    --quick \
    --compress \
    --single-transaction \
    --skip-triggers \
    --no-tablespaces \
    --no-create-info \
    --skip-extended-insert \
    --skip-comments \
    --skip-lock-tables \
    --max-allowed-packet=32M \
    ${MYSQL_DATABASE} > ${BACKUP_FILE} 2>${ERROR_LOG}

# Verifica se o backup foi bem sucedido
if [ $? -ne 0 ] || [ ! -s ${BACKUP_FILE} ]; then
    log_message "ERRO: Falha ao criar backup. Verifique ${ERROR_LOG}"
    cat ${ERROR_LOG} >> ${LOG_FILE}
    exit 1
fi

# Comprime o arquivo
gzip -9 ${BACKUP_FILE}
if [ $? -eq 0 ]; then
    log_message "Backup comprimido com sucesso: ${BACKUP_FILE}.gz"
else
    log_message "ERRO: Falha ao comprimir o backup"
    exit 1
fi

# Limpa backups antigos
cleanup_old_backups

log_message "Backup finalizado com sucesso!"
