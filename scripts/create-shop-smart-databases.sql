-- Cria as bases de desenvolvimento e E2E (idempotente).
-- Uso: mysql -h HOST -u root -p < scripts/create-shop-smart-databases.sql
-- Ou copie os comandos abaixo no cliente MySQL.

CREATE DATABASE IF NOT EXISTS shop_smart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS shop_smart_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Exemplo: um usuário para os dois bancos (ajuste senha):
-- CREATE USER IF NOT EXISTS 'shop_smart'@'%' IDENTIFIED BY 'sua_senha';
-- GRANT ALL PRIVILEGES ON shop_smart.* TO 'shop_smart'@'%';
-- GRANT ALL PRIVILEGES ON shop_smart_test.* TO 'shop_smart'@'%';
-- FLUSH PRIVILEGES;

-- Exemplo avançado: usuário só para testes (opcional):
-- CREATE USER IF NOT EXISTS 'shop_smart_test'@'%' IDENTIFIED BY 'outra_senha';
-- GRANT ALL PRIVILEGES ON shop_smart_test.* TO 'shop_smart_test'@'%';
-- FLUSH PRIVILEGES;
