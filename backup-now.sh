#!/bin/bash

# Diretório do projeto
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Carrega as variáveis de ambiente do .env
if [ -f "${PROJECT_DIR}/.env" ]; then
    echo "Carregando variáveis de ambiente..."
    set -a
    . "${PROJECT_DIR}/.env"
    set +a
else
    echo "Arquivo .env não encontrado!"
    exit 1
fi

# Verifica se as variáveis necessárias estão definidas
if [ -z "${MYSQL_ROOT_PASSWORD}" ] || [ -z "${MYSQL_DATABASE}" ]; then
    echo "Erro: Variáveis de ambiente necessárias não estão definidas!"
    echo "Necessário: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE"
    exit 1
fi

# Executa o backup manual
echo "Iniciando backup manual..."
sh ${PROJECT_DIR}/scripts/manual_backup.sh

echo "Para ver os backups disponíveis, execute:"
echo "ls -la /home/ubuntu/shop-smart/backups/"
