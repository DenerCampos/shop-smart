#!/bin/sh

# Define o timestamp para o nome do arquivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/manual_backup_${TIMESTAMP}.sql"

# Executa o backup
# Instala o cliente MySQL se não estiver instalado
if ! command -v mysql >/dev/null 2>&1; then
    apk add --no-cache mysql-client
fi

# Executa o backup usando o cliente MySQL
mysql_config_editor set --login-path=backup --host=db --user=${MYSQL_USER} --password=${MYSQL_PASSWORD}

mysqldump --login-path=backup \
    -u ${MYSQL_USER} \
    -p${MYSQL_PASSWORD} \
    --skip-ssl \
    --single-transaction \
    --quick \
    --no-tablespaces \
    ${MYSQL_DATABASE} > ${BACKUP_FILE}

# Verifica se o backup foi bem sucedido
if [ $? -ne 0 ] || [ ! -s ${BACKUP_FILE} ]; then
    echo "Erro ao criar o backup!"
    exit 1
fi

# Comprime o arquivo
gzip ${BACKUP_FILE}

# Log do backup
echo "Manual backup completed at $(date)" >> /backups/backup.log

echo "Backup concluído com sucesso! Arquivo: manual_backup_${TIMESTAMP}.sql.gz"
