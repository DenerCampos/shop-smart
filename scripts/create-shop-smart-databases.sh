#!/usr/bin/env bash
# Cria shop_smart e shop_smart_test (IF NOT EXISTS) e aplica GRANT ao usuário da aplicação.
# Uso (na raiz do repo): ./scripts/create-shop-smart-databases.sh
# Variáveis opcionais: MYSQL_HOST, MYSQL_PORT, MYSQL_ADMIN_USER, MYSQL_ADMIN_PASS
# MYSQL_DOCKER_CONTAINER — se o cliente `mysql` não existir no host, o script usa:
#   docker exec -e MYSQL_PWD=... CONTAINER mysql -u... -e "SQL"
#   Ex.: MYSQL_DOCKER_CONTAINER=gym-flow-mysql npm run db:create
# Carrega .env e depois .env.test (para API_DB_ROOT_PASS / credenciais só no ambiente de teste).
# Se MYSQL_ADMIN_PASS estiver vazio, usa API_DB_ROOT_PASS; se ainda vazio, tenta MySQL sem senha (root local).
# Modo dois usuários: defina API_DB_USER_TEST e API_DB_PASS_TEST (usuário principal só em shop_smart).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MYSQL_HOST="${MYSQL_HOST:-127.0.0.1}"
MYSQL_PORT="${MYSQL_PORT:-3306}"
MYSQL_ADMIN_USER="${MYSQL_ADMIN_USER:-root}"
MYSQL_ADMIN_PASS="${MYSQL_ADMIN_PASS:-}"

load_env_file() {
  local f="$1"
  if [[ -f "$f" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$f"
    set +a
  fi
}

load_env_file ".env"
load_env_file ".env.test"

if [[ -z "${MYSQL_ADMIN_PASS}" && -n "${API_DB_ROOT_PASS:-}" ]]; then
  MYSQL_ADMIN_PASS="$API_DB_ROOT_PASS"
fi

if [[ -z "${MYSQL_ADMIN_PASS}" ]]; then
  echo "Aviso: MYSQL_ADMIN_PASS e API_DB_ROOT_PASS vazios — tentando mysql como ${MYSQL_ADMIN_USER} sem senha." >&2
  echo "Se falhar, exporte MYSQL_ADMIN_PASS=... ou defina API_DB_ROOT_PASS no .env ou .env.test" >&2
fi

APP_USER="${API_DB_USER:-shop_smart}"
APP_PASS="${API_DB_PASS:-shop_smart}"
APP_USER_TEST="${API_DB_USER_TEST:-}"
APP_PASS_TEST="${API_DB_PASS_TEST:-}"

MYSQL_DOCKER_CONTAINER="${MYSQL_DOCKER_CONTAINER:-}"

if command -v mysql >/dev/null 2>&1; then
  MYSQL_CLIENT_MODE="local"
elif [[ -n "$MYSQL_DOCKER_CONTAINER" ]] && command -v docker >/dev/null 2>&1; then
  MYSQL_CLIENT_MODE="docker"
else
  echo "Cliente mysql não encontrado no PATH." >&2
  echo "Opções: instalar mysql-client, ou definir MYSQL_DOCKER_CONTAINER (nome do container, ex.: gym-flow-mysql) e ter o Docker CLI." >&2
  exit 1
fi

mysql_exec() {
  local sql="$1"
  if [[ "$MYSQL_CLIENT_MODE" == "local" ]]; then
    if [[ -n "$MYSQL_ADMIN_PASS" ]]; then
      MYSQL_PWD="$MYSQL_ADMIN_PASS" mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_ADMIN_USER" -N -e "$sql"
    else
      mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_ADMIN_USER" -N -e "$sql"
    fi
  else
    if [[ -n "$MYSQL_ADMIN_PASS" ]]; then
      docker exec -e MYSQL_PWD="$MYSQL_ADMIN_PASS" "$MYSQL_DOCKER_CONTAINER" \
        mysql -u"$MYSQL_ADMIN_USER" -N -e "$sql"
    else
      docker exec "$MYSQL_DOCKER_CONTAINER" mysql -u"$MYSQL_ADMIN_USER" -N -e "$sql"
    fi
  fi
}

mysql_exec "CREATE DATABASE IF NOT EXISTS shop_smart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql_exec "CREATE DATABASE IF NOT EXISTS shop_smart_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if [[ -n "$APP_USER_TEST" && -n "$APP_PASS_TEST" ]]; then
  mysql_exec "CREATE USER IF NOT EXISTS '${APP_USER}'@'%' IDENTIFIED BY '${APP_PASS}';"
  mysql_exec "GRANT ALL PRIVILEGES ON shop_smart.* TO '${APP_USER}'@'%';"
  mysql_exec "CREATE USER IF NOT EXISTS '${APP_USER_TEST}'@'%' IDENTIFIED BY '${APP_PASS_TEST}';"
  mysql_exec "GRANT ALL PRIVILEGES ON shop_smart_test.* TO '${APP_USER_TEST}'@'%';"
else
  mysql_exec "CREATE USER IF NOT EXISTS '${APP_USER}'@'%' IDENTIFIED BY '${APP_PASS}';"
  mysql_exec "GRANT ALL PRIVILEGES ON shop_smart.* TO '${APP_USER}'@'%';"
  mysql_exec "GRANT ALL PRIVILEGES ON shop_smart_test.* TO '${APP_USER}'@'%';"
fi

mysql_exec "FLUSH PRIVILEGES;"

echo "OK: bases shop_smart e shop_smart_test verificadas/criadas; permissões aplicadas."
