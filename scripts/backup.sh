#!/bin/sh

# Configura o cron para executar o backup às 02:00
mkdir -p /var/spool/cron/crontabs
echo "0 2 * * * /scripts/perform_backup.sh >> /home/ubuntu/shop-smart/backups/cron.log 2>&1" > /var/spool/cron/crontabs/root
chmod 600 /var/spool/cron/crontabs/root

# Inicia o cron em primeiro plano
crond -f -l 8
