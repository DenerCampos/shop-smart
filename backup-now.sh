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
if [ -z "${API_DB_ROOT_PASS}" ] || [ -z "${API_DB_NAME}" ]; then
    echo "Erro: Variáveis de ambiente necessárias não estão definidas!"
    echo "Necessário: API_DB_ROOT_PASS, API_DB_NAME"
    echo "Conteúdo atual das variáveis:"
    echo "API_DB_ROOT_PASS=${API_DB_ROOT_PASS}"
    echo "API_DB_NAME=${API_DB_NAME}"
    exit 1
fi

# Define as variáveis que o script de backup espera
export MYSQL_ROOT_PASSWORD="${API_DB_ROOT_PASS}"
export MYSQL_DATABASE="${API_DB_NAME}"
export MYSQL_USER="${API_DB_USER}"
export MYSQL_PASSWORD="${API_DB_PASS}"

# Executa o backup manual
echo "Iniciando backup manual..."
sh ${PROJECT_DIR}/scripts/manual_backup.sh

echo "Para ver os backups disponíveis, execute:"
echo "ls -la /home/ubuntu/shop-smart/backups/"
