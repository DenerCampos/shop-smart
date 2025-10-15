#!/bin/bash

# Diretório do projeto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Carrega as variáveis de ambiente do .env
if [ -f "${PROJECT_DIR}/.env" ]; then
    export $(cat "${PROJECT_DIR}/.env" | grep -v '^#' | xargs)
fi

# Executa o backup manual
echo "Iniciando backup manual..."
sh ${PROJECT_DIR}/scripts/manual_backup.sh

echo "Para ver os backups disponíveis, execute:"
echo "ls -la /home/ubuntu/shop-smart/backups/"
