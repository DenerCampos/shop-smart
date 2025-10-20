#!/bin/sh

# Define os diretórios e nome do arquivo
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/manual_backup_${TIMESTAMP}.sql"

# Cria diretório para logs se não existir
mkdir -p ${BACKUP_DIR}/logs

# Configurações do MySQL
MYSQL_HOST=${MYSQL_HOST:-"db"}
MYSQL_PORT=${MYSQL_PORT:-"3306"}

# Testa a conexão primeiro
echo "Testando conexão com o MySQL..."
if ! mysql --ssl-mode=DISABLED -h${MYSQL_HOST} -P${MYSQL_PORT} -uroot -p${MYSQL_ROOT_PASSWORD} -e "SELECT 1;" > /dev/null 2>&1; then
    echo "Erro ao conectar ao MySQL. Verifique as credenciais."
    echo "Tentando com usuário padrão..."
    mysql --ssl-mode=DISABLED -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p${MYSQL_PASSWORD} -e "SELECT 1;"
    exit 1
fi

echo "Conexão OK. Iniciando backup..."
mysqldump \
    --ssl-mode=DISABLED \
    -h${MYSQL_HOST} \
    -P${MYSQL_PORT} \
    -uroot \
    -p${MYSQL_ROOT_PASSWORD} \
    --single-transaction \
    --quick \
    --no-tablespaces \
    --set-gtid-purged=OFF \
    --column-statistics=0 \
    ${MYSQL_DATABASE} > ${BACKUP_FILE} 2>${BACKUP_DIR}/logs/manual_backup_error.log

# Se houver erro, mostra o log
if [ $? -ne 0 ]; then
    echo "Erro detalhado do backup:"
    cat ${BACKUP_DIR}/logs/manual_backup_error.log
    exit 1
fi

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
