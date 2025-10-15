#!/bin/sh

# Instala as dependências necessárias
apk update
apk add mysql-client

# Configura o cron
echo "0 2 * * * /scripts/perform_backup.sh" > /var/spool/cron/crontabs/root
crond -f
