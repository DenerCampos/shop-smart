#!/bin/bash

# Diretório do projeto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Verifica se o container de backup está rodando
if ! docker-compose -f ${PROJECT_DIR}/docker-compose.yml ps | grep -q "backup.*Up"; then
    echo "Container de backup não está rodando. Iniciando..."
    docker-compose -f ${PROJECT_DIR}/docker-compose.yml up -d backup
fi

# Executa o backup manual
echo "Iniciando backup manual..."
docker-compose -f ${PROJECT_DIR}/docker-compose.yml exec backup sh /scripts/manual_backup.sh

echo "Para ver os backups disponíveis, execute:"
echo "ls -la ${PROJECT_DIR}/backups/"
