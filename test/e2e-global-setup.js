const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.test');
const REQUIRED_DB = 'shop_smart_test';

function main() {
  if (!fs.existsSync(envPath)) {
    console.error(
      'E2E globalSetup: crie .env.test a partir de .env.test.example na raiz do projeto.',
    );
    process.exit(1);
  }

  require('dotenv').config({ path: envPath });

  if (process.env.API_DB_NAME !== REQUIRED_DB) {
    console.error(
      `E2E globalSetup: API_DB_NAME deve ser "${REQUIRED_DB}" (valor atual: ${process.env.API_DB_NAME}).`,
    );
    process.exit(1);
  }

  const env = { ...process.env };

  execSync('npm run build', { stdio: 'inherit', cwd: root, env });
  execSync('npx typeorm migration:run -d dist/db/data-source.js', {
    stdio: 'inherit',
    cwd: root,
    env,
  });
  execSync('node dist/db/seeds/run-all.dev.seed.js', {
    stdio: 'inherit',
    cwd: root,
    env,
  });
}

module.exports = async function e2eGlobalSetup() {
  main();
};
