#!/bin/sh

# Define os diretórios e nome do arquivo
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Cria diretório para logs se não existir
mkdir -p ${BACKUP_DIR}/logs

# Configurações do MySQL
MYSQL_HOST=${MYSQL_HOST:-"db"}
MYSQL_PORT=${MYSQL_PORT:-"3306"}

# Executa o backup
echo "Iniciando backup automático..."
mysqldump \
    --skip-ssl \
    -h${MYSQL_HOST} \
    -P${MYSQL_PORT} \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --quick \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --column-statistics=0 \
    ${MYSQL_DATABASE} > ${BACKUP_FILE} 2>${BACKUP_DIR}/logs/auto_backup_error.log

# Se houver erro, mostra o log
if [ $? -ne 0 ]; then
    echo "Erro detalhado do backup:"
    cat ${BACKUP_DIR}/logs/auto_backup_error.log
    exit 1
fi

# Verifica se o backup foi bem sucedido
if [ $? -ne 0 ] || [ ! -s ${BACKUP_FILE} ]; then
    echo "Erro ao criar o backup!"
    exit 1
fi

# Comprime o arquivo
gzip ${BACKUP_FILE}

# Remove backups mais antigos que 7 dias
find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +7 -delete

# Log do backup
echo "Backup automático completed at $(date)" >> ${BACKUP_DIR}/backup.log

echo "Backup concluído com sucesso! Arquivo: backup_${TIMESTAMP}.sql.gz"
