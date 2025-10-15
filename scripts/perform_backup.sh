#!/bin/sh

# Define os diretórios e nome do arquivo
BACKUP_DIR="/home/ubuntu/shop-smart/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Cria o diretório de backup se não existir
mkdir -p ${BACKUP_DIR}

# Executa o backup diretamente do container do MySQL
# Garante que estamos no diretório correto
cd /home/ubuntu/shop-smart

CONTAINER_NAME=$(docker-compose ps -q db)
if [ -z "$CONTAINER_NAME" ]; then
    echo "Container do MySQL não está rodando!"
    exit 1
fi

docker exec $CONTAINER_NAME mysqldump \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
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

# Remove backups mais antigos que 7 dias
find ${BACKUP_DIR} -type f -name "*.sql.gz" -mtime +7 -delete

# Log do backup
echo "Backup automático completed at $(date)" >> ${BACKUP_DIR}/backup.log

echo "Backup concluído com sucesso! Arquivo: backup_${TIMESTAMP}.sql.gz"
