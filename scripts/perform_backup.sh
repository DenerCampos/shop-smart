#!/bin/sh

# Define o timestamp para o nome do arquivo
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/backup_${TIMESTAMP}.sql"

# Executa o backup
mysqldump -h db -u ${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DATABASE} > ${BACKUP_FILE}

# Comprime o arquivo
gzip ${BACKUP_FILE}

# Remove backups mais antigos que 7 dias
find /backups -type f -name "*.sql.gz" -mtime +7 -delete

# Log do backup
echo "Backup completed at $(date)" >> /backups/backup.log
