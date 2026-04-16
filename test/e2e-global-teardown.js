const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.test');
const REQUIRED_DB = 'shop_smart_test';

module.exports = async function e2eGlobalTeardown() {
  if (!fs.existsSync(envPath)) {
    return;
  }

  require('dotenv').config({ path: envPath });

  if (process.env.API_DB_NAME !== REQUIRED_DB) {
    console.warn(
      `E2E globalTeardown: ignorado — API_DB_NAME não é "${REQUIRED_DB}".`,
    );
    return;
  }

  const env = { ...process.env };

  const dataSourceJs = path.join(root, 'dist/db/data-source.js');
  if (!fs.existsSync(dataSourceJs)) {
    console.warn(
      'E2E globalTeardown: dist/db/data-source.js ausente; pule schema:drop ou rode npm run build.',
    );
    return;
  }

  try {
    execSync('npx typeorm schema:drop -d dist/db/data-source.js', {
      stdio: 'inherit',
      cwd: root,
      env,
    });
  } catch (err) {
    console.warn('E2E globalTeardown: schema:drop falhou.', err.message);
  }
};
