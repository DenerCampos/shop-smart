#!/bin/sh

# Define os diretórios e nome do arquivo
BACKUP_DIR="/home/ubuntu/shop-smart/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/manual_backup_${TIMESTAMP}.sql"

# Cria o diretório de backup se não existir
mkdir -p ${BACKUP_DIR}

# Executa o backup
# Executa o backup diretamente do container do MySQL
# Garante que estamos no diretório correto
cd /home/ubuntu/shop-smart

CONTAINER_NAME=$(docker-compose ps -q db)
if [ -z "$CONTAINER_NAME" ]; then
    echo "Container do MySQL não está rodando!"
    exit 1
fi

# Testa a conexão primeiro
echo "Testando conexão com o MySQL..."
if ! docker exec $CONTAINER_NAME mysql -uroot -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1;" > /dev/null 2>&1; then
    echo "Erro ao conectar ao MySQL. Verifique as credenciais."
    echo "Tentando com usuário padrão..."
    docker exec $CONTAINER_NAME mysql -u${MYSQL_USER} -p${MYSQL_PASSWORD} -e "SELECT 1;"
    exit 1
fi

echo "Conexão OK. Iniciando backup..."
docker exec $CONTAINER_NAME mysqldump \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --quick \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --column-statistics=0 \
    ${MYSQL_DATABASE} > ${BACKUP_FILE} 2>${BACKUP_DIR}/backup_error.log

# Se houver erro, mostra o log
if [ $? -ne 0 ]; then
    echo "Erro detalhado do backup:"
    cat ${BACKUP_DIR}/backup_error.log
fi

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
