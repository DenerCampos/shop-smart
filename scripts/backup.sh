#!/bin/sh

# Instala as dependências necessárias
apk update && apk add --no-cache mysql-client dcron

# Cria diretório para logs
mkdir -p /backups/logs

# Configura o cron para executar o backup às 02:00
mkdir -p /var/spool/cron/crontabs
echo "0 2 * * * /scripts/perform_backup.sh >> /backups/logs/cron.log 2>&1" > /var/spool/cron/crontabs/root
chmod 600 /var/spool/cron/crontabs/root

# Cria script para executar backup manual
cat > /usr/local/bin/manual-backup << 'EOF'
#!/bin/sh
/scripts/manual_backup.sh
EOF
chmod +x /usr/local/bin/manual-backup

# Mensagem de ajuda
echo "Container de backup iniciado!"
echo "Para executar um backup manual, use:"
echo "docker-compose exec backup manual-backup"

# Inicia o cron em primeiro plano
crond -f -l 8
